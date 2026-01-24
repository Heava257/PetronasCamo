// ✅ stock_reconciliation.controller.js - Complete Stock Reconciliation Controller

const { db, logError } = require("../util/helper");
const dayjs = require('dayjs');

// ========================================
// 1. CREATE STOCK RECONCILIATION
// ========================================

exports.createReconciliation = async (req, res) => {
  try {
    const {
      reconciliation_date,
      reconciliation_type,  // 'shift', 'daily', 'weekly', 'monthly', 'adhoc'
      reference_type,       // 'shift_closing', 'daily_closing', 'manual'
      reference_id,
      reconciliations       // [{product_id, physical_stock, notes}, ...]
    } = req.body;

    if (!reconciliation_date || !reconciliations || reconciliations.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Reconciliation date and data are required"
      });
    }

    const branch_name = req.auth?.branch_name || null;
    const reconciliation_id = `RECON-${reconciliation_date}-${Date.now()}`;

    const results = [];

    for (const item of reconciliations) {
      const { product_id, physical_stock, variance_reason, notes } = item;

      // ✅ Get product info
      const [productInfo] = await db.query(`
        SELECT 
          p.id,
          p.name,
          p.category_id,
          p.unit_price,
          c.name as category_name,
          -- ✅ System stock from inventory transactions
          COALESCE((
            SELECT SUM(quantity)
            FROM inventory_transaction
            WHERE product_id = p.id
          ), 0) as system_stock
        FROM product p
        LEFT JOIN category c ON p.category_id = c.id
        WHERE p.id = :product_id
      `, { product_id });

      if (productInfo.length === 0) {
        continue; // Skip if product not found
      }

      const product = productInfo[0];
      const system_stock = parseFloat(product.system_stock) || 0;
      const physical = parseFloat(physical_stock) || 0;
      const variance = physical - system_stock;
      const variance_percentage = system_stock > 0
        ? ((variance / system_stock) * 100).toFixed(2)
        : 0;

      const unit_cost = parseFloat(product.unit_price) || 0;
      const variance_value = variance * unit_cost;

      // ✅ Insert reconciliation record
      const sql = `
        INSERT INTO stock_reconciliation (
          reconciliation_id, reconciliation_date, branch_name, reconciliation_type,
          reference_type, reference_id,
          product_id, product_name, category_id, category_name,
          system_stock, physical_stock, variance, variance_percentage,
          unit_cost, variance_value,
          variance_reason, notes,
          status, created_by, created_at
        ) VALUES (
          :reconciliation_id, :reconciliation_date, :branch_name, :reconciliation_type,
          :reference_type, :reference_id,
          :product_id, :product_name, :category_id, :category_name,
          :system_stock, :physical_stock, :variance, :variance_percentage,
          :unit_cost, :variance_value,
          :variance_reason, :notes,
          'pending', :created_by, NOW()
        )
      `;

      const [result] = await db.query(sql, {
        reconciliation_id,
        reconciliation_date,
        branch_name,
        reconciliation_type: reconciliation_type || 'adhoc',
        reference_type: reference_type || 'manual',
        reference_id: reference_id || null,
        product_id,
        product_name: product.name,
        category_id: product.category_id,
        category_name: product.category_name,
        system_stock,
        physical_stock: physical,
        variance,
        variance_percentage,
        unit_cost,
        variance_value,
        variance_reason: variance_reason || null,
        notes: notes || null,
        created_by: req.auth?.id
      });

      results.push({
        id: result.insertId,
        product_name: product.name,
        variance,
        variance_value,
        physical,
        system_stock
      });
    }

    // ✅ TRIGGER TELEGRAM NOTIFICATION (Non-blocking)
    if (results.length > 0) {
      setImmediate(async () => {
        try {
          const { sendSmartNotification } = require("../util/Telegram.helpe");
          const { formatPrice } = require("../util/helper");

          const details = results.slice(0, 10).map((r, i) => {
            const icon = r.variance > 0 ? "📈" : r.variance < 0 ? "📉" : "⚖️";
            const varianceText = r.variance > 0 ? `+${r.variance.toLocaleString()}` : r.variance.toLocaleString();
            return `${icon} ${i + 1}. <b>${r.product_name}</b>\n• Sys: ${r.system_stock.toLocaleString()} L\n• <b>Adj: ${varianceText} L</b>\n• <b>Rem: <code>${r.physical.toLocaleString()} L</code></b>`;
          }).join("\n\n");

          const totalVariance = results.reduce((sum, r) => sum + r.variance_value, 0);

          const message = `
📊 <b>កែសម្រួលស្តុក / Stock Adjustment</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 <b>Reconciliation Info:</b>
• លេខសម្គាល់: <code>${reconciliation_id}</code>
• ប្រភេទ: ${reconciliation_type.toUpperCase()}
• កាលបរិច្ឆេទ: ${reconciliation_date}

📍 <b>Branch:</b>
• សាខា: ${branch_name || 'N/A'}
• ដោយ: ${req.auth?.name || 'System'}

━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 <b>ADJUSTMENTS (${results.length} items)</b>
${details}
${results.length > 10 ? `\n<i>... and ${results.length - 10} more</i>` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 <b>Estim. Variance Value:</b> <b>${formatPrice(totalVariance)}</b>

⏰ ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh', dateStyle: 'medium', timeStyle: 'short' })}
                `;

          await sendSmartNotification({
            event_type: 'inventory_movement',
            branch_name: branch_name,
            title: `📊 Stock Adjustment: ${reconciliation_id}`,
            message: message.trim(),
            severity: Math.abs(totalVariance) > 500 ? 'warning' : 'info'
          });

        } catch (notifError) {
          console.error("❌ Stock adjustment notification error:", notifError);
        }
      });
    }

    res.status(201).json({
      success: true,
      message: "Stock reconciliation created successfully",
      data: {
        reconciliation_id,
        items: results
      }
    });

  } catch (error) {
    logError("stock_reconciliation.createReconciliation", error, res);
  }
};

// ========================================
// 2. GET RECONCILIATION LIST
// ========================================

exports.getReconciliationList = async (req, res) => {
  try {
    const { from_date, to_date, product_id, status } = req.query;

    let sql = `
      SELECT 
        sr.*,
        p.name as current_product_name,
        c.name as current_category_name
      FROM stock_reconciliation sr
      LEFT JOIN product p ON sr.product_id = p.id
      LEFT JOIN category c ON sr.category_id = c.id
      WHERE 1=1
    `;

    const params = {};

    if (req.auth?.role !== "admin") {
      sql += ` AND sr.branch_name = :branch_name`;
      params.branch_name = req.auth?.branch_name;
    }

    if (from_date) {
      sql += ` AND sr.reconciliation_date >= :from_date`;
      params.from_date = from_date;
    }
    if (to_date) {
      sql += ` AND sr.reconciliation_date <= :to_date`;
      params.to_date = to_date;
    }
    if (product_id) {
      sql += ` AND sr.product_id = :product_id`;
      params.product_id = product_id;
    }
    if (status) {
      sql += ` AND sr.status = :status`;
      params.status = status;
    }

    sql += ` ORDER BY sr.reconciliation_date DESC, sr.created_at DESC`;

    const [list] = await db.query(sql, params);

    res.json({
      success: true,
      list
    });

  } catch (error) {
    logError("stock_reconciliation.getReconciliationList", error, res);
  }
};

// ========================================
// 3. GET RECONCILIATION BY ID
// ========================================

exports.getReconciliationById = async (req, res) => {
  try {
    const { id } = req.params;

    const [reconciliation] = await db.query(
      "SELECT * FROM stock_reconciliation WHERE id = :id",
      { id }
    );

    if (reconciliation.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Reconciliation not found"
      });
    }

    res.json({
      success: true,
      data: reconciliation[0]
    });

  } catch (error) {
    logError("stock_reconciliation.getReconciliationById", error, res);
  }
};

// ========================================
// 4. UPDATE RECONCILIATION STATUS
// ========================================

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, action_taken, notes } = req.body;

    const validStatuses = ['pending', 'investigated', 'resolved', 'written_off'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status"
      });
    }

    const sql = `
      UPDATE stock_reconciliation SET
        status = :status,
        action_taken = :action_taken,
        notes = CONCAT(IFNULL(notes, ''), '\n\n', :new_notes),
        investigated_by = :investigated_by,
        investigated_at = NOW()
      WHERE id = :id
    `;

    await db.query(sql, {
      id,
      status,
      action_taken: action_taken || null,
      new_notes: notes || '',
      investigated_by: req.auth?.id
    });

    res.json({
      success: true,
      message: "Status updated successfully"
    });

  } catch (error) {
    logError("stock_reconciliation.updateStatus", error, res);
  }
};

// ========================================
// 5. GET VARIANCE REPORT
// ========================================

exports.getVarianceReport = async (req, res) => {
  try {
    const { from_date, to_date, product_id } = req.query;
    const branch_name = req.auth?.branch_name || null;

    let sql = `
      SELECT 
        sr.product_id,
        sr.product_name,
        sr.category_name,
        COUNT(sr.id) as reconciliation_count,
        SUM(sr.variance) as total_variance_liters,
        SUM(sr.variance_value) as total_variance_value,
        AVG(sr.variance_percentage) as avg_variance_percentage,
        SUM(CASE WHEN sr.variance < 0 THEN ABS(sr.variance) ELSE 0 END) as total_loss_liters,
        SUM(CASE WHEN sr.variance > 0 THEN sr.variance ELSE 0 END) as total_gain_liters
      FROM stock_reconciliation sr
      WHERE sr.branch_name = :branch_name
    `;

    const params = { branch_name };

    if (from_date) {
      sql += ` AND sr.reconciliation_date >= :from_date`;
      params.from_date = from_date;
    }
    if (to_date) {
      sql += ` AND sr.reconciliation_date <= :to_date`;
      params.to_date = to_date;
    }
    if (product_id) {
      sql += ` AND sr.product_id = :product_id`;
      params.product_id = product_id;
    }

    sql += ` GROUP BY sr.product_id, sr.product_name, sr.category_name`;
    sql += ` ORDER BY ABS(SUM(sr.variance_value)) DESC`;

    const [report] = await db.query(sql, params);

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    logError("stock_reconciliation.getVarianceReport", error, res);
  }
};

module.exports = exports;