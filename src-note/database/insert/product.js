const {
  db,
  isArray,
  isEmpty,
  logError,
  removeFile,
} = require("../util/helper");

exports.getList = async (req, res) => {
  try {
    const { txt_search, category_id, page, is_list_all } = req.query;
    const { user_id } = req.params; 

    const pageSize = 10;
    const currentPage = Number(page) || 1;
    const offset = (currentPage - 1) * pageSize;

    const sqlSelect = `
      SELECT 
  p.id, p.name, p.category_id, p.barcode, p.company_name,
  p.description, p.qty, p.unit_price, p.discount, p.actual_price, p.status,
  p.create_by, p.create_at, p.unit,
  c.name AS category_name,
  c.barcode AS category_barcode,
  c.actual_price AS category_actual_price,
  (p.qty * p.unit_price) AS original_price,
  CASE
    WHEN p.discount > 0 THEN ((p.qty * p.unit_price) * (1 - p.discount / 100)) / c.actual_price
    ELSE (p.qty * p.unit_price) / c.actual_price
  END AS total_price

    `;

    const sqlJoin = `
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
    `;

    let sqlWhere = `WHERE p.user_id = :user_id`;

    if (txt_search) {
      sqlWhere += ` AND (p.name LIKE :txt_search OR p.barcode = :barcode)`;
    }
    if (category_id) {
      sqlWhere += ` AND p.category_id = :category_id`;
    }

    const sqlOrderBy = `ORDER BY p.id DESC`;
    const sqlLimit = is_list_all ? `` : `LIMIT ${pageSize} OFFSET ${offset}`;

    const sqlList = `${sqlSelect} ${sqlJoin} ${sqlWhere} ${sqlOrderBy} ${sqlLimit}`;

    const sqlParam = {
      user_id,
      txt_search: `%${txt_search || ''}%`,
      barcode: txt_search || '',
      category_id,
    };
    const [list] = await db.query(sqlList, sqlParam);

    let total = 0;
    if (currentPage === 1) {
      const sqlTotal = `SELECT COUNT(p.id) AS total ${sqlJoin} ${sqlWhere}`;
      const [count] = await db.query(sqlTotal, sqlParam);
      total = count[0]?.total || 0;
    }

    return res.json({
      list,
      total,
    });
  } catch (error) {
    console.error("❌ Error in product.getList:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      user_id, name, category_id, barcode, company_name, description, qty,
      actual_price, unit, unit_price, discount, status, create_at,receive_date,
      customer_id
    } = req.body;

    if (!user_id || !name || !category_id || !qty || !unit_price) {
      return res.status(400).json({
        error: true,
        message: "Missing required fields (user_id, name, category_id, qty, unit_price).",
      });
    }

    const [categoryRow] = await db.query(
      "SELECT barcode, name FROM category WHERE id = :category_id",
      { category_id }
    );

    if (!categoryRow || categoryRow.length === 0) {
      return res.status(400).json({
        error: true,
        message: "Invalid category_id, category not found.",
      });
    }

    const categoryData = categoryRow[0];

    // Always default actual_price to 1190 if not provided
    const resolvedActualPrice = actual_price || 1190;

    // Use category's barcode if not provided
    const resolvedBarcode = barcode || categoryData.barcode;


    // ✅ Step 3: Check for existing product
    const checkSql = "SELECT * FROM product WHERE category_id = :category_id AND name = :name AND user_id = :user_id LIMIT 1";
    const [existingProducts] = await db.query(checkSql, { category_id, name, user_id });

    let productId;
    let isNewProduct = false;

    if (existingProducts.length > 0) {
      // ✅ Step 4: Update existing product qty
      const existingProduct = existingProducts[0];
      const newQty = parseInt(existingProduct.qty) + parseInt(qty);
      await db.query("UPDATE product SET qty = :new_qty WHERE id = :id", {
        new_qty: newQty,
        id: existingProduct.id
      });
      productId = existingProduct.id;
    } else {
      // ✅ Step 5: Insert new product
      const insertSql = `
        INSERT INTO product 
        (user_id, name, category_id, barcode, company_name, description, qty, actual_price, unit, unit_price, discount, status, create_by, create_at ,receive_date)
        VALUES
        (:user_id, :name, :category_id, :barcode, :company_name, :description, :qty, :actual_price, :unit, :unit_price, :discount, :status, :create_by, :create_at , :receive_date)
      `;
      const [result] = await db.query(insertSql, {
        user_id,
        name,
        category_id,
        barcode: resolvedBarcode,
        company_name,
        description,
        qty,
        actual_price: resolvedActualPrice,
        unit,
        unit_price,
        discount,
        status,
        create_by: req.auth?.name || 'system',
        create_at,
        receive_date
      });

      productId = result.insertId;
      isNewProduct = true;
    }

    // ✅ Step 6: Insert product detail
    if (productId) {
      const totalPrice = ((qty * unit_price) * (1 - (discount || 0) / 100)) / resolvedActualPrice;

      const detailSql = `
        INSERT INTO product_details (
          product_id, user_id, customer_id, name, barcode, description, category, company_name,
          qty, unit, unit_price, total_price, status, created_at, created_by ,receive_date
        )
        VALUES (
          :product_id, :user_id, :customer_id, :name, :barcode, :description, :category, :company_name,
          :qty, :unit, :unit_price, :total_price, :status, :created_at, :created_by, :receive_date
        )
      `;
      await db.query(detailSql, {
        product_id: productId,
        user_id,
        customer_id: customer_id || null,
        name,
        barcode: resolvedBarcode,
        description: description || '',
        category: category_id,
        company_name: company_name || '',
        qty,
        unit: unit || '',
        unit_price,
        total_price: totalPrice,
        status: status || 1,
        created_at: create_at || null,
        created_by: req.auth?.name || 'system',
         receive_date: receive_date || null
      });

      // ✅ Step 7: Fetch product and detail for response
      const [productData] = await db.query(`
        SELECT 
          p.id, p.name, p.category_id, p.user_id, p.barcode, p.company_name, 
          p.description, p.qty, p.unit_price, p.discount, p.actual_price, p.status, 
          p.create_by, p.create_at, p.unit, 
          c.name AS category_name,
          (p.qty * p.unit_price) AS original_price,
          CASE
            WHEN p.discount > 0 THEN ((p.qty * p.unit_price) * (1 - p.discount / 100)) / p.actual_price
            ELSE (p.qty * p.unit_price) / p.actual_price
          END AS total_price
        FROM product p  
        INNER JOIN category c ON p.category_id = c.id
        WHERE p.id = :id
      `, { id: productId });

      const [productDetails] = await db.query(`
        SELECT 
          id, product_id, user_id, name, barcode, description, category, company_name,
          qty, unit, unit_price, total_price, status, created_at, created_by
        FROM product_details
        WHERE product_id = :product_id
        ORDER BY created_at DESC
        LIMIT 1
      `, { product_id: productId });

      return res.json({
        error: false,
        message: isNewProduct ? "Product created successfully." : "Product quantity updated successfully.",
        data: {
          ...productData[0],
          detail: productDetails[0] || {}
        }
      });
    }

    return res.status(500).json({
      error: true,
      message: "Failed to retrieve product data after creation."
    });

  } catch (error) {
    console.error("❌ Error while creating product:", error);
    logError("product.create", error, res);
    return res.status(500).json({
      success: false,
      message: "An error occurred while creating the product.",
    });
  }
};




exports.update = async (req, res) => {
  try {
    const {
      id, name, category_id, company_name, description, qty, unit,
      unit_price, discount, status, actual_price, create_at, receive_date
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required for the update.",
      });
    }

    const convertedUnitPrice = parseFloat(unit_price);
    const convertedDiscount = discount ? parseFloat(discount) : 0;
    const convertedActualPrice = parseFloat(actual_price);

    if (isNaN(convertedUnitPrice) || isNaN(convertedActualPrice)) {
      return res.status(400).json({
        success: false,
        message: "Invalid unit_price or actual_price. Please provide valid numbers.",
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
        status = :status,
        actual_price = :actual_price,
        create_at = :create_at,
        receive_date = :receive_date
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
      actual_price: convertedActualPrice,
      create_at,
      receive_date
    });

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



exports.getProductDetail = async (req, res) => {
  try {
    const { txt_search, category_id, page, from_date, to_date, is_list_all } = req.query;
    const { user_id } = req.params;

    // Convert string to boolean
    const listAll = is_list_all === 'true';

    // Main SELECT
    let sqlSelect = `
      SELECT 
        pd.id AS detail_id,
        p.id AS product_id,
        cu.name AS customer_name, 
        pd.name,
        pd.barcode AS detail_barcode,
        pd.company_name AS detail_company_name,
        pd.description AS detail_description,
        pd.qty,
        pd.unit,
        pd.unit_price AS detail_unit_price,
        pd.total_price,
        c.actual_price,
        c.name AS category_name,
        pd.status AS detail_status,
        pd.created_at AS detail_created_at,
        pd.created_by AS detail_created_by,
        p.create_at AS product_created_at,
        p.receive_date AS receive_date,
        p.create_by AS product_created_by
    `;

    let sqlFrom = `
      FROM product_details pd
      JOIN product p ON pd.product_id = p.id
      LEFT JOIN category c ON CAST(pd.category AS UNSIGNED) = c.id
      LEFT JOIN customer cu ON pd.customer_id = cu.id
    `;

    let sqlWhere = `WHERE pd.user_id = ?`;
    const params = [user_id];

    if (from_date) {
      sqlWhere += ` AND DATE(pd.created_at) >= ?`;
      params.push(from_date);
    }

    if (to_date) {
      sqlWhere += ` AND DATE(pd.created_at) <= ?`;
      params.push(to_date);
    }

    if (txt_search) {
      const pattern = `%${txt_search}%`;
      sqlWhere += `
        AND (
          pd.name LIKE ? OR 
          pd.barcode LIKE ? OR 
          pd.company_name LIKE ? OR 
          pd.description LIKE ? OR
          c.name LIKE ?
        )
      `;
      params.push(pattern, pattern, pattern, pattern, pattern);
    }

    if (category_id) {
      sqlWhere += ` AND CAST(pd.category AS UNSIGNED) = ?`;
      params.push(category_id);
    }

    const countSql = `SELECT COUNT(*) AS total ${sqlFrom} ${sqlWhere}`;
    const [countRows] = await db.query(countSql, params);
    const total = countRows[0]?.total || 0;
    let sql = `${sqlSelect} ${sqlFrom} ${sqlWhere} ORDER BY pd.created_at DESC`;
    if (!listAll && page) {
      const pageSize = 10; // Default page size
      const offset = (parseInt(page) - 1) * pageSize;
      sql += ` LIMIT ${pageSize} OFFSET ${offset}`;
    }
    const [rows] = await db.query(sql, params);
    const formattedRows = rows.map((item) => {
      const totalPrice =
        (parseFloat(item.qty || 0) * parseFloat(item.detail_unit_price || 0)) /
        (parseFloat(item.actual_price) || 1);

      return {
        ...item,
        corrected_total_price: totalPrice.toFixed(2)
      };
    });

    res.json({
      success: true,
      data: formattedRows,
      total,
      message: formattedRows.length === 0 ? "No product details found" : undefined,
    });
  } catch (error) {
    console.error("Error while updating product:", error);
    logError("product.details", error, res);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the product. Please try again later.",
    });
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

