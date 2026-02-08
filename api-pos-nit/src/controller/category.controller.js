const { db, isArray, isEmpty, logError } = require("../util/helper");


exports.create = async (req, res) => {
  try {
    var sql =
      "INSERT INTO category (name, description, status, parentid, barcode, actual_price, user_id) VALUES (:name, :description, :status, :parentid, :barcode, :actual_price, :user_id)";
    var [data] = await db.query(sql, {
      name: req.body.name,
      description: req.body.description,
      status: req.body.status,
      parentid: req.body.parent_id,
      barcode: req.body.barcode,
      actual_price: req.body.actual_price,
      user_id: req.body.user_id, // Added user_id
    });
    res.json({
      data: data,
      message: "Insert success!",
    });
  } catch (error) {
    logError("category.create", error, res);
  }
};

exports.update = async (req, res) => {
  try {
    var [data] = await db.query(
      "UPDATE category SET name=:name, description=:description, status=:status, parentid=:parentid, barcode=:barcode, actual_price=:actual_price, user_id=:user_id WHERE id = :id",
      {
        id: req.body.id,
        name: req.body.name,
        description: req.body.description,
        status: req.body.status,
        parentid: req.body.parentid,
        barcode: req.body.barcode,
        actual_price: req.body.actual_price,
        user_id: req.body.user_id, // Added user_id
      }
    );
    res.json({
      data: data,
      message: "Data update success!",
    });
  } catch (error) {
    logError("update.category", error, res);
  }
};

// ទាញទិន្នន័យតាម user_id (របស់ចាស់)
exports.getList = async (req, res) => {
  try {
    var sql = "SELECT id, name, description, status, parentid, barcode, actual_price, CreateAt, user_id FROM category WHERE user_id = :user_id";
    var [data] = await db.query(sql, {
      user_id: req.params.user_id
    });
    res.json({
      list: data,
      message: "Success!",
    });
  } catch (error) {
    logError("category.getList", error, res);
  }
};

exports.getListByCurrentUserGroup = async (req, res) => {
  try {
    var sql = `
      SELECT 
        c.id, 
        c.name, 
        c.description, 
        c.status, 
        c.parentid, 
        c.barcode, 
        c.actual_price, 
        c.CreateAt, 
        c.user_id,
        u.branch_id,
        u.name as created_by_name,
        u.username as created_by_username
      FROM category c
      INNER JOIN user u ON c.user_id = u.id
      INNER JOIN user cu ON cu.branch_id = u.branch_id
      WHERE cu.id = :current_user_id
    `;
    var [data] = await db.query(sql, {
      current_user_id: req.current_id
    });
    res.json({
      list: data,
      message: "Success!",
    });
  } catch (error) {
    logError("category.getListByCurrentUserGroup", error, res);
  }
};
exports.remove = async (req, res) => {
  try {
    var [data] = await db.query("DELETE FROM category WHERE id = :id", {
      id: req.body.id, // null
    });
    res.json({
      data: data,
      message: "Data delete success!",
    });
  } catch (error) {
    logError("remove.create", error, res);
  }
};

exports.runMigration = async (req, res) => {
  try {
    // 1. Add notes to pre_order_delivery
    const [cols1] = await db.query("SHOW COLUMNS FROM pre_order_delivery");
    if (!cols1.some(c => c.Field === 'notes')) {
      await db.query("ALTER TABLE pre_order_delivery ADD COLUMN notes TEXT NULL AFTER destination");
    }

    // 2. Add actual_delivery_date to pre_order
    const [cols2] = await db.query("SHOW COLUMNS FROM pre_order");
    if (!cols2.some(c => c.Field === 'actual_delivery_date')) {
      await db.query("ALTER TABLE pre_order ADD COLUMN actual_delivery_date DATETIME NULL AFTER delivery_date");
    }

    res.json({ success: true, message: "Migration completed successfully." });
  } catch (error) {
    logError("category.runMigration", error, res);
  }
};
