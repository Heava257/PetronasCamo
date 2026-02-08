// ✅ UPDATED pre_order.controller.js - 3-Stage Workflow Support
// Stage 1: Initial Order Creation
// Stage 2: Delivery Recording (from POS/Invoice)
// Stage 3: Auto-calculated Remaining Quantities

const { db, logError } = require("../util/helper");
const dayjs = require('dayjs');
const { sendSmartNotification } = require("../util/Telegram.helpe");

const formatNumber = (num) => {
  return parseFloat(num || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// ========================================
// STAGE 1: CREATE PRE-ORDER (Initial Order)
// ========================================
exports.createPreOrder = async (req, res) => {
  try {
    const {
      pre_order_no,
      customer_id,
      delivery_date,
      delivery_time,
      delivery_address,
      special_instructions,
      products,
      deposit_amount,
      payment_method,
      location_name
    } = req.body;

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

    // Check if pre_order_no already exists
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

    const [userInfo] = await db.query(
      "SELECT id, name, branch_name FROM user WHERE id = :user_id",
      { user_id: req.auth?.id || 1 }
    );

    const branch_name = userInfo[0]?.branch_name || 'Unknown Branch';
    const user_name = userInfo[0]?.name || 'Unknown User';

    // Calculate total amount
    let total_amount = 0;
    const productsWithDetails = [];

    for (const product of products) {
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
        payment_status, status, created_by, location_name, created_at
      ) VALUES (
        :pre_order_no, :customer_id, :customer_name, :customer_tel,
        :order_date, :delivery_date, :delivery_time,
        :delivery_address, :special_instructions,
        :total_amount, :deposit_amount, :remaining_amount,
        :payment_status, :status, :created_by, :location_name, NOW()
      )
    `;

    const deposit = parseFloat(deposit_amount || 0);
    const remaining = total_amount - deposit;
    const payment_status = deposit === 0 ? 'unpaid' : deposit >= total_amount ? 'paid' : 'partial';
    const status_value = req.body.status || 'pending';
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
      status: status_value,
      created_by: req.auth?.id,
      location_name: location_name || null
    });

    const pre_order_id = resultPreOrder.insertId;

    // ✅ Insert pre-order details with remaining_qty = qty initially
    for (const product of productsWithDetails) {
      const discount_value = parseFloat(product.discount || 0) / 100;
      const amount = (product.qty * product.price * (1 - discount_value)) / product.actual_price;

      await db.query(`
        INSERT INTO pre_order_detail (
          pre_order_id, product_id, product_name, category_name,
          qty, unit, price, discount, amount, 
          delivered_qty, remaining_qty, destination
        ) VALUES (
          :pre_order_id, :product_id, :product_name, :category_name,
          :qty, :unit, :price, :discount, :amount,
          0, :qty, :destination
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
        destination: product.destination || null
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

    // Send Telegram notification
    setImmediate(async () => {
      try {
        const productDetails = productsWithDetails.slice(0, 5).map((item, index) => {
          const qty = parseFloat(item.qty || 0);
          const price = parseFloat(item.price || 0);
          const discount = parseFloat(item.discount || 0);
          const actualPrice = parseFloat(item.actual_price || price);
          const amount = item.calculated_amount;

          return `
🔄 ${index + 1}. <b>${item.product_name}</b>
• ប្រភេទ: ${item.category_name || 'N/A'}
• ចំនួន: ${formatNumber(qty)} ${item.unit || 'L'}
• តម្លៃ: $${formatNumber(price)}/${item.unit || 'L'}
${discount > 0 ? `• បញ្ចុះតម្លៃ: ${discount}%` : ''}• តម្លៃអាហ្វិក: $${formatNumber(actualPrice)}
• សរុប: $${formatNumber(amount)}
${item.destination ? `• គោលដៅ: ${item.destination}` : ''}`;
        }).join('\n\n');

        const telegramMessage = `
📝 <b>កម្មង់ទុកថ្មី / New Pre-Order</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 <b>Order Info:</b>
• លេខកម្មង់: <code>${pre_order_no}</code>
• កាលបរិច្ឆេទបង្កើត: ${today}
${delivery_date ? `• កាលបរិច្ឆេទដឹកជញ្ជូន: ${delivery_date}` : ''}

👤 <b>Customer:</b>
• ឈ្មោះ: ${customer[0].name}
• លេខទូរស័ព្ទ: ${customer[0].tel}
${delivery_address ? `• អាសយដ្ឋាន: ${delivery_address}` : ''}

📍 <b>Branch:</b> ${branch_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 <b>PRODUCT DETAILS:</b>
${productDetails}

━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 តម្លៃសរុប: $${formatNumber(total_amount)}
⏰ Created: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })}
`;

        await sendSmartNotification({
          event_type: 'order_created',
          branch_name: branch_name,
          title: `🔖 Pre-Order Created: ${pre_order_no}`,
          message: telegramMessage,
          severity: 'normal'
        });
      } catch (notifError) {
        console.error('❌ Telegram notification error:', notifError);
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

// ========================================
// STAGE 2: RECORD DELIVERY (from POS/Invoice)
// ========================================
exports.recordDelivery = async (req, res) => {
  try {
    const { pre_order_id, invoice_id, deliveries, notes } = req.body;
    // deliveries = [{pre_order_detail_id, delivered_qty, destination}]

    if (!pre_order_id || !deliveries || !Array.isArray(deliveries)) {
      return res.status(400).json({
        success: false,
        message: "pre_order_id and deliveries array required"
      });
    }

    // Validate pre-order exists
    const [preOrder] = await db.query(
      "SELECT id, pre_order_no, status FROM pre_order WHERE id = :id",
      { id: pre_order_id }
    );

    if (preOrder.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pre-order not found"
      });
    }

    // Record each delivery
    for (const delivery of deliveries) {
      const { pre_order_detail_id, delivered_qty, destination } = delivery;

      if (!pre_order_detail_id || !delivered_qty || delivered_qty <= 0) {
        continue;
      }

      // Check remaining quantity
      const [detail] = await db.query(
        "SELECT remaining_qty, product_id FROM pre_order_detail WHERE id = :id",
        { id: pre_order_detail_id }
      );

      if (detail.length === 0) {
        continue;
      }

      const remaining = parseFloat(detail[0].remaining_qty || 0);
      if (delivered_qty > remaining) {
        return res.status(400).json({
          success: false,
          message: `Cannot deliver ${delivered_qty}L - only ${remaining}L remaining`
        });
      }

      // 1. Insert delivery record
      await db.query(`
        INSERT INTO pre_order_delivery (
          pre_order_id, pre_order_detail_id, invoice_id,
          delivered_qty, delivery_date, destination, notes, created_by
        ) VALUES (
          :pre_order_id, :pre_order_detail_id, :invoice_id,
          :delivered_qty, NOW(), :destination, :notes, :created_by
        )
      `, {
        pre_order_id,
        pre_order_detail_id,
        invoice_id: invoice_id || null,
        delivered_qty,
        destination: destination || null,
        notes: notes || null,
        created_by: req.auth?.id
      });

      // 2. Update pre_order_detail (Subtract remaining, add delivered)
      await db.query(`
        UPDATE pre_order_detail 
        SET 
          remaining_qty = remaining_qty - :delivered_qty,
          delivered_qty = delivered_qty + :delivered_qty
        WHERE id = :id
      `, {
        delivered_qty,
        id: pre_order_detail_id
      });
    }

    // 3. Update Pre-Order status and last delivery date
    await db.query(`
      UPDATE pre_order 
      SET actual_delivery_date = NOW(),
          updated_at = NOW()
      WHERE id = :id
    `, { id: pre_order_id });

    // Check if fully delivered
    const [stats] = await db.query(`
      SELECT SUM(remaining_qty) as total_remaining
      FROM pre_order_detail
      WHERE pre_order_id = :pre_order_id
    `, { pre_order_id });

    if (stats.length > 0 && parseFloat(stats[0].total_remaining || 0) <= 0.01) {
      await db.query(`
        UPDATE pre_order SET status = 'delivered' WHERE id = :id
      `, { id: pre_order_id });
    }

    res.json({
      success: true,
      message: "Delivery recorded successfully",
      message_kh: "បានកត់ត្រាការដឹកជញ្ជូនជោគជ័យ"
    });

  } catch (error) {
    logError("pre_order.recordDelivery", error, res);
  }
};

// ========================================
// GET PRE-ORDER LIST (with 3-stage data)
// ========================================
exports.getPreOrderList = async (req, res) => {
  try {
    const { status, customer_id, from_date, to_date } = req.query;
    const user_id = req.auth?.id;

    const [currentUser] = await db.query(
      "SELECT role_id, branch_name FROM user WHERE id = :user_id",
      { user_id }
    );

    if (!currentUser || currentUser.length === 0) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    const { role_id, branch_name } = currentUser[0];
    const isSuperAdmin = role_id === 29;

    let sql = `
      SELECT
        po.*,
        DATE_FORMAT(po.actual_delivery_date, '%Y-%m-%d %H:%i:%s') as actual_delivery_date_formatted,
        (SELECT COUNT(*) FROM pre_order_detail WHERE pre_order_id = po.id) as item_count,
        u_creator.branch_name as creator_branch,
        u_confirmed.name as confirmed_by_name
      FROM pre_order po
      LEFT JOIN user u_creator ON po.created_by = u_creator.id
      LEFT JOIN user u_confirmed ON po.confirmed_by = u_confirmed.id
      WHERE 1=1
    `;

    const params = {};

    if (!isSuperAdmin) {
      sql += ` AND u_creator.branch_name = :branch_name`;
      params.branch_name = branch_name;
    }

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

    // ✅ Fetch details with 3-stage data
    if (list.length > 0) {
      const ids = list.map(item => item.id);

      const [details] = await db.query(`
        SELECT 
          pod.pre_order_id,
          pod.qty,
          pod.delivered_qty,
          pod.remaining_qty,
          pod.price,
          pod.amount,
          pod.destination,
          COALESCE(pod.product_name, p.name) as product_name,
          COALESCE(pod.category_name, c.name) as category_name,
          COALESCE(p.actual_price, 1) as actual_price
        FROM pre_order_detail pod
        LEFT JOIN product p ON pod.product_id = p.id
        LEFT JOIN category c ON p.category_id = c.id
        WHERE pod.pre_order_id IN (:ids)
      `, { ids });

      const detailsMap = {};
      for (const d of details) {
        if (!detailsMap[d.pre_order_id]) {
          detailsMap[d.pre_order_id] = [];
        }
        const pName = (d.product_name || "").toLowerCase();
        const cName = (d.category_name || "").toLowerCase();
        const search = ` ${pName} ${cName} `.replace(/\s+/g, ' '); // Pad with spaces for better matching

        let fuel_type = 'other';

        // 1. Extra Keywords (Premium/95/Red) - Move 'super' and 'ស៊ុបពែរ' here
        if (search.includes('extra') || search.includes('95') || search.includes('red') || search.includes('super') || search.includes('ស៊ុបពែរ') || search.includes('អិចត្រា') || search.includes('ក្រហម') || search.includes('gold')) {
          fuel_type = 'extra';
        }
        // 2. Super Keywords (Regular/92/Green) - Usually matches 'gasoline' or 'សាំង'
        else if (search.includes('92') || search.includes('regular') || search.includes('gasoline') || search.includes('សាំង') || search.includes('green') || search.includes('ខៀវ') || search.includes('បៃតង') || search.includes('បេងហ្សាំង')) {
          fuel_type = 'super';
        }
        // 3. Diesel Keywords (DDO/Euro-5)
        else if (search.includes('diesel') || search.includes('ddo') || search.includes('euro') || search.includes('ម៉ាស៊ូត') || search.includes('ឌីហ្សែល')) {
          fuel_type = 'diesel';
        }
        // 4. LPG Keywords (Gas)
        else if (search.includes('lpg') || search.includes('gas') || search.includes('ហ្គាស') || search.includes('ហ្កាស') || search.includes('ហ្គាស់') || search.includes('ហ្គាស៊') || search.includes('ហ្គាស៍') || search.includes('ហ្គាស៌')) {
          fuel_type = 'lpg';
        }

        detailsMap[d.pre_order_id].push({
          product_name: d.product_name,
          category_name: d.category_name,
          fuel_type,
          qty: d.qty,
          delivered_qty: d.delivered_qty,
          remaining_qty: d.remaining_qty,
          price: d.price,
          amount: d.amount,
          actual_price: d.actual_price,
          destination: d.destination
        });
      }

      for (const item of list) {
        item.details_json = detailsMap[item.id] || [];
      }
    }

    res.json({
      success: true,
      list,
      user_context: {
        role_id,
        branch: branch_name,
        is_super_admin: isSuperAdmin
      }
    });

  } catch (error) {
    logError("pre_order.getPreOrderList", error, res);
  }
};

// ========================================
// GET PRE-ORDER BY ID
// ========================================
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
        c.name as category_name
      FROM pre_order_detail pod 
      LEFT JOIN product p ON pod.product_id = p.id 
      LEFT JOIN category c ON p.category_id = c.id
      WHERE pod.pre_order_id = :id`,
      { id }
    );

    const [deliveries] = await db.query(
      `SELECT 
        d.*,
        u.name as delivered_by_name
      FROM pre_order_delivery d
      LEFT JOIN user u ON d.created_by = u.id
      WHERE d.pre_order_id = :id
      ORDER BY d.delivery_date DESC`,
      { id }
    );

    const [payments] = await db.query(
      "SELECT * FROM pre_order_payment WHERE pre_order_id = :id ORDER BY payment_date DESC",
      { id }
    );

    res.json({
      success: true,
      data: {
        ...preOrder[0],
        details,
        deliveries,
        payments
      }
    });

  } catch (error) {
    logError("pre_order.getPreOrderById", error, res);
  }
};

// ========================================
// UPDATE STATUS
// ========================================
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

    let sql = `
      UPDATE pre_order SET
        status = :status,
        notes = CONCAT(IFNULL(notes, ''), '\n', :new_notes),
        updated_at = NOW()
    `;

    const params = {
      id,
      status,
      new_notes: notes || `Status changed to ${status}`
    };

    if (status === 'confirmed') {
      sql = `
        UPDATE pre_order SET
          status = :status,
          confirmed_by = :confirmed_by,
          notes = CONCAT(IFNULL(notes, ''), '\n', :new_notes),
          updated_at = NOW()
      `;
      params.confirmed_by = req.auth?.id;
    }

    sql += ` WHERE id = :id`;

    await db.query(sql, params);

    res.json({
      success: true,
      message: "Status updated successfully"
    });

  } catch (error) {
    logError("pre_order.updateStatus", error, res);
  }
};

// ========================================
// UPDATE PRE-ORDER
// ========================================
exports.updatePreOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      delivery_date,
      delivery_time,
      delivery_address,
      special_instructions,
      products,
      deposit_amount,
      location_name
    } = req.body;

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

    if (!['pending', 'confirmed'].includes(existing[0].status)) {
      return res.status(400).json({
        success: false,
        message: "Only pending or confirmed orders can be edited",
        message_kh: "អាចកែបានតែកម្មង់ដែលកំពុងរង់ចាំឬបញ្ជាក់រួចប៉ុណ្ណោះ"
      });
    }

    let total_amount = existing[0].total_amount;

    if (products && products.length > 0) {
      total_amount = 0;

      await db.query(
        "DELETE FROM pre_order_detail WHERE pre_order_id = :id",
        { id }
      );

      for (const product of products) {
        const [productInfo] = await db.query(`
          SELECT p.id, p.name, p.unit, p.actual_price, c.name as category_name
          FROM product p
          LEFT JOIN category c ON p.category_id = c.id
          WHERE p.id = :product_id
        `, { product_id: product.product_id });

        if (productInfo.length === 0) continue;

        const actual_price = parseFloat(productInfo[0].actual_price || product.price || 1000);
        const discount = parseFloat(product.discount || 0) / 100;
        const qty = parseFloat(product.qty || 0);
        const price = parseFloat(product.price || 0);

        const amount = (qty * price * (1 - discount)) / actual_price;
        total_amount += amount;

        await db.query(`
          INSERT INTO pre_order_detail (
            pre_order_id, product_id, product_name, category_name,
            qty, unit, price, discount, amount,
            delivered_qty, remaining_qty, destination
          ) VALUES (
            :pre_order_id, :product_id, :product_name, :category_name,
            :qty, :unit, :price, :discount, :amount,
            0, :qty, :destination
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
          destination: product.destination || null
        });
      }
    }

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
        location_name = :location_name,
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
      payment_status: payment_status,
      location_name: location_name || null
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
    logError("pre_order.updatePreOrder", error, res);
  }
};

// ========================================
// DELETE PRE-ORDER
// ========================================
exports.deletePreOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query("SELECT status FROM pre_order WHERE id = :id", { id });
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Not found" });
    }

    if (!['pending', 'cancelled'].includes(existing[0].status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete active pre-orders",
        message_kh: "មិនអាចលុបកម្មង់ដែលកំពុងដំណើរការ"
      });
    }

    await db.query("DELETE FROM pre_order_delivery WHERE pre_order_id = :id", { id });
    await db.query("DELETE FROM pre_order_detail WHERE pre_order_id = :id", { id });
    await db.query("DELETE FROM pre_order_payment WHERE pre_order_id = :id", { id });
    await db.query("DELETE FROM pre_order WHERE id = :id", { id });

    res.json({
      success: true,
      message: "Pre-order deleted successfully",
      message_kh: "បានលុបកម្មង់ជោគជ័យ"
    });
  } catch (error) {
    logError("pre_order.deletePreOrder", error, res);
  }
};

// ========================================
// HELPER: Check Duplicate PO Number
// ========================================
exports.checkDuplicate = async (req, res) => {
  try {
    const { no, exclude_id } = req.query;
    if (!no) {
      return res.json({ exists: false });
    }

    let sql = "SELECT id FROM pre_order WHERE pre_order_no = :no";
    const params = { no };

    if (exclude_id) {
      sql += " AND id != :exclude_id";
      params.exclude_id = exclude_id;
    }

    const [existing] = await db.query(sql, params);

    res.json({
      exists: existing.length > 0
    });
  } catch (error) {
    logError("pre_order.checkDuplicate", error, res);
  }
};

// ========================================
// ADD PAYMENT
// ========================================
exports.addPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_method, payment_type, reference_no, notes } = req.body;

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