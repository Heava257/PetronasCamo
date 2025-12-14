const { db, isArray, isEmpty, logError, sendTelegramMessagenewcustomerPays } = require("../util/helper");
const moment = require('moment');
const { config } = require("../util/config");
const axios = require("axios");
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
      SELECT 
        cd.id AS debt_id,
        cd.order_id,
        o.order_no,
        DATE_FORMAT(o.order_date, '%Y-%m-%d') AS order_date,
        DATE_FORMAT(o.delivery_date, '%Y-%m-%d') AS delivery_date,
        c.id AS customer_id,
        c.name AS customer_name,
        c.tel,
        c.address,
        cd.total_amount,
        cd.paid_amount,
        cd.due_amount,
        cd.payment_status,
        DATE_FORMAT(cd.due_date, '%Y-%m-%d') AS due_date,
        DATE_FORMAT(cd.last_payment_date, '%Y-%m-%d') AS last_payment_date,
        cd.notes,
        u.username AS created_by,
        DATE_FORMAT(cd.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
        DATE_FORMAT(cd.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at,
        
        -- ✅ FIXED: Get qty from customer_debt, but unit_price from order_detail table based on category_id
        cd.qty AS quantity,
        (
          SELECT od.price
          FROM order_detail od
          JOIN product p ON od.product_id = p.id
          WHERE od.order_id = o.id AND p.category_id = cd.category_id
          LIMIT 1
        ) AS unit_price,
        cd.actual_price AS debt_actual_price,
        
        -- ✅ NEW: Get actual_price from category table
        (
          SELECT cat.actual_price
          FROM category cat
          WHERE cat.id = cd.category_id
        ) AS category_actual_price,
        
        -- ✅ NEW: Use category actual_price as fallback if debt actual_price is null/0
        COALESCE(
          NULLIF(cd.actual_price, 0), 
          (SELECT cat.actual_price FROM category cat WHERE cat.id = cd.category_id)
        ) AS effective_actual_price,
        
        -- ✅ NEW: Get product description
        (
          SELECT p.description
          FROM order_detail od
          JOIN product p ON od.product_id = p.id
          WHERE od.order_id = o.id AND p.category_id = cd.category_id
          LIMIT 1
        ) AS product_description,
        
        CASE 
          WHEN cd.due_date IS NOT NULL AND cd.due_date < CURDATE() AND cd.payment_status != 'Paid' 
          THEN DATEDIFF(CURDATE(), cd.due_date)
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

        -- ✅ Get total quantity from order_detail table (sum of all items in order)
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
          WHERE od.order_id = o.id AND p.category_id = cd.category_id
          LIMIT 1
        ) AS product_category,
        
        (
          SELECT od.discount
          FROM order_detail od
          JOIN product p ON od.product_id = p.id
          WHERE od.order_id = o.id AND p.category_id = cd.category_id
          LIMIT 1
        ) AS discount,
        
        (
          SELECT od.total
          FROM order_detail od
          JOIN product p ON od.product_id = p.id
          WHERE od.order_id = o.id AND p.category_id = cd.category_id
          LIMIT 1
        ) AS item_total
      FROM 
        customer_debt cd
      JOIN 
        \`order\` o ON cd.order_id = o.id
      JOIN 
        customer c ON cd.customer_id = c.id
      JOIN 
        user u ON cd.created_by = u.id
      JOIN 
        user cu ON cu.group_id = u.group_id
      WHERE cu.id = ?
    `;

    const queryParams = [req.current_id];
    const conditions = [];

    if (show_paid !== 'true' && show_paid !== true) {
      conditions.push(`cd.due_amount > 0`);
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
      conditions.push(`cd.customer_id = ?`);
      queryParams.push(customer_id);
    }

    if (search && search.trim() !== '') {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(`(
        c.name LIKE ? OR 
        c.tel LIKE ? OR 
        o.order_no LIKE ? OR
        EXISTS (
          SELECT 1 FROM order_detail od
          JOIN product p ON od.product_id = p.id
          JOIN category cat ON p.category_id = cat.id
          WHERE od.order_id = o.id AND (
            p.name LIKE ? OR
            cat.name LIKE ?
          )
        )
      )`);
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
      sqlQuery += ' AND ' + conditions.join(' AND ');
    }

    sqlQuery += ' ORDER BY cd.payment_status ASC, cd.due_date ASC, o.order_date DESC';

    const [list] = await db.query(sqlQuery, queryParams);

    const formattedList = list.map(item => ({
      ...item,
      branch_name: item.address,
      debt_type: item.product_category,
      product_details: item.product_details ? item.product_details.split('\n') : [],
      categories: item.categories ? item.categories.split(', ') : []
    }));

    res.json({
      list: formattedList
    });
  } catch (error) {
    logError("order.gettotaldue", error, res);
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
    } = req.body;

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

    // ✅ Fetch product descriptions from order details
    const [orderDetailsRows] = await connection.query(
      `SELECT od.product_id, p.description 
       FROM order_detail od
       LEFT JOIN product p ON od.product_id = p.id
       WHERE od.order_id = ?`,
      [order_id]
    );

    // Get the first non-empty description (card number)
    const firstDescription = orderDetailsRows
      .map(row => row.description)
      .find(desc => desc && desc.trim() !== '') || '';

    const slipFiles = req.files?.["upload_image_optional"] || [];
    const slipPaths = slipFiles.map((file) => file.filename);

    const [paymentResult] = await connection.query(
      `INSERT INTO payments (
        order_id, customer_id, amount, payment_method, bank, 
        payment_date, user_id, notes, slips, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        order_id,
        customer_id,
        paymentAmount,
        payment_method || "cash",
        bank || null,
        payment_date || new Date().toISOString().split("T")[0],
        user_id,
        notes || "",
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

    // ✅ Format Date for Telegram
    const formatDate = (dateStr) => {
      const d = new Date(dateStr || new Date());
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // ✅ Build Telegram alert message with description
    let alertMessage = `✅ <b>New Payment Received</b>
📅 <b>Date:</b> ${formatDate(payment_date)}
`;

    // ✅ Add card number if available
    if (firstDescription) {
      alertMessage += `📝 <b>Invoice Number:</b> <i>${firstDescription}</i>
`;
    }

    alertMessage += `👤 <b>Customer:</b> ${customerName}
📞 <b>Phone:</b> ${customerPhone}
📍 <b>Address:</b> ${customerAddress}
💲 <b>Amount:</b> $${Number(paymentAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
💳 <b>Method:</b> ${payment_method}
🏦 <b>Bank:</b> ${bank || 'N/A'}
<i>Processed by: ${userName}</i>
    `;

    const imageUrls = slipPaths.map(f => config.image_path + f);
    await sendTelegramMessagenewcustomerPays(alertMessage, imageUrls);

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
        card_number: firstDescription || null, // ✅ Include in response
      },
    });

  } catch (error) {
    await connection.rollback();
    logError("Error in updateCustomerDebt:", error);
    res.status(500).json({
      success: false,
      error: "An error occurred while processing the payment. Please try again.",
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
      category_id, // ✅ ADD: category_id to specify which product to update
      actual_price, // ✅ NEW: actual_price for customer_debt table
      category_actual_price, // ✅ NEW: actual_price for category table
      update_price_type // ✅ NEW: specify which price to update ('debt', 'category', 'both')
    } = req.body;

    if (!debt_id) {
      return res.status(400).json({ error: "Debt ID is required" });
    }

    const checkQuery = `
      SELECT cd.id, cd.customer_id, cd.order_id, cd.category_id, cd.total_amount, cd.paid_amount, cd.actual_price
      FROM customer_debt cd
      JOIN user u ON cd.created_by = u.id
      JOIN user cu ON cu.group_id = u.group_id
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

    // Get current values for reference (due_amount will be auto-calculated)
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

    // ✅ REMOVED: Manual due_amount calculation since it's a generated column
    // The due_amount will be automatically calculated by MySQL based on total_amount - paid_amount

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

    // ✅ UPDATE: Update category_id if provided
    if (category_id !== undefined) {
      updateFields.push('category_id = ?');
      updateParams.push(category_id);
    }

    // ✅ NEW: Update qty in customer_debt table
    if (qty !== undefined) {
      updateFields.push('qty = ?');
      updateParams.push(qty);
    }

    // ✅ NEW: Update actual_price in customer_debt table
    if (actual_price !== undefined) {
      updateFields.push('actual_price = ?');
      updateParams.push(actual_price);
    }

    // Only proceed with update if there are fields to update
    if (updateFields.length > 0) {
      // Finalize debt update
      updateFields.push('updated_at = NOW()');
      updateParams.push(debt_id);

      const updateQuery = `
        UPDATE customer_debt 
        SET ${updateFields.join(', ')} 
        WHERE id = ?
      `;
      await db.query(updateQuery, updateParams);
    }

    // ✅ NEW: Update actual_price in category table if requested
    if (category_actual_price !== undefined && (update_price_type === 'category' || update_price_type === 'both')) {
      const targetCategoryId = category_id || existingDebt[0].category_id;
      
      const updateCategoryQuery = `
        UPDATE category 
        SET actual_price = ?
        WHERE id = ?
      `;
      await db.query(updateCategoryQuery, [category_actual_price, targetCategoryId]);
    }

    // ✅ Update order table dates
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

    // ✅ FIXED: Update unit_price for SPECIFIC CATEGORY and qty in product_details
    if (unit_price !== undefined || qty !== undefined) {
      // Determine which category to update
      const targetCategoryId = category_id || existingDebt[0].category_id;
      
      // Get the specific order_detail for the target category
      const getOrderDetailQuery = `
        SELECT od.id as order_detail_id, p.id as product_id, pd.id as product_detail_id
        FROM customer_debt cd
        JOIN \`order\` o ON cd.order_id = o.id
        JOIN order_detail od ON o.id = od.order_id
        JOIN product p ON od.product_id = p.id
        LEFT JOIN product_details pd ON p.id = pd.product_id
        WHERE cd.id = ? AND p.category_id = ?
        LIMIT 1
      `;
      const [orderDetailResult] = await db.query(getOrderDetailQuery, [debt_id, targetCategoryId]);

      if (orderDetailResult.length > 0) {
        const { order_detail_id, product_detail_id } = orderDetailResult[0];

        // Update price in order_detail table for specific category
        if (unit_price !== undefined) {
          const updateOrderDetailQuery = `
            UPDATE order_detail 
            SET price = ?, total = price * qty
            WHERE id = ?
          `;
          await db.query(updateOrderDetailQuery, [unit_price, order_detail_id]);
        }

        // Update qty in product_details table
        if (qty !== undefined && product_detail_id) {
          const updateProductDetailsQuery = `
            UPDATE product_details 
            SET qty = ?
            WHERE id = ?
          `;
          await db.query(updateProductDetailsQuery, [qty, product_detail_id]);
        }
      } else {
        return res.status(400).json({
          error: `No product found for category ID: ${targetCategoryId} in this order`
        });
      }
    }

    // ✅ ENHANCED: Return updated record with all actual price fields
    const selectQuery = `
      SELECT 
        cd.*,
        c.name AS customer_name,
        o.order_no,
        od.price AS unit_price,
        p.name AS product_name,
        p.barcode AS product_barcode,
        pd.qty AS product_qty,
        cat.name AS category_name,
        
        -- ✅ NEW: Include all actual price fields
        cd.actual_price AS debt_actual_price,
        cat.actual_price AS category_actual_price,
        COALESCE(
          NULLIF(cd.actual_price, 0), 
          cat.actual_price
        ) AS effective_actual_price,
        
        DATE_FORMAT(cd.due_date, '%Y-%m-%d') AS formatted_due_date,
        DATE_FORMAT(cd.last_payment_date, '%Y-%m-%d') AS formatted_last_payment_date,
        DATE_FORMAT(cd.created_at, '%Y-%m-%d %H:%i:%s') AS formatted_created_at,
        DATE_FORMAT(cd.updated_at, '%Y-%m-%d %H:%i:%s') AS formatted_updated_at,
        DATE_FORMAT(o.delivery_date, '%Y-%m-%d') AS formatted_delivery_date,
        DATE_FORMAT(o.order_date, '%Y-%m-%d') AS formatted_order_date,
        
        -- ✅ NEW: Additional helpful fields
        CASE 
          WHEN cd.due_date IS NOT NULL AND cd.due_date < CURDATE() AND cd.payment_status != 'Paid' 
          THEN DATEDIFF(CURDATE(), cd.due_date)
          ELSE NULL
        END AS days_overdue,
        
        -- ✅ NEW: Calculate using effective actual price
        CASE 
          WHEN COALESCE(NULLIF(cd.actual_price, 0), cat.actual_price) > 0 
          THEN (od.price * cd.qty) / COALESCE(NULLIF(cd.actual_price, 0), cat.actual_price)
          ELSE 0
        END AS calculated_amount_using_effective_price
        
      FROM customer_debt cd
      JOIN customer c ON cd.customer_id = c.id
      JOIN \`order\` o ON cd.order_id = o.id
      LEFT JOIN order_detail od ON o.id = od.order_id
      LEFT JOIN product p ON od.product_id = p.id AND p.category_id = cd.category_id
      LEFT JOIN product_details pd ON p.id = pd.product_id
      LEFT JOIN category cat ON cd.category_id = cat.id
      WHERE cd.id = ?
      LIMIT 1
    `;
    const [updatedRecord] = await db.query(selectQuery, [debt_id]);

    // ✅ NEW: Add summary of what was updated
    const updateSummary = {
      debt_fields_updated: [],
      category_updated: false,
      order_updated: delivery_date !== undefined || order_date !== undefined,
      product_details_updated: unit_price !== undefined || qty !== undefined
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
      JOIN user cu ON cu.group_id = u.group_id
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

    // ✅ Step 4: Delete product_details (BEFORE deleting order_detail!)
    let productDetailsDeleted = 0;
    if (orderProducts.length > 0) {
      const productIds = orderProducts.map(p => p.product_id);
      const [deleteProductDetailsResult] = await connection.query(
        `DELETE FROM product_details 
         WHERE customer_id = ? AND product_id IN (?)`,
        [debtRecord.customer_id, productIds]
      );
      productDetailsDeleted = deleteProductDetailsResult.affectedRows;
    }

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
        product_details_deleted: productDetailsDeleted,
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