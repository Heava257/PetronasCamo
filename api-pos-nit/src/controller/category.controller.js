const { db, isArray, isEmpty, logError } = require("../util/helper");


exports.create = async (req, res) => {
  try {
    const branch_id = req.auth?.branch_id || null;
    const branch_name = req.auth?.branch_name || null;

    var sql =
      "INSERT INTO category (name, description, status, parentid, barcode, actual_price, user_id, branch_id, branch_name) VALUES (:name, :description, :status, :parentid, :barcode, :actual_price, :user_id, :branch_id, :branch_name)";
    var [data] = await db.query(sql, {
      name: req.body.name,
      description: req.body.description,
      status: req.body.status,
      parentid: req.body.parent_id,
      barcode: req.body.barcode,
      actual_price: req.body.actual_price,
      user_id: req.body.user_id,
      branch_id: branch_id,
      branch_name: branch_name
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
    const [currentUser] = await db.query(
      "SELECT role_id, branch_id FROM user WHERE id = ?",
      [req.current_id]
    );

    if (!currentUser || currentUser.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { role_id, branch_id: userBranchId } = currentUser[0];
    const isSuperAdmin = role_id === 29;
    const selectedBranchId = req.query.branch_id || req.query.branchId;

    let branchFilter = "";
    let sqlParams = {};

    if (isSuperAdmin) {
      if (selectedBranchId) {
        branchFilter = " AND c.branch_id = :selected_branch_id ";
        sqlParams.selected_branch_id = selectedBranchId;
      }
    } else {
      branchFilter = " AND c.branch_id = :user_branch_id ";
      sqlParams.user_branch_id = userBranchId;
    }

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
        c.branch_id,
        u.name as created_by_name,
        u.username as created_by_username
      FROM category c
      INNER JOIN user u ON c.user_id = u.id
      WHERE 1=1 ${branchFilter}
    `;

    var [data] = await db.query(sql, sqlParams);
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
