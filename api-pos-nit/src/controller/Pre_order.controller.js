// ✅ pre_order.controller.js - Complete Pre-Order Controller

const { db, logError } = require("../util/helper");
const dayjs = require('dayjs');
const { sendSmartNotification } = require("../util/Telegram.helpe");

const formatNumber = (num) => {
  return parseFloat(num || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
exports.createPreOrder = async (req, res) => {
  try {
    const {
      pre_order_no,
      customer_id,
      delivery_date,
      delivery_time,
      delivery_address,
      special_instructions,
      products, // [{product_id, qty, price, discount}]
      deposit_amount,
      payment_method
    } = req.body;

    // Validation
    if (!pre_order_no) {
      return res.status(400).json({
        success: false,
        message: "Pre-order number is required",
        message_kh: "សូមបញ្ចូលលេខកម្មង់"
      });
    }

    if (!customer_id || !products || products.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Customer and products are required"
      });
    }

    // ✅ Check if pre_order_no already exists
    const [existing] = await db.query(
      "SELECT id FROM pre_order WHERE pre_order_no = :pre_order_no",
      { pre_order_no }
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Pre-order number already exists",
        message_kh: "លេខកម្មង់នេះមានរួចហើយ"
      });
    }

    // ✅ FIXED: Get customer info with correct column names
    const [customer] = await db.query(
      "SELECT name, tel, address, id_card_number FROM customer WHERE id = :customer_id",
      { customer_id }
    );

    if (customer.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found"
      });
    }

    // ✅ Get user info for branch and user name
    const [userInfo] = await db.query(
      "SELECT id, name, branch_name FROM user WHERE id = :user_id",
      { user_id: req.auth?.id || 1 }
    );

    const branch_name = userInfo[0]?.branch_name || 'Unknown Branch';
    const user_name = userInfo[0]?.name || 'Unknown User';

    // Calculate total amount using CORRECT formula: (qty × price × (1 - discount)) ÷ actual_price
    let total_amount = 0;
    const productsWithDetails = [];

    for (const product of products) {
      // Get product details including actual_price
      const [productInfo] = await db.query(`
        SELECT p.id, p.name, p.unit, p.actual_price, c.name as category_name
        FROM product p
        LEFT JOIN category c ON p.category_id = c.id
        WHERE p.id = :product_id
      `, { product_id: product.product_id });

      if (productInfo.length === 0) continue;

      const actual_price = parseFloat(productInfo[0].actual_price || product.price);
      const discount = parseFloat(product.discount || 0) / 100;
      const qty = parseFloat(product.qty || 0);
      const price = parseFloat(product.price || 0);

      // ✅ CORRECT FORMULA: (qty × price × (1 - discount)) ÷ actual_price
      const amount = (qty * price * (1 - discount)) / actual_price;
      total_amount += amount;

      productsWithDetails.push({
        ...product,
        product_name: productInfo[0].name,
        category_name: productInfo[0].category_name,
        unit: productInfo[0].unit,
        actual_price: actual_price,
        calculated_amount: amount
      });
    }

    // Insert pre-order
    const sqlPreOrder = `
      INSERT INTO pre_order (
        pre_order_no, customer_id, customer_name, customer_tel,
        order_date, delivery_date, delivery_time,
        delivery_address, special_instructions,
        total_amount, deposit_amount, remaining_amount,
        payment_status, status, created_by, created_at
      ) VALUES (
        :pre_order_no, :customer_id, :customer_name, :customer_tel,
        :order_date, :delivery_date, :delivery_time,
        :delivery_address, :special_instructions,
        :total_amount, :deposit_amount, :remaining_amount,
        :payment_status, 'pending', :created_by, NOW()
      )
    `;

    const deposit = parseFloat(deposit_amount || 0);
    const remaining = total_amount - deposit;
    const payment_status = deposit === 0 ? 'unpaid' : deposit >= total_amount ? 'paid' : 'partial';
    const today = dayjs().format('YYYY-MM-DD');

    const [resultPreOrder] = await db.query(sqlPreOrder, {
      pre_order_no,
      customer_id,
      customer_name: customer[0].name,
      customer_tel: customer[0].tel,
      order_date: today,
      delivery_date: delivery_date || null,
      delivery_time: delivery_time || null,
      delivery_address: delivery_address || customer[0].address || null,
      special_instructions: special_instructions || null,
      total_amount,
      deposit_amount: deposit,
      remaining_amount: remaining,
      payment_status,
      created_by: req.auth?.id
    });

    const pre_order_id = resultPreOrder.insertId;

    // Insert pre-order details
    for (const product of productsWithDetails) {
      const discount_value = parseFloat(product.discount || 0) / 100;
      const amount = (product.qty * product.price * (1 - discount_value)) / product.actual_price;

      await db.query(`
        INSERT INTO pre_order_detail (
          pre_order_id, product_id, product_name, category_name,
          qty, unit, price, discount, amount, remaining_qty
        ) VALUES (
          :pre_order_id, :product_id, :product_name, :category_name,
          :qty, :unit, :price, :discount, :amount, :remaining_qty
        )
      `, {
        pre_order_id,
        product_id: product.product_id,
        product_name: product.product_name,
        category_name: product.category_name,
        qty: product.qty,
        unit: product.unit,
        price: product.price,
        discount: product.discount || 0,
        amount,
        remaining_qty: product.qty
      });
    }

    // Record deposit payment if any
    if (deposit > 0) {
      await db.query(`
        INSERT INTO pre_order_payment (
          pre_order_id, payment_date, amount,
          payment_method, payment_type, notes, created_by
        ) VALUES (
          :pre_order_id, NOW(), :amount,
          :payment_method, 'deposit', 'ប្រាក់កក់', :created_by
        )
      `, {
        pre_order_id,
        amount: deposit,
        payment_method: payment_method || 'cash',
        created_by: req.auth?.id
      });
    }

    // ✅✅✅ SEND TELEGRAM NOTIFICATION (NON-BLOCKING) ✅✅✅
    setImmediate(async () => {
      try {
        console.log('📤 Sending Pre-Order Telegram notification...');

        // ✅ Format product details with correct calculation
        const productDetails = productsWithDetails.slice(0, 5).map((item, index) => {
          const qty = parseFloat(item.qty || 0);
          const price = parseFloat(item.price || 0);
          const discount = parseFloat(item.discount || 0);
          const actualPrice = parseFloat(item.actual_price || price);
          const discountAmount = (qty * price * discount) / 100;
          const amount = item.calculated_amount;

          return `
🔄 ${index + 1}. <b>${item.product_name}</b>
• ប្រភេទ: ${item.category_name || 'N/A'}
• ចំនួន: ${formatNumber(qty)} ${item.unit || 'L'}
• តម្លៃ: $${formatNumber(price)}/${item.unit || 'L'}
${discount > 0 ? `• បញ្ចុះតម្លៃ: ${discount}% (-$${formatNumber(discountAmount)})` : ''}• តម្លៃអាហ្វិក (Actual): $${formatNumber(actualPrice)}
• សរុប: $${formatNumber(amount)}`;
        }).join('\n\n');

        const remaining_products = productsWithDetails.length > 5 
          ? `\n\n<i>... និង ${productsWithDetails.length - 5} ផលិតផលផ្សេងទៀត</i>` 
          : '';

        const totalQty = productsWithDetails.reduce((sum, i) => sum + parseFloat(i.qty || 0), 0);

        // Payment status emoji
        const paymentEmoji = {
          'paid': '✅',
          'partial': '⚠️',
          'unpaid': '⏳'
        };

        const paymentText = {
          'paid': 'បានបង់ពេញ / Fully Paid',
          'partial': 'បានបង់ដំបូង / Partial Payment',
          'unpaid': 'មិនទាន់បង់ / Unpaid'
        };

        const telegramMessage = `
📝 <b>កម្មង់ទុកថ្មី / New Pre-Order</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 <b>Order Info:</b>
• លេខកម្មង់: <code>${pre_order_no}</code>
• ស្ថានភាពបង់ប្រាក់: ${paymentEmoji[payment_status]} <b>${paymentText[payment_status]}</b>
• កាលបរិច្ឆេទបង្កើត: ${today}
${delivery_date ? `• កាលបរិច្ឆេទដឹកជញ្ជូន: ${delivery_date}${delivery_time ? ` ${delivery_time}` : ''}` : ''}

👤 <b>Customer Information:</b>
• ឈ្មោះ: ${customer[0].name}
• លេខទូរស័ព្ទ: ${customer[0].tel}
${customer[0].id_card_number ? `• លេខអត្តសញ្ញាណបណ្ណ: ${customer[0].id_card_number}` : ''}${delivery_address ? `• អាសយដ្ឋាន: ${delivery_address}` : customer[0].address ? `• អាសយដ្ឋាន: ${customer[0].address}` : ''}

📍 <b>Branch:</b>
• សាខា: ${branch_name}
• បង្កើតដោយ: ${user_name}

━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 <b>PRODUCT DETAILS (${productsWithDetails.length} items)</b>
${productDetails}${remaining_products}

━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 <b>SUMMARY:</b>
• ផលិតផលសរុប: ${productsWithDetails.length} items
• បរិមាណសរុប: ${formatNumber(totalQty)} L

💰 <b>PAYMENT DETAILS:</b>
• តម្លៃសរុប: $${formatNumber(total_amount)}
${deposit > 0 ? `• ប្រាក់កក់: $${formatNumber(deposit)}\n• នៅសល់: $${formatNumber(remaining)}` : '• មិនទាន់បង់ប្រាក់កក់'}

${special_instructions ? `📝 <b>Special Instructions:</b>\n${special_instructions}\n` : ''}⏰ <b>Created at:</b> ${new Date().toLocaleString('en-US', {
          timeZone: 'Asia/Phnom_Penh',
          dateStyle: 'medium',
          timeStyle: 'short'
        })}
━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

        const notificationResult = await sendSmartNotification({
          event_type: 'pre_order_created', // Pre-orders use order_created event
          branch_name: branch_name,
          message: telegramMessage,
          severity: 'normal'
        });

        if (notificationResult.success) {
          console.log('✅ Pre-Order Telegram notification sent!');
          console.log(`📊 Sent to ${notificationResult.recipients_count} recipients`);
        } else {
          console.log('⚠️ Pre-Order notification not sent:', notificationResult.reason);
        }

      } catch (notifError) {
        console.error('❌ Pre-Order Telegram error:', notifError);
      }
    });

    res.status(201).json({
      success: true,
      message: "Pre-order created successfully",
      message_kh: "បង្កើតកម្មង់ទុកបានជោគជ័យ",
      data: {
        id: pre_order_id,
        pre_order_no,
        total_amount,
        deposit_amount: deposit,
        remaining_amount: remaining,
        payment_status
      }
    });

  } catch (error) {
    logError("pre_order.createPreOrder", error, res);
  }
};
exports.deductPreOrderQty = async (req, res) => {
    try {
        const { pre_order_id, delivered_items } = req.body;

        if (!pre_order_id || !delivered_items || !Array.isArray(delivered_items)) {
            return res.status(400).json({
                success: false,
                message: "pre_order_id and delivered_items array required"
            });
        }

        for (const item of delivered_items) {
            await db.query(`
        UPDATE pre_order_detail
        SET remaining_qty = remaining_qty - :qty,
            delivered_qty = delivered_qty + :qty,
            updated_at = NOW()
        WHERE pre_order_id = :pre_order_id
          AND product_id = :product_id
          AND remaining_qty >= :qty
      `, {
                pre_order_id,
                product_id: item.product_id,
                qty: item.qty
            });
        }

        const [remainingItems] = await db.query(`
      SELECT COUNT(*) as has_remaining
      FROM pre_order_detail
      WHERE pre_order_id = :pre_order_id
        AND remaining_qty > 0
    `, { pre_order_id });

        if (remainingItems[0].has_remaining === 0) {
            await db.query(`
        UPDATE pre_order
        SET status = 'delivered',
            updated_at = NOW()
        WHERE id = :pre_order_id
      `, { pre_order_id });
        } else {
            await db.query(`
        UPDATE pre_order
        SET status = 'partially_delivered',
            updated_at = NOW()
        WHERE id = :pre_order_id
      `, { pre_order_id });
        }

        res.json({
            success: true,
            message: "Pre-order quantities updated successfully",
            fully_delivered: remainingItems[0].has_remaining === 0
        });

    } catch (error) {
        logError("pre_order.deductPreOrderQty", error, res);
    }
};

exports.getPreOrderList = async (req, res) => {
    try {
        const { status, customer_id, from_date, to_date } = req.query;

        let sql = `
          SELECT
            po.*,
            (SELECT COUNT(*) FROM pre_order_detail WHERE pre_order_id = po.id) as item_count,
            (SELECT GROUP_CONCAT(product_name SEPARATOR ', ') FROM pre_order_detail WHERE pre_order_id = po.id) as products_display,
            (SELECT SUM(qty) FROM pre_order_detail WHERE pre_order_id = po.id) as total_qty,
            (SELECT price FROM pre_order_detail WHERE pre_order_id = po.id LIMIT 1) as first_price
          FROM pre_order po
          WHERE 1=1
        `;

        const params = {};

        if (status) {
            sql += ` AND po.status = :status`;
            params.status = status;
        }

        if (customer_id) {
            sql += ` AND po.customer_id = :customer_id`;
            params.customer_id = customer_id;
        }

        if (from_date) {
            sql += ` AND po.order_date >= :from_date`;
            params.from_date = from_date;
        }

        if (to_date) {
            sql += ` AND po.order_date <= :to_date`;
            params.to_date = to_date;
        }

        sql += ` ORDER BY po.created_at DESC`;

        const [list] = await db.query(sql, params);

        res.json({
            success: true,
            list
        });

    } catch (error) {
        logError("pre_order.getPreOrderList", error, res);
    }
};

exports.getPreOrderById = async (req, res) => {
    try {
        const { id } = req.params;

        const [preOrder] = await db.query(
            "SELECT * FROM pre_order WHERE id = :id",
            { id }
        );

        if (preOrder.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Pre-order not found"
            });
        }

        const [details] = await db.query(
            `SELECT 
                pod.*, 
                p.actual_price as product_actual_price,
                p.category_id,
                p.qty as available_qty,
                c.actual_price as category_actual_price,
                c.name as category_name
             FROM pre_order_detail pod 
             LEFT JOIN product p ON pod.product_id = p.id 
             LEFT JOIN category c ON p.category_id = c.id
             WHERE pod.pre_order_id = :id`,
            { id }
        );

        const [payments] = await db.query(
            "SELECT * FROM pre_order_payment WHERE pre_order_id = :id ORDER BY payment_date DESC",
            { id }
        );

        const processedDetails = details.map(detail => {
            let actual_price = 1000;

            if (detail.product_actual_price && detail.product_actual_price > 0) {
                actual_price = parseFloat(detail.product_actual_price);
            } else if (detail.category_actual_price && detail.category_actual_price > 0) {
                actual_price = parseFloat(detail.category_actual_price);
            }

            return {
                ...detail,
                actual_price: actual_price
            };
        });

        res.json({
            success: true,
            data: {
                ...preOrder[0],
                details: processedDetails,
                payments
            }
        });

    } catch (error) {
        logError("pre_order.getPreOrderById", error, res);
    }
};
exports.convertToOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const [preOrder] = await db.query(
            "SELECT * FROM pre_order WHERE id = :id AND status IN ('confirmed', 'ready')",
            { id }
        );

        if (preOrder.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Pre-order not found or not ready to convert"
            });
        }

        const [details] = await db.query(
            "SELECT * FROM pre_order_detail WHERE pre_order_id = :id",
            { id }
        );

        res.json({
            success: true,
            message: "Pre-order data ready for POS",
            data: {
                pre_order_id: id,
                pre_order_no: preOrder[0].pre_order_no,
                customer_id: preOrder[0].customer_id,
                customer_name: preOrder[0].customer_name,
                customer_tel: preOrder[0].customer_tel,
                products: details.map(d => ({
                    product_id: d.product_id,
                    product_name: d.product_name,
                    qty: d.remaining_qty,
                    price: d.price,
                    discount: d.discount,
                    description: d.description
                })),
                total_amount: preOrder[0].remaining_amount || preOrder[0].total_amount
            }
        });

    } catch (error) {
        logError("pre_order.convertToOrder", error, res);
    }
};
exports.updateStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const validStatuses = ['pending', 'confirmed', 'in_progress', 'ready', 'delivered', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid status"
            });
        }

        const adminRoles = [1, 29];
        const userRoleId = req.auth?.role_id;

        if (['confirmed', 'ready'].includes(status) && !adminRoles.includes(userRoleId)) {
            return res.status(403).json({
                success: false,
                message: "Only Administrators can approve this status",
                message_kh: "មានតែអ្នកគ្រប់គ្រងប៉ុណ្ណោះដែលអាចបញ្ជាក់បាន"
            });
        }

        if (status === 'ready') {
            const [details] = await db.query(`
                SELECT pod.product_id, pod.remaining_qty, p.name, p.qty as available_qty
                FROM pre_order_detail pod
                INNER JOIN product p ON pod.product_id = p.id
                WHERE pod.pre_order_id = :id
            `, { id });

            for (const item of details) {
                const required = Number(item.remaining_qty || 0);
                const available = Number(item.available_qty || 0);
                if (required > available) {
                    return res.status(400).json({
                        success: false,
                        message: `ស្តុកមិនគ្រប់គ្រាន់សម្រាប់ ${item.name} (មានតែ ${available.toLocaleString()}L ប៉ុណ្ណោះ)`,
                        error_code: "INSUFFICIENT_STOCK"
                    });
                }
            }
        }

        await db.query(`
      UPDATE pre_order SET
        status = :status,
        notes = CONCAT(IFNULL(notes, ''), '\n', :new_notes),
        updated_at = NOW()
      WHERE id = :id
    `, {
            id,
            status,
            new_notes: notes || `Status changed to ${status}`
        });

        res.json({
            success: true,
            message: "Status updated successfully"
        });

    } catch (error) {
        logError("pre_order.updateStatus", error, res);
    }
};

exports.updatePreOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      delivery_date,
      delivery_time,
      delivery_address,
      special_instructions,
      products,
      deposit_amount
    } = req.body;

    // ✅ Verify pre-order exists and is still pending
    const [existing] = await db.query(
      "SELECT status, total_amount FROM pre_order WHERE id = :id",
      { id }
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pre-order not found",
        message_kh: "រកមិនឃើញកម្មង់"
      });
    }

    if (existing[0].status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: "Only pending orders can be edited",
        message_kh: "អាចកែបានតែកម្មង់ដែលកំពុងរង់ចាំប៉ុណ្ណោះ"
      });
    }

    // ✅ Recalculate total if products changed
    let total_amount = existing[0].total_amount;

    if (products && products.length > 0) {
      total_amount = 0;

      // Delete old details
      await db.query(
        "DELETE FROM pre_order_detail WHERE pre_order_id = :id",
        { id }
      );

      // Insert new details
      for (const product of products) {
        // Get product info
        const [productInfo] = await db.query(`
          SELECT p.id, p.name, p.unit, p.actual_price, c.name as category_name
          FROM product p
          LEFT JOIN category c ON p.category_id = c.id
          WHERE p.id = :product_id
        `, { product_id: product.product_id });

        if (productInfo.length === 0) {
          console.log(`⚠️ Product ${product.product_id} not found, skipping...`);
          continue;
        }

        const actual_price = parseFloat(productInfo[0].actual_price || product.price || 1000);
        const discount = parseFloat(product.discount || 0) / 100;
        const qty = parseFloat(product.qty || 0);
        const price = parseFloat(product.price || 0);

        // ✅ CORRECT FORMULA: (qty × price × (1 - discount)) ÷ actual_price
        const amount = (qty * price * (1 - discount)) / actual_price;
        total_amount += amount;

        // ✅ FIXED: Insert WITHOUT 'description' column
        await db.query(`
          INSERT INTO pre_order_detail (
            pre_order_id,
            product_id,
            product_name,
            category_name,
            qty,
            unit,
            price,
            discount,
            amount,
            remaining_qty
          ) VALUES (
            :pre_order_id,
            :product_id,
            :product_name,
            :category_name,
            :qty,
            :unit,
            :price,
            :discount,
            :amount,
            :remaining_qty
          )
        `, {
          pre_order_id: id,
          product_id: product.product_id,
          product_name: productInfo[0].name,
          category_name: productInfo[0].category_name || 'N/A',
          qty: qty,
          unit: productInfo[0].unit || 'L',
          price: price,
          discount: product.discount || 0,
          amount: amount,
          remaining_qty: qty
          // ✅ NO 'description' field
        });

        console.log(`✅ Inserted product: ${productInfo[0].name}, amount: $${amount.toFixed(2)}`);
      }
    }

    // Calculate payment status
    const deposit = parseFloat(deposit_amount || 0);
    const remaining = total_amount - deposit;
    let payment_status = 'unpaid';

    if (deposit === 0) {
      payment_status = 'unpaid';
    } else if (deposit >= total_amount) {
      payment_status = 'paid';
    } else {
      payment_status = 'partial';
    }

    // ✅ Update pre_order table
    await db.query(`
      UPDATE pre_order SET
        delivery_date = :delivery_date,
        delivery_time = :delivery_time,
        delivery_address = :delivery_address,
        special_instructions = :special_instructions,
        total_amount = :total_amount,
        deposit_amount = :deposit_amount,
        remaining_amount = :remaining_amount,
        payment_status = :payment_status,
        updated_at = NOW()
      WHERE id = :id
    `, {
      id,
      delivery_date: delivery_date || null,
      delivery_time: delivery_time || null,
      delivery_address: delivery_address || null,
      special_instructions: special_instructions || null,
      total_amount: total_amount,
      deposit_amount: deposit,
      remaining_amount: remaining > 0 ? remaining : 0,
      payment_status: payment_status
    });

    console.log('✅ Pre-order updated successfully:', {
      id,
      total_amount,
      deposit,
      remaining,
      payment_status
    });

    res.json({
      success: true,
      message: "Pre-order updated successfully",
      message_kh: "បានកែប្រែកម្មង់ជោគជ័យ",
      data: {
        id,
        total_amount,
        deposit_amount: deposit,
        remaining_amount: remaining > 0 ? remaining : 0,
        payment_status
      }
    });

  } catch (error) {
    console.error('❌ Error in updatePreOrder:', error);
    logError("pre_order.updatePreOrder", error, res);
  }
};
exports.deletePreOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.query("SELECT status FROM pre_order WHERE id = :id", { id });
        if (existing.length === 0) return res.status(404).json({ success: false, message: "Not found" });
        if (!['pending', 'cancelled'].includes(existing[0].status)) {
            return res.status(400).json({ success: false, message: "Cannot delete active pre-orders" });
        }

        await db.query("DELETE FROM pre_order_detail WHERE pre_order_id = :id", { id });
        await db.query("DELETE FROM pre_order_payment WHERE pre_order_id = :id", { id });
        await db.query("DELETE FROM pre_order WHERE id = :id", { id });

        res.json({ success: true, message: "Pre-order deleted successfully" });
    } catch (error) {
        logError("pre_order.deletePreOrder", error, res);
    }
};


exports.addPayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, payment_method, payment_type, reference_no, notes } = req.body;

        // Get current pre-order
        const [preOrder] = await db.query(
            "SELECT * FROM pre_order WHERE id = :id",
            { id }
        );

        if (preOrder.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Pre-order not found"
            });
        }

        const order = preOrder[0];
        const new_deposit = parseFloat(order.deposit_amount) + parseFloat(amount);
        const new_remaining = parseFloat(order.total_amount) - new_deposit;

        let payment_status = 'partial';
        if (new_remaining <= 0) {
            payment_status = 'paid';
        } else if (new_deposit === 0) {
            payment_status = 'unpaid';
        }

        // Insert payment record
        await db.query(`
      INSERT INTO pre_order_payment (
        pre_order_id, payment_date, amount,
        payment_method, payment_type, reference_no, notes, created_by
      ) VALUES (
        :pre_order_id, NOW(), :amount,
        :payment_method, :payment_type, :reference_no, :notes, :created_by
      )
    `, {
            pre_order_id: id,
            amount,
            payment_method,
            payment_type,
            reference_no: reference_no || null,
            notes: notes || null,
            created_by: req.auth?.id
        });

        // Update pre-order
        await db.query(`
      UPDATE pre_order SET
        deposit_amount = :deposit_amount,
        remaining_amount = :remaining_amount,
        payment_status = :payment_status,
        updated_at = NOW()
      WHERE id = :id
    `, {
            id,
            deposit_amount: new_deposit,
            remaining_amount: new_remaining > 0 ? new_remaining : 0,
            payment_status
        });

        res.json({
            success: true,
            message: "Payment added successfully",
            data: {
                deposit_amount: new_deposit,
                remaining_amount: new_remaining > 0 ? new_remaining : 0,
                payment_status
            }
        });

    } catch (error) {
        logError("pre_order.addPayment", error, res);
    }
};

module.exports = exports;