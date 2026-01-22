const { db, isArray, isEmpty, logError } = require("../util/helper");
const { sendSmartNotification } = require("../util/Telegram.helpe");
const formatNumber = (num) => {
  return parseFloat(num || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

exports.getList = async (req, res) => {
  try {
    const { txtSearch } = req.query;

    let sql = `
      SELECT 
        p.*,
        s.name AS supplier_name,
        s.code AS supplier_code,
        u.name AS created_by_name,
        u.branch_name
      FROM purchase p
      LEFT JOIN supplier s ON p.supplier_id = s.id
      LEFT JOIN user u ON p.user_id = u.id
      WHERE 1=1
    `;

    const params = {};

    // 🔐 Branch filter for non-super admin (user table has branch_name)
    if (req.auth?.role !== "admin") {
      sql += ` AND u.branch_name = :branch_name`;
      params.branch_name = req.auth?.branch_name;
    }

    // Search filter
    if (txtSearch && txtSearch.trim() !== "") {
      sql += ` AND (
        p.order_no LIKE :search OR 
        s.name LIKE :search OR 
        p.status LIKE :search
      )`;
      params.search = `%${txtSearch.trim()}%`;
    }

    sql += ` ORDER BY p.created_at DESC`;

    const [results] = await db.query(sql, params);

    // Parse JSON items for each purchase
    const list = results.map(purchase => ({
      ...purchase,
      items: purchase.items ? JSON.parse(purchase.items) : []
    }));

    res.json({
      list,
      success: true,
      message: "Purchase orders retrieved successfully"
    });

  } catch (error) {
    logError("purchase.getList", error, res);
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    let sql = `
      SELECT 
        p.*,
        s.name AS supplier_name,
        s.code AS supplier_code,
        s.tel AS supplier_tel,
        s.email AS supplier_email,
        s.address AS supplier_address,
        u.branch_name, 
        u.name AS created_by_name
      FROM purchase p
      LEFT JOIN supplier s ON p.supplier_id = s.id
      LEFT JOIN user u ON p.user_id = u.id
      WHERE p.id = :id
    `;

    const params = { id };

    // 🔐 Branch filter for non-super admin
    if (req.auth?.role !== "admin") {
      sql += ` AND u.branch_name = :branch_name`;
      params.branch_name = req.auth?.branch_name;
    }

    const [results] = await db.query(sql, params);

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found"
      });
    }

    const purchase = results[0];
    purchase.items = purchase.items ? JSON.parse(purchase.items) : [];

    res.json({
      data: purchase,
      success: true,
      message: "Purchase order retrieved successfully"
    });

  } catch (error) {
    logError("purchase.getById", error, res);
  }
};
exports.create = async (req, res) => {
  try {
    const {
      supplier_id,
      order_no,
      order_date,
      expected_delivery_date,
      status = 'pending',
      payment_terms,
      items,
      total_amount,
      notes
    } = req.body;

    // Validation
    if (!supplier_id) {
      return res.status(400).json({
        success: false,
        message: "Supplier is required"
      });
    }

    if (!items || !isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order items are required"
      });
    }

    // ✅ GET SUPPLIER INFO
    const [supplierInfo] = await db.query(
      "SELECT id, name, code FROM supplier WHERE id = :supplier_id",
      { supplier_id }
    );

    if (supplierInfo.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier"
      });
    }

    const supplier = supplierInfo[0];

    // ✅ GET USER INFO (for branch_name)
    const [userInfo] = await db.query(
      "SELECT id, name, branch_name FROM user WHERE id = :user_id",
      { user_id: req.auth?.id || 1 }
    );

    const branch_name = userInfo[0]?.branch_name || 'Unknown Branch';
    const user_name = userInfo[0]?.name || 'Unknown User';

    // ✅ ADD SUPPLIER INFO TO EACH ITEM
    const itemsWithSupplier = items.map(item => ({
      ...item,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      supplier_code: supplier.code
    }));

    // Calculate total amount
    let calculatedTotal = total_amount || itemsWithSupplier.reduce((sum, item) => {
      return sum + ((item.quantity || 0) * (item.unit_price || 0));
    }, 0);

    // ✅ INSERT INTO DATABASE
    const sql = `
      INSERT INTO purchase (
        supplier_id, order_no, order_date, expected_delivery_date,
        status, payment_terms, items, total_amount, notes, user_id, created_at
      ) VALUES (
        :supplier_id, :order_no, :order_date, :expected_delivery_date,
        :status, :payment_terms, :items, :total_amount, :notes, :user_id, CURRENT_TIMESTAMP
      )
    `;

    const params = {
      supplier_id, order_no,
      order_date: order_date || new Date().toISOString().split('T')[0],
      expected_delivery_date: expected_delivery_date || null,
      status, payment_terms: payment_terms || null,
      items: JSON.stringify(itemsWithSupplier),
      total_amount: calculatedTotal, notes: notes || null,
      user_id: req.auth?.id || 1
    };

    const [result] = await db.query(sql, params);
    const purchaseId = result.insertId;

    // ✅✅✅ ENHANCED TELEGRAM NOTIFICATION ✅✅✅
    setImmediate(async () => {
      try {
        // ✅ Get actual_price and format details
        const productDetailsPromises = itemsWithSupplier.slice(0, 5).map(async (item, index) => {
          let actualPrice = 1190;
          if (item.category_id) {
            const [cat] = await db.query(
              "SELECT actual_price FROM category WHERE id = :id",
              { id: item.category_id }
            );
            if (cat.length > 0 && cat[0].actual_price) {
              actualPrice = parseFloat(cat[0].actual_price);
            }
          }
          const qty = parseFloat(item.quantity || 0);
          const price = parseFloat(item.unit_price || 0);
          const total = (qty * price) / actualPrice;
          return `🔄 ${index + 1}. <b>${item.product_name}</b>\n• ប្រភេទ: ${item.category_name || 'N/A'}\n• ចំនួន: ${formatNumber(qty)} L\n• តម្លៃ: $${formatNumber(price)}/L\n• តម្លៃអាហ្វិក: $${formatNumber(actualPrice)}\n• សរុប: $${formatNumber(total)}`;
        });

        const productDetails = (await Promise.all(productDetailsPromises)).join('\n\n');
        const remaining = itemsWithSupplier.length > 5 ? `\n\n<i>... និង ${itemsWithSupplier.length - 5} ផលិតផលផ្សេងទៀត</i>` : '';
        const totalQty = itemsWithSupplier.reduce((s, i) => s + parseFloat(i.quantity || 0), 0);

        const message = `🛒 <b>ការទិញថ្មី / New Purchase Order</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📋 <b>Order Info:</b>\n• លេខបញ្ជាទិញ: <code>${order_no}</code>\n• ស្ថានភាព: <b>${status.toUpperCase()}</b>\n• កាលបរិច្ឆេទ: ${order_date || new Date().toISOString().split('T')[0]}\n\n🏢 <b>Supplier:</b>\n• ឈ្មោះ: ${supplier.name}\n• លេខកូដ: ${supplier.code}\n\n📍 <b>Branch:</b>\n• សាខា: ${branch_name}\n• បង្កើតដោយ: ${user_name}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n📦 <b>PRODUCTS (${itemsWithSupplier.length} items)</b>\n${productDetails}${remaining}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 <b>SUMMARY:</b>\n• ផលិតផលសរុប: ${itemsWithSupplier.length} items\n• បរិមាណសរុប: ${formatNumber(totalQty)} L\n💰 <b>GRAND TOTAL: $${formatNumber(calculatedTotal)}</b>\n\n${notes ? `📝 <b>Notes:</b> ${notes}\n` : ''}⏰ ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh', dateStyle: 'medium', timeStyle: 'short' })}\n━━━━━━━━━━━━━━━━━━━━━━━━━━`;

        const notificationResult = await sendSmartNotification({
          event_type: 'purchase_created',
          branch_name: branch_name,
          message: message,
          severity: 'normal'
        });

        if (notificationResult.success) {
        }
      } catch (notifError) {
        console.error('❌ Telegram error:', notifError);
      }
    });

    res.status(201).json({
      success: true,
      message: "Purchase order created successfully",
      data: {
        id: purchaseId, order_no,
        supplier_name: supplier.name,
        total_amount: calculatedTotal,
        items_count: itemsWithSupplier.length
      }
    });

  } catch (error) {
    console.error('❌ Purchase creation error:', error);
    logError("purchase.create", error, res);
  }
};
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      supplier_id,
      order_no,
      order_date,
      expected_delivery_date,
      status,
      payment_terms,
      items,
      total_amount,
      notes,
      received_by // ✅ Extract received_by
    } = req.body;

    // Get previous status and data
    const [previousOrder] = await db.query(
      `SELECT p.*, u.branch_name, u.name as user_name 
       FROM purchase p
       LEFT JOIN user u ON p.user_id = u.id
       WHERE p.id = :id`,
      { id }
    );

    if (previousOrder.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found"
      });
    }

    const previousStatus = previousOrder[0]?.status;
    const branch_name = previousOrder[0]?.branch_name || 'Unknown Branch';
    const user_name = previousOrder[0]?.user_name || 'Unknown User';

    // Validation
    if (!supplier_id || !items || !isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Supplier and items are required"
      });
    }

    // ✅ GET SUPPLIER INFO
    const [supplierInfo] = await db.query(
      "SELECT id, name, code FROM supplier WHERE id = :supplier_id",
      { supplier_id }
    );

    if (supplierInfo.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier"
      });
    }

    const supplier = supplierInfo[0];

    // ✅ ADD SUPPLIER INFO TO EACH ITEM
    const itemsWithSupplier = items.map(item => ({
      ...item,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      supplier_code: supplier.code
    }));

    // Calculate total
    let calculatedTotal = total_amount || itemsWithSupplier.reduce((sum, item) => {
      return sum + ((item.quantity || 0) * (item.unit_price || 0));
    }, 0);

    // Update purchase order
    const sql = `
      UPDATE purchase SET
        supplier_id = :supplier_id,
        order_no = :order_no,
        order_date = :order_date,
        expected_delivery_date = :expected_delivery_date,
        status = :status,
        payment_terms = :payment_terms,
        items = :items,
        total_amount = :total_amount,
        notes = :notes,
        received_by = :received_by,  -- ✅ Update received_by
        updated_at = CURRENT_TIMESTAMP
      WHERE id = :id
    `;

    const params = {
      id,
      supplier_id,
      order_no,
      order_date: order_date ? new Date(order_date).toISOString().split('T')[0] : null,
      expected_delivery_date: expected_delivery_date ? new Date(expected_delivery_date).toISOString().split('T')[0] : null,
      status,
      payment_terms,
      items: JSON.stringify(itemsWithSupplier),
      total_amount: calculatedTotal,
      notes,
      received_by: received_by || previousOrder[0]?.received_by || null // ✅ Persist or update
    };

    await db.query(sql, params);

    // ✅✅✅ SEND TELEGRAM NOTIFICATION ON STATUS CHANGE ✅✅✅
    if (previousStatus !== status) {
      try {
        const statusEmoji = {
          'pending': '⏳',
          'confirmed': '✅',
          'shipped': '🚚',
          'delivered': '📦',
          'cancelled': '❌'
        };

        const statusText = {
          'pending': 'រង់ចាំ / Pending',
          'confirmed': 'បញ្ជាក់ / Confirmed',
          'shipped': 'កំពុងដឹកជញ្ជូន / Shipped',
          'delivered': 'បានទទួល / Delivered',
          'cancelled': 'បានលុបចោល / Cancelled'
        };

        // ✅✅✅ FIXED: Get actual_price for each item and calculate correctly
        const productDetailsPromises = itemsWithSupplier.map(async (item, index) => {
          let actualPrice = 1190; // default

          // Get actual_price from product or category
          if (item.category_id) {
            const [categoryInfo] = await db.query(
              "SELECT actual_price FROM category WHERE id = :category_id",
              { category_id: item.category_id }
            );

            if (categoryInfo && categoryInfo.length > 0 && categoryInfo[0].actual_price) {
              actualPrice = parseFloat(categoryInfo[0].actual_price);
            }
          }

          // ✅✅✅ CORRECT FORMULA: (qty * unit_price) / actual_price
          const quantity = parseFloat(item.quantity || 0);
          const unitPrice = parseFloat(item.unit_price || 0);
          const itemTotal = (quantity * unitPrice) / actualPrice;

          return `
🔄 ${index + 1}. <b>${item.product_name}</b>
• ចំនួន: ${formatNumber(quantity)} L
• តម្លៃតោន: $${formatNumber(unitPrice)}/L
• តម្លៃសរុប: $${formatNumber(itemTotal)}`;
        });

        const productDetailsArray = await Promise.all(productDetailsPromises);
        const productDetails = productDetailsArray.join('\n\n');

        // ✅ Calculate totals with correct formula
        const totalQuantity = itemsWithSupplier.reduce((sum, i) => sum + parseFloat(i.quantity || 0), 0);
        const totalItems = itemsWithSupplier.length;

        // ✅ Include Receiver in Notification if delivered
        const receiverInfo = (status === 'delivered' && received_by)
          ? `\n👤 <b>Received By:</b> ${received_by}`
          : '';

        const telegramMessage = `
${statusEmoji[status] || '📋'} <b>ស្ថានភាពការទិញប្រែប្រួល / Purchase Status Changed</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 <b>Order Info:</b>
• លេខបញ្ជាទិញ: <code>${order_no}</code>
• ស្ថានភាពចាស់: ${statusEmoji[previousStatus] || '❓'} ${statusText[previousStatus] || previousStatus}
• ស្ថានភាពថ្មី: ${statusEmoji[status] || '❓'} <b>${statusText[status] || status}</b>${receiverInfo}

🏢 <b>Supplier Information:</b>
• ឈ្មោះ: ${supplier.name}
• លេខកូដ: ${supplier.code}

📍 <b>Branch:</b>
• សាខា: ${branch_name}
• អ្នកកែប្រែ: ${user_name}

━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 <b>PRODUCT DETAILS (${totalItems} items)</b>
${productDetails}

━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 <b>SUMMARY:</b>
• ផលិតផលសរុប: ${totalItems} items
• បរិមាណសរុប: ${formatNumber(totalQuantity)} L
💰 <b>GRAND TOTAL: $${formatNumber(calculatedTotal)}</b>

${notes ? `📝 <b>Notes:</b> ${notes}\n` : ''}⏰ <b>Updated at:</b> ${new Date().toLocaleString('en-US', {
          timeZone: 'Asia/Phnom_Penh',
          dateStyle: 'medium',
          timeStyle: 'short'
        })}
━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

        // Send notification (non-blocking)
        sendSmartNotification({
          event_type: 'purchase_status_changed',
          branch_name: branch_name,
          message: telegramMessage,
          severity: status === 'delivered' ? 'high' : 'normal'
        }).catch(err => {
          console.error('❌ Telegram notification failed:', err);
        });

      } catch (notifError) {
        console.error('❌ Notification error:', notifError);
      }
    }

    // 🔄 INVENTORY INTEGRATION: Update when delivered or completed
    const validStatuses = ['delivered', 'completed'];
    if (
      (!validStatuses.includes(previousStatus) && validStatuses.includes(status)) ||
      (previousStatus !== status && validStatuses.includes(status))
    ) {
      if (!validStatuses.includes(previousStatus)) { // strict check to avoid double counting if going from delivered -> completed
        try {
          for (const item of itemsWithSupplier) {
            let productId = null;
            let actualPrice = 1190;
            let existingProduct = [];

            // ✅✅✅ 1. Try Find by ID first (Most reliable)
            if (item.product_id || item.id) { // Check both fields just in case
              const searchId = item.product_id || item.id;
              const [byId] = await db.query(
                "SELECT id, qty, category_id, actual_price FROM product WHERE id = :id LIMIT 1",
                { id: searchId }
              );
              if (byId.length > 0) existingProduct = byId;
            }

            // ✅✅✅ 2. Fallback to Name if ID didn't work
            if (existingProduct.length === 0 && item.product_name) {
              const [byName] = await db.query(
                "SELECT id, qty, category_id, actual_price FROM product WHERE name = :product_name LIMIT 1",
                { product_name: item.product_name }
              );
              if (byName.length > 0) existingProduct = byName;
            }

            if (existingProduct.length > 0) {
              productId = existingProduct[0].id;

              if (existingProduct[0].actual_price && existingProduct[0].actual_price > 0) {
                actualPrice = parseFloat(existingProduct[0].actual_price);
              } else if (item.category_id) {
                const [categoryInfo] = await db.query(
                  "SELECT actual_price FROM category WHERE id = :category_id",
                  { category_id: item.category_id }
                );

                if (categoryInfo && categoryInfo.length > 0 && categoryInfo[0].actual_price) {
                  actualPrice = parseFloat(categoryInfo[0].actual_price);
                }
              }
            } else {
              // If still no product, check category for new product creation
              if (item.category_id) {
                const [categoryInfo] = await db.query(
                  "SELECT actual_price FROM category WHERE id = :category_id",
                  { category_id: item.category_id }
                );

                if (categoryInfo && categoryInfo.length > 0 && categoryInfo[0].actual_price) {
                  actualPrice = parseFloat(categoryInfo[0].actual_price);
                }
              }
            }

            if (existingProduct.length > 0) {
              productId = existingProduct[0].id; // Ensure we have the ID

              await db.query(`
                  UPDATE product 
                  SET 
                    qty = qty + :quantity,
                    unit_price = :unit_price,
                    supplier_id = :supplier_id,
                    supplier_name = :supplier_name,
                    actual_price = :actual_price,
                    updated_at = CURRENT_TIMESTAMP
                  WHERE id = :id
                `, {
                quantity: item.quantity,
                unit_price: item.unit_price,
                supplier_id: supplier.id,
                supplier_name: supplier.name,
                actual_price: actualPrice,
                id: productId
              });

            } else {
              // Create new product if it really doesn't exist
              const insertProductSql = `
                  INSERT INTO product (
                    name,
                    category_id,
                    qty,
                    unit_price,
                    unit,
                    supplier_id,
                    supplier_name,
                    actual_price,
                    user_id,
                    create_at,
                    updated_at,
                    status,
                    barcode
                  ) VALUES (
                    :name,
                    :category_id,
                    :qty,
                    :unit_price,
                    'L',
                    :supplier_id,
                    :supplier_name,
                    :actual_price,
                    :user_id,
                    CURRENT_TIMESTAMP,
                    CURRENT_TIMESTAMP,
                    1,
                    :barcode
                  )
                `;

              const [insertResult] = await db.query(insertProductSql, {
                name: item.product_name,
                category_id: item.category_id || null,
                qty: item.quantity || 0,
                unit_price: item.unit_price || 0,
                supplier_id: supplier.id,
                supplier_name: supplier.name,
                actual_price: actualPrice,
                user_id: req.auth?.id || 1,
                barcode: `PO${id}-${Date.now()}`
              });

              productId = insertResult.insertId;
            }

            if (productId) {
              const inventorySql = `
                  INSERT INTO inventory_transaction (
                    product_id, 
                    purchase_id, 
                    transaction_type, 
                    quantity, 
                    unit_price,
                    selling_price,
                    actual_price,
                    reference_no,
                    supplier_id,
                    supplier_name,
                    notes,
                    user_id, 
                    created_at
                  ) VALUES (
                    :product_id, 
                    :purchase_id, 
                    'PURCHASE_IN', 
                    :quantity,
                    :unit_price,
                    :selling_price,
                    :actual_price,
                    :reference_no,
                    :supplier_id,
                    :supplier_name,
                    :notes,
                    :user_id, 
                    CURRENT_TIMESTAMP
                  )
                `;

              await db.query(inventorySql, {
                product_id: productId,
                purchase_id: id,
                quantity: item.quantity,
                unit_price: item.unit_price,
                selling_price: item.unit_price,
                actual_price: actualPrice,
                reference_no: order_no,
                supplier_id: supplier.id,
                supplier_name: supplier.name,
                notes: `Purchase from ${supplier.name}`,
                user_id: req.auth?.id || 1
              });
            }
          }

          // ✅✅✅ FIXED: Send DELIVERED notification
          // Logic moved INSIDE the if-block so it only triggers on successful delivery/completion logic
          const deliveredDetailsPromises = itemsWithSupplier.map(async (item, index) => {
            let actualPrice = 1190;
            if (item.category_id) {
              const [cat] = await db.query(
                "SELECT actual_price FROM category WHERE id = :id",
                { id: item.category_id }
              );
              if (cat && cat.length > 0 && cat[0].actual_price) {
                actualPrice = parseFloat(cat[0].actual_price);
              }
            }
            const quantity = parseFloat(item.quantity || 0);
            const unitPrice = parseFloat(item.unit_price || 0);
            const itemTotal = (quantity * unitPrice) / actualPrice;

            return `
🔄 ${index + 1}. <b>${item.product_name}</b>
• ប្រភេទ: ${item.category_name || 'N/A'}
• ចំនួនចូល: ${formatNumber(quantity)} L
• តម្លៃក្នុងមួយលីត្រ: $${formatNumber(unitPrice)}/L
• តម្លៃអាហ្វិក (Actual): $${formatNumber(actualPrice)}
• តម្លៃសរុប: $${formatNumber(itemTotal)}`;
          });

          const deliveredProductDetails = (await Promise.all(deliveredDetailsPromises)).join('\n\n');
          const totalQuantity = itemsWithSupplier.reduce((sum, i) => sum + parseFloat(i.quantity || 0), 0);
          const totalItems = itemsWithSupplier.length;

          const inventoryMessage = `
📦 <b>ទទួលទំនិញបានជោគជ័យ / DELIVERY COMPLETED</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ <b>Purchase Order:</b> <code>${order_no}</code>
✅ <b>Status:</b> ${status.toUpperCase()}

🏢 <b>Supplier Information:</b>
• ឈ្មោះ: ${supplier.name}
• លេខកូដ: ${supplier.code}

📍 <b>Branch:</b>
• សាខា: ${branch_name}

━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 <b>STOCK UPDATES (${totalItems} products)</b>
${deliveredProductDetails}

━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 <b>SUMMARY:</b>
• ផលិតផលសរុប: ${totalItems} items
• បរិមាណសរុប: ${formatNumber(totalQuantity)} L
💰 <b>GRAND TOTAL: $${formatNumber(calculatedTotal)}</b>

👤 <b>Updated by:</b> ${user_name}
🕐 <b>Date:</b> ${new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Phnom_Penh',
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
          })}
━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

          sendSmartNotification({
            event_type: 'purchase_delivered',
            branch_name: branch_name,
            message: inventoryMessage,
            severity: 'high'
          }).catch(err => console.error('❌ Telegram notification failed:', err));

        } catch (inventoryError) {
          console.error("❌ Inventory update error:", inventoryError);
        }
      }
    }

    res.json({
      success: true,
      message: "Purchase order updated successfully",
      data: {
        id,
        ...params,
        items: itemsWithSupplier
      }
    });

  } catch (error) {
    logError("purchase.update", error, res);
  }
};
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if purchase exists and belongs to user's branch
    let checkSql = `
      SELECT p.*, u.branch_name 
      FROM purchase p
      LEFT JOIN user u ON p.user_id = u.id
      WHERE p.id = :id
    `;
    let checkParams = { id };

    if (req.auth?.role !== "admin") {
      checkSql += ` AND u.branch_name = :branch_name`;
      checkParams.branch_name = req.auth?.branch_name;
    }

    const [existingPurchase] = await db.query(checkSql, checkParams);

    if (existingPurchase.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found or not in your branch"
      });
    }

    // Check if purchase can be deleted (no related records)
    const [relatedRecords] = await db.query(
      "SELECT COUNT(*) as count FROM inventory_transaction WHERE purchase_id = :id",
      { id }
    );

    if (relatedRecords[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete purchase order with related inventory transactions"
      });
    }

    await db.query("DELETE FROM purchase WHERE id = :id", { id });

    res.json({
      success: true,
      message: "Purchase order deleted successfully"
    });

  } catch (error) {
    logError("purchase.delete", error, res);
  }
};

exports.getStatistics = async (req, res) => {
  try {
    let sql = `
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN p.status = 'confirmed' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN p.status = 'shipped' THEN 1 END) as shipped_orders,
        COUNT(CASE WHEN p.status = 'delivered' THEN 1 END) as delivered_orders,
        COUNT(CASE WHEN p.status = 'cancelled' THEN 1 END) as cancelled_orders,
        COALESCE(SUM(p.total_amount), 0) as total_value,
        COALESCE(SUM(CASE WHEN p.status = 'delivered' THEN p.total_amount ELSE 0 END), 0) as delivered_value
      FROM purchase p
      LEFT JOIN user u ON p.user_id = u.id
      WHERE 1=1
    `;

    const params = {};

    // 🔐 Branch filter
    if (req.auth?.role !== "admin") {
      sql += ` AND u.branch_name = :branch_name`;
      params.branch_name = req.auth?.branch_name;
    }

    const [results] = await db.query(sql, params);

    res.json({
      data: results[0],
      success: true,
      message: "Purchase statistics retrieved successfully"
    });

  } catch (error) {
    logError("purchase.getStatistics", error, res);
  }
};

exports.getInventoryStatistics = async (req, res) => {
  try {
    let sql = `
      SELECT 
        COUNT(DISTINCT p.id) as total_products,
        COALESCE(SUM(p.qty), 0) as total_quantity_liters,
        COALESCE(SUM(p.qty * p.unit_price), 0) as total_stock_value,
        COUNT(CASE WHEN p.qty <= 1000 THEN 1 END) as low_stock_products,
        COUNT(CASE WHEN p.qty > 10000 THEN 1 END) as high_stock_products,
        c.name as category_name,
        COUNT(CASE WHEN p.id IS NOT NULL THEN 1 END) as product_count,
        COALESCE(SUM(CASE WHEN p.id IS NOT NULL THEN p.qty ELSE 0 END), 0) as category_quantity,
        COALESCE(SUM(CASE WHEN p.id IS NOT NULL THEN (p.qty * p.unit_price) ELSE 0 END), 0) as category_value
      FROM category c
      LEFT JOIN product p ON c.id = p.category_id
      LEFT JOIN user u ON p.user_id = u.id
      WHERE 1=1
    `;

    const params = {};

    if (req.auth?.role !== "admin") {
      sql += ` AND (u.branch_name = :branch_name OR u.branch_name IS NULL)`;
      params.branch_name = req.auth?.branch_name;
    }

    sql += ` GROUP BY c.id, c.name ORDER BY c.id`;

    const [results] = await db.query(sql, params);

    const totals = results.reduce((acc, row) => {
      acc.total_products += parseInt(row.total_products) || 0;
      acc.total_quantity_liters += parseFloat(row.total_quantity_liters) || 0;
      acc.total_stock_value += parseFloat(row.total_stock_value) || 0;
      acc.low_stock_products += parseInt(row.low_stock_products) || 0;
      acc.high_stock_products += parseInt(row.high_stock_products) || 0;
      return acc;
    }, {
      total_products: 0,
      total_quantity_liters: 0,
      total_stock_value: 0,
      low_stock_products: 0,
      high_stock_products: 0
    });

    res.json({
      data: {
        ...totals,
        categories: results
      },
      success: true,
      message: "Inventory statistics retrieved successfully"
    });

  } catch (error) {
    logError("purchase.getInventoryStatistics", error, res);
  }
};

exports.getRecentTransactions = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    let sql = `
      SELECT 
        it.*,
        p.name as product_name,
        c.name as category_name,
        u.name as user_name
      FROM inventory_transaction it
      LEFT JOIN product p ON it.product_id = p.id
      LEFT JOIN category c ON p.category_id = c.id
      LEFT JOIN user u ON it.user_id = u.id
      WHERE 1=1
    `;

    const params = {};

    if (req.auth?.role !== "admin") {
      sql += ` AND u.branch_name = :branch_name`;
      params.branch_name = req.auth?.branch_name;
    }

    sql += ` ORDER BY it.created_at DESC LIMIT :limit`;
    params.limit = parseInt(limit);

    const [results] = await db.query(sql, params);

    res.json({
      data: results,
      success: true,
      message: "Recent transactions retrieved successfully"
    });

  } catch (error) {
    logError("purchase.getRecentTransactions", error, res);
  }
};