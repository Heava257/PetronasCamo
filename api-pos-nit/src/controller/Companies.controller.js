const { db, logError } = require("../util/helper");

// ===================================
// GET: List Companies
// ===================================
exports.getCompanies = async (req, res) => {
  try {
    const { txt_search, status, page, is_list_all } = req.query;

    const listAll = is_list_all === 'true';
    const pageSize = 10;
    const currentPage = Number(page) || 1;
    const offset = (currentPage - 1) * pageSize;

    let sqlWhere = 'WHERE 1=1';
    const params = [];

    // Search filter
    if (txt_search) {
      sqlWhere += ` AND (
        c.name LIKE ? OR 
        c.code LIKE ? OR 
        c.phone LIKE ? OR 
        c.email LIKE ? OR
        c.contact_person LIKE ?
      )`;
      const searchPattern = `%${txt_search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
    }

    // Status filter
    if (status !== undefined) {
      sqlWhere += ` AND c.status = ?`;
      params.push(status);
    } else {
      // Default: only show active companies
      sqlWhere += ` AND c.status = 1`;
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM companies c ${sqlWhere}`;
    const [countRows] = await db.query(countSql, params);
    const total = countRows[0]?.total || 0;

    // Build main query with financial summary
    const sql = `
      SELECT 
        c.*,
        COUNT(DISTINCT p.id) as total_products,
        COALESCE(SUM(p.qty * p.unit_price * (1 - COALESCE(p.discount, 0) / 100)), 0) as total_purchases,
        COALESCE(SUM(cp.paid_amount), 0) as total_paid,
        COALESCE(
          SUM(p.qty * p.unit_price * (1 - COALESCE(p.discount, 0) / 100)) - 
          SUM(cp.paid_amount), 
          0
        ) as outstanding_balance,
        MAX(cp.payment_date) as last_payment_date,
        MAX(p.create_at) as last_purchase_date
      FROM companies c
      LEFT JOIN product p ON c.id = p.company_id AND p.qty > 0
      LEFT JOIN company_payments cp ON c.id = cp.company_id AND cp.status = 1
      ${sqlWhere}
      GROUP BY c.id
      ORDER BY c.name ASC
      ${listAll ? '' : `LIMIT ${pageSize} OFFSET ${offset}`}
    `;

    const [rows] = await db.query(sql, params);

    // Format financial data
    const formattedRows = rows.map(row => ({
      ...row,
      total_purchases: parseFloat(row.total_purchases || 0),
      total_paid: parseFloat(row.total_paid || 0),
      outstanding_balance: parseFloat(row.outstanding_balance || 0),
      credit_limit: parseFloat(row.credit_limit || 0),
      credit_available: parseFloat(row.credit_limit || 0) - parseFloat(row.outstanding_balance || 0)
    }));

    res.json({
      success: true,
      data: formattedRows,
      total
    });

  } catch (error) {
    console.error("❌ Error in getCompanies:", error);
    logError("companies.getList", error, res);
  }
};

// ===================================
// GET: Company by ID
// ===================================
exports.getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;

    const sql = `
      SELECT 
        c.*,
        COUNT(DISTINCT p.id) as total_products,
        COALESCE(SUM(p.qty * p.unit_price * (1 - COALESCE(p.discount, 0) / 100)), 0) as total_purchases,
        COALESCE(SUM(cp.paid_amount), 0) as total_paid,
        COALESCE(
          SUM(p.qty * p.unit_price * (1 - COALESCE(p.discount, 0) / 100)) - 
          SUM(cp.paid_amount), 
          0
        ) as outstanding_balance,
        MAX(cp.payment_date) as last_payment_date,
        MAX(p.create_at) as last_purchase_date
      FROM companies c
      LEFT JOIN product p ON c.id = p.company_id AND p.qty > 0
      LEFT JOIN company_payments cp ON c.id = cp.company_id AND cp.status = 1
      WHERE c.id = ?
      GROUP BY c.id
    `;

    const [rows] = await db.query(sql, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    const company = {
      ...rows[0],
      total_purchases: parseFloat(rows[0].total_purchases || 0),
      total_paid: parseFloat(rows[0].total_paid || 0),
      outstanding_balance: parseFloat(rows[0].outstanding_balance || 0),
      credit_limit: parseFloat(rows[0].credit_limit || 0),
      credit_available: parseFloat(rows[0].credit_limit || 0) - parseFloat(rows[0].outstanding_balance || 0)
    };

    res.json({
      success: true,
      data: company
    });

  } catch (error) {
    console.error("❌ Error in getCompanyById:", error);
    logError("companies.getById", error, res);
  }
};

// ===================================
// POST: Create Company
// ===================================
exports.createCompany = async (req, res) => {
  try {
    const {
      name,
      code,
      address,
      phone,
      email,
      contact_person,
      tax_number,
      payment_terms,
      credit_limit,
      notes,
      status
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Company name is required"
      });
    }

    // Check for duplicate name
    const [existingCompany] = await db.query(
      "SELECT id FROM companies WHERE name = ?",
      [name]
    );

    if (existingCompany.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Company with this name already exists"
      });
    }

    // Check for duplicate code if provided
    if (code) {
      const [existingCode] = await db.query(
        "SELECT id FROM companies WHERE code = ?",
        [code]
      );

      if (existingCode.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Company code already exists"
        });
      }
    }

    const sql = `
      INSERT INTO companies (
        name, code, address, phone, email, contact_person,
        tax_number, payment_terms, credit_limit, notes, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(sql, [
      name,
      code || null,
      address || null,
      phone || null,
      email || null,
      contact_person || null,
      tax_number || null,
      payment_terms || null,
      credit_limit || 0,
      notes || null,
      status !== undefined ? status : 1,
      req.auth?.name || 'system'
    ]);

    res.json({
      success: true,
      message: "Company created successfully",
      data: {
        id: result.insertId,
        name
      }
    });

  } catch (error) {
    console.error("❌ Error in createCompany:", error);
    logError("companies.create", error, res);
  }
};

// ===================================
// PUT: Update Company
// ===================================
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      code,
      address,
      phone,
      email,
      contact_person,
      tax_number,
      payment_terms,
      credit_limit,
      notes,
      status
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Company name is required"
      });
    }

    // Check if company exists
    const [existingCompany] = await db.query(
      "SELECT id FROM companies WHERE id = ?",
      [id]
    );

    if (existingCompany.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    // Check for duplicate name (excluding current company)
    const [duplicateName] = await db.query(
      "SELECT id FROM companies WHERE name = ? AND id != ?",
      [name, id]
    );

    if (duplicateName.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Company with this name already exists"
      });
    }

    // Check for duplicate code if provided (excluding current company)
    if (code) {
      const [duplicateCode] = await db.query(
        "SELECT id FROM companies WHERE code = ? AND id != ?",
        [code, id]
      );

      if (duplicateCode.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Company code already exists"
        });
      }
    }

    const sql = `
      UPDATE companies
      SET 
        name = ?,
        code = ?,
        address = ?,
        phone = ?,
        email = ?,
        contact_person = ?,
        tax_number = ?,
        payment_terms = ?,
        credit_limit = ?,
        notes = ?,
        status = ?
      WHERE id = ?
    `;

    await db.query(sql, [
      name,
      code || null,
      address || null,
      phone || null,
      email || null,
      contact_person || null,
      tax_number || null,
      payment_terms || null,
      credit_limit || 0,
      notes || null,
      status !== undefined ? status : 1,
      id
    ]);

    res.json({
      success: true,
      message: "Company updated successfully"
    });

  } catch (error) {
    console.error("❌ Error in updateCompany:", error);
    logError("companies.update", error, res);
  }
};

// ===================================
// DELETE: Remove Company (Soft Delete)
// ===================================
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if company has related records
    const [products] = await db.query(
      "SELECT COUNT(*) as count FROM product WHERE company_id = ?",
      [id]
    );

    const [payments] = await db.query(
      "SELECT COUNT(*) as count FROM company_payments WHERE company_id = ?",
      [id]
    );

    if (products[0].count > 0 || payments[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete company with existing products or payments. Please set status to inactive instead.",
        details: {
          products: products[0].count,
          payments: payments[0].count
        }
      });
    }

    // Soft delete
    const sql = `UPDATE companies SET status = 0 WHERE id = ?`;
    const [result] = await db.query(sql, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Company not found"
      });
    }

    res.json({
      success: true,
      message: "Company deleted successfully"
    });

  } catch (error) {
    console.error("❌ Error in deleteCompany:", error);
    logError("companies.delete", error, res);
  }
};

// ===================================
// GET: Company Financial Summary
// ===================================
exports.getCompanyFinancialSummary = async (req, res) => {
  try {
    const { id } = req.params;
    const { from_date, to_date } = req.query;

    let dateFilter = '';
    const params = [id];

    if (from_date && to_date) {
      dateFilter = 'AND DATE(p.create_at) BETWEEN ? AND ?';
      params.push(from_date, to_date);
    }

    // Get purchase summary
    const purchasesSql = `
      SELECT 
        DATE_FORMAT(p.create_at, '%Y-%m') as month,
        COUNT(p.id) as purchase_count,
        SUM(p.qty * p.unit_price * (1 - COALESCE(p.discount, 0) / 100)) as total_amount
      FROM product p
      WHERE p.company_id = ?
      ${dateFilter}
      GROUP BY month
      ORDER BY month DESC
    `;

    const [purchases] = await db.query(purchasesSql, params);

    // Get payment summary
    const paymentParams = [id];
    let paymentDateFilter = '';
    
    if (from_date && to_date) {
      paymentDateFilter = 'AND DATE(cp.payment_date) BETWEEN ? AND ?';
      paymentParams.push(from_date, to_date);
    }

    const paymentsSql = `
      SELECT 
        DATE_FORMAT(cp.payment_date, '%Y-%m') as month,
        COUNT(cp.id) as payment_count,
        SUM(cp.paid_amount) as total_paid
      FROM company_payments cp
      WHERE cp.company_id = ?
      AND cp.status = 1
      ${paymentDateFilter}
      GROUP BY month
      ORDER BY month DESC
    `;

    const [payments] = await db.query(paymentsSql, paymentParams);

    // Get overall summary
    const overallSql = `
      SELECT 
        (SELECT COALESCE(SUM(p.qty * p.unit_price * (1 - COALESCE(p.discount, 0) / 100)), 0)
         FROM product p
         WHERE p.company_id = ? ${dateFilter}) as total_purchases,
        (SELECT COALESCE(SUM(cp.paid_amount), 0)
         FROM company_payments cp
         WHERE cp.company_id = ? AND cp.status = 1 ${paymentDateFilter}) as total_paid
    `;

    const overallParams = from_date && to_date ? [id, from_date, to_date, id, from_date, to_date] : [id, id];
    const [overall] = await db.query(overallSql, overallParams);

    const totalPurchases = parseFloat(overall[0].total_purchases || 0);
    const totalPaid = parseFloat(overall[0].total_paid || 0);

    res.json({
      success: true,
      data: {
        purchases: purchases.map(p => ({
          ...p,
          total_amount: parseFloat(p.total_amount || 0)
        })),
        payments: payments.map(p => ({
          ...p,
          total_paid: parseFloat(p.total_paid || 0)
        })),
        summary: {
          total_purchases: totalPurchases,
          total_paid: totalPaid,
          outstanding_balance: totalPurchases - totalPaid
        }
      }
    });

  } catch (error) {
    console.error("❌ Error in getCompanyFinancialSummary:", error);
    logError("companies.getFinancialSummary", error, res);
  }
};

module.exports = exports;
