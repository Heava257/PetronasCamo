const {
  db,
  isArray,
  isEmpty,
  logError,
} = require("../util/helper");


exports.getList = async (req, res) => {
  try {
    var { txt_search, user_id, page, is_list_all } = req.query;
    const pageSize = 2; // fix
    page = Number(page);
    const offset = (page - 1) * pageSize;

    var sqlSelect = `
      SELECT at.id, at.user_id, at.product_id, 
             p.name, p.company_name, p.barcode, p.unit_price, 
             at.qty_transferred, at.date_transferred 
      FROM admin_stock_transfer at
      INNER JOIN product p ON at.product_id = p.id
      WHERE true
    `;

    // Apply filters based on query parameters
    if (txt_search) {
      sqlSelect += " AND (p.name LIKE :txt_search OR p.barcode = :barcode)";
    }
    if (user_id) {
      sqlSelect += " AND at.user_id = :user_id";
    }

    var sqlLimit = is_list_all ? "" : ` LIMIT ${pageSize} OFFSET ${offset}`;
    var sqlList = sqlSelect + sqlLimit;
    var sqlparam = {
      txt_search: "%" + txt_search + "%",
      barcode: txt_search,
      user_id,
    };

    const [list] = await db.query(sqlList, sqlparam);

    var dataCount = 0;
    if (page == 1) {
      let sqlTotal = "SELECT COUNT(at.id) as total FROM admin_stock_transfer at INNER JOIN product p ON at.product_id = p.id";
      var [dataCountResult] = await db.query(sqlTotal, sqlparam);
      dataCount = dataCountResult[0].total;
    }

    res.json({
      list,
      total: dataCount,
    });
  } catch (error) {
    logError("admin_stock_transfer.getList", error, res);
  }
};





exports.create = async (req, res) => {
  try {
    const { admin_id, user_id, product_id, qty_transferred } = req.body;

    var sql = `
      INSERT INTO admin_stock_transfer ( user_id, product_id, qty_transferred, date_transferred) 
      VALUES ( :user_id, :product_id, :qty_transferred, NOW())
    `;

    var [data] = await db.query(sql, {
      admin_id,
      user_id,
      product_id,
      qty_transferred,
    });

    // Update stock in `product` table (reduce stock)
    var sqlUpdateProduct = `
      UPDATE product SET qty = qty - :qty_transferred WHERE id = :product_id
    `;
    await db.query(sqlUpdateProduct, { qty_transferred, product_id });

    res.json({
      data,
      message: "Stock transferred successfully!",
    });
  } catch (error) {
    logError("admin_stock_transfer.create", error, res);
  }
};

exports.update = async (req, res) => {
  try {
    const { id, admin_id, user_id, product_id, qty_transferred } = req.body;

    var sql = `
      UPDATE admin_stock_transfer SET 
      user_id = :user_id, 
      product_id = :product_id, 
      qty_transferred = :qty_transferred 
      WHERE id = :id
    `;

    var [data] = await db.query(sql, {
      id,
      admin_id,
      user_id,
      product_id,
      qty_transferred,
    });

    res.json({
      data,
      message: "Data updated successfully!",
    });
  } catch (error) {
    logError("admin_stock_transfer.update", error, res);
  }
};


exports.remove = async (req, res) => {
  try {
    const id = req.params.id || req.body.id;

    if (!id) {
      return res.status(400).json({ message: "ID is required!" });
    }

    var [data] = await db.query("DELETE FROM admin_stock_transfer WHERE id = :id", { id });

    if (data.affectedRows === 0) {
      return res.status(404).json({ message: "Data not found!" });
    }

    res.json({ message: "Data deleted successfully!" });
  } catch (error) {
    logError("admin_stock_transfer.remove", error, res);
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
