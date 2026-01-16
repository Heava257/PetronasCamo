const { db, isArray, isEmpty, logError, sendTelegramMessageIvoices_fake } = require("../util/helper");
const dayjs = require('dayjs');
const { sendSmartNotification } = require("../util/Telegram.helpe");
const { createSystemNotification } = require("./System_notification.controller");

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
      total_amount = 0,
      manual_customer_name,
      manual_customer_tel,
      manual_customer_address
    } = req.body;

    const branch_name = req.auth?.branch_name || null;
    const group_id = req.auth?.group_id || null;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Items array is required and must not be empty." });
    }

    const safeNumber = (value, defaultValue = 0) => {
      const num = Number(value);
      return isNaN(num) || !isFinite(num) ? defaultValue : num;
    };

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

    const formattedOrderDate = formatDate(order_date);
    const formattedDeliveryDate = formatDate(delivery_date);
    const formattedDueDate = formatDate(due_date);
    const formattedReceiveDate = formatDate(receive_date);

    const safePaidAmount = safeNumber(paid_amount, 0);
    const safeTotalAmount = safeNumber(total_amount, 0);

    let calculatedTotalAmount = 0;
    let totalQuantity = 0;

    // First pass: Validate items and calculate total
    for (const item of items) {
      if (!item.product_id || !item.quantity || !item.unit_price) {
        await connection.rollback();
        return res.status(400).json({ error: "Each item must have product_id, quantity, and unit_price" });
      }

      const quantity = safeNumber(item.quantity);
      const unitPrice = safeNumber(item.unit_price);

      // Get divisor from item (frontend sends it), fallback to DB if 0 or missing
      let actualPrice = safeNumber(item.actual_price, 0);
      if (actualPrice === 0) {
        const [p] = await connection.query(
          "SELECT p.actual_price, c.actual_price as cat_price FROM product p LEFT JOIN category c ON p.category_id = c.id WHERE p.id = ?",
          [item.product_id]
        );
        actualPrice = p[0]?.actual_price || p[0]?.cat_price || 0;
      }

      // NEW LOGIC: If actualPrice is 0, don't divide
      let itemTotal = 0;
      if (actualPrice === 0) {
        itemTotal = quantity * unitPrice; // No division
      } else {
        itemTotal = (quantity * unitPrice) / actualPrice; // With division
      }

      calculatedTotalAmount += itemTotal;
      totalQuantity += quantity;

      // Update item object with found actualPrice for later use
      item.actual_price = actualPrice;
    }

    const finalTotalAmount = safeTotalAmount > 0 ? safeTotalAmount : calculatedTotalAmount;
    const totalDue = finalTotalAmount - safePaidAmount;

    // Insert ONLY ONE row into fakeinvoice (Header)
    const [headerResult] = await connection.query(
      `INSERT INTO fakeinvoice (
        order_no, customer_id, user_id, 
        quantity, unit_price, total_amount, paid_amount, total_due, 
        payment_method, remark, create_by, payment_status, 
        order_date, delivery_date, due_date, receive_date, destination,
        manual_customer_name, manual_customer_tel, manual_customer_address,
        product_id, actual_price
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        order_no, customer_id, user_id,
        totalQuantity, items[0].unit_price, finalTotalAmount, safePaidAmount, totalDue,
        payment_method, remark, create_by, payment_status,
        formattedOrderDate, formattedDeliveryDate, formattedDueDate, formattedReceiveDate, destination,
        manual_customer_name, manual_customer_tel, manual_customer_address,
        items[0].product_id, items[0].actual_price || 0
      ]
    );

    const invoiceId = headerResult.insertId;

    // Insert items into fakeinvoice_detail
    for (const item of items) {
      const quantity = safeNumber(item.quantity);
      const unitPrice = safeNumber(item.unit_price);
      const actualPrice = safeNumber(item.actual_price, 0);

      // Apply same logic: if actualPrice is 0, don't divide
      let itemTotal = 0;
      if (actualPrice === 0) {
        itemTotal = quantity * unitPrice;
      } else {
        itemTotal = (quantity * unitPrice) / actualPrice;
      }

      await connection.query(
        `INSERT INTO fakeinvoice_detail (
          invoice_id, product_id, quantity, unit_price, actual_price, total_amount
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [invoiceId, item.product_id, quantity, unitPrice, actualPrice, itemTotal]
      );
    }

    // Prepare notification data
    const [customerRes] = await connection.query(
      "SELECT name, address, tel FROM customer WHERE id = ?",
      [customer_id]
    );

    const customer = (customer_id && customerRes[0]) ? customerRes[0] : {
      name: manual_customer_name || 'Unknown',
      address: manual_customer_address || 'N/A',
      tel: manual_customer_tel || 'N/A'
    };

    const createdBy = req.auth?.name || "System";
    const productIds = items.map(item => item.product_id);
    const [productsRes] = await connection.query(
      `SELECT id, name FROM product WHERE id IN (${productIds.map(() => '?').join(',')})`,
      productIds
    );

    const productMap = {};
    productsRes.forEach(p => { productMap[p.id] = p.name; });

    // Notifications
    try {
      let telegramText = `✅ <b>Order Completed!</b>\n━━━━━━━━━━━━━━━\n`;
      if (branch_name) telegramText += `🏢 <b>Branch:</b> ${branch_name}\n`;
      telegramText += `📅 <b>Date:</b> ${dayjs(formattedOrderDate).format('DD-MM-YYYY')}\n`;
      telegramText += `🧾 <b>Order No:</b> ${order_no}\n`;
      telegramText += `👤 <b>Customer:</b> ${customer.name}\n`;
      telegramText += `💰 <b>Total:</b> $${safeNumber(finalTotalAmount, 0).toLocaleString()}\n\n`;
      telegramText += `📦 <b>Items:</b>\n`;
      items.forEach((item, idx) => {
        telegramText += `  ${idx + 1}. <b>${productMap[item.product_id] || 'Unknown'}</b> / <b>${item.quantity}L</b>\n`;
      });
      telegramText += `\n━━━━━━━━━━━━━━━`;

      await sendSmartNotification({
        event_type: 'invoice_created',
        branch_name: branch_name,
        message: telegramText,
        severity: finalTotalAmount > 5000 ? 'critical' : 'normal'
      });
    } catch (notifError) { console.error("❌ Notification error:", notifError); }

    await connection.commit();
    res.json({
      message: "Invoice created successfully!",
      id: invoiceId,
      success: true,
      total_amount: finalTotalAmount
    });

  } catch (error) {
    await connection.rollback();
    logError("fakeinvoices.create", error);
    res.status(500).json({ error: "Failed to create invoice", details: error.message });
  } finally {
    connection.release();
  }
};

exports.createWithDetails = exports.create;


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
      items = [],
      manual_customer_name,
      manual_customer_tel,
      manual_customer_address
    } = req.body;

    if (!id) return res.status(400).json({ error: "Invoice ID is required for update" });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "Items array is required." });

    const safeNumber = (value, defaultValue = 0) => {
      const num = Number(value);
      return isNaN(num) || !isFinite(num) ? defaultValue : num;
    };

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

    let total_amount = 0;
    let total_quantity = 0;

    // Calculate total with NEW LOGIC
    for (const item of items) {
      const quantity = safeNumber(item.quantity);
      const unitPrice = safeNumber(item.unit_price);
      
      // Get actualPrice from item (frontend sends it)
      let actual_price = safeNumber(item.actual_price, 0);
      
      // If not provided or 0, fetch from database
      if (actual_price === 0) {
        const [productRes] = await connection.query(
          "SELECT p.actual_price, c.actual_price as cat_price FROM product p LEFT JOIN category c ON p.category_id = c.id WHERE p.id = ?",
          [item.product_id]
        );
        actual_price = productRes[0]?.actual_price || productRes[0]?.cat_price || 0;
      }

      // NEW LOGIC: If actual_price is 0, don't divide
      let itemTotal = 0;
      if (actual_price === 0) {
        itemTotal = quantity * unitPrice; // No division
      } else {
        itemTotal = (quantity * unitPrice) / actual_price; // With division
      }

      total_amount += itemTotal;
      total_quantity += quantity;

      // Store actual_price in item for detail insert
      item.actual_price = actual_price;
    }

    const safePaidAmount = safeNumber(paid_amount, 0);
    const total_due = total_amount - safePaidAmount;

    // Update header
    await connection.query(
      `UPDATE fakeinvoice SET
        order_no = ?, customer_id = ?, user_id = ?, quantity = ?, 
        unit_price = ?, total_amount = ?, paid_amount = ?, total_due = ?, 
        payment_method = ?, remark = ?, create_by = ?, payment_status = ?, 
        order_date = ?, delivery_date = ?, due_date = ?, receive_date = ?, 
        destination = ?, product_id = ?, actual_price = ?,
        manual_customer_name = ?, manual_customer_tel = ?, manual_customer_address = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        order_no, customer_id, user_id, total_quantity,
        items[0]?.unit_price || 0, total_amount, safePaidAmount, total_due,
        payment_method, remark, create_by, payment_status,
        formatDate(order_date), formatDate(delivery_date), formatDate(due_date), formatDate(receive_date),
        destination, items[0]?.product_id || null, items[0]?.actual_price || 0,
        manual_customer_name, manual_customer_tel, manual_customer_address,
        id
      ]
    );

    // Delete old details
    await connection.query("DELETE FROM fakeinvoice_detail WHERE invoice_id = ?", [id]);

    // Insert new details with NEW LOGIC
    for (const item of items) {
      const quantity = safeNumber(item.quantity);
      const unitPrice = safeNumber(item.unit_price);
      const actual_price = safeNumber(item.actual_price, 0);

      // Apply same logic
      let item_total = 0;
      if (actual_price === 0) {
        item_total = quantity * unitPrice;
      } else {
        item_total = (quantity * unitPrice) / actual_price;
      }

      await connection.query(
        `INSERT INTO fakeinvoice_detail (
          invoice_id, product_id, quantity, unit_price, actual_price, total_amount
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, item.product_id, quantity, unitPrice, actual_price, item_total]
      );
    }

    await connection.commit();
    res.json({ message: "Invoice updated successfully!", success: true, total_amount });

  } catch (error) {
    await connection.rollback();
    logError("fakeinvoices.update", error);
    res.status(500).json({ error: "Failed to update", message: error.message });
  } finally {
    connection.release();
  }
};

exports.getList = async (req, res) => {
  try {
    const query = `
      SELECT 
        f.id, f.order_no, f.customer_id,
        c.name as customer_name, c.address as customer_address, c.tel as customer_tel,
        f.total_amount, f.paid_amount, f.total_due, f.payment_status, f.payment_method,
        f.order_date, f.delivery_date, f.due_date, f.receive_date, f.destination,
        f.remark, f.create_by, f.created_at, f.updated_at,
        f.manual_customer_name, f.manual_customer_tel, f.manual_customer_address,
        GROUP_CONCAT(p.name SEPARATOR ', ') as product_names,
        SUM(fd.quantity) as total_quantity,
        COUNT(fd.id) as item_count
      FROM fakeinvoice f
      LEFT JOIN customer c ON f.customer_id = c.id
      LEFT JOIN fakeinvoice_detail fd ON f.id = fd.invoice_id
      LEFT JOIN product p ON fd.product_id = p.id
      WHERE f.user_id = ?
      GROUP BY f.id
      ORDER BY f.created_at DESC
    `;

    const [results] = await db.query(query, [req.user_id]);

    const list = results.map(item => ({
      ...item,
      customer_name: item.manual_customer_name || item.customer_name || 'Unknown',
      customer_address: item.manual_customer_address || item.customer_address || 'N/A',
      customer_tel: item.manual_customer_tel || item.customer_tel || 'N/A',
      product_display: item.item_count > 1 ? `${item.item_count} Products` : (item.product_names || 'No items')
    }));

    res.json({ list, success: true });
  } catch (error) { logError("getlist.fakeinvoices", error); }
};

exports.getInvoiceDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const [invoiceDetails] = await db.query(
      `SELECT fi.*, cust.name as customer_name, cust.address as customer_address, cust.tel as customer_tel
       FROM fakeinvoice fi LEFT JOIN customer cust ON fi.customer_id = cust.id WHERE fi.id = ?`,
      [id]
    );

    if (!invoiceDetails.length) return res.status(404).json({ error: "Not found" });

    const [items] = await db.query(
      `SELECT fd.*, p.name as product_name FROM fakeinvoice_detail fd 
       LEFT JOIN product p ON fd.product_id = p.id WHERE fd.invoice_id = ?`,
      [id]
    );

    const invoice = invoiceDetails[0];
    res.json({
      success: true,
      invoice: {
        ...invoice,
        customer_name: invoice.manual_customer_name || invoice.customer_name || 'Unknown',
        customer_address: invoice.manual_customer_address || invoice.customer_address || 'N/A',
        customer_tel: invoice.manual_customer_tel || invoice.customer_tel || 'N/A'
      },
      items,
      success: true
    });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.remove = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { id } = req.body;
    await connection.beginTransaction();
    await connection.query("DELETE FROM fakeinvoice_detail WHERE invoice_id = ?", [id]);
    await connection.query("DELETE FROM fakeinvoice WHERE id = ?", [id]);
    await connection.commit();
    res.json({ success: true, message: "Deleted" });
  } catch (error) { await connection.rollback(); logError("fakeinvoice.remove", error, res); } finally { connection.release(); }
};

exports.getInvoiceDetailsByOrderNo = async (req, res) => {
  try {
    const { order_no } = req.params;
    const [header] = await db.query("SELECT * FROM fakeinvoice WHERE order_no = ? LIMIT 1", [order_no]);
    if (!header.length) return res.status(404).json({ error: "Not found" });

    const [items] = await db.query(
      `SELECT fd.*, p.name as product_name FROM fakeinvoice_detail fd 
       LEFT JOIN product p ON fd.product_id = p.id WHERE fd.invoice_id = ?`,
      [header[0].id]
    );

    res.json({ success: true, items, invoice: header[0] });
  } catch (error) { res.status(500).json({ error: error.message }); }
};

exports.getListByCurrentUserGroup = async (req, res) => {
  try {
    // ទាញយក group_id របស់ user បច្ចុប្បន្ន
    const [userResult] = await db.query(
      "SELECT group_id FROM user WHERE id = ?",
      [req.current_id]
    );

    if (!userResult.length) {
      return res.status(404).json({ error: "User not found" });
    }

    const groupId = userResult[0].group_id;

    // ទាញយក invoice ទាំងអស់ដែល user ក្នុង group នោះបានបង្កើត
    const sql = `
      SELECT 
        f.*, 
        COALESCE(f.manual_customer_name, cu.name, 'Unknown') AS customer_name,
        COALESCE(f.manual_customer_address, cu.address, 'N/A') AS customer_address,
        COALESCE(f.manual_customer_tel, cu.tel, 'N/A') AS customer_tel,
        u.name AS created_by_name
      FROM fakeinvoice f
      INNER JOIN user u ON f.user_id = u.id
      LEFT JOIN customer cu ON f.customer_id = cu.id
      WHERE u.group_id = ?
      ORDER BY f.create_at DESC
    `;

    const [data] = await db.query(sql, [groupId]);
    res.json({ list: data, message: "Success!" });
  } catch (error) {
    logError("fakeinvoice.getListByCurrentUserGroup", error, res);
  }
};