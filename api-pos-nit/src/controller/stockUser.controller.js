const { db, isArray, isEmpty, logError, sendTelegramMessagenewcustomerPays } = require("../util/helper");
const moment = require('moment');
const { config } = require("../util/config");
const axios = require("axios");
const { sendSmartNotification } = require("../util/Telegram.helpe");
const { createSystemNotification } = require("./System_notification.controller");
exports.getStockByUser = async (req, res) => {
  try {
    const { txtSearch } = req.query;
    const { user_id } = req.params; // Get user_id from URL parameter

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "user_id is required",
      });
    }

    // SQL query to join user_stock with product and category tables
    let sql = `
      SELECT 
        us.id,
        us.user_id,
        us.product_name,  -- Replace product_id with product name
        c.name AS category_name, -- Replace category_id with category name
        us.qty,
        us.barcode,
        us.brand,
        us.description,
        us.price,
        us.discount,
        us.status,
     
        us.create_by,
        us.create_at,
        us.unit,
        us.unit_price,
        us.last_updated
      FROM stock us
      LEFT JOIN product p ON us.product_name = p.id  -- Join with product table
      LEFT JOIN category c ON us.category_id = c.id  -- Join with category table
      WHERE us.user_id = :user_id
    `;

    const params = { user_id };

    // Add search functionality
    if (txtSearch) {
      sql += " AND (p.name LIKE :txtSearch OR us.barcode LIKE :txtSearch OR us.brand LIKE :txtSearch OR c.name LIKE :txtSearch)";
      params.txtSearch = `%${txtSearch}%`;
    }

    // Execute the query
    const [list] = await db.query(sql, params);

    // Return the result
    res.json({
      success: true,
      list,
    });
  } catch (error) {
    logError("stock.getList", error, res);
  }
};


exports.create = async (req, res) => {
  try {
    // Extract values from request body
    const { user_id, product_name, category_id, qty, barcode, brand, description, price, discount, status, unit, unit_price } = req.body;

    // Validate required fields
    if (!user_id || !product_name || !category_id || !qty || !unit || !unit_price) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (user_id, product_name, category_id, qty, unit, unit_price).",
      });
    }

    // Verify the user exists before proceeding
    const [userExists] = await db.query("SELECT 1 FROM user WHERE id = :user_id LIMIT 1", {
      user_id
    });

    if (!userExists || userExists.length === 0) {
      return res.status(400).json({
        success: false,
        message: `User with ID ${user_id} does not exist.`,
      });
    }


    // Insert into the `user_stock` table
    const sql = `
      INSERT INTO stock (
        user_id, product_name, category_id, qty, barcode, brand, description, price, discount, status, create_by, create_at, unit, unit_price, last_updated
      ) VALUES (
        :user_id, :product_name, :category_id, :qty, :barcode, :brand, :description, :price, :discount, :status, :create_by, NOW(), :unit, :unit_price, NOW()
      )
    `;

    const [data] = await db.query(sql, {
      user_id,
      product_name,
      category_id,
      qty: Number(qty),
      barcode: barcode || null,
      brand: brand || null,
      description: description || null,
      price: Number(unit_price) * Number(qty),
      discount: discount || 0,
      status: status || 1,

      create_by: req.auth?.name || "System",
      unit: unit || null,
      unit_price: Number(unit_price)
    });


    res.json({
      success: true,
      data,
      message: "Insert success!",
    });
  } catch (error) {
    console.error("Error in user_stock.create:", error.message);
    logError("user_stock.create", error, res);

    // More specific error message based on the error code
    let errorMessage = "An error occurred while creating the stock entry.";
    if (error.message && error.message.includes("foreign key constraint fails")) {
      if (error.message.includes("user_id")) {
        errorMessage = "Invalid user ID. The specified user does not exist.";
      } else if (error.message.includes("product_id")) {
        errorMessage = "Invalid product ID. The specified product does not exist.";
      } else if (error.message.includes("category_id")) {
        errorMessage = "Invalid category ID. The specified category does not exist.";
      }
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};


exports.remove = async (req, res) => {
  try {
    const id = req.params.id || req.body.id; // Check both params & body

    if (!id) {
      return res.status(400).json({ message: "Stock ID is required!" });
    }

    var [data] = await db.query("DELETE FROM stock WHERE id = :id", { id });

    if (data.affectedRows === 0) {
      return res.status(404).json({ message: "Stock not found!" });
    }

    res.json({ message: "Stock deleted successfully!" });
  } catch (error) {
    logError("stock.remove", error, res);
  }
};
exports.newBarcode = async (req, res) => {
  try {
    var sql =
      "SELECT " +
      "CONCAT('P',LPAD((SELECT COALESCE(MAX(id),0) + 1 FROM user_stock), 3, '0')) " +
      "as barcode";
    var [data] = await db.query(sql);
    res.json({
      barcode: data[0].barcode,
    });
  } catch (error) {
    logError("barcode.create", error, res);
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



exports.getList = async (req, res) => {
  try {
    const user_id = req.current_id; // Assuming `req.current_id` contains the logged-in user's ID

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const [list] = await db.query(`
      SELECT 
        us.id, 
        us.user_id, 
        us.create_by,  
        us.product_id, 
        p.name AS product_name, 
        us.qty, 
        us.last_updated, 
        us.category_id, 
        us.brand, 
        p.unit_price,
        p.discount,
        p.unit,
        p.barcode,  
        c.name AS category_name,
        (us.qty * p.unit_price) AS total_price
      FROM user_stock us
      JOIN product p ON us.product_id = p.id
      JOIN category c ON us.category_id = c.id
      WHERE us.user_id = :user_id  -- Filter by the logged-in user's ID
      ORDER BY us.id DESC;
    `, { user_id });

    res.json({
      i_know_you_are_id: user_id, // Return the user ID for reference
      list: list,
    });
  } catch (error) {
    logError("user_stock.getList", error, res);
  }
};
exports.gettotal_due = async (req, res) => {
  try {
    const { user_id } = req.params;
    const {
      search,
      customer_id,
      from_date,
      to_date,
      show_paid = false
    } = req.query;

    let sqlQuery = `
      WITH debt_summary AS (
        SELECT 
          MIN(cd.id) AS debt_id,
          cd.order_id,
          cd.customer_id,
          cd.category_id,
          SUM(cd.total_amount) AS total_amount,
          SUM(cd.paid_amount) AS paid_amount,
          SUM(cd.due_amount) AS due_amount,
          MAX(cd.payment_status) AS payment_status,
          MAX(cd.due_date) AS due_date,
          MAX(cd.last_payment_date) AS last_payment_date,
          -- ✅ យក description ពី customer_debt (ចុងក្រោយបំផុត)
          (
            SELECT cd2.description 
            FROM customer_debt cd2 
            WHERE cd2.order_id = cd.order_id 
              AND cd2.customer_id = cd.customer_id
              AND cd2.category_id = cd.category_id
              AND cd2.description IS NOT NULL 
              AND cd2.description != ''
              AND cd2.description NOT LIKE 'Product ID:%'
            ORDER BY cd2.id DESC 
            LIMIT 1
          ) AS debt_description,
          GROUP_CONCAT(DISTINCT cd.notes SEPARATOR ' | ') AS notes,
          MIN(cd.created_by) AS created_by,
          MIN(cd.created_at) AS created_at,
          MAX(cd.updated_at) AS updated_at,
          SUM(cd.qty) AS quantity, 
          AVG(cd.actual_price) AS debt_actual_price,
          MAX(cd.pre_order_no) AS pre_order_no
        FROM customer_debt cd
        JOIN user u ON cd.created_by = u.id
        JOIN user cu ON cu.branch_id = u.branch_id
        WHERE cu.id = :current_user_id
          AND (:customer_id IS NULL OR cd.customer_id = :customer_id)
        GROUP BY cd.order_id, cd.customer_id, cd.category_id
      )
      SELECT 
        ds.debt_id,
        ds.order_id,
        o.order_no,
        o.pre_order_no,
        DATE_FORMAT(o.order_date, '%Y-%m-%d') AS order_date,
        DATE_FORMAT(o.delivery_date, '%Y-%m-%d') AS delivery_date,
        ds.customer_id,
        c.name AS customer_name,
        c.tel,
        c.address,
        ds.total_amount,
        ds.paid_amount,
        ds.due_amount,
        ds.payment_status,
        DATE_FORMAT(ds.due_date, '%Y-%m-%d') AS due_date,
        DATE_FORMAT(ds.last_payment_date, '%Y-%m-%d') AS last_payment_date,
        ds.notes,
        u.username AS created_by,
        DATE_FORMAT(ds.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
        DATE_FORMAT(ds.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at,
        
        ds.quantity,
        ds.category_id,
        
        (
          SELECT od.price
          FROM order_detail od
          JOIN product p ON od.product_id = p.id
          WHERE od.order_id = o.id AND p.category_id = ds.category_id
          LIMIT 1
        ) AS unit_price,
        
        ds.debt_actual_price,
        
        (
          SELECT cat.actual_price
          FROM category cat
          WHERE cat.id = ds.category_id
        ) AS category_actual_price,
        
        COALESCE(
          NULLIF(ds.debt_actual_price, 0), 
          (SELECT cat.actual_price FROM category cat WHERE cat.id = ds.category_id)
        ) AS effective_actual_price,
        
        -- ✅ អាទិភាព: pre_order_no > debt_description > inventory_transaction > product_details > order_no
        COALESCE(
          -- Priority 1: pre_order_no from debt_summary (customer_debt)
          NULLIF(ds.pre_order_no, ''),
          -- Priority 2: pre_order_no from order table
          NULLIF(o.pre_order_no, ''),
          -- Priority 3: debt_description from customer_debt
          NULLIF(ds.debt_description, ''),
          -- Strategy 4: From inventory_transaction.reference_no
          (
            SELECT it.reference_no
            FROM inventory_transaction it
            WHERE it.product_id = (SELECT od.product_id FROM order_detail od WHERE od.order_id = o.id AND od.qty = ds.quantity LIMIT 1) -- Best effort match
              AND it.transaction_type = 'SALE_OUT'
              AND it.reference_no IS NOT NULL
              AND it.reference_no != ''
              AND it.reference_no != o.order_no
              AND DATE(it.created_at) = DATE(o.order_date)
            ORDER BY it.created_at DESC
            LIMIT 1
          ),
          -- Strategy 5: From inventory_transaction.notes
          (
            SELECT 
              SUBSTRING_INDEX(SUBSTRING_INDEX(it.notes, 'PO: ', -1), ')', 1)
            FROM inventory_transaction it
            WHERE it.product_id = (SELECT od.product_id FROM order_detail od WHERE od.order_id = o.id AND od.qty = ds.quantity LIMIT 1)
              AND it.transaction_type = 'SALE_OUT'
              AND it.notes LIKE '%PO:%'
              AND DATE(it.created_at) = DATE(o.order_date)
            ORDER BY it.created_at DESC
            LIMIT 1
          ),
          -- Final fallback: order_no
          o.order_no
        ) AS product_description,
        
        -- ✅ យក description ទាំងអស់ ប៉ុន្តែ DISTINCT (Fixed to use order_detail + product)
        (
          SELECT GROUP_CONCAT(DISTINCT p.name ORDER BY o2.create_at DESC SEPARATOR ' | ')
          FROM order_detail od
          JOIN product p ON od.product_id = p.id
          JOIN \`order\` o2 ON od.order_id = o2.id
          WHERE o2.customer_id = ds.customer_id 
          -- Note: We map product category to debt category
          AND p.category_id = ds.category_id
          AND DATE(o2.order_date) <= DATE(o.order_date)
          AND p.name IS NOT NULL
          AND p.name != ''
        ) AS all_product_descriptions,
        
        -- ✅ PURCHASE AMOUNT (Fixed for Pre-Orders & Normal Orders)
        COALESCE(
          -- Strategy 1: From pre_order_detail (Pre-Orders) - Priority
          (
             SELECT SUM(pod.qty * p.actual_price)
             FROM pre_order_detail pod
             JOIN product p ON pod.product_id = p.id
             JOIN pre_order po ON pod.pre_order_id = po.id
             WHERE po.pre_order_no = o.pre_order_no
          ),
          -- Strategy 2: From order_detail * product.unit_price (Normal Orders - Fallback)
          (
            SELECT SUM(od.qty * p.unit_price)
            FROM order_detail od
            JOIN product p ON od.product_id = p.id
            WHERE od.order_id = o.id
            AND p.category_id = ds.category_id
          ), 
          0
        ) AS purchase_amount,
        
        -- ✅ PURCHASE QTY
        COALESCE(
          -- Strategy 1: From pre_order_detail
          (
             SELECT SUM(pod.qty)
             FROM pre_order_detail pod
             JOIN pre_order po ON pod.pre_order_id = po.id
             WHERE po.pre_order_no = o.pre_order_no
          ),
          -- Strategy 2: From order_detail
          (
            SELECT SUM(od.qty)
            FROM order_detail od
            JOIN product p ON od.product_id = p.id
            WHERE od.order_id = o.id
            AND p.category_id = ds.category_id
          ), 
          0
        ) AS purchase_qty,
        
        -- ✅ AVG PURCHASE PRICE
        COALESCE(
          -- Strategy 1: From pre_order_detail
          (
             SELECT AVG(p.actual_price)
             FROM pre_order_detail pod
             JOIN product p ON pod.product_id = p.id
             JOIN pre_order po ON pod.pre_order_id = po.id
             WHERE po.pre_order_no = o.pre_order_no
          ),
          -- Strategy 2: From product (Current Unit Price)
          (
            SELECT AVG(p.unit_price)
            FROM order_detail od
            JOIN product p ON od.product_id = p.id
            WHERE od.order_id = o.id
            AND p.category_id = ds.category_id
          ), 
          0
        ) AS avg_purchase_price,
        
        -- ✅ យក barcode តែមួយ
        (
          SELECT p.barcode
          FROM order_detail od
          JOIN product p ON od.product_id = p.id
          WHERE od.order_id = o.id
          AND p.category_id = ds.category_id
          LIMIT 1
        ) AS product_barcode,
        
        -- ✅ យក name តែមួយ
        (
          SELECT p.name
          FROM order_detail od
          JOIN product p ON od.product_id = p.id
          WHERE od.order_id = o.id
          AND p.category_id = ds.category_id
          LIMIT 1
        ) AS product_name,
        
        CASE 
          WHEN ds.due_date IS NOT NULL 
          AND ds.due_date < CURDATE() 
          AND ds.payment_status != 'Paid' 
          THEN DATEDIFF(CURDATE(), ds.due_date)
          ELSE NULL
        END AS days_overdue,
        
        (
          SELECT GROUP_CONCAT(
            CONCAT(
              p.name, ' (', od.qty, ' ', p.unit, ') - ', 
              'Price: ', od.price, ' - Discount: ', IFNULL(od.discount, 0), 
              ' - Total: ', od.total
            ) SEPARATOR '\n'
          )
          FROM order_detail od
          JOIN product p ON od.product_id = p.id
          WHERE od.order_id = o.id
        ) AS product_details,
        
        (
          SELECT GROUP_CONCAT(DISTINCT cat.name SEPARATOR ', ')
          FROM order_detail od
          JOIN product p ON od.product_id = p.id
          JOIN category cat ON p.category_id = cat.id
          WHERE od.order_id = o.id
        ) AS categories,

        (
          SELECT SUM(od.qty)
          FROM order_detail od
          WHERE od.order_id = o.id
        ) AS total_quantity,
        
        (
          SELECT p.unit
          FROM order_detail od
          JOIN product p ON od.product_id = p.id
          WHERE od.order_id = o.id
          LIMIT 1
        ) AS unit,
        
        (
          SELECT cat.name
          FROM order_detail od
          JOIN product p ON od.product_id = p.id
          JOIN category cat ON p.category_id = cat.id
          WHERE od.order_id = o.id AND p.category_id = ds.category_id
          LIMIT 1
        ) AS product_category,
        
        (
          SELECT od.discount
          FROM order_detail od
          JOIN product p ON od.product_id = p.id
          WHERE od.order_id = o.id AND p.category_id = ds.category_id
          LIMIT 1
        ) AS discount,
        
        (
          SELECT od.total
          FROM order_detail od
          JOIN product p ON od.product_id = p.id
          WHERE od.order_id = o.id AND p.category_id = ds.category_id
          LIMIT 1
        ) AS item_total
      FROM 
        debt_summary ds
      JOIN 
        \`order\` o ON ds.order_id = o.id
      JOIN 
        customer c ON ds.customer_id = c.id
      JOIN 
        user u ON ds.created_by = u.id
      WHERE 1=1
    `;

    const queryParams = [req.current_id];
    const conditions = [];

    if (show_paid !== 'true' && show_paid !== true) {
      conditions.push(`ds.due_amount > 0`);
    }

    if (from_date) {
      conditions.push(`o.order_date >= ?`);
      queryParams.push(from_date);
    }

    if (to_date) {
      conditions.push(`o.order_date <= ?`);
      queryParams.push(to_date);
    }

    if (customer_id) {
      conditions.push(`ds.customer_id = ?`);
      queryParams.push(customer_id);
    }

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(`(
        c.name LIKE ? OR 
        c.tel LIKE ? OR 
        o.order_no LIKE ? OR
        o.pre_order_no LIKE ? OR
        ds.debt_description LIKE ? OR
        EXISTS (
          SELECT 1 FROM order_detail od
          JOIN product p ON od.product_id = p.id
          WHERE od.order_id = o.id
          AND p.category_id = ds.category_id
          AND (
            p.name LIKE ? OR
            p.description LIKE ? OR
            p.barcode LIKE ?
          )
        )
      )`);
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
      sqlQuery += ' AND ' + conditions.join(' AND ');
    }

    sqlQuery += ' ORDER BY ds.payment_status ASC, ds.due_date ASC, o.order_date DESC';

    const [list] = await db.query(sqlQuery, queryParams);

    const formattedList = list.map(item => {
      const purchaseAmount = parseFloat(item.purchase_amount) || 0;
      const totalAmount = parseFloat(item.total_amount) || 0;
      const profit = totalAmount - purchaseAmount;
      const profitMargin = totalAmount > 0 ? ((profit / totalAmount) * 100).toFixed(2) : 0;

      return {
        ...item,
        branch_name: item.address,
        debt_type: item.product_category,
        product_details: item.product_details ? item.product_details.split('\n') : [],
        categories: item.categories ? item.categories.split(', ') : [],
        purchase_amount: purchaseAmount,
        purchase_qty: parseFloat(item.purchase_qty) || 0,
        avg_purchase_price: parseFloat(item.avg_purchase_price) || 0,
        profit: profit,
        profit_margin: profitMargin
      };
    });

    res.json({
      list: formattedList
    });
  } catch (error) {
    console.error('❌ Error in gettotal_due:', error);
    logError("order.gettotaldue", error, res);
  }
};
exports.gettotal_due_detail = async (req, res) => {
  try {
    const { order_id } = req.params;

    if (!order_id) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    // Get all debt records for this order
    let sqlQuery = `
      SELECT 
        cd.id AS debt_id,
        cd.order_id,
        o.order_no,
        o.pre_order_no,
        DATE_FORMAT(o.order_date, '%Y-%m-%d') AS order_date,
        DATE_FORMAT(o.delivery_date, '%Y-%m-%d') AS delivery_date,
        c.id AS customer_id,
        c.name AS customer_name,
        c.tel,
        c.address,
        cd.category_id,
        cd.qty AS quantity,
        cd.total_amount,
        cd.paid_amount,
        cd.due_amount,
        cd.payment_status,
        DATE_FORMAT(cd.due_date, '%Y-%m-%d') AS due_date,
        DATE_FORMAT(cd.last_payment_date, '%Y-%m-%d') AS last_payment_date,
        cd.notes,
        
        -- ✅ យក description ពី robust lookup (prioritize pre_order_no)
        COALESCE(
          -- Priority 1: pre_order_no from customer_debt
          NULLIF(cd.pre_order_no, ''),
          -- Priority 2: pre_order_no from order table
          NULLIF(o.pre_order_no, ''),
          -- Priority 3: description from customer_debt
          NULLIF(cd.description, ''),
          -- Strategy 4: From inventory_transaction.reference_no
          (
            SELECT it.reference_no
            FROM inventory_transaction it
            INNER JOIN order_detail od ON it.product_id = od.product_id
            WHERE od.order_id = o.id 
              AND it.transaction_type = 'SALE_OUT'
              AND it.reference_no IS NOT NULL
              AND it.reference_no != ''
              AND it.reference_no != o.order_no
              AND DATE(it.created_at) = DATE(o.create_at)
            ORDER BY it.created_at DESC
            LIMIT 1
          ),
          -- Strategy 5: From inventory_transaction.notes
          (
            SELECT 
              SUBSTRING_INDEX(SUBSTRING_INDEX(it.notes, 'PO: ', -1), ')', 1)
            FROM inventory_transaction it
            INNER JOIN order_detail od ON it.product_id = od.product_id
            WHERE od.order_id = o.id
              AND it.transaction_type = 'SALE_OUT'
              AND it.notes LIKE '%PO:%'
              AND DATE(it.created_at) = DATE(o.create_at)
            ORDER BY it.created_at DESC
            LIMIT 1
          ),
          -- Fallback
          o.order_no
        ) AS product_description,
        
        -- Get unit_price from order_detail
        (
          SELECT od.price
          FROM order_detail od
          JOIN product p ON od.product_id = p.id
          WHERE od.order_id = o.id AND p.category_id = cd.category_id
          LIMIT 1
        ) AS unit_price,
        
        -- Get actual_price from category
        (
          SELECT cat.actual_price
          FROM category cat
          WHERE cat.id = cd.category_id
        ) AS actual_price,
        
        -- Get category name
        (
          SELECT cat.name
          FROM category cat
          WHERE cat.id = cd.category_id
        ) AS category_name,
        
        cd.actual_price AS debt_actual_price
      FROM 
        customer_debt cd
      JOIN 
        \`order\` o ON cd.order_id = o.id
      JOIN 
        customer c ON cd.customer_id = c.id
      WHERE 
        cd.order_id = ?
      ORDER BY 
        cd.category_id ASC
    `;

    const [debts] = await db.query(sqlQuery, [order_id]);

    if (!debts || debts.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No debt records found for this order'
      });
    }

    // Format the response with product details
    const productDetails = debts.map(debt => ({
      debt_id: debt.debt_id,
      category_id: debt.category_id,
      category_name: debt.category_name,
      quantity: parseFloat(debt.quantity) || 0,
      unit_price: parseFloat(debt.unit_price) || 0,
      actual_price: parseFloat(debt.actual_price) || 1,
      effective_actual_price: parseFloat(debt.debt_actual_price) > 0
        ? parseFloat(debt.debt_actual_price)
        : parseFloat(debt.actual_price) || 1,
      total_amount: parseFloat(debt.total_amount) || 0,
      paid_amount: parseFloat(debt.paid_amount) || 0,
      due_amount: parseFloat(debt.due_amount) || 0
    }));

    // Calculate totals
    const totalAmount = productDetails.reduce((sum, item) => sum + item.total_amount, 0);
    const totalPaid = productDetails.reduce((sum, item) => sum + item.paid_amount, 0);
    const totalDue = productDetails.reduce((sum, item) => sum + item.due_amount, 0);

    // Get first record for order-level info
    const firstDebt = debts[0];

    res.json({
      success: true,
      order_id: order_id,
      order_no: firstDebt.order_no,
      order_date: firstDebt.order_date,
      delivery_date: firstDebt.delivery_date,
      customer_id: firstDebt.customer_id,
      customer_name: firstDebt.customer_name,
      tel: firstDebt.tel,
      address: firstDebt.address,
      payment_status: firstDebt.payment_status,
      due_date: firstDebt.due_date,
      last_payment_date: firstDebt.last_payment_date,
      notes: firstDebt.notes,
      product_details: productDetails,
      total_amount: totalAmount,
      paid_amount: totalPaid,
      due_amount: totalDue
    });

  } catch (error) {
    logError("order.gettotal_due_detail", error, res);
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const { order_id } = req.params;

    if (!order_id) {
      return res.status(400).json({
        success: false,
        error: 'Order ID is required'
      });
    }

    // Get all payment records for this order
    const sqlQuery = `
      SELECT 
        ph.id AS payment_id,
        ph.order_id,
        ph.debt_id,
        cd.total_amount,
        cd.paid_amount AS total_paid,
        cd.due_amount AS current_due,
        ph.amount AS payment_amount,
        ph.payment_method,
        ph.bank,
        DATE_FORMAT(ph.payment_date, '%Y-%m-%d') AS payment_date,
        ph.notes,
        DATE_FORMAT(ph.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
      FROM 
        payment_history ph
      JOIN 
        customer_debt cd ON ph.debt_id = cd.id
      WHERE 
        ph.order_id = ?
      ORDER BY 
        ph.payment_date DESC, ph.created_at DESC
    `;

    const [payments] = await db.query(sqlQuery, [order_id]);

    // Get current debt status
    const debtQuery = `
      SELECT 
        SUM(cd.total_amount) AS total_owed,
        SUM(cd.paid_amount) AS total_paid,
        SUM(cd.due_amount) AS total_due
      FROM 
        customer_debt cd
      WHERE 
        cd.order_id = ?
    `;

    const [debtStatus] = await db.query(debtQuery, [order_id]);

    res.json({
      success: true,
      order_id: order_id,
      payments: payments || [],
      debt_summary: debtStatus[0] || {
        total_owed: 0,
        total_paid: 0,
        total_due: 0
      }
    });

  } catch (error) {
    logError("order.getPaymentHistory", error, res);
  }
};

exports.updatePaymentHistory = async (req, res) => {
  try {
    const { payment_id } = req.params;
    const { amount, payment_method, bank, payment_date, notes } = req.body;

    if (!payment_id || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Payment ID and amount are required'
      });
    }

    // Get old payment record
    const [oldPayment] = await db.query(
      'SELECT * FROM payment_history WHERE id = ?',
      [payment_id]
    );

    if (!oldPayment || oldPayment.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    const oldAmount = parseFloat(oldPayment[0].amount);
    const newAmount = parseFloat(amount);
    const difference = newAmount - oldAmount; // If positive = more paid, if negative = refund

    // Get debt record
    const [debt] = await db.query(
      'SELECT * FROM customer_debt WHERE id = ?',
      [oldPayment[0].debt_id]
    );

    if (!debt || debt.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Debt record not found'
      });
    }

    const currentDebt = debt[0];
    const newPaidAmount = parseFloat(currentDebt.paid_amount) + difference;
    const newDueAmount = Math.max(0, parseFloat(currentDebt.total_amount) - newPaidAmount);
    const newPaymentStatus = newDueAmount <= 0.01 ? 'Paid' : (newPaidAmount > 0 ? 'Partial' : 'Pending');

    // Update payment history record
    await db.query(
      `UPDATE payment_history 
       SET amount = ?, payment_method = ?, bank = ?, payment_date = ?, notes = ?
       WHERE id = ?`,
      [newAmount, payment_method || oldPayment[0].payment_method,
        bank || oldPayment[0].bank, payment_date || oldPayment[0].payment_date,
        notes || oldPayment[0].notes, payment_id]
    );

    // Update customer_debt record
    await db.query(
      `UPDATE customer_debt 
       SET paid_amount = ?, due_amount = ?, payment_status = ?, last_payment_date = ?
       WHERE id = ?`,
      [newPaidAmount, newDueAmount, newPaymentStatus, payment_date || new Date().toISOString().split('T')[0], oldPayment[0].debt_id]
    );

    res.json({
      success: true,
      message: 'Payment updated successfully',
      payment: {
        payment_id: payment_id,
        old_amount: oldAmount,
        new_amount: newAmount,
        difference: difference
      },
      debt_updated: {
        paid_amount: newPaidAmount,
        due_amount: newDueAmount,
        payment_status: newPaymentStatus
      }
    });

  } catch (error) {
    logError("order.updatePaymentHistory", error, res);
  }
};


exports.updateCustomerDebt = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { order_id } = req.params;
    const {
      customer_id,
      amount,
      payment_method,
      bank,
      payment_date,
      user_id,
      notes,
      qty,
      unit_price,
      actual_price,
      description,
    } = req.body;

    // ✅ Get branch name from auth
    const branch_name = req.auth?.branch_name || null;

    if (!order_id || !customer_id || !amount || !user_id) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: "Missing required fields: order_id, customer_id, amount, user_id",
      });
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: "Payment amount must be a valid number greater than 0",
      });
    }

    const [debtRows] = await connection.query(
      `SELECT id, qty, unit_price, actual_price, total_amount, paid_amount, due_amount 
       FROM customer_debt 
       WHERE order_id = ? AND customer_id = ?
       ORDER BY id ASC`,
      [order_id, customer_id]
    );

    if (!debtRows.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: "No debts found for this order" });
    }

    let totalDue = 0;
    debtRows.forEach(row => {
      totalDue += parseFloat(row.due_amount || 0);
    });

    if (paymentAmount - totalDue > 0.01) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: `Payment amount ($${paymentAmount}) exceeds total due ($${totalDue.toFixed(2)})`
      });
    }

    const [customerRows] = await connection.query(
      `SELECT name, tel, address FROM customer WHERE id = ?`,
      [customer_id]
    );
    const [userRows] = await connection.query(
      `SELECT name FROM user WHERE id = ?`,
      [user_id]
    );

    const customerInfo = customerRows[0];
    const userInfo = userRows[0];

    if (!customerInfo || !userInfo) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: "Customer or user not found",
      });
    }

    const customerName = customerInfo?.name || `ID: ${customer_id}`;
    const customerPhone = customerInfo?.tel || 'N/A';
    const customerAddress = customerInfo?.address || 'N/A';
    const userName = userInfo?.name || `ID: ${user_id}`;

    let productDescription = description;

    productDescription = `Order-${order_id}`;

    const slipFiles = req.files?.["upload_image_optional"] || [];
    const slipPaths = slipFiles.map((file) => file.path || file.filename);

    const [paymentResult] = await connection.query(
      `INSERT INTO payments (
        order_id, customer_id, amount, payment_method, bank, 
        payment_date, user_id, notes, description, slips, 
        created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        order_id,
        customer_id,
        paymentAmount,
        payment_method || "cash",
        bank || null,
        payment_date || new Date().toISOString().split("T")[0],
        user_id,
        notes || "",
        productDescription,
        JSON.stringify(slipPaths),
        user_id,
      ]
    );

    let remainingPayment = paymentAmount;
    const updatedDebts = [];
    let qtyApplied = false;

    for (const debt of debtRows) {
      if (remainingPayment <= 0) break;

      const currentDue = parseFloat(debt.due_amount || 0);
      if (currentDue <= 0) continue;

      const paymentForThisDebt = Math.min(remainingPayment, currentDue);

      let newQty = parseFloat(debt.qty || 0);
      let newUnitPrice = parseFloat(debt.unit_price || 0);
      let newActualPrice = parseFloat(debt.actual_price || 1);
      let newTotalAmount = parseFloat(debt.total_amount || 0);

      if (
        !qtyApplied &&
        qty !== undefined &&
        unit_price !== undefined &&
        actual_price !== undefined &&
        currentDue > 0
      ) {
        newQty = parseFloat(qty);
        newUnitPrice = parseFloat(unit_price);
        newActualPrice = parseFloat(actual_price);
        newTotalAmount = ((newQty * newUnitPrice) / newActualPrice);
        qtyApplied = true;
      }

      const newPaidAmount = parseFloat(debt.paid_amount || 0) + paymentForThisDebt;
      const newDueAmount = newTotalAmount - newPaidAmount;

      await connection.query(
        `UPDATE customer_debt 
         SET qty = ?, 
             unit_price = ?, 
             actual_price = ?, 
             total_amount = ?, 
             paid_amount = ?, 
             last_payment_date = ?, 
             updated_at = NOW()
         WHERE id = ?`,
        [
          newQty,
          newUnitPrice,
          newActualPrice,
          newTotalAmount.toFixed(2),
          newPaidAmount.toFixed(2),
          payment_date || new Date().toISOString().split("T")[0],
          debt.id,
        ]
      );

      if (newDueAmount <= 0.01) {
        await connection.query(
          `UPDATE customer_debt SET due_date = NULL WHERE id = ?`,
          [debt.id]
        );
      }

      updatedDebts.push({
        id: debt.id,
        payment_applied: paymentForThisDebt,
        new_paid_amount: newPaidAmount,
        new_due_amount: newDueAmount,
        payment_status: newDueAmount <= 0.01 ? 'Paid' : newPaidAmount > 0 ? 'Partial' : 'Unpaid'
      });

      remainingPayment -= paymentForThisDebt;
    }

    await connection.commit();

    const totalNewPaid = updatedDebts.reduce((sum, debt) => sum + debt.new_paid_amount, 0);
    const totalNewDue = updatedDebts.reduce((sum, debt) => sum + debt.new_due_amount, 0);

    const formatDate = (dateStr) => {
      const d = new Date(dateStr || new Date());
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    try {


      const notificationData = {
        notification_type: 'payment_received',
        title: `💰 Payment Received: ${customerName}`,
        message: `Payment of $${paymentAmount.toFixed(2)} received from ${customerName}\n\nInvoice: ${productDescription}\nMethod: ${payment_method || 'cash'}\nBank: ${bank || 'N/A'}\nDate: ${formatDate(payment_date)}`,

        data: {
          payment_info: {
            payment_id: paymentResult.insertId,
            order_id: order_id,
            invoice_number: productDescription,
            amount: paymentAmount,
            payment_method: payment_method || 'cash',
            bank: bank || null,
            payment_date: payment_date || new Date().toISOString().split("T")[0],
            payment_date_formatted: formatDate(payment_date),

            // Updated debts summary
            total_paid: totalNewPaid.toFixed(2),
            total_due: totalNewDue.toFixed(2),
            debts_updated: updatedDebts.length,

            // Payment details
            updated_debts: updatedDebts.map(debt => ({
              debt_id: debt.id,
              payment_applied: debt.payment_applied.toFixed(2),
              new_paid_amount: debt.new_paid_amount.toFixed(2),
              new_due_amount: debt.new_due_amount.toFixed(2),
              status: debt.payment_status
            })),

            // Slip images
            slip_images: slipPaths,
            slip_count: slipPaths.length,

            // Additional info
            notes: notes || null,
            processed_by: userName,
            processed_by_id: user_id
          },

          customer_info: {
            customer_id: customer_id,
            name: customerName,
            phone: customerPhone,
            address: customerAddress
          }
        },

        // Main fields
        order_id: order_id,
        order_no: productDescription,
        customer_id: null,  // ✅ NULL to avoid FK constraint
        customer_name: customerName,
        customer_address: customerAddress,
        customer_tel: customerPhone,
        total_amount: paymentAmount,
        total_liters: null,
        card_number: null,

        user_id: user_id,
        created_by: userName,
        branch_name: branch_name || null,
        branch_id: null,  // ✅ NULL = visible to all Super Admins

        priority: paymentAmount >= 5000 ? 'critical' : paymentAmount >= 1000 ? 'high' : 'normal',
        severity: paymentAmount >= 5000 ? 'critical' : paymentAmount >= 1000 ? 'warning' : 'info',
        icon: '💰',
        color: 'green',
        action_url: `/payments/${paymentResult.insertId}`,
        expires_at: null
      };


      const notificationId = await createSystemNotification(notificationData);


    } catch (sysNotifError) {
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('❌ FAILED TO CREATE PAYMENT NOTIFICATION');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Payment ID:', paymentResult.insertId);
      console.error('Order ID:', order_id);
      console.error('Customer:', customerName);
      console.error('Error Message:', sysNotifError.message);

      if (sysNotifError.code === 'ER_NO_REFERENCED_ROW_2') {
        console.error('⚠️ Foreign Key Constraint Error!');
        console.error('   Solution: Make sure customer_id is set to NULL in notification data');
      }

      if (sysNotifError.sql) {
        console.error('SQL Error:', sysNotifError.sqlMessage);
        console.error('SQL State:', sysNotifError.sqlState);
      }

      console.error('Full Error:', sysNotifError);
      console.error('Stack:', sysNotifError.stack);
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    }

    const imageUrls = slipPaths.map(f => (f && f.startsWith('http')) ? f : config.image_path + f);

    res.json({
      success: true,
      message: "Payment recorded and debt updated successfully.",
      data: {
        payment_id: paymentResult.insertId,
        order_id: order_id,
        customer_name: customerInfo.name,
        payment_amount: paymentAmount,
        total_new_paid_amount: totalNewPaid.toFixed(2),
        total_new_due_amount: totalNewDue.toFixed(2),
        payment_date: payment_date || new Date().toISOString().split("T")[0],
        slip_images: imageUrls,
        updated_debts: updatedDebts,
        description: productDescription,
      },
    });

  } catch (error) {
    await connection.rollback();
    console.error("Error in updateCustomerDebt:", error);
    logError("Error in updateCustomerDebt:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred while processing the payment. Please try again.",
    });
  } finally {
    connection.release();
  }
};





















































exports.updateDebt = async (req, res) => {
  try {
    const { debt_id } = req.params;
    const {
      total_amount,
      paid_amount,
      due_date,
      last_payment_date,
      delivery_date,
      order_date,
      notes,
      unit_price,
      qty,
      category_id,
      actual_price,
      category_actual_price,
      update_price_type,
      sync_to_payment = true // ✅ NEW: Flag to sync changes to payment
    } = req.body;

    if (!debt_id) {
      return res.status(400).json({ error: "Debt ID is required" });
    }

    const checkQuery = `
      SELECT cd.id, cd.customer_id, cd.order_id, cd.category_id, cd.total_amount, cd.paid_amount, cd.actual_price
      FROM customer_debt cd
      JOIN user u ON cd.created_by = u.id
      JOIN user cu ON cu.branch_id = u.branch_id
      WHERE cd.id = ? AND cu.id = ?
    `;
    const [existingDebt] = await db.query(checkQuery, [debt_id, req.current_id]);

    if (existingDebt.length === 0) {
      return res.status(404).json({
        error: "Debt record not found or you don't have permission to update it"
      });
    }

    const updateFields = [];
    const updateParams = [];

    let currentTotalAmount = existingDebt[0].total_amount;
    let currentPaidAmount = existingDebt[0].paid_amount;

    if (total_amount !== undefined) {
      updateFields.push('total_amount = ?');
      updateParams.push(total_amount);
      currentTotalAmount = total_amount;
    }

    if (paid_amount !== undefined) {
      updateFields.push('paid_amount = ?');
      updateParams.push(paid_amount);
      currentPaidAmount = paid_amount;
    }

    if (due_date !== undefined) {
      updateFields.push('due_date = ?');
      updateParams.push(due_date);
    }

    if (last_payment_date !== undefined) {
      updateFields.push('last_payment_date = ?');
      updateParams.push(last_payment_date);
    }

    if (notes !== undefined) {
      updateFields.push('notes = ?');
      updateParams.push(notes);
    }

    if (category_id !== undefined) {
      updateFields.push('category_id = ?');
      updateParams.push(category_id);
    }

    if (qty !== undefined) {
      updateFields.push('qty = ?');
      updateParams.push(qty);
    }

    if (actual_price !== undefined) {
      updateFields.push('actual_price = ?');
      updateParams.push(actual_price);
    }

    // Update customer_debt
    if (updateFields.length > 0) {
      updateFields.push('updated_at = NOW()');
      updateParams.push(debt_id);

      const updateQuery = `
        UPDATE customer_debt 
        SET ${updateFields.join(', ')} 
        WHERE id = ?
      `;
      await db.query(updateQuery, updateParams);
    }

    // ✅ NEW: Sync changes to payments table if sync_to_payment is true
    if (sync_to_payment) {
      const paymentUpdateFields = [];
      const paymentUpdateParams = [];

      // Sync paid_amount to payment amount
      if (paid_amount !== undefined) {
        paymentUpdateFields.push('amount = ?');
        paymentUpdateParams.push(paid_amount);
      }

      // Sync notes
      if (notes !== undefined) {
        paymentUpdateFields.push('notes = ?');
        paymentUpdateParams.push(notes);
      }

      // Always update the updated_at timestamp
      paymentUpdateFields.push('updated_at = NOW()');

      if (paymentUpdateFields.length > 1) { // More than just updated_at
        paymentUpdateParams.push(existingDebt[0].order_id);

        const syncPaymentQuery = `
          UPDATE payments 
          SET ${paymentUpdateFields.join(', ')} 
          WHERE order_id = ?
          LIMIT 1
        `;
        await db.query(syncPaymentQuery, paymentUpdateParams);
      }
    }

    // Update category table if requested
    if (category_actual_price !== undefined && (update_price_type === 'category' || update_price_type === 'both')) {
      const targetCategoryId = category_id || existingDebt[0].category_id;

      const updateCategoryQuery = `
        UPDATE category 
        SET actual_price = ?
        WHERE id = ?
      `;
      await db.query(updateCategoryQuery, [category_actual_price, targetCategoryId]);
    }

    // Update order table dates
    if (delivery_date !== undefined || order_date !== undefined) {
      const orderUpdateFields = [];
      const orderUpdateParams = [];

      if (delivery_date !== undefined) {
        orderUpdateFields.push('delivery_date = ?');
        orderUpdateParams.push(delivery_date);
      }

      if (order_date !== undefined) {
        orderUpdateFields.push('order_date = ?');
        orderUpdateParams.push(order_date);
      }

      if (orderUpdateFields.length > 0) {
        orderUpdateParams.push(existingDebt[0].order_id);

        const updateOrderQuery = `
          UPDATE \`order\` 
          SET ${orderUpdateFields.join(', ')} 
          WHERE id = ?
        `;
        await db.query(updateOrderQuery, orderUpdateParams);
      }
    }

    // Update unit_price for specific category and qty in product_details
    if (unit_price !== undefined || qty !== undefined) {
      const targetCategoryId = category_id || existingDebt[0].category_id;

      const getOrderDetailQuery = `
        SELECT od.id as order_detail_id, p.id as product_id
        FROM customer_debt cd
        JOIN \`order\` o ON cd.order_id = o.id
        JOIN order_detail od ON o.id = od.order_id
        JOIN product p ON od.product_id = p.id
        WHERE cd.id = ? AND p.category_id = ?
        LIMIT 1
      `;
      const [orderDetailResult] = await db.query(getOrderDetailQuery, [debt_id, targetCategoryId]);

      if (orderDetailResult.length > 0) {
        const { order_detail_id } = orderDetailResult[0];

        if (unit_price !== undefined) {
          const updateOrderDetailQuery = `
            UPDATE order_detail 
            SET price = ?, total = price * qty
            WHERE id = ?
          `;
          await db.query(updateOrderDetailQuery, [unit_price, order_detail_id]);
        }
      } else {
        return res.status(400).json({
          error: `No product found for category ID: ${targetCategoryId} in this order`
        });
      }
    }

    // Return updated record with all details
    const selectQuery = `
      SELECT 
        cd.*,
        c.name AS customer_name,
        o.order_no,
        od.price AS unit_price,
        p.name AS product_name,
        p.barcode AS product_barcode,
        cat.name AS category_name,
      LEFT JOIN category cat ON cd.category_id = cat.id
      WHERE cd.id = ?
      LIMIT 1
    `;
    const [updatedRecord] = await db.query(selectQuery, [debt_id]);

    const updateSummary = {
      debt_fields_updated: [],
      category_updated: false,
      order_updated: delivery_date !== undefined || order_date !== undefined,
      product_details_updated: unit_price !== undefined || qty !== undefined,
      payment_synced: sync_to_payment && (paid_amount !== undefined || notes !== undefined) // ✅ NEW: Track if payment was synced
    };

    if (total_amount !== undefined) updateSummary.debt_fields_updated.push('total_amount');
    if (paid_amount !== undefined) updateSummary.debt_fields_updated.push('paid_amount');
    if (actual_price !== undefined) updateSummary.debt_fields_updated.push('actual_price');
    if (qty !== undefined) updateSummary.debt_fields_updated.push('qty');
    if (category_actual_price !== undefined) updateSummary.category_updated = true;

    res.json({
      message: "Debt record updated successfully",
      data: updatedRecord[0],
      update_summary: updateSummary
    });

  } catch (error) {
    logError("stockUser.updateDebt", error, res);
  }
};


exports.deleteDebt = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { debt_id } = req.params;

    if (!debt_id) {
      return res.status(400).json({ error: "Debt ID is required" });
    }

    await connection.beginTransaction();

    // ✅ Step 1: Get debt record
    const checkQuery = `
      SELECT 
        cd.id, 
        cd.customer_id, 
        cd.order_id,
        cd.payment_status,
        c.name AS customer_name,
        o.order_no,
        o.delivery_date
      FROM customer_debt cd
      JOIN customer c ON cd.customer_id = c.id
      JOIN \`order\` o ON cd.order_id = o.id
      JOIN user u ON cd.created_by = u.id
      JOIN user cu ON cu.branch_id = u.branch_id
      WHERE cd.id = ? AND cu.id = ?
    `;

    const [existingDebt] = await connection.query(checkQuery, [debt_id, req.current_id]);

    if (existingDebt.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: "Debt record not found or permission denied" });
    }

    const debtRecord = existingDebt[0];
    const orderId = debtRecord.order_id;

    // ✅ Step 2: Delete payment slip files
    const [payments] = await connection.query(`SELECT slips FROM payments WHERE order_id = ?`, [orderId]);

    if (payments && payments.length > 0) {
      for (const payment of payments) {
        try {
          const slipList = JSON.parse(payment.slips || "[]");
          for (const slip of slipList) {
            const filePath = path.join(__dirname, "..", "uploads", slip);
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          }
        } catch (parseError) {
          console.error("Error parsing slips:", parseError);
        }
      }
    }

    // ✅ Step 3: Get product_ids from order_detail
    const [orderProducts] = await connection.query(
      `SELECT product_id FROM order_detail WHERE order_id = ?`,
      [orderId]
    );

    // ✅ Removed product_details deletion as table does not exist

    // ✅ Step 5: Delete payments
    const [deletePaymentsResult] = await connection.query(
      `DELETE FROM payments WHERE order_id = ?`,
      [orderId]
    );

    // ✅ Step 6: Delete order_detail
    const [deleteOrderDetailResult] = await connection.query(
      `DELETE FROM order_detail WHERE order_id = ?`,
      [orderId]
    );

    // ✅ Step 7: Delete customer_debt
    const [deleteDebtResult] = await connection.query(
      `DELETE FROM customer_debt WHERE order_id = ?`,
      [orderId]
    );

    // ✅ Step 8: Delete order
    const [deleteOrderResult] = await connection.query(
      `DELETE FROM \`order\` WHERE id = ?`,
      [orderId]
    );

    // ✅ Step 9: Verify deletion
    const [orderCheck] = await connection.query(`SELECT id FROM \`order\` WHERE id = ?`, [orderId]);
    if (orderCheck.length > 0) {
      throw new Error("Order still exists after deletion attempt");
    }

    await connection.commit();

    res.json({
      message: "All related records deleted successfully",
      deleted_record: {
        id: debtRecord.id,
        customer_name: debtRecord.customer_name,
        order_no: debtRecord.order_no,
        payment_status: debtRecord.payment_status,
        order_id: orderId
      },
      debug_info: {
        payments_deleted: deletePaymentsResult.affectedRows,
        order_details_deleted: deleteOrderDetailResult.affectedRows,
        debts_deleted: deleteDebtResult.affectedRows,
        orders_deleted: deleteOrderResult.affectedRows
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error("Delete debt error:", error);
    res.status(500).json({
      error: "Server error while deleting debt and related records",
      details: error.message
    });
  } finally {
    connection.release();
  }
};
