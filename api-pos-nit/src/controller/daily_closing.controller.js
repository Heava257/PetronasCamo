// ✅ daily_closing.controller.js - Complete Daily Closing Controller

const { db, logError } = require("../util/helper");
const dayjs = require('dayjs');

// ========================================
// 1. CREATE DAILY CLOSING (បង្កើតបិទថ្ងៃ)
// ========================================

exports.createDailyClosing = async (req, res) => {
  try {
    const { closing_date } = req.body;

    if (!closing_date) {
      return res.status(400).json({
        success: false,
        message: "Closing date is required"
      });
    }

    const branch_name = req.auth?.branch_name || null;
    const closing_id = `DC-${closing_date}-${branch_name || 'HQ'}`;

    // Check if already exists
    const [existing] = await db.query(
      "SELECT id FROM daily_closing WHERE closing_id = :closing_id",
      { closing_id }
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Daily closing already exists for this date"
      });
    }

    // ✅ Get all approved shifts for this date
    const [shifts] = await db.query(`
      SELECT * FROM shift_closing
      WHERE shift_date = :closing_date
        AND branch_name = :branch_name
        AND status = 'approved'
      ORDER BY start_time ASC
    `, {
      closing_date,
      branch_name
    });

    if (shifts.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No approved shifts found for this date"
      });
    }

    // ✅ Calculate daily summary
    const shift_ids = shifts.map(s => s.shift_id);
    const total_shifts = shifts.length;

    let total_sales_amount = 0;
    let total_sales_liters = 0;
    let total_orders = 0;
    let total_cash = 0;
    let total_card = 0;
    let total_transfer = 0;
    let total_credit = 0;
    let total_expenses = 0;
    let total_stock_loss_liters = 0;
    let total_stock_loss_value = 0;
    let cash_variance_total = 0;

    shifts.forEach(shift => {
      total_sales_amount += parseFloat(shift.total_sales_amount) || 0;
      total_sales_liters += parseFloat(shift.total_sales_liters) || 0;
      total_orders += parseInt(shift.total_orders) || 0;
      total_cash += parseFloat(shift.cash_received) || 0;
      total_card += parseFloat(shift.card_received) || 0;
      total_transfer += parseFloat(shift.transfer_received) || 0;
      total_credit += parseFloat(shift.credit_sales) || 0;
      total_expenses += parseFloat(shift.total_expenses) || 0;
      total_stock_loss_liters += parseFloat(shift.total_stock_loss_liters) || 0;
      total_stock_loss_value += parseFloat(shift.total_stock_loss_value) || 0;
      cash_variance_total += parseFloat(shift.cash_variance) || 0;
    });

    // ✅ Financial calculations
    const gross_revenue = total_sales_amount;
    const total_costs = total_expenses + total_stock_loss_value;
    const net_profit = gross_revenue - total_costs;
    const profit_margin = gross_revenue > 0 ? (net_profit / gross_revenue) * 100 : 0;

    // ✅ Insert daily closing
    const sql = `
      INSERT INTO daily_closing (
        closing_id, branch_name, closing_date,
        total_shifts, shift_ids_json,
        total_sales_amount, total_sales_liters, total_orders,
        total_cash, total_card, total_transfer, total_credit,
        total_stock_loss_liters, total_stock_loss_value,
        total_expenses,
        gross_revenue, total_costs, net_profit, profit_margin,
        cash_variance_total,
        status, created_by, created_at
      ) VALUES (
        :closing_id, :branch_name, :closing_date,
        :total_shifts, :shift_ids_json,
        :total_sales_amount, :total_sales_liters, :total_orders,
        :total_cash, :total_card, :total_transfer, :total_credit,
        :total_stock_loss_liters, :total_stock_loss_value,
        :total_expenses,
        :gross_revenue, :total_costs, :net_profit, :profit_margin,
        :cash_variance_total,
        'draft', :created_by, NOW()
      )
    `;

    const [result] = await db.query(sql, {
      closing_id,
      branch_name,
      closing_date,
      total_shifts,
      shift_ids_json: JSON.stringify(shift_ids),
      total_sales_amount,
      total_sales_liters,
      total_orders,
      total_cash,
      total_card,
      total_transfer,
      total_credit,
      total_stock_loss_liters,
      total_stock_loss_value,
      total_expenses,
      gross_revenue,
      total_costs,
      net_profit,
      profit_margin: profit_margin.toFixed(2),
      cash_variance_total,
      created_by: req.auth?.id
    });

    res.status(201).json({
      success: true,
      message: "Daily closing created successfully",
      data: {
        id: result.insertId,
        closing_id,
        net_profit,
        profit_margin: profit_margin.toFixed(2)
      }
    });

  } catch (error) {
    logError("daily_closing.createDailyClosing", error, res);
  }
};

// ========================================
// 2. GET DAILY CLOSING LIST
// ========================================

exports.getDailyClosingList = async (req, res) => {
  try {
    const { from_date, to_date, status, branch_name } = req.query;

    let sql = `SELECT * FROM daily_closing WHERE 1=1`;
    const params = {};

    if (req.auth?.role !== "admin") {
      sql += ` AND branch_name = :branch_name`;
      params.branch_name = req.auth?.branch_name;
    } else if (branch_name) {
      sql += ` AND branch_name = :branch_name`;
      params.branch_name = branch_name;
    }

    if (from_date) {
      sql += ` AND closing_date >= :from_date`;
      params.from_date = from_date;
    }
    if (to_date) {
      sql += ` AND closing_date <= :to_date`;
      params.to_date = to_date;
    }
    if (status) {
      sql += ` AND status = :status`;
      params.status = status;
    }

    sql += ` ORDER BY closing_date DESC`;

    const [list] = await db.query(sql, params);

    res.json({
      success: true,
      list
    });

  } catch (error) {
    logError("daily_closing.getDailyClosingList", error, res);
  }
};

// ========================================
// 3. GET DAILY CLOSING BY ID
// ========================================

exports.getDailyClosingById = async (req, res) => {
  try {
    const { id } = req.params;

    const [closing] = await db.query(
      "SELECT * FROM daily_closing WHERE id = :id",
      { id }
    );

    if (closing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Daily closing not found"
      });
    }

    const closingData = closing[0];
    closingData.shift_ids_json = closingData.shift_ids_json ? JSON.parse(closingData.shift_ids_json) : [];

    res.json({
      success: true,
      data: closingData
    });

  } catch (error) {
    logError("daily_closing.getDailyClosingById", error, res);
  }
};

// ========================================
// 4. APPROVE DAILY CLOSING
// ========================================

exports.approveDailyClosing = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const sql = `
      UPDATE daily_closing SET
        status = 'approved',
        notes = :notes,
        approved_by = :approved_by,
        approved_at = NOW()
      WHERE id = :id
    `;

    await db.query(sql, {
      id,
      notes: notes || null,
      approved_by: req.auth?.id
    });

    res.json({
      success: true,
      message: "Daily closing approved successfully"
    });

  } catch (error) {
    logError("daily_closing.approveDailyClosing", error, res);
  }
};

// ========================================
// 5. GET DASHBOARD STATISTICS
// ========================================

exports.getDashboardStats = async (req, res) => {
  try {
    const { date } = req.query;
    const target_date = date || dayjs().format('YYYY-MM-DD');
    const branch_name = req.auth?.branch_name || null;

    // Get daily closing for date
    const [dailyClosing] = await db.query(`
      SELECT * FROM daily_closing
      WHERE closing_date = :target_date
        AND branch_name = :branch_name
      LIMIT 1
    `, { target_date, branch_name });

    // Get shifts for date
    const [shifts] = await db.query(`
      SELECT 
        COUNT(*) as total_shifts,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_shifts,
        SUM(CASE WHEN status = 'pending_approval' THEN 1 ELSE 0 END) as pending_shifts
      FROM shift_closing
      WHERE shift_date = :target_date
        AND branch_name = :branch_name
    `, { target_date, branch_name });

    res.json({
      success: true,
      data: {
        daily_closing: dailyClosing[0] || null,
        shift_summary: shifts[0] || {}
      }
    });

  } catch (error) {
    logError("daily_closing.getDashboardStats", error, res);
  }
};

module.exports = exports;
