const { db, isArray, isEmpty, logError } = require("../util/helper");

// ==================== GET LIST ====================
exports.getList = async (req, res) => {
  try {
    const { txtSearch } = req.query;

    let sql = `
      SELECT 
        s.*, 
        u.branch_name, 
        u.name AS created_by_name
      FROM supplier s
      LEFT JOIN user u ON s.user_id = u.id
      WHERE 1=1
    `;

    const values = [];

    // Branch filter for non-admin users
    if (req.auth && req.auth.role !== "admin") {
      sql += ` AND u.branch_name = ?`;
      values.push(req.auth.branch_name);
    }

    // Search filter 
    if (txtSearch && txtSearch.trim() !== "") {
      sql += `
        AND (
          s.name LIKE ? OR
          s.code LIKE ? OR
          s.tel LIKE ? OR
          s.email LIKE ? OR
          s.contact_person LIKE ?
        )
      `;
      const searchParam = `%${txtSearch}%`;
      values.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    sql += ` ORDER BY s.created_at DESC`;

    const [list] = await db.query(sql, values);

    res.json({ 
      error: false,
      list: list 
    });

  } catch (error) {
    console.error("ERROR in supplier.getList:", error);
    logError("supplier.getList", error, res);
  }
};

// ==================== CREATE ====================
exports.create = async (req, res) => {
  try {
    const {
      name,
      code,
      tel,
      email,
      address,
      website,
      note,
      fuel_types,
      credit_terms,
      contact_person,
      company_license,
      tax_id,
      bank_account,
      payment_method,
      is_active
    } = req.body;



    // Validation
    if (!name) {
      return res.status(400).json({
        error: true,
        message: "Supplier name is required!"
      });
    }

    if (!code) {
      return res.status(400).json({
        error: true,
        message: "Supplier code is required!"
      });
    }

    if (!tel) {
      return res.status(400).json({
        error: true,
        message: "Supplier telephone is required!"
      });
    }

    if (!email) {
      return res.status(400).json({
        error: true,
        message: "Supplier email is required!"
      });
    }

    // ✅ Convert array to comma-separated string for fuel_types
    let fuelTypesString = null;
    if (fuel_types) {
      if (Array.isArray(fuel_types)) {
        fuelTypesString = fuel_types.join(',');
      } else if (typeof fuel_types === 'string') {
        fuelTypesString = fuel_types;
      }
    }

    // ✅ Validate payment_method ENUM
    const validPaymentMethods = ['cash', 'check', 'transfer', 'online'];
    let validatedPaymentMethod = null;
    if (payment_method && validPaymentMethods.includes(payment_method)) {
      validatedPaymentMethod = payment_method;
    }

    const sql = `
      INSERT INTO supplier 
      (name, code, tel, email, address, website, note, 
       fuel_types, credit_terms, contact_person, company_license, 
       tax_id, bank_account, payment_method, is_active, user_id)
      VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      name,
      code,
      tel,
      email,
      address || null,
      website || null,
      note || null,
      fuelTypesString,
      credit_terms || null,
      contact_person || null,
      company_license || null,
      tax_id || null,
      bank_account || null,
      validatedPaymentMethod, // ✅ Use validated enum value
      is_active !== undefined ? is_active : 1,
      req.auth && req.auth.id ? req.auth.id : null
    ];


    const [result] = await db.query(sql, values);


    res.json({
      error: false,
      message: "Supplier created successfully!",
      data: {
        id: result.insertId,
        name,
        code,
        tel,
        email,
        address,
        website,
        note,
        fuel_types: fuelTypesString,
        credit_terms,
        contact_person,
        company_license,
        tax_id,
        bank_account,
        payment_method: validatedPaymentMethod,
        is_active: is_active !== undefined ? is_active : 1,
        user_id: req.auth && req.auth.id ? req.auth.id : null
      }
    });

  } catch (error) {
    console.error("ERROR in supplier.create:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql
    });
    logError("supplier.create", error, res);
  }
};

// ==================== UPDATE ====================
exports.update = async (req, res) => {
  try {
    const {
      id,
      name,
      code,
      tel,
      email,
      address,
      website,
      note,
      fuel_types,
      credit_terms,
      contact_person,
      company_license,
      tax_id,
      bank_account,
      payment_method,
      is_active
    } = req.body;



    // Validation
    if (!id) {
      return res.status(400).json({
        error: true,
        message: "Supplier ID is required!"
      });
    }

    if (!name) {
      return res.status(400).json({
        error: true,
        message: "Supplier name is required!"
      });
    }

    if (!code) {
      return res.status(400).json({
        error: true,
        message: "Supplier code is required!"
      });
    }

    if (!tel) {
      return res.status(400).json({
        error: true,
        message: "Supplier telephone is required!"
      });
    }

    if (!email) {
      return res.status(400).json({
        error: true,
        message: "Supplier email is required!"
      });
    }

    // Check if supplier exists
    const checkSql = "SELECT id FROM supplier WHERE id = ?";
    const [existing] = await db.query(checkSql, [id]);

    if (!existing || existing.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Supplier not found!"
      });
    }

    // ✅ Convert array to comma-separated string for fuel_types
    let fuelTypesString = null;
    if (fuel_types) {
      if (Array.isArray(fuel_types)) {
        fuelTypesString = fuel_types.join(',');
      } else if (typeof fuel_types === 'string') {
        fuelTypesString = fuel_types;
      }
    }

    // ✅ Validate payment_method ENUM
    const validPaymentMethods = ['cash', 'check', 'transfer', 'online'];
    let validatedPaymentMethod = null;
    if (payment_method && validPaymentMethods.includes(payment_method)) {
      validatedPaymentMethod = payment_method;
    }

    const sql = `
      UPDATE supplier 
      SET 
        name = ?,
        code = ?,
        tel = ?,
        email = ?,
        address = ?,
        website = ?,
        note = ?,
        fuel_types = ?,
        credit_terms = ?,
        contact_person = ?,
        company_license = ?,
        tax_id = ?,
        bank_account = ?,
        payment_method = ?,
        is_active = ?,
        user_id = ?
      WHERE id = ?
    `;

    const values = [
      name,
      code,
      tel,
      email,
      address || null,
      website || null,
      note || null,
      fuelTypesString,
      credit_terms || null,
      contact_person || null,
      company_license || null,
      tax_id || null,
      bank_account || null,
      validatedPaymentMethod, // ✅ Use validated enum value
      is_active !== undefined ? is_active : 1,
      req.auth && req.auth.id ? req.auth.id : null,
      id
    ];


    await db.query(sql, values);


    res.json({
      error: false,
      message: "Supplier updated successfully!",
      data: {
        id,
        name,
        code,
        tel,
        email,
        address,
        website,
        note,
        fuel_types: fuelTypesString,
        credit_terms,
        contact_person,
        company_license,
        tax_id,
        bank_account,
        payment_method: validatedPaymentMethod,
        is_active,
        user_id: req.auth && req.auth.id ? req.auth.id : null
      }
    });

  } catch (error) {
    console.error("ERROR in supplier.update:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      errno: error.errno,
      sql: error.sql
    });
    logError("supplier.update", error, res);
  }
};

// ==================== DELETE ====================
exports.remove = async (req, res) => {
  try {
    const { id } = req.body;


    if (!id) {
      return res.status(400).json({
        error: true,
        message: "Supplier ID is required!"
      });
    }

    // Check if supplier exists
    const checkSql = "SELECT id FROM supplier WHERE id = ?";
    const [existing] = await db.query(checkSql, [id]);

    if (!existing || existing.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Supplier not found!"
      });
    }

    const sql = "DELETE FROM supplier WHERE id = ?";
    await db.query(sql, [id]);


    res.json({
      error: false,
      message: "Supplier deleted successfully!"
    });

  } catch (error) {
    console.error("ERROR in supplier.remove:", error);
    
    // Check for foreign key constraint error
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
      return res.status(400).json({
        error: true,
        message: "Cannot delete supplier. It is being used in other records (purchases, etc)."
      });
    }
    
    logError("supplier.remove", error, res);
  }
};

// Export all functions
module.exports = {
  getList: exports.getList,
  create: exports.create,
  update: exports.update,
  remove: exports.remove
};
