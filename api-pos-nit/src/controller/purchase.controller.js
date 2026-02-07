const { db, isArray, isEmpty, logError } = require("../util/helper");
const { sendSmartNotification, formatStockIn, formatOpeningStock } = require("../util/Telegram.helpe"); // Imported new formatters

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
    // 🔒 RESTRICT CREATION REMOVED - Rely on route permission check
    const userBranch = (req.auth?.branch_name || '').toLowerCase();

    let { items, branch_id } = req.body;
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch (e) { }
    }
    const image = req.file ? req.file.path : null;

    let {
      supplier_id,
      order_no,
      order_date,
      expected_delivery_date,
      status = 'pending',
      payment_terms,
      total_amount,
      notes
    } = req.body;

    // ✅ FORCE STATUS TO PENDING (No immediate stock in)
    status = 'pending';

    if (!supplier_id) return res.status(400).json({ success: false, message: "Supplier is required" });
    if (!items || !isArray(items) || items.length === 0) return res.status(400).json({ success: false, message: "Order items are required" });

    // ✅ GET SUPPLIER INFO
    const [supplierInfo] = await db.query("SELECT id, name, code FROM supplier WHERE id = :supplier_id", { supplier_id });
    if (supplierInfo.length === 0) return res.status(400).json({ success: false, message: "Invalid supplier" });
    const supplier = supplierInfo[0];

    // ✅ DETERMINE BRANCH
    let targetBranchName = "Head Office"; // Default
    if (branch_id) {
      try {
        const [branchRes] = await db.query("SELECT name FROM branch WHERE id = :branch_id", { branch_id });
        if (branchRes.length > 0) targetBranchName = branchRes[0].name;
      } catch (err) {
        targetBranchName = branch_id;
      }
    } else {
      const [userInfo] = await db.query("SELECT branch_name FROM user WHERE id = :user_id", { user_id: req.auth?.id || 1 });
      targetBranchName = userInfo[0]?.branch_name || targetBranchName;
    }

    const itemsWithSupplier = items.map(item => ({
      ...item,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      supplier_code: supplier.code,
      target_branch_name: targetBranchName // ✅ PERSIST BRANCH NAME IN ITEMS (Critical for Receive step)
    }));

    let calculatedTotal = total_amount || itemsWithSupplier.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);

    const sql = `
      INSERT INTO purchase (
        supplier_id, order_no, order_date, expected_delivery_date,
        status, payment_terms, items, total_amount, notes, user_id, image, created_at
      ) VALUES (
        :supplier_id, :order_no, :order_date, :expected_delivery_date,
        :status, :payment_terms, :items, :total_amount, :notes, :user_id, :image, CURRENT_TIMESTAMP
      )
    `;

    const [result] = await db.query(sql, {
      supplier_id, order_no,
      order_date: order_date || new Date().toISOString().split('T')[0],
      expected_delivery_date: expected_delivery_date || null,
      status,
      payment_terms: payment_terms || null,
      items: JSON.stringify(itemsWithSupplier),
      total_amount: calculatedTotal,
      notes: notes || null,
      user_id: req.auth?.id || 1,
      image: image
    });
    const purchaseId = result.insertId;

    // ✅ TELEGRAM NOTIFICATION (Purchase Created - Pending)
    setImmediate(async () => {
      try {
        await sendSmartNotification({
          event_type: 'purchase_created',
          branch_name: targetBranchName,
          title: `📝 New Purchase Order: ${order_no}`,
          message: `📦 <b>ការបញ្ជាទិញថ្មី / NEW PO CREATED</b>\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n✅ <b>PO:</b> <code>${order_no}</code>\n✅ <b>Status:</b> PENDING\n\n🏢 <b>Supplier:</b> ${supplier.name}\n📍 <b>Destination:</b> ${targetBranchName}\n\n👤 <b>By:</b> ${req.auth?.name || 'Admin'}`,
          severity: 'normal'
        });
      } catch (e) {
        console.error("Telegram Error:", e);
      }
    });

    res.status(201).json({
      success: true,
      message: "Purchase order created successfully (Pending Receive)",
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
    // ✅ Handle Multipart/FormData
    let { items } = req.body;
    if (typeof items === 'string') {
      try { items = JSON.parse(items); } catch (e) { }
    }

    const {
      supplier_id,
      order_no,
      order_date,
      expected_delivery_date,
      status,
      payment_terms,
      total_amount,
      notes,
      received_by,
      branch_id,
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

    // ✅ DETECT TARGET BRANCH (Critical for Inventory Update)
    let targetBranchName = null;

    // 1. Unpack items to check for saved branch
    let previousItems = [];
    try { previousItems = JSON.parse(previousOrder[0].items || '[]'); } catch (e) { }

    // Check saved items first
    if (previousItems.length > 0 && previousItems[0].target_branch_name) {
      targetBranchName = previousItems[0].target_branch_name;
    }
    // Check new items (if passed)
    if (items && items.length > 0 && items[0].target_branch_name) {
      targetBranchName = items[0].target_branch_name;
    }
    // Fallback to Creator's Branch if not found (Legacy support)
    if (!targetBranchName) {
      targetBranchName = previousOrder[0]?.branch_name || 'Head Office';
    }

    // Override if branch_id is explicitly passed in Update
    if (branch_id) {
      try {
        const [bRes] = await db.query("SELECT name FROM branch WHERE id = :id", { id: branch_id });
        if (bRes.length > 0) targetBranchName = bRes[0].name;
        else targetBranchName = branch_id; // Fallback
      } catch (e) { }
    }

    // ✅ Determine Target User (Stock Owner) in that Branch
    let targetUserId = previousOrder[0]?.user_id; // Default to creator
    const creatorBranch = previousOrder[0]?.branch_name;

    // If we have a specific target branch, try to assign to a user in that branch
    if (targetBranchName) {
      try {
        // Try precise match
        let [uRes] = await db.query("SELECT id FROM user WHERE branch_name = :b AND is_active = 1 LIMIT 1", { b: targetBranchName });

        // Try LIKE match
        if (uRes.length === 0) {
          [uRes] = await db.query("SELECT id FROM user WHERE branch_name LIKE :b AND is_active = 1 LIMIT 1", { b: `%${targetBranchName}%` });
        }

        if (uRes.length > 0) {
          targetUserId = uRes[0].id; // Assign to branch user
        } else {
          // Only warn if target branch is different from creator branch
          if (targetBranchName !== creatorBranch) {
            console.warn(`Warning: No active user found for branch '${targetBranchName}'. Stock will be assigned to Creator (${targetUserId}).`);
          }
        }
      } catch (e) { console.error("Update Branch User Lookup Error", e); }
    }

    const user_name = previousOrder[0]?.user_name || 'Unknown User';
    const previousImage = previousOrder[0]?.image;
    const image = req.file ? req.file.path : previousImage;

    // Validation
    if (!supplier_id || !items || !isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Supplier and items are required"
      });
    }

    // ✅ GET SUPPLIER INFO
    const [supplierInfo] = await db.query("SELECT id, name, code FROM supplier WHERE id = :supplier_id", { supplier_id });
    if (supplierInfo.length === 0) return res.status(400).json({ success: false, message: "Invalid supplier" });
    const supplier = supplierInfo[0];

    // ✅ ADD SUPPLIER & BRANCH INFO TO ITEMS
    const itemsWithSupplier = items.map(item => ({
      ...item,
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      supplier_code: supplier.code,
      target_branch_name: targetBranchName // ✅ Ensure persistence
    }));

    let calculatedTotal = total_amount || itemsWithSupplier.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);

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
        received_by = :received_by,
        user_id = :user_id,
        image = :image,
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
      received_by: received_by || previousOrder[0]?.received_by || null,
      user_id: targetUserId, // ✅ Update Owner to Branch User
      image: image
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
• សាខា: ${targetBranchName}
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
          branch_name: targetBranchName,
          title: `🔄 Purchase ${order_no} Status: ${statusText[status] || status}`,
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

            // ✅✅✅ 2. Fallback to Name + Branch Scope (✅ Uses verified targetBranchName)
            if (existingProduct.length === 0 && item.product_name) {
              const [byName] = await db.query(`
                SELECT id, qty, category_id, actual_price FROM product 
                WHERE name = :product_name 
                AND (
                    (SELECT branch_name FROM user WHERE id = product.user_id) = :branch_name
                    OR :branch_name = 'Head Office' 
                )
                LIMIT 1
              `, {
                product_name: item.product_name,
                branch_name: targetBranchName
              });
              // NOTE: The subquery above is a more robust way to check product owner's branch
              // but simplifies to just checking if product is accessible.

              if (byName.length > 0) existingProduct = byName;

              // If still empty, try to match via user scope logic used in Create
              if (existingProduct.length === 0) {
                const [byName2] = await db.query(`
                    SELECT p.id, p.qty, p.category_id, p.actual_price 
                    FROM product p
                    LEFT JOIN user u ON p.user_id = u.id
                    WHERE p.name = :product_name 
                    AND u.branch_name = :branch_name
                    LIMIT 1
                  `, {
                  product_name: item.product_name,
                  branch_name: targetBranchName
                });
                if (byName2.length > 0) existingProduct = byName2;
              }
            }

            if (existingProduct.length > 0) {
              productId = existingProduct[0].id;
              if (existingProduct[0].actual_price) actualPrice = parseFloat(existingProduct[0].actual_price);
              else if (item.category_id) {
                const [cat] = await db.query("SELECT actual_price FROM category WHERE id = :id", { id: item.category_id });
                if (cat.length) actualPrice = parseFloat(cat[0].actual_price);
              }

              await db.query(`
                  UPDATE product 
                  SET qty = qty + :quantity, unit_price = :unit_price, supplier_id = :supplier_id, supplier_name = :supplier_name, actual_price = :actual_price, updated_at = CURRENT_TIMESTAMP
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

              if (item.category_id) {
                const [cat] = await db.query("SELECT actual_price FROM category WHERE id = :id", { id: item.category_id });
                if (cat.length) actualPrice = parseFloat(cat[0].actual_price);
              }

              const insertProductSql = `
                  INSERT INTO product (
                    name, category_id, qty, unit_price, unit, supplier_id, supplier_name, actual_price, user_id, 
                    create_at, updated_at, status, barcode
                  ) VALUES (
                    :name, :category_id, :qty, :unit_price, 'L', :supplier_id, :supplier_name, :actual_price, :user_id,
                    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, :barcode
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
                user_id: targetUserId, // ✅ Assign to Target Branch User
                barcode: `PO${id}-${Date.now()}`
              });
              productId = insertResult.insertId;
            }

            if (productId) {
              await db.query(`
                  INSERT INTO inventory_transaction (
                    product_id, purchase_id, transaction_type, quantity, unit_price, selling_price, actual_price, reference_no,
                    supplier_id, supplier_name, notes, user_id, created_at
                  ) VALUES (
                    :product_id, :purchase_id, 'PURCHASE_IN', :quantity, :unit_price, :unit_price, :actual_price, :reference_no,
                    :supplier_id, :supplier_name, :notes, :user_id, NOW()
                  )
                `, {
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
                user_id: targetUserId // ✅ Assign tx to Target Branch User
              });

              // Update item DB object for response/notification
              const [productData] = await db.query("SELECT actual_price FROM product WHERE id = :id", { id: productId });
              item.actual_price = parseFloat(productData[0]?.actual_price) || actualPrice;
              const [newQtyResult] = await db.query("SELECT SUM(quantity) as qty FROM inventory_transaction WHERE product_id = :id", { id: productId });
              item.remaining_qty = newQtyResult[0]?.qty || 0;
            }
          }
        } catch (inventoryError) {
          console.error("❌ Inventory update error:", inventoryError);
        }

        // ✅✅✅ Send Delivery Notification (Moved OUTSIDE the try-catch to be safe)
        try {

          // ✅✅✅ Send Delivery Notification
          const deliveredDetailsPromises = itemsWithSupplier.map(async (item, index) => {
            const quantity = parseFloat(item.quantity || 0);
            const unitPrice = parseFloat(item.unit_price || 0);
            const actualP = item.actual_price || 1190;
            const itemTotal = (quantity * unitPrice) / actualP;

            return `
🔄 ${index + 1}. <b>${item.product_name}</b>
• ប្រភេទ: ${item.category_name || 'N/A'}
• In: <b>+${formatNumber(quantity)} L</b>
• Unit: $${formatNumber(unitPrice)}/L
• Total: <b>$${formatNumber(itemTotal)}</b>
• Rem: <code>${formatNumber(item.remaining_qty || 0)} L</code>`;
          });

          const deliveredProductDetails = (await Promise.all(deliveredDetailsPromises)).join('\n\n');
          const totalQuantity = itemsWithSupplier.reduce((sum, i) => sum + parseFloat(i.quantity || 0), 0);
          const totalItems = itemsWithSupplier.length;

          const inventoryMessage = `
📦 <b>ទទួលទំនិញបានជោគជ័យ / DELIVERY COMPLETED</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ <b>Purchase Order:</b> <code>${order_no}</code>
✅ <b>Status:</b> ${status.toUpperCase()}

🏢 <b>Supplier:</b> ${supplier.name}
📍 <b>Branch:</b> ${targetBranchName}

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
          })
            }
━━━━━━━━━━━━━━━━━━━━━━━━━━
        `;

          sendSmartNotification({
            event_type: 'inventory_movement',
            branch_name: branch_name,
            title: status === 'completed' ? `✅ Purchase Completed & Stock In: ${order_no}` : `🚚 Purchase Delivered & Stock In: ${order_no}`,
            message: inventoryMessage,
            severity: 'high'
          }).catch(err => console.error('❌ Inventory notification failed:', err));

        } catch (notifErr) {
          console.error("❌ Notification error:", notifErr);
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
      checkSql += ` AND u.branch_name = : branch_name`;
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
      WHERE 1 = 1
          `;

    const params = {};

    // 🔐 Branch filter
    if (req.auth?.role !== "admin") {
      sql += ` AND u.branch_name = : branch_name`;
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
          COALESCE(SUM(CASE WHEN p.id IS NOT NULL THEN(p.qty * p.unit_price) ELSE 0 END), 0) as category_value
      FROM category c
      LEFT JOIN product p ON c.id = p.category_id
      LEFT JOIN user u ON p.user_id = u.id
      WHERE 1 = 1
          `;

    const params = {};

    if (req.auth?.role !== "admin") {
      sql += ` AND(u.branch_name = : branch_name OR u.branch_name IS NULL)`;
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
      WHERE 1 = 1
          `;

    const params = {};

    if (req.auth?.role !== "admin") {
      sql += ` AND u.branch_name = : branch_name`;
      params.branch_name = req.auth?.branch_name;
    }

    sql += ` ORDER BY it.created_at DESC LIMIT: limit`;
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

exports.distribute = async (req, res) => {
  try {
    const { purchase_id, branch_id, distributions, notes } = req.body; // distributions: [{ product_id, quantity }]

    if (!purchase_id || !branch_id || !distributions || !isArray(distributions)) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // 1. Get Purchase Order
    const [orders] = await db.query("SELECT * FROM purchase WHERE id = :id", { id: purchase_id });
    if (orders.length === 0) return res.status(404).json({ success: false, message: "Purchase Order not found" });

    const purchase = orders[0];
    let items = [];
    try { items = JSON.parse(purchase.items || '[]'); } catch (e) { }

    // 2. Get Branch Name (Assuming branch_id IS the name since 'branch' table is missing)
    let targetBranchName = branch_id;
    // Optional: Validate if this branch exists in user table if needed
    // const [bCheck] = await db.query("SELECT DISTINCT branch_name FROM user WHERE branch_name = :b", { b: branch_id });
    // if (bCheck.length > 0) targetBranchName = bCheck[0].branch_name;

    // 3. Find User in Target Branch
    let targetUserId = req.auth.id;
    try {
      let [uRes] = await db.query("SELECT id FROM user WHERE branch_name = :b AND is_active = 1 LIMIT 1", { b: targetBranchName });
      if (uRes.length === 0) {
        [uRes] = await db.query("SELECT id FROM user WHERE branch_name LIKE :b AND is_active = 1 LIMIT 1", { b: `%${targetBranchName}%` });
      }
      if (uRes.length > 0) targetUserId = uRes[0].id;
    } catch (e) { }

    // 4. Process Distributions
    const processedItems = [];
    let updated = false;

    for (const dist of distributions) {
      // Match item
      const itemIndex = items.findIndex(i => (String(i.product_id) === String(dist.product_id) || i.product_name === dist.product_name));

      if (itemIndex !== -1) {
        const item = items[itemIndex];
        const distQty = parseFloat(dist.quantity || 0);

        if (distQty > 0) {
          item.received_qty = (parseFloat(item.received_qty || 0) + distQty);
          updated = true;

          // Sync Inventory
          let productId = item.product_id || item.id;
          let actualPrice = parseFloat(item.actual_price || 1190);

          let existingProduct = [];
          // Find Existing Product in Branch Scope
          const [byName] = await db.query(`
                   SELECT p.id, p.actual_price FROM product p 
                   JOIN user u ON p.user_id = u.id 
                   WHERE p.name = :name AND u.branch_name = :b LIMIT 1`,
            { name: item.product_name, b: targetBranchName }
          );
          if (byName.length) existingProduct = byName;

          if (existingProduct.length) {
            productId = existingProduct[0].id;
            await db.query(`UPDATE product SET qty = qty + :qty, updated_at = NOW() WHERE id = :id`, { qty: distQty, id: productId });
          } else {
            const [insert] = await db.query(`
                        INSERT INTO product (name, category_id, qty, unit_price, unit, supplier_id, user_id, actual_price, status, create_at)
                        VALUES (:name, :cat, :qty, :price, 'L', :sup, :uid, :act, 1, NOW())
                     `, {
              name: item.product_name,
              cat: item.category_id || null,
              qty: distQty,
              price: item.unit_price || 0,
              sup: purchase.supplier_id,
              uid: targetUserId,
              act: actualPrice
            });
            productId = insert.insertId;
          }

          // Create Transaction
          await db.query(`
                  INSERT INTO inventory_transaction (
                    product_id, purchase_id, transaction_type, quantity, unit_price, actual_price, reference_no,
                    supplier_id, supplier_name, notes, user_id, created_at
                  ) VALUES (
                    :pid, :poid, 'PURCHASE_IN', :qty, :price, :act, :ref,
                    :sup, :sup_name, :note, :uid, NOW()
                  )
                `, {
            pid: productId,
            poid: purchase_id,
            qty: distQty,
            price: item.unit_price,
            act: actualPrice,
            ref: 'HO-' + purchase.order_no,
            sup: purchase.supplier_id,
            sup_name: items[0].supplier_name || 'Supplier',
            note: `Received from Head Office. PO: ${purchase.order_no}. ${notes || ''}`,
            uid: targetUserId
          });

          processedItems.push({
            name: item.product_name,
            qty: distQty,
            unit_price: item.unit_price
          });

          // 4. ✅ DEDUCT from Head Office (Sender)
          if (item.product_id) {
            // Deduct Qty
            await db.query(`UPDATE product SET qty = qty - :qty WHERE id = :id`, { qty: distQty, id: item.product_id });

            // Add Transaction (Transfer Out)
            await db.query(`
               INSERT INTO inventory_transaction (
                 product_id, purchase_id, transaction_type, quantity, unit_price, actual_price, reference_no,
                 supplier_id, supplier_name, notes, user_id, created_at
               ) VALUES (
                 :pid, :poid, 'TRANSFER_OUT', :qty, :price, :act, :ref,
                 :sup, :sup_name, :notes, :uid, NOW()
               )
             `, {
              pid: item.product_id,
              poid: purchase_id,
              qty: -distQty, // Negative for Out
              price: item.unit_price,
              act: actualPrice,
              ref: 'TO-' + targetBranchName.toUpperCase(),
              sup: purchase.supplier_id,
              sup_name: targetBranchName, // Destination
              notes: `Distributed to ${targetBranchName}. PO: ${purchase.order_no}`,
              uid: req.auth.id // Admin/Sender
            });
          }
        }
      }
    }

    if (updated) {
      const allReceived = items.every(i => (parseFloat(i.received_qty || 0) >= parseFloat(i.quantity || 0)));

      await db.query("UPDATE purchase SET items = :items, status = :status WHERE id = :id", {
        items: JSON.stringify(items),
        status: allReceived ? 'completed' : (purchase.status === 'pending' ? 'confirmed' : purchase.status),
        id: purchase_id
      });

      // Async Notif
      setImmediate(async () => {
        const details = processedItems.map((p, i) => `${i + 1}. ${p.name}: +${p.qty}L`).join('\n');
        await sendSmartNotification({
          event_type: 'inventory_movement',
          branch_name: targetBranchName,
          title: `🚚 Stock Received at ${targetBranchName}`,
          message: `Partial Stock Received from PO: ${purchase.order_no}\n\n${details}\n\nBy: ${req.auth.name}`,
          severity: 'normal'
        });
      });

      res.json({ success: true, message: "Stock distributed successfully" });
    } else {
      res.json({ success: false, message: "No items updated" });
    }

  } catch (error) {
    logError("purchase.distribute", error, res);
  }
};

exports.getDistributions = async (req, res) => {
  try {
    const { id } = req.params;

    // Query transactions linked to this PO
    const sql = `
      SELECT 
        it.*,
        u.branch_name,
        u.name as receiver_name,
        p.name as product_name
      FROM inventory_transaction it
      LEFT JOIN user u ON it.user_id = u.id
      LEFT JOIN product p ON it.product_id = p.id
      WHERE it.purchase_id = :id
      ORDER BY it.created_at DESC
    `;

    const [rows] = await db.query(sql, { id });

    res.json({
      success: true,
      list: rows
    });

  } catch (error) {
    logError("purchase.getDistributions", error, res);
  }
};