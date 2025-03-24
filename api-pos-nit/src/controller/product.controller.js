const {
  db,
  isArray,
  isEmpty,
  logError,
  removeFile,
} = require("../util/helper");



// exports.getList = async (req, res) => {
//   try {
//     const { txt_search, category_id, brand, page, is_list_all } = req.query;
//     const { user_id } = req.params; // Extract user_id from URL params

//     const pageSize = 2; // Fixed page size
//     const currentPage = Number(page) || 1; // Default to page 1 if not provided
//     const offset = (currentPage - 1) * pageSize; // Calculate offset for pagination

//     // Base SQL query to select product details
//     const sqlSelect = `
//       SELECT 
//         p.id, p.name, p.category_id, p.barcode, p.brand, p.company_name, 
//         p.description, p.qty, p.unit_price, p.discount, p.status, 
//         p.create_by, p.create_at, p.unit, 
//         c.name AS category_name,
//         (p.qty * p.unit_price) AS original_price,
//         CASE
//           WHEN p.discount > 0 THEN (p.qty * p.unit_price) * (1 - p.discount / 100)
//           ELSE (p.qty * p.unit_price)
//         END AS total_price
//     `;

//     // SQL JOIN clause
//     const sqlJoin = `FROM product p INNER JOIN category c ON p.category_id = c.id`;

//     // SQL WHERE clause with user_id filter
//     let sqlWhere = `WHERE p.user_id = :user_id`;

//     // Apply additional filters based on query parameters
//     if (txt_search) {
//       sqlWhere += ` AND (p.name LIKE :txt_search OR p.barcode = :barcode)`;
//     }
//     if (category_id) {
//       sqlWhere += ` AND p.category_id = :category_id`;
//     }
//     if (brand) {
//       sqlWhere += ` AND p.brand = :brand`;
//     }

//     // SQL ORDER BY clause
//     const sqlOrderBy = `ORDER BY p.id DESC`;

//     // SQL LIMIT and OFFSET for pagination
//     let sqlLimit = `LIMIT ${pageSize} OFFSET ${offset}`;
//     if (is_list_all) {
//       sqlLimit = ``; // If is_list_all is true, remove LIMIT and OFFSET
//     }

//     // Combine SQL clauses with proper spacing
//     const sqlList = `${sqlSelect} ${sqlJoin} ${sqlWhere} ${sqlOrderBy} ${sqlLimit}`;

//     // SQL parameters
//     const sqlParam = {
//       user_id, // Pass user_id from params
//       txt_search: `%${txt_search}%`, // Add wildcards for LIKE search
//       barcode: txt_search, // Use the same value for barcode search
//       category_id,
//       brand,
//     };

//     const [list] = await db.query(sqlList, sqlParam);

//     let dataCount = 0;
//     if (currentPage === 1) {
//       const sqlTotal = `SELECT COUNT(p.id) AS total ${sqlJoin} ${sqlWhere}`;
//       const [totalResult] = await db.query(sqlTotal, sqlParam);
//       dataCount = totalResult[0].total;
//     }

//     res.json({
//       list: list,
//       total: dataCount,
//     });
//   } catch (error) {
//     logError("product.getList", error, res);
//   }
// };

exports.getList = async (req, res) => {
  try {
    const { txt_search, category_id, page, is_list_all } = req.query;
    const { user_id } = req.params; // Extract user_id from URL params

    const pageSize = 10; // Increased page size for better UX
    const currentPage = Number(page) || 1;
    const offset = (currentPage - 1) * pageSize;

    // SQL query to select product details
    const sqlSelect = `
      SELECT 
        p.id, p.name, p.category_id, p.barcode,  p.company_name, 
        p.description, p.qty, p.unit_price, p.discount, p.actual_price, p.status, 
        p.create_by, p.create_at, p.unit, 
        c.name AS category_name,
        (p.qty * p.unit_price) AS original_price,
        CASE
          WHEN p.discount > 0 THEN ((p.qty * p.unit_price) * (1 - p.discount / 100)) / p.actual_price
          ELSE (p.qty * p.unit_price) / p.actual_price
        END AS total_price
    `;

    // SQL JOIN clause
    const sqlJoin = `FROM product p INNER JOIN category c ON p.category_id = c.id`;

    // SQL WHERE clause with user_id filter
    let sqlWhere = `WHERE p.user_id = :user_id`;

    // Apply additional filters
    if (txt_search) {
      sqlWhere += ` AND (p.name LIKE :txt_search OR p.barcode = :barcode)`;
    }
    if (category_id) {
      sqlWhere += ` AND p.category_id = :category_id`;
    }

    // SQL ORDER BY clause
    const sqlOrderBy = `ORDER BY p.id DESC`;

    // SQL LIMIT and OFFSET for pagination
    let sqlLimit = `LIMIT ${pageSize} OFFSET ${offset}`;
    if (is_list_all) {
      sqlLimit = ``; // If is_list_all is true, remove pagination
    }

    // Combine SQL clauses
    const sqlList = `${sqlSelect} ${sqlJoin} ${sqlWhere} ${sqlOrderBy} ${sqlLimit}`;

    // SQL parameters
    const sqlParam = {
      user_id,
      txt_search: `%${txt_search || ''}%`,
      barcode: txt_search || '',
      category_id,
    };

    const [list] = await db.query(sqlList, sqlParam);

    let dataCount = 0;
    if (currentPage === 1) {
      const sqlTotal = `SELECT COUNT(p.id) AS total ${sqlJoin} ${sqlWhere}`;
      const [totalResult] = await db.query(sqlTotal, sqlParam);
      dataCount = totalResult[0].total;
    }

    res.json({
      list,
      total: dataCount,
    });
  } catch (error) {
    logError("product.getList", error, res);
  }
};


// exports.create = async (req, res) => {
//   try {
//     // Extract values from request body
//     const { name, category_id, barcode, company_name, description, qty, actual_price,unit, unit_price, discount, status } = req.body;
    
//     // Get user_id from authentication or fallback to request body
//     const user_id = req.auth?.id || req.body.user_id;
  
//     // Validate required fields
//     if (!user_id || !name || !category_id || !qty || !unit || !unit_price) {
//       return res.status(400).json({
//         success: false,
//         message: "Missing required fields (user_id, name, category_id, qty, unit, unit_price).",
//       });
//     }

//     var sql =
//       " INSERT INTO product (user_id, name, category_id, barcode, company_name, description, qty, actual_price,unit, unit_price, discount, status, create_by) " +
//       " VALUES (:user_id, :name, :category_id, :barcode,  :company_name, :description, :qty, :actual_price,:unit, :unit_price, :discount, :status, :create_by) ";

//     var [data] = await db.query(sql, {
//       user_id,
//       name,
//       category_id,
//       barcode,
//       company_name,
//       description,
//       qty,
//       actual_price,
//       unit,
//       unit_price,
//       discount,
//       status,
//       create_by: req.auth?.name,
//     });

//     res.json({
//       success: true,
//       data,
//       message: "Insert success!",
//     });
//   } catch (error) {
//     logError("product.create", error, res);
//   }
// };

exports.create = async (req, res) => {
  try {
    // Extract values from request body
    const { name, category_id, barcode, company_name, description, qty, actual_price, unit, unit_price, discount, status } = req.body;
    
    // Get user_id from authentication or fallback to request body
    const user_id = req.auth?.id || req.body.user_id;

    // Log all the fields for debugging
    console.log("Fields received for product creation:", {
      user_id,
      name,
      category_id,
      barcode,
      company_name,
      description,
      qty,
      unit,
      unit_price,
      discount,
      status
    });
  
    // Validate required fields
    if (!user_id || !name || !category_id || !qty || !unit || !unit_price || !actual_price) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (user_id, name, category_id, qty, unit, unit_price, actual_price).",
      });
    }

    var sql =
      " INSERT INTO product (user_id, name, category_id, barcode, company_name, description, qty, actual_price, unit, unit_price, discount, status, create_by) " +
      " VALUES (:user_id, :name, :category_id, :barcode, :company_name, :description, :qty, :actual_price, :unit, :unit_price, :discount, :status, :create_by) ";

    var [data] = await db.query(sql, {
      user_id,
      name,
      category_id,
      barcode,
      company_name,
      description,
      qty,
      actual_price, // ធានាថាតម្លៃនេះមិនទទេ
      unit,
      unit_price,
      discount,
      status,
      create_by: req.auth?.name,
    });

    res.json({
      success: true,
      message: "Product created successfully.",
      data,
    });
  } catch (error) {
    logError("product.create", error, res);

    // Log the full error object for debugging
    console.error("Error while creating product:", error);

    res.status(500).json({
      success: false,
      message: "An error occurred while creating the product. Please try again later.",
    });
  }
};
exports.update = async (req, res) => {
  try {
    // Extracting fields from request body
    const { id, name, category_id, company_name, description, qty, unit, unit_price, discount, status } = req.body;

    // Check if `id` is provided
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required for the update.",
      });
    }

    const convertedUnitPrice = parseFloat(unit_price);

    const convertedDiscount = discount ? parseFloat(discount) : 0;

    if (isNaN(convertedUnitPrice)) {
      return res.status(400).json({
        success: false,
        message: "Invalid value for unit_price. Please provide a valid number.",
      });
    }

    const sql = `
      UPDATE product
      SET 
        name = :name, 
        category_id = :category_id, 
        company_name = :company_name, 
        description = :description, 
        qty = :qty, 
        unit = :unit, 
        unit_price = :unit_price, 
        discount = :discount, 
        status = :status
      WHERE id = :id
    `;

    const [data] = await db.query(sql, {
      id,
      name,
      category_id,
      company_name,
      description,
      qty,
      unit,
      unit_price: convertedUnitPrice,
      discount: convertedDiscount,
      status,
      create_by: req.auth?.name, // Assumes the authenticated user is the one updating the product
    });

    // If no rows are affected, it means the product ID doesn't exist
    if (data.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully.",
      data,
    });
  } catch (error) {
    // Log error for debugging
    console.error("Error while updating product:", error);
    
    logError("product.update", error, res);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the product. Please try again later.",
    });
  }
};




exports.remove = async (req, res) => {
  try {
    const id = req.params.id || req.body.id; // Check both params & body
    
    if (!id) {
      return res.status(400).json({ message: "Product ID is required!" });
    }

    var [data] = await db.query("DELETE FROM product WHERE id = :id", { id });

    if (data.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found!" });
    }

    res.json({ message: "Product deleted successfully!" });
  } catch (error) {
    logError("remove.product", error, res);
  }
};

exports.newBarcode = async (req, res) => {
  try {
    var sql =
      "SELECT " +
      "CONCAT('P',LPAD((SELECT COALESCE(MAX(id),0) + 1 FROM product), 3, '0')) " +
      "as barcode";
    var [data] = await db.query(sql);
    res.json({
      barcode: data[0].barcode,
    });
  } catch (error) {
    logError("remove.create", error, res);
  }
};

isExistBarcode = async (barcode) => {
  try {
    var sql = "SELECT COUNT(id) as Total FROM product WHERE barcode=:barcode";
    var [data] = await db.query(sql, {
      barcode: barcode,
    });
    if (data.length > 0 && data[0].Total > 0) {
      return true; // ស្ទួន
    }
    return false; // អត់ស្ទួនទេ
  } catch (error) {
    logError("remove.create", error, res);
  }
};

exports.productImage = async (req, res) => {
  try {
    var sql = "SELECT *  FROM product_image WHERE product_id=:product_id";
    var [list] = await db.query(sql, {
      product_id: req.params.product_id,
    });
    res.json({
      list,
    });
  } catch (error) {
    logError("remove.create", error, res);
  }
};
