const { db, isArray, isEmpty, logError ,sendTelegramMessageIvoices_fake} = require("../util/helper");
const dayjs = require('dayjs');


exports.create = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      order_no,
      customer_id,
      user_id,
      payment_method,
      remark,
      create_by,
      payment_status,
      order_date,
      delivery_date,
      due_date,
      receive_date,
      destination,
      items,
      paid_amount = 0,
      total_amount = 0
    } = req.body;

    // ✅ Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items array is required and must not be empty." });
    }

    // ✅ Helper function to safely convert to number and validate
    const safeNumber = (value, defaultValue = 0) => {
      const num = Number(value);
      return isNaN(num) || !isFinite(num) ? defaultValue : num;
    };

    // ✅ Helper function to handle date values
    const formatDate = (dateValue) => {
      if (!dateValue || dateValue === '' || dateValue === null || dateValue === undefined) {
        return null;
      }
      if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateValue;
      }
      if (dateValue instanceof Date) {
        return dateValue.toISOString().split('T')[0];
      }
      try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) {
          return null;
        }
        return date.toISOString().split('T')[0];
      } catch (e) {
        return null;
      }
    };

    // ✅ Format all dates
    const formattedOrderDate = formatDate(order_date);
    const formattedDeliveryDate = formatDate(delivery_date);
    const formattedDueDate = formatDate(due_date);
    const formattedReceiveDate = formatDate(receive_date);

    // ✅ Validate and sanitize paid_amount
    const safePaidAmount = safeNumber(paid_amount, 0);
    const safeTotalAmount = safeNumber(total_amount, 0);

    // ✅ Calculate actual total amount from items
    let calculatedTotalAmount = 0;
    
    // First pass: validate items and calculate total
    for (const item of items) {
      if (!item.category_id || !item.quantity || !item.unit_price) {
        await connection.rollback();
        return res.status(400).json({ error: "Each item must have category_id, quantity, and unit_price" });
      }

      // Validate numeric values
      const quantity = safeNumber(item.quantity);
      const unitPrice = safeNumber(item.unit_price);
      
      if (quantity <= 0 || unitPrice <= 0) {
        await connection.rollback();
        return res.status(400).json({ error: "Quantity and unit_price must be positive numbers" });
      }

      // Get category info
      const [categoryRes] = await connection.query(
        "SELECT actual_price FROM category WHERE id = ?",
        [item.category_id]
      );

      if (!categoryRes.length) {
        await connection.rollback();
        return res.status(400).json({ error: `Category with id ${item.category_id} not found` });
      }

      const actualPrice = safeNumber(categoryRes[0]?.actual_price, 0);
      
      // Calculate item total based on actual_price
      let itemTotal;
      if (actualPrice === 0) {
        // If actual_price is 0, use: quantity * unitPrice
        itemTotal = quantity * unitPrice;
      } else {
        // If actual_price > 0, use: quantity * unitPrice / actual_price
        itemTotal = (quantity * unitPrice) / actualPrice;
      }
      calculatedTotalAmount += itemTotal;
    }

    // Use calculated total if total_amount is 0 or not provided
    const finalTotalAmount = safeTotalAmount > 0 ? safeTotalAmount : calculatedTotalAmount;

    // ✅ Calculate paid amount per item (distribute evenly) - SAFE DIVISION
    const paidPerItem = items.length > 0 ? safePaidAmount / items.length : 0;

    // ✅ Create separate invoice records for each item
    const createdInvoices = [];
    
    for (const item of items) {
      const quantity = safeNumber(item.quantity);
      const unitPrice = safeNumber(item.unit_price);

      // Get category info (we already validated this exists above)
      const [categoryRes] = await connection.query(
        "SELECT actual_price FROM category WHERE id = ?",
        [item.category_id]
      );

      const actualPrice = safeNumber(categoryRes[0]?.actual_price, 0);
      
      // Calculate item total based on actual_price
      let itemTotal;
      if (actualPrice === 0) {
        // If actual_price is 0, use: quantity * unitPrice
        itemTotal = quantity * unitPrice;
      } else {
        // If actual_price > 0, use: quantity * unitPrice / actual_price
        itemTotal = (quantity * unitPrice) / actualPrice;
      }
      const itemDue = itemTotal - paidPerItem;

      // ✅ Final safety check for all monetary values
      const safeItemTotal = safeNumber(itemTotal, 0);
      const safePaidPerItem = safeNumber(paidPerItem, 0);
      const safeItemDue = safeNumber(itemDue, 0);

      // Insert individual invoice record for each item
      const [insertResult] = await connection.query(
        `INSERT INTO fakeinvoice (
          order_no, customer_id, user_id, category_id, quantity, unit_price, actual_price,
          total_amount, paid_amount, total_due, payment_method, 
          remark, create_by, payment_status, order_date, 
          delivery_date, due_date, receive_date, destination
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order_no, customer_id, user_id, item.category_id, quantity, unitPrice, actualPrice,
          safeItemTotal, safePaidPerItem, safeItemDue, payment_method,
          remark, create_by, payment_status, formattedOrderDate,
          formattedDeliveryDate, formattedDueDate, formattedReceiveDate, destination
        ]
      );

      createdInvoices.push(insertResult.insertId);
    }

    // ✅ Get customer information for Telegram message
    const [customerRes] = await connection.query(
      "SELECT name, address, tel FROM customer WHERE id = ?",
      [customer_id]
    );

    const customer = customerRes[0] || { name: 'Unknown', address: 'N/A', tel: 'N/A' };

    const createdBy = req.auth?.name || "System";

    // ✅ Get category information for items
    const categoryIds = items.map(item => item.category_id);
    const [categoriesRes] = await connection.query(
      `SELECT id, name FROM category WHERE id IN (${categoryIds.map(() => '?').join(',')})`,
      categoryIds
    );

    const categoryMap = {};
    categoriesRes.forEach(cat => {
      categoryMap[cat.id] = cat.name;
    });

    // ✅ Calculate total liters
    const totalLiters = items.reduce((sum, item) => sum + safeNumber(item.quantity, 0), 0);

    // ✅ Build Telegram message - Use the calculated total amount
    let telegramText = `✅ <b>Order Completed!</b>\n\n`;
    telegramText += `━━━━━━━━━━━━━━━\n`;
    const formattedinvoicefakeDate = dayjs(formattedOrderDate).format('DD-MM-YYYY');
    telegramText += `📅 Date: <b>${formattedinvoicefakeDate}</b>\n`;
    telegramText += `🧾 Order No: <b>${order_no}</b>\n`;
    telegramText += `👤 Customer: <b>${customer.name}</b>\n`;
    telegramText += `🏠 Address: <b>${customer.address}</b>\n`;
    telegramText += `📞 Phone: <b>${customer.tel}</b>\n`;
    telegramText += `💰 Total: <b>$${safeNumber(finalTotalAmount, 0).toLocaleString()}</b>\n`;
    telegramText += `📝 Created By: <b>${createdBy}</b>\n\n`;

    telegramText += `📦 <b>Items:</b>\n`;
    items.forEach((item, idx) => {
      const categoryName = categoryMap[item.category_id] || 'Unknown Category';
      const qty = safeNumber(item.quantity, 0).toLocaleString();
      telegramText += `  ${idx + 1}. <b>${categoryName}</b> / <b>${qty}L</b>\n`;
    });

    telegramText += `\n🔢 <b>Total Liters:</b> ${totalLiters.toLocaleString()}L\n`;
    telegramText += `━━━━━━━━━━━━━━━`;

    await sendTelegramMessageIvoices_fake(telegramText);

    await connection.commit();
    res.json({ 
      message: "Invoice created successfully!", 
      ids: createdInvoices,
      success: true,
      total_amount: safeNumber(finalTotalAmount, 0)
    });

  } catch (error) {
    await connection.rollback();
    logError("fakeinvoices.create", error);
    res.status(500).json({ error: "Failed to create invoice", details: error.message });
  } finally {
    connection.release();
  }
};

exports.update = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      id,
      order_no,
      customer_id,
      user_id,
      payment_method,
      remark,
      create_by,
      payment_status,
      order_date,
      delivery_date,
      due_date,
      receive_date,
      destination,
      paid_amount = 0,
      items = []
    } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Invoice ID is required for update" });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items array is required and must not be empty." });
    }

    // Calculate totals from all items
    let total_amount = 0;
    let total_quantity = 0;

    for (const item of items) {
      if (!item.category_id || !item.quantity || !item.unit_price) {
        await connection.rollback();
        return res.status(400).json({ error: "Each item must have category_id, quantity, and unit_price" });
      }

      const [categoryRes] = await connection.query(
        "SELECT actual_price FROM category WHERE id = ?",
        [item.category_id]
      );

      if (!categoryRes.length) {
        await connection.rollback();
        return res.status(400).json({ error: `Category with id ${item.category_id} not found` });
      }

      const actual_price = categoryRes[0]?.actual_price || 1;
      const itemTotal = (item.quantity * item.unit_price) / actual_price;

      total_amount += itemTotal;
      total_quantity += item.quantity;
    }

    const total_due = total_amount - paid_amount;

    // ✅ Update main invoice record
    await connection.query(
      `UPDATE fakeinvoice SET
        order_no = ?, customer_id = ?, user_id = ?, quantity = ?, 
        unit_price = ?, total_amount = ?, paid_amount = ?, total_due = ?, 
        payment_method = ?, remark = ?, create_by = ?, payment_status = ?, 
        order_date = ?, delivery_date = ?, due_date = ?, receive_date = ?, 
        destination = ?, category_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        order_no, customer_id, user_id, total_quantity,
        items[0]?.unit_price || 0, total_amount, paid_amount, total_due,
        payment_method, remark, create_by, payment_status,
        order_date, delivery_date, due_date, receive_date,
        destination, items[0]?.category_id || null, id
      ]
    );

    // ✅ Delete existing detail records
    await connection.query("DELETE FROM fakeinvoice_detail WHERE invoice_id = ?", [id]);

    // ✅ Insert updated items into detail table
    for (const item of items) {
      const [categoryRes] = await connection.query(
        "SELECT actual_price FROM category WHERE id = ?",
        [item.category_id]
      );
      
      const actual_price = categoryRes[0]?.actual_price || 1;
      const item_total = (item.quantity * item.unit_price) / actual_price;

      await connection.query(
        `INSERT INTO fakeinvoice_detail (
          invoice_id, category_id, quantity, unit_price, actual_price, total_amount
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, item.category_id, item.quantity, item.unit_price, actual_price, item_total]
      );
    }

    await connection.commit();
    res.json({ 
      message: "Invoice updated successfully!", 
      success: true 
    });

  } catch (error) {
    await connection.rollback();
    console.error("Update invoice error:", error);
    res.status(500).json({ 
      error: "Failed to update invoice", 
      message: error.message,
      success: false 
    });
  } finally {
    connection.release();
  }
};
exports.getList = async (req, res) => {
  try {
    // ✅ Get invoices with detailed items
    const query = `
      SELECT 
        f.id,
        f.order_no,
        f.customer_id,
        c.name as customer_name,
        c.address as customer_address,
        c.tel as customer_tel,
        f.total_amount,
        f.paid_amount,
        f.total_due,
        f.payment_status,
        f.payment_method,
        f.order_date,
        f.delivery_date,
        f.due_date,
        f.receive_date,
        f.destination,
        f.remark,
        f.create_by,
        f.created_at,
        f.updated_at,
        f.customer_id as customer_name,
        -- Get concatenated category names for display
        GROUP_CONCAT(cat.name SEPARATOR ', ') as category_names,
        -- Get total quantities
        SUM(fd.quantity) as total_quantity,
        -- Count number of different items
        COUNT(fd.id) as item_count
      FROM fakeinvoice f
      LEFT JOIN customer c ON f.customer_id = c.id
      LEFT JOIN fakeinvoice_detail fd ON f.id = fd.invoice_id
      LEFT JOIN category cat ON fd.category_id = cat.id
      WHERE f.user_id = ?
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `;

    const [results] = await db.query(query, [req.user_id]);

    // ✅ Format the results
    const list = results.map(item => ({
      ...item,
      // Show category names or item count
      category_display: item.item_count > 1 
        ? `${item.item_count} items` 
        : item.category_names || 'No items'
    }));

    res.json({ 
      list, 
      success: true 
    });

  } catch (error) {
   logError("getlist.fakeinvioies",error)
  }
};
exports.remove = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { order_no } = req.body;

    if (!order_no) {
      return res.status(400).json({ error: "Missing order_no" });
    }

    // 🔍 Step 1: Get all invoice IDs for the given order_no
    const [invoices] = await connection.query(
      "SELECT id FROM fakeinvoice WHERE order_no = ?",
      [order_no]
    );

    const invoiceIds = invoices.map(inv => inv.id);

    if (invoiceIds.length === 0) {
      return res.status(404).json({ error: "No invoice found with that order number" });
    }

    // 🗑️ Step 2: Delete from fakeinvoice_detail
    await connection.query(
      `DELETE FROM fakeinvoice_detail WHERE invoice_id IN (?)`,
      [invoiceIds]
    );

    // 🗑️ Step 3: Delete from fakeinvoice
    await connection.query(
      `DELETE FROM fakeinvoice WHERE id IN (?)`,
      [invoiceIds]
    );

    await connection.commit();

    res.json({
      success: true,
      message: `Deleted invoice(s) with order_no: ${order_no}`,
    });
  } catch (error) {
    await connection.rollback();
    logError("fakeinvoice.remove", error, res);
  } finally {
    connection.release();
  }
};


exports.createWithDetails = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      order_no,
      customer_id,
      user_id,
      payment_method,
      remark,
      create_by,
      payment_status,
      order_date,
      delivery_date,
      due_date,
      receive_date,
      destination,
      items,
      paid_amount = 0,
      total_amount = 0
    } = req.body;

    // ✅ Validate items
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items array is required and must not be empty." });
    }

    // ✅ Create separate invoice records for each item (this approach matches your current frontend display)
    for (const item of items) {
      if (!item.category_id || !item.quantity || !item.unit_price) {
        await connection.rollback();
        return res.status(400).json({ error: "Each item must have category_id, quantity, and unit_price" });
      }

      // Get category info
      const [categoryRes] = await connection.query(
        "SELECT actual_price FROM category WHERE id = ?",
        [item.category_id]
      );

      if (!categoryRes.length) {
        await connection.rollback();
        return res.status(400).json({ error: `Category with id ${item.category_id} not found` });
      }

      const actual_price = categoryRes[0]?.actual_price || 1;
      const item_total = (item.quantity * item.unit_price) / actual_price;
      
      // Calculate proportional paid amount for this item
      const item_paid = total_amount > 0 ? (paid_amount * item_total) / total_amount : 0;
      const item_due = item_total - item_paid;

      // Insert individual invoice record
      const [insertResult] = await connection.query(
        `INSERT INTO fakeinvoice (
          order_no, customer_id, user_id, category_id, quantity, unit_price, actual_price,
          total_amount, paid_amount, total_due, payment_method, 
          remark, create_by, payment_status, order_date, 
          delivery_date, due_date, receive_date, destination
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order_no, customer_id, user_id, item.category_id, item.quantity, item.unit_price, actual_price,
          item_total, item_paid, item_due, payment_method,
          remark, create_by, payment_status, order_date,
          delivery_date, due_date, receive_date, destination
        ]
      );
    }

    await connection.commit();
    res.json({ 
      message: "Invoice created successfully!", 
      success: true 
    });

  } catch (error) {
    await connection.rollback();
    console.error("Create invoice error:", error);
    res.status(500).json({ 
      error: "Failed to create invoice", 
      message: error.message,
      success: false 
    });
  } finally {
    connection.release();
  }
};

// ✅ Add this method to your fakeinvoice.controller.js file

exports.getInvoiceDetails = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Invoice ID is required" });
    }

    // ✅ Method 1: If you want to get details for a specific invoice record
    const [invoiceDetails] = await connection.query(
      `SELECT 
        fi.*,
        c.name as category_name,
        cust.name as customer_name,
        cust.address as customer_address,
        cust.tel as customer_tel
      FROM fakeinvoice fi
      LEFT JOIN category c ON fi.category_id = c.id
      LEFT JOIN customer cust ON fi.customer_id = cust.id
      WHERE fi.id = ?`,
      [id]
    );

    if (!invoiceDetails.length) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // ✅ Method 2: Or if you want to get all items for the same order_no
    const invoice = invoiceDetails[0];
    const [allOrderItems] = await connection.query(
      `SELECT 
        fi.*,
        c.name as category_name
      FROM fakeinvoice fi
      LEFT JOIN category c ON fi.category_id = c.id
      WHERE fi.order_no = ?
      ORDER BY fi.id`,
      [invoice.order_no]
    );

    res.json({
      success: true,
      invoice: invoice, // Single invoice details
      items: allOrderItems, // All items for this order
      message: "Invoice details retrieved successfully"
    });

  } catch (error) {
    console.error("Get invoice details error:", error);
    res.status(500).json({ 
      error: "Failed to get invoice details", 
      message: error.message,
      success: false 
    });
  } finally {
    connection.release();
  }
};

// ✅ Alternative method if you prefer to get by order_no instead of ID
exports.getInvoiceDetailsByOrderNo = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { order_no } = req.params;

    if (!order_no) {
      return res.status(400).json({ error: "Order number is required" });
    }

    const [orderItems] = await connection.query(
      `SELECT 
        fi.*,
        c.name as category_name,
        c.actual_price,
        cust.name as customer_name,
        cust.address as customer_address,
        cust.tel as customer_tel
      FROM fakeinvoice fi
      LEFT JOIN category c ON fi.category_id = c.id
      LEFT JOIN customer cust ON fi.customer_id = cust.id
      WHERE fi.order_no = ?
      ORDER BY fi.id`,
      [order_no]
    );

    if (!orderItems.length) {
      return res.status(404).json({ error: "No items found for this order" });
    }

    res.json({
      success: true,
      items: orderItems,
      order_summary: {
        order_no: order_no,
        total_items: orderItems.length,
        total_amount: orderItems.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0),
        customer_info: {
          name: orderItems[0].customer_name,
          address: orderItems[0].customer_address,
          tel: orderItems[0].customer_tel
        }
      },
      message: "Order details retrieved successfully"
    });

  } catch (error) {
    console.error("Get order details error:", error);
    res.status(500).json({ 
      error: "Failed to get order details", 
      message: error.message,
      success: false 
    });
  } finally {
    connection.release();
  }
};

exports.getListByCurrentUserGroup = async (req, res) => {
  try {
    const sql = `
      SELECT 
        f.id, 
        f.order_no, 
        f.category_id,
        f.customer_id, 
        cu.name AS customer_name,             -- ✅ Add customer name
        cu.address AS customer_address,       -- ✅ Add customer address
        cu.tel AS customer_tel,               -- ✅ Add customer phone
        f.user_id, 
        f.quantity, 
        f.unit_price, 
        f.total_amount, 
        f.paid_amount, 
        f.payment_method, 
        f.remark, 
        f.create_by, 
        f.create_at, 
        f.updated_at, 
        f.total_due, 
        f.payment_status, 
        f.update_at, 
        f.order_date, 
        f.delivery_date, 
        f.due_date, 
        f.receive_date,
        f.destination,
        u.group_id,
        u.name AS created_by_name,
        u.username AS created_by_username
      FROM fakeinvoice f
      INNER JOIN user u ON f.user_id = u.id
      INNER JOIN user gcu ON gcu.group_id = u.group_id
      INNER JOIN customer cu ON f.customer_id = cu.id    -- ✅ Join with customer table
      WHERE gcu.id = :current_user_id
    `;

    const [data] = await db.query(sql, {
      current_user_id: req.current_id
    });

    res.json({
      list: data,
      message: "Success!",
    });

  } catch (error) {
    logError("fakeinvoice.getListByCurrentUserGroup", error, res);
  }
};





