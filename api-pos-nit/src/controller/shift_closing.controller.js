// ✅ shift_closing.controller.js - Complete Shift Closing Controller

const { db, isArray, isEmpty, logError } = require("../util/helper");
const dayjs = require('dayjs');

// ========================================
// 1. CREATE NEW SHIFT (បើកវេន)
// ========================================

exports.createShift = async (req, res) => {
  try {
    const {
      shift_name,      // 'morning', 'afternoon', 'evening', 'night'
      shift_date,      // '2026-01-11'
      start_time,      // '2026-01-11 06:00:00'
      opening_cash,    // 100.00
      opening_stock    // {product_id: qty, ...}
    } = req.body;

    // Validation
    if (!shift_name || !shift_date) {
      return res.status(400).json({
        success: false,
        message: "Shift name and date are required"
      });
    }

    // Get user info
    const branch_name = req.auth?.branch_name || null;
    const staff_id = req.auth?.id || null;
    const staff_name = req.auth?.name || null;

    // Generate shift ID
    const shift_id = `SHIFT-${shift_date}-${shift_name.toUpperCase()}-${branch_name || 'HQ'}`;

    // Check if shift already exists
    const [existingShift] = await db.query(
      "SELECT id FROM shift_closing WHERE shift_id = :shift_id",
      { shift_id }
    );

    if (existingShift.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Shift already exists for this date and time"
      });
    }

    // Insert new shift
    const sql = `
      INSERT INTO shift_closing (
        shift_id, branch_name, shift_date, shift_name, start_time,
        staff_id, staff_name, opening_cash, opening_stock_json,
        status, created_by, created_at
      ) VALUES (
        :shift_id, :branch_name, :shift_date, :shift_name, :start_time,
        :staff_id, :staff_name, :opening_cash, :opening_stock_json,
        'open', :created_by, NOW()
      )
    `;

    const [result] = await db.query(sql, {
      shift_id,
      branch_name,
      shift_date,
      shift_name,
      start_time: start_time || dayjs().format('YYYY-MM-DD HH:mm:ss'),
      staff_id,
      staff_name,
      opening_cash: opening_cash || 0,
      opening_stock_json: JSON.stringify(opening_stock || {}),
      created_by: staff_id
    });

    res.status(201).json({
      success: true,
      message: "Shift opened successfully",
      data: {
        id: result.insertId,
        shift_id,
        shift_name,
        shift_date,
        staff_name
      }
    });

  } catch (error) {
    logError("shift_closing.createShift", error, res);
  }
};

// ========================================
// 2. GET CURRENT OPEN SHIFT (វេនកំពុងបើក)
// ========================================

exports.getCurrentShift = async (req, res) => {
  try {
    const branch_name = req.auth?.branch_name || null;
    const staff_id = req.auth?.id || null;

    const sql = `
      SELECT 
        sc.*,
        TIMESTAMPDIFF(HOUR, sc.start_time, NOW()) as hours_open
      FROM shift_closing sc
      WHERE sc.status = 'open'
        AND sc.branch_name = :branch_name
        AND sc.staff_id = :staff_id
      ORDER BY sc.start_time DESC
      LIMIT 1
    `;

    const [shift] = await db.query(sql, { branch_name, staff_id });

    if (shift.length === 0) {
      return res.json({
        success: true,
        message: "No open shift found",
        data: null
      });
    }

    // Parse JSON fields
    const shiftData = shift[0];
    shiftData.opening_stock_json = shiftData.opening_stock_json 
      ? JSON.parse(shiftData.opening_stock_json) 
      : {};

    res.json({
      success: true,
      data: shiftData
    });

  } catch (error) {
    logError("shift_closing.getCurrentShift", error, res);
  }
};

// ========================================
// 3. CLOSE SHIFT (បិទវេន)
// ========================================

exports.closeShift = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      end_time,
      closing_cash_actual,
      closing_stock,           // {product_id: qty, ...}
      expenses,                // [{description, amount, category}, ...]
      notes,
      issues_reported
    } = req.body;

    // Validation
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Shift ID is required"
      });
    }

    // Get existing shift
    const [existingShift] = await db.query(
      "SELECT * FROM shift_closing WHERE id = :id AND status = 'open'",
      { id }
    );

    if (existingShift.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Open shift not found"
      });
    }

    const shift = existingShift[0];

    // ✅ Calculate sales summary for this shift
    const [salesSummary] = await db.query(`
      SELECT 
        COUNT(o.id) as total_orders,
        SUM(o.total_amount) as total_sales_amount,
        SUM(
          (SELECT SUM(od.qty) 
           FROM order_detail od 
           WHERE od.order_id = o.id)
        ) as total_sales_liters,
        SUM(CASE WHEN o.payment_method = 'cash' THEN o.total_amount ELSE 0 END) as cash_received,
        SUM(CASE WHEN o.payment_method = 'card' THEN o.total_amount ELSE 0 END) as card_received,
        SUM(CASE WHEN o.payment_method = 'transfer' THEN o.total_amount ELSE 0 END) as transfer_received,
        SUM(CASE WHEN o.payment_method = 'credit' THEN o.total_amount ELSE 0 END) as credit_sales
      FROM \`order\` o
      INNER JOIN user u ON o.user_id = u.id
      WHERE u.branch_name = :branch_name
        AND o.create_at BETWEEN :start_time AND :end_time
    `, {
      branch_name: shift.branch_name,
      start_time: shift.start_time,
      end_time: end_time || dayjs().format('YYYY-MM-DD HH:mm:ss')
    });

    const sales = salesSummary[0] || {};

    // ✅ Calculate cash variance
    const opening_cash = parseFloat(shift.opening_cash) || 0;
    const cash_received = parseFloat(sales.cash_received) || 0;
    const total_expenses = expenses?.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0) || 0;
    
    const closing_cash_expected = opening_cash + cash_received - total_expenses;
    const cash_variance = (parseFloat(closing_cash_actual) || 0) - closing_cash_expected;

    // ✅ Calculate stock variance
    const opening_stock = shift.opening_stock_json ? JSON.parse(shift.opening_stock_json) : {};
    const stock_variance = {};
    let total_stock_loss_liters = 0;
    let total_stock_loss_value = 0;

    for (const [product_id, opening_qty] of Object.entries(opening_stock)) {
      const closing_qty = closing_stock?.[product_id] || 0;
      
      // Get sales for this product in this shift
      const [productSales] = await db.query(`
        SELECT SUM(od.qty) as qty_sold
        FROM order_detail od
        INNER JOIN \`order\` o ON od.order_id = o.id
        INNER JOIN user u ON o.user_id = u.id
        WHERE od.product_id = :product_id
          AND u.branch_name = :branch_name
          AND o.create_at BETWEEN :start_time AND :end_time
      `, {
        product_id,
        branch_name: shift.branch_name,
        start_time: shift.start_time,
        end_time: end_time || dayjs().format('YYYY-MM-DD HH:mm:ss')
      });

      const qty_sold = parseFloat(productSales[0]?.qty_sold) || 0;
      const expected_closing = opening_qty - qty_sold;
      const variance = closing_qty - expected_closing;

      stock_variance[product_id] = {
        opening: opening_qty,
        sold: qty_sold,
        expected_closing: expected_closing,
        actual_closing: closing_qty,
        variance: variance
      };

      if (variance < 0) {
        total_stock_loss_liters += Math.abs(variance);
        
        // Get unit cost for this product
        const [productInfo] = await db.query(
          "SELECT unit_price FROM product WHERE id = :product_id",
          { product_id }
        );
        const unit_cost = parseFloat(productInfo[0]?.unit_price) || 0;
        total_stock_loss_value += Math.abs(variance) * unit_cost;
      }
    }

    // ✅ Update shift closing
    const updateSql = `
      UPDATE shift_closing SET
        end_time = :end_time,
        total_sales_amount = :total_sales_amount,
        total_sales_liters = :total_sales_liters,
        total_orders = :total_orders,
        cash_received = :cash_received,
        card_received = :card_received,
        transfer_received = :transfer_received,
        credit_sales = :credit_sales,
        closing_cash_expected = :closing_cash_expected,
        closing_cash_actual = :closing_cash_actual,
        cash_variance = :cash_variance,
        closing_stock_json = :closing_stock_json,
        stock_variance_json = :stock_variance_json,
        total_stock_loss_liters = :total_stock_loss_liters,
        total_stock_loss_value = :total_stock_loss_value,
        expenses_json = :expenses_json,
        total_expenses = :total_expenses,
        notes = :notes,
        issues_reported = :issues_reported,
        status = 'pending_approval',
        updated_at = NOW()
      WHERE id = :id
    `;

    await db.query(updateSql, {
      id,
      end_time: end_time || dayjs().format('YYYY-MM-DD HH:mm:ss'),
      total_sales_amount: sales.total_sales_amount || 0,
      total_sales_liters: sales.total_sales_liters || 0,
      total_orders: sales.total_orders || 0,
      cash_received,
      card_received: sales.card_received || 0,
      transfer_received: sales.transfer_received || 0,
      credit_sales: sales.credit_sales || 0,
      closing_cash_expected,
      closing_cash_actual: closing_cash_actual || 0,
      cash_variance,
      closing_stock_json: JSON.stringify(closing_stock || {}),
      stock_variance_json: JSON.stringify(stock_variance),
      total_stock_loss_liters,
      total_stock_loss_value,
      expenses_json: JSON.stringify(expenses || []),
      total_expenses,
      notes: notes || null,
      issues_reported: issues_reported || null
    });

    // ✅ Insert expenses into shift_expenses table
    if (expenses && expenses.length > 0) {
      for (const expense of expenses) {
        await db.query(`
          INSERT INTO shift_expenses (
            shift_closing_id, expense_date, branch_name,
            category, description, amount, payment_method,
            created_by, created_at
          ) VALUES (
            :shift_closing_id, :expense_date, :branch_name,
            :category, :description, :amount, :payment_method,
            :created_by, NOW()
          )
        `, {
          shift_closing_id: id,
          expense_date: shift.shift_date,
          branch_name: shift.branch_name,
          category: expense.category || 'other',
          description: expense.description,
          amount: expense.amount,
          payment_method: expense.payment_method || 'cash',
          created_by: req.auth?.id
        });
      }
    }

    res.json({
      success: true,
      message: "Shift closed successfully",
      data: {
        id,
        cash_variance,
        stock_loss_liters: total_stock_loss_liters,
        stock_loss_value: total_stock_loss_value,
        status: 'pending_approval'
      }
    });

  } catch (error) {
    logError("shift_closing.closeShift", error, res);
  }
};

// ========================================
// 4. GET SHIFT LIST (បញ្ជីវេនទាំងអស់)
// ========================================

exports.getShiftList = async (req, res) => {
  try {
    const { from_date, to_date, status, branch_name, page = 1, pageSize = 20 } = req.query;

    let sql = `
      SELECT 
        sc.*,
        TIMESTAMPDIFF(HOUR, sc.start_time, IFNULL(sc.end_time, NOW())) as duration_hours
      FROM shift_closing sc
      WHERE 1=1
    `;

    const params = {};

    // Branch filter
    if (req.auth?.role !== "admin") {
      sql += ` AND sc.branch_name = :branch_name`;
      params.branch_name = req.auth?.branch_name;
    } else if (branch_name) {
      sql += ` AND sc.branch_name = :branch_name`;
      params.branch_name = branch_name;
    }

    // Date filter
    if (from_date) {
      sql += ` AND sc.shift_date >= :from_date`;
      params.from_date = from_date;
    }
    if (to_date) {
      sql += ` AND sc.shift_date <= :to_date`;
      params.to_date = to_date;
    }

    // Status filter
    if (status) {
      sql += ` AND sc.status = :status`;
      params.status = status;
    }

    sql += ` ORDER BY sc.shift_date DESC, sc.start_time DESC`;

    // Pagination
    const offset = (page - 1) * pageSize;
    sql += ` LIMIT :pageSize OFFSET :offset`;
    params.pageSize = parseInt(pageSize);
    params.offset = offset;

    const [shifts] = await db.query(sql, params);

    // Parse JSON fields
    const list = shifts.map(shift => ({
      ...shift,
      opening_stock_json: shift.opening_stock_json ? JSON.parse(shift.opening_stock_json) : {},
      closing_stock_json: shift.closing_stock_json ? JSON.parse(shift.closing_stock_json) : {},
      stock_variance_json: shift.stock_variance_json ? JSON.parse(shift.stock_variance_json) : {},
      expenses_json: shift.expenses_json ? JSON.parse(shift.expenses_json) : []
    }));

    res.json({
      success: true,
      list,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total: list.length
      }
    });

  } catch (error) {
    logError("shift_closing.getShiftList", error, res);
  }
};

// ========================================
// 5. APPROVE/REJECT SHIFT (អនុម័ត/បដិសេធ)
// ========================================

exports.approveShift = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body; // action: 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Use 'approve' or 'reject'"
      });
    }

    const status = action === 'approve' ? 'approved' : 'rejected';

    const sql = `
      UPDATE shift_closing SET
        status = :status,
        notes = CONCAT(IFNULL(notes, ''), '\n\n', :approval_notes),
        approved_by = :approved_by,
        approved_at = NOW()
      WHERE id = :id
    `;

    await db.query(sql, {
      id,
      status,
      approval_notes: `[${action.toUpperCase()}] ${notes || ''}`,
      approved_by: req.auth?.id
    });

    res.json({
      success: true,
      message: `Shift ${action}d successfully`
    });

  } catch (error) {
    logError("shift_closing.approveShift", error, res);
  }
};

// ========================================
// 6. GET SHIFT BY ID
// ========================================

exports.getShiftById = async (req, res) => {
  try {
    const { id } = req.params;

    const [shift] = await db.query(
      "SELECT * FROM shift_closing WHERE id = :id",
      { id }
    );

    if (shift.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Shift not found"
      });
    }

    const shiftData = shift[0];
    shiftData.opening_stock_json = shiftData.opening_stock_json ? JSON.parse(shiftData.opening_stock_json) : {};
    shiftData.closing_stock_json = shiftData.closing_stock_json ? JSON.parse(shiftData.closing_stock_json) : {};
    shiftData.stock_variance_json = shiftData.stock_variance_json ? JSON.parse(shiftData.stock_variance_json) : {};
    shiftData.expenses_json = shiftData.expenses_json ? JSON.parse(shiftData.expenses_json) : [];

    res.json({
      success: true,
      data: shiftData
    });

  } catch (error) {
    logError("shift_closing.getShiftById", error, res);
  }
};

// ========================================
// 7. ADD EXPENSE TO SHIFT
// ========================================

exports.addExpense = async (req, res) => {
  try {
    const { shift_id } = req.params;
    const { category, description, amount, payment_method, receipt_number } = req.body;

    // Get shift closing ID
    const [shift] = await db.query(
      "SELECT id, shift_date, branch_name FROM shift_closing WHERE id = :shift_id",
      { shift_id }
    );

    if (shift.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Shift not found"
      });
    }

    const sql = `
      INSERT INTO shift_expenses (
        shift_closing_id, expense_date, branch_name,
        category, description, amount, payment_method,
        receipt_number, created_by, created_at
      ) VALUES (
        :shift_closing_id, :expense_date, :branch_name,
        :category, :description, :amount, :payment_method,
        :receipt_number, :created_by, NOW()
      )
    `;

    const [result] = await db.query(sql, {
      shift_closing_id: shift_id,
      expense_date: shift[0].shift_date,
      branch_name: shift[0].branch_name,
      category,
      description,
      amount,
      payment_method: payment_method || 'cash',
      receipt_number: receipt_number || null,
      created_by: req.auth?.id
    });

    res.status(201).json({
      success: true,
      message: "Expense added successfully",
      data: { id: result.insertId }
    });

  } catch (error) {
    logError("shift_closing.addExpense", error, res);
  }
};

// ========================================
// 8. GET EXPENSES FOR SHIFT
// ========================================

exports.getExpenses = async (req, res) => {
  try {
    const { shift_id } = req.params;

    const sql = `
      SELECT * FROM shift_expenses
      WHERE shift_closing_id = :shift_id
      ORDER BY created_at DESC
    `;

    const [expenses] = await db.query(sql, { shift_id });

    res.json({
      success: true,
      list: expenses
    });

  } catch (error) {
    logError("shift_closing.getExpenses", error, res);
  }
};

// ========================================
// 9. UPDATE EXPENSE
// ========================================

exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, description, amount, payment_method, receipt_number } = req.body;

    const sql = `
      UPDATE shift_expenses SET
        category = :category,
        description = :description,
        amount = :amount,
        payment_method = :payment_method,
        receipt_number = :receipt_number
      WHERE id = :id
    `;

    await db.query(sql, {
      id,
      category,
      description,
      amount,
      payment_method,
      receipt_number: receipt_number || null
    });

    res.json({
      success: true,
      message: "Expense updated successfully"
    });

  } catch (error) {
    logError("shift_closing.updateExpense", error, res);
  }
};

// ========================================
// 10. DELETE EXPENSE
// ========================================

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("DELETE FROM shift_expenses WHERE id = :id", { id });

    res.json({
      success: true,
      message: "Expense deleted successfully"
    });

  } catch (error) {
    logError("shift_closing.deleteExpense", error, res);
  }
};

module.exports = exports;