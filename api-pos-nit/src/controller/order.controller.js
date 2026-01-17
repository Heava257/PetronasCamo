const { db, isArray, isEmpty, logError, sendTelegramMessage } = require("../util/helper");

const dayjs = require('dayjs');
const { sendSmartNotification } = require("../util/Telegram.helpe");
const { createSystemNotification } = require("./System_notification.controller");

exports.getone = async (req, res) => {
  try {
    const orderId = req.params.id;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    const sql = `
      SELECT 
        od.order_id,
        p.name AS product_name,
        c.name AS category_name,
        od.price,
        o.total_amount AS total_amount_price,
        p.discount,
        p.unit,
        SUM(od.qty) AS total_quantity,
        SUM(od.qty * od.price * (1 - COALESCE(p.discount, 0)/100) / NULLIF(p.actual_price, 0)) AS grand_total
      FROM order_detail od
      INNER JOIN product p ON od.product_id = p.id
      INNER JOIN category c ON p.category_id = c.id
      INNER JOIN \`order\` o ON od.order_id = o.id
      WHERE od.order_id = ?
      GROUP BY od.order_id, p.name, c.name, od.price, p.discount, p.unit, o.total_amount
    `;

    const [rows] = await db.query(sql, [orderId]);

    return res.json({
      error: false,
      list: rows
    });
  } catch (error) {
    logError("getone.order", error);
    return res.status(500).json({ error: "Server error" });
  }
};
// order.controller.js - UPDATED create function with Smart Notification

// exports.create = async (req, res) => {
//   try {
//     const { order, order_details = [] } = req.body;
//     const totalLiters = order_details.reduce((sum, item) => sum + Number(item.qty || 0), 0);

//     if (!order.customer_id || !order.total_amount) {
//       return res.status(400).json({ error: "Missing required fields" });
//     }

//     // ✅ Get branch name from auth
//     const branch_name = req.auth?.branch_name || null;

//     const [customerResult] = await db.query(
//       "SELECT name, address, tel FROM customer WHERE id = :id",
//       { id: order.customer_id }
//     );
//     const customer = customerResult.length > 0 ? customerResult[0] : {
//       name: `ID: ${order.customer_id}`,
//       address: "N/A",
//       tel: "N/A"
//     };

//     const productCategories = {};
//     const productCategoryIds = {}; 
//     const categoryActualPrices = {};
//     const productDescriptions = {};

//     // Get product info
//     for (const item of order_details) {
//       const [productResult] = await db.query(
//         `SELECT 
//           p.id, 
//           p.name AS product_name, 
//           p.description AS product_description,
//           p.category_id, 
//           c.name AS category_name, 
//           c.actual_price,
//           pd.description AS details_description
//          FROM product p 
//          LEFT JOIN category c ON p.category_id = c.id
//          LEFT JOIN product_details pd ON p.id = pd.product_id 
//            AND pd.customer_id = :customer_id
//          WHERE p.id = :id
//          LIMIT 1`,
//         { 
//           id: item.product_id,
//           customer_id: order.customer_id 
//         }
//       );

//       if (productResult.length > 0) {
//         const prod = productResult[0];
//         productCategories[item.product_id] = `${prod.category_name} / ${prod.product_name}`;
//         productCategoryIds[item.product_id] = prod.category_id; 
//         categoryActualPrices[item.product_id] = prod.actual_price || 0;

//         productDescriptions[item.product_id] = 
//           item.description || 
//           prod.details_description || 
//           prod.product_description || 
//           '';
//       }
//     }

//     const order_no = await newOrderNo();
//     const order_date = order.order_date || new Date().toISOString().slice(0, 10);
//     const delivery_date = order.delivery_date || order_date;
//     const receive_date = order.receive_date || null;
//     const createdBy = req.auth?.name || "System";

//     const sqlOrder = `
//       INSERT INTO \`order\` 
//         (order_no, customer_id, total_amount, paid_amount, payment_method, 
//          remark, user_id, create_by, order_date, delivery_date, receive_date) 
//       VALUES 
//         (:order_no, :customer_id, :total_amount, :paid_amount, :payment_method, 
//          :remark, :user_id, :create_by, :order_date, :delivery_date, :receive_date)
//     `;

//     // ✅ Build Telegram notification message
//     let telegramText = `✅ <b>Order Completed!</b>\n`;
//     telegramText += `━━━━━━━━━━━━━━━\n`;

//     // Add branch info
//     if (branch_name) {
//       telegramText += `🏢 <b>Branch:</b> ${branch_name}\n`;
//     }

//     const formattedOrderDate = dayjs(order_date).format('DD-MM-YYYY');
//     telegramText += `📅 <b>Date:</b> ${formattedOrderDate}\n`;

//     const firstDescription = order_details
//       .map(item => productDescriptions[item.product_id])
//       .find(desc => desc && desc.trim() !== '');

//     if (firstDescription) {
//       telegramText += `📝 <b>Card Number:</b> <i>${firstDescription}</i>\n`;
//     }

//     telegramText += `\n👤 <b>Customer:</b> ${customer.name}\n`;
//     telegramText += `🏠 <b>Address:</b> ${customer.address}\n`;
//     telegramText += `📞 <b>Phone:</b> ${customer.tel}\n`;
//     telegramText += `📝 <b>Created By:</b> ${createdBy}\n`;
//     telegramText += `\n📦 <b>Items:</b>\n`;

//     order_details.forEach((item, idx) => {
//       let name = productCategories[item.product_id] || '';
//       name = name.replace(/\/?\s*oil\s*\/?/i, '').trim();
//       const qty = Number(item.qty).toLocaleString();
//       const unitPrice = item.price;

//       telegramText += `  ${idx + 1}. <b>${name}</b> - <b>${qty}L</b>\n`;
//       telegramText += `     • Ton Price: <b>$${unitPrice}</b>\n`;
//     });

//     telegramText += `\n🔢 <b>Total Liters:</b> ${totalLiters.toLocaleString()}L\n`;
//     telegramText += `💰 <b>Total:</b> $${parseFloat(order.total_amount).toLocaleString()}\n`;
//     telegramText += `━━━━━━━━━━━━━━━`;

//     // ✅✅✅ USE SMART NOTIFICATION ✅✅✅
//     try {
//       await sendSmartNotification({
//         event_type: 'order_created',
//         branch_name: branch_name, // ✅ Send to specific branch
//         message: telegramText,
//         severity: order.total_amount > 5000 ? 'critical' : 'normal'
//       });

//       console.log(`✅ Order notification sent to branch: ${branch_name || 'N/A'}`);
//     } catch (notifError) {
//       console.error('❌ Failed to send order notification:', notifError);
//       // Don't fail the order creation if notification fails
//     }

//     // Create order
//     const [orderResult] = await db.query(sqlOrder, {
//       ...order,
//       order_no,
//       user_id: req.auth?.id || null,
//       create_by: req.auth?.name || "System",
//       order_date,
//       delivery_date,
//       receive_date
//     });

//     // Create order details
//     const sqlOrderDetails = `
//       INSERT INTO order_detail 
//         (order_id, product_id, qty, price, discount, total) 
//       VALUES 
//         (:order_id, :product_id, :qty, :price, :discount, :total)
//     `;

//     await Promise.all(
//       order_details.map(async (item) => {
//         await db.query(sqlOrderDetails, {
//           ...item,
//           order_id: orderResult.insertId,
//         });

//         // Update stock
//         if (item.product_id !== 0) {
//           const sqlUpdateStock = `
//             UPDATE product 
//             SET qty = qty - :qty 
//             WHERE id = :product_id
//           `;

//           await db.query(sqlUpdateStock, {
//             qty: item.qty,
//             product_id: item.product_id
//           });
//         }
//       })
//     );

//     // Create customer_debt
//     const sqlDebt = `
//       INSERT INTO customer_debt 
//         (customer_id, order_id, category_id, qty, unit_price, actual_price, 
//          total_amount, paid_amount, due_date, notes, created_by, description)
//       VALUES 
//         (:customer_id, :order_id, :category_id, :qty, :unit_price, :actual_price, 
//          :total_amount, :paid_amount, :due_date, :notes, :created_by, :description)
//     `;

//     await Promise.all(order_details.map(async (item) => {
//       const actualPrice = categoryActualPrices[item.product_id] || 0;
//       const calculatedTotal = actualPrice > 0 ? (item.qty * item.price) / actualPrice : 0;
//       const description = productDescriptions[item.product_id] || '';

//       await db.query(sqlDebt, {
//         customer_id: order.customer_id,
//         order_id: orderResult.insertId,
//         category_id: productCategoryIds[item.product_id] || null, 
//         qty: item.qty, 
//         unit_price: item.price, 
//         actual_price: actualPrice,
//         total_amount: calculatedTotal, 
//         paid_amount: 0.00,
//         due_date: order.due_date || null,
//         notes: `Product ID: ${item.product_id}`,
//         created_by: req.auth?.id || null,
//         description: description
//       });
//     }));

//     const [currentOrder] = await db.query(
//       "SELECT * FROM `order` WHERE id = :id",
//       { id: orderResult.insertId }
//     );

//     res.json({
//       order: currentOrder.length > 0 ? currentOrder[0] : null,
//       order_details: order_details,
//       message: "Order created successfully",
//     });

//   } catch (error) {
//     logError("Order.create", error, res);
//   }
// };


exports.create = async (req, res) => {
  try {
    const { order, order_details = [] } = req.body;
    const totalLiters = order_details.reduce((sum, item) => sum + Number(item.qty || 0), 0);

    if (!order.customer_id || !order.total_amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!order.location_id) {
      return res.status(400).json({
        error: "Location is required",
        message: "សូមជ្រើសរើសទីតាំងដឹកជញ្ជូន"
      });
    }

    // ========================================
    // ✅ NEW: GET PRE_ORDER_NO (if order is from pre-order)
    // ========================================
    let pre_order_no = null;

    if (order.pre_order_id) {
      const [preOrder] = await db.query(
        "SELECT pre_order_no FROM pre_order WHERE id = :id",
        { id: order.pre_order_id }
      );

      if (preOrder.length > 0) {
        pre_order_no = preOrder[0].pre_order_no;
      }
    }

    // ✅ Get branch name and group from auth
    const branch_name = req.auth?.branch_name || null;
    const group_id = req.auth?.group_id || null;

    // Get customer info
    const [customerResult] = await db.query(
      "SELECT name, address, tel FROM customer WHERE id = :id",
      { id: order.customer_id }
    );
    const customer = customerResult.length > 0 ? customerResult[0] : {
      name: `ID: ${order.customer_id}`,
      address: "N/A",
      tel: "N/A"
    };

    const productCategories = {};
    const productCategoryIds = {};
    const categoryActualPrices = {};
    const productDescriptions = {};

    // Get product info
    for (const item of order_details) {
      const [productResult] = await db.query(
        `SELECT 
          p.id, 
          p.name AS product_name, 
          p.description AS product_description,
          p.category_id, 
          p.qty,
          p.actual_price AS product_actual_price,
          c.name AS category_name, 
          c.actual_price AS category_actual_price,
          pd.description AS details_description
         FROM product p 
         LEFT JOIN category c ON p.category_id = c.id
         LEFT JOIN product_details pd ON p.id = pd.product_id 
           AND pd.customer_id = :customer_id
         WHERE p.id = :id
         LIMIT 1`,
        {
          id: item.product_id,
          customer_id: order.customer_id
        }
      );

      if (productResult.length > 0) {
        const prod = productResult[0];
        productCategories[item.product_id] = `${prod.category_name} / ${prod.product_name}`;
        productCategoryIds[item.product_id] = prod.category_id;
        categoryActualPrices[item.product_id] = prod.product_actual_price || prod.category_actual_price || 0;

        productDescriptions[item.product_id] =
          item.description ||
          prod.details_description ||
          prod.product_description ||
          '';

        // ✅ STOCK VALIDATION CHECK
        if (item.product_id !== 0) {
          const currentQty = Number(prod.qty || 0);
          const requestedQty = Number(item.qty || 0);

          if (requestedQty > currentQty) {
            return res.status(400).json({
              error: "Insufficient Stock",
              message: `ស្តុកមិនគ្រប់គ្រាន់សម្រាប់ ${prod.product_name} (មានតែ ${currentQty.toLocaleString()}L ប៉ុណ្ណោះ)`,
              details: `Insufficient stock for ${prod.product_name} (Only ${currentQty}L available)`
            });
          }
        }
      }
    }

    const order_no = await newOrderNo();
    const order_date = order.order_date || new Date().toISOString().slice(0, 10);
    const delivery_date = order.delivery_date || order_date;
    const receive_date = order.receive_date || null;
    const createdBy = req.auth?.name || "System";

    // ========================================
    // ✅ UPDATED: SQL INSERT with pre_order_no
    // ========================================
    const sqlOrder = `
     INSERT INTO \`order\` 
        (order_no, pre_order_no, customer_id, location_id, truck_id, total_amount, paid_amount, 
         payment_method, remark, user_id, create_by, order_date, delivery_date, receive_date) 
      VALUES 
        (:order_no, :pre_order_no, :customer_id, :location_id, :truck_id, :total_amount, :paid_amount, 
         :payment_method, :remark, :user_id, :create_by, :order_date, :delivery_date, :receive_date)
    `;

    // Build notification messages
    let notificationMessage = `Order Completed!\n\n`;
    if (branch_name) {
      notificationMessage += `Branch: ${branch_name}\n`;
    }

    // ✅ ADD: Pre-Order reference in notification
    if (pre_order_no) {
      notificationMessage += `Card Number #: ${pre_order_no}\n`;
    }

    const formattedOrderDate = dayjs(order_date).format('DD-MM-YYYY');
    notificationMessage += `Date: ${formattedOrderDate}\n`;

    const firstDescription = order_details
      .map(item => productDescriptions[item.product_id])
      .find(desc => desc && desc.trim() !== '');

    if (firstDescription) {
      notificationMessage += `Card Number: ${firstDescription}\n`;
    }

    notificationMessage += `\nCustomer: ${customer.name}\n`;
    notificationMessage += `Address: ${customer.address}\n`;
    notificationMessage += `Phone: ${customer.tel}\n`;
    notificationMessage += `Created By: ${createdBy}\n`;
    notificationMessage += `\nItems:\n`;

    let items = [];
    order_details.forEach((item, idx) => {
      let name = productCategories[item.product_id] || '';
      name = name.replace(/\/?\s*oil\s*\/?/i, '').trim();
      const qty = Number(item.qty).toLocaleString();
      const unitPrice = item.price;

      notificationMessage += `  ${idx + 1}. ${name} - ${qty}L\n`;
      notificationMessage += `     • Selling Price: $${unitPrice}\n`;

      items.push({
        name,
        quantity: item.qty,
        unit_price: unitPrice
      });
    });

    notificationMessage += `\nTotal Liters: ${totalLiters.toLocaleString()}L\n`;
    notificationMessage += `Total: $${parseFloat(order.total_amount).toLocaleString()}`;

    // Build Telegram message
    let telegramText = `✅ <b>Order Completed!</b>\n`;
    telegramText += `━━━━━━━━━━━━━━━\n`;

    if (branch_name) {
      telegramText += `🏢 <b>Branch:</b> ${branch_name}\n`;
    }

    // ✅ ADD: Pre-Order reference in Telegram
    if (pre_order_no) {
      telegramText += `🔖 <b>Pre-Order #:</b> <code>${pre_order_no}</code>\n`;
    }

    telegramText += `📅 <b>Date:</b> ${formattedOrderDate}\n`;

    if (firstDescription) {
      telegramText += `📝 <b>Card Number:</b> <i>${firstDescription}</i>\n`;
    }

    telegramText += `\n👤 <b>Customer:</b> ${customer.name}\n`;
    telegramText += `🏠 <b>Address:</b> ${customer.address}\n`;
    telegramText += `📞 <b>Phone:</b> ${customer.tel}\n`;
    telegramText += `📝 <b>Created By:</b> ${createdBy}\n`;
    telegramText += `\n📦 <b>Items:</b>\n`;

    order_details.forEach((item, idx) => {
      let name = productCategories[item.product_id] || '';
      name = name.replace(/\/?\s*oil\s*\/?/i, '').trim();
      const qty = Number(item.qty).toLocaleString();
      const unitPrice = item.price;

      telegramText += `  ${idx + 1}. <b>${name}</b> - <b>${qty}L</b>\n`;
      telegramText += `     • Selling Price: <b>$${unitPrice}</b>\n`;
    });

    telegramText += `\n🔢 <b>Total Liters:</b> ${totalLiters.toLocaleString()}L\n`;
    telegramText += `💰 <b>Total:</b> $${parseFloat(order.total_amount).toLocaleString()}\n`;
    telegramText += `━━━━━━━━━━━━━━━`;

    // Send Telegram notification (don't wait)
    sendSmartNotification({
      event_type: 'order_created',
      branch_name: branch_name,
      message: telegramText,
      severity: order.total_amount > 5000 ? 'critical' : 'normal'
    }).catch(err => console.error('❌ Telegram notification failed:', err));

    // ========================================
    // ✅ UPDATED: Create order with pre_order_no
    // ========================================
    const [orderResult] = await db.query(sqlOrder, {
      ...order,
      order_no,
      pre_order_no,  // ✅ ADD THIS
      location_id: order.location_id || null,
      truck_id: order.truck_id || null,
      user_id: req.auth?.id || null,
      create_by: req.auth?.name || "System",
      order_date,
      delivery_date,
      receive_date
    });


    // Create system notification
    try {
      await createSystemNotification({
        notification_type: 'order_created',
        title: `✅ Order ${order_no} Created${pre_order_no ? ` (PO: ${pre_order_no})` : ''}`,
        message: notificationMessage,
        data: {
          items: items,
          order_details: order_details,
          pre_order_no: pre_order_no  // ✅ ADD THIS
        },
        order_id: orderResult.insertId,
        order_no: order_no,
        pre_order_no: pre_order_no,  // ✅ ADD THIS
        customer_id: order.customer_id,
        customer_name: customer.name,
        customer_address: customer.address,
        customer_tel: customer.tel,
        total_amount: parseFloat(order.total_amount),
        total_liters: totalLiters,
        card_number: firstDescription || null,
        user_id: req.auth?.id || null,
        created_by: createdBy,
        branch_name: branch_name,
        group_id: group_id,
        priority: order.total_amount > 5000 ? 'high' : 'normal',
        severity: 'success',
        icon: '✅',
        color: 'green',
        action_url: `/orders/${orderResult.insertId}`
      });
    } catch (notifError) {
      console.error('❌ Failed to create system notification:', notifError);
    }

    // Create delivery tracking if truck assigned
    if (order.truck_id) {
      try {
        await db.query(
          `INSERT INTO delivery_tracking 
            (order_id, truck_id, location_id, status, created_by, timestamp)
           VALUES 
            (:order_id, :truck_id, :location_id, 'preparing', :created_by, NOW())`,
          {
            order_id: orderResult.insertId,
            truck_id: order.truck_id,
            location_id: order.location_id,
            created_by: req.auth?.id || null
          }
        );

        await db.query(
          `UPDATE \`order\` SET delivery_status = 'preparing' WHERE id = :order_id`,
          { order_id: orderResult.insertId }
        );
      } catch (trackingError) {
        console.error('❌ Failed to create delivery tracking:', trackingError);
      }
    }

    // Create order details
    const sqlOrderDetails = `
      INSERT INTO order_detail 
        (order_id, product_id, qty, price, discount, total) 
      VALUES 
        (:order_id, :product_id, :qty, :price, :discount, :total)
    `;

    // ✅ Process order details with robust PO reference lookup
    await Promise.all(
      order_details.map(async (item) => {
        // Insert order_detail
        await db.query(sqlOrderDetails, {
          ...item,
          order_id: orderResult.insertId,
        });

        // Update stock and create inventory transaction
        if (item.product_id !== 0) {
          // Update product stock
          const sqlUpdateStock = `
            UPDATE product 
            SET qty = qty - :qty 
            WHERE id = :product_id
          `;

          await db.query(sqlUpdateStock, {
            qty: item.qty,
            product_id: item.product_id
          });

          // ✅ ROBUST PO REFERENCE LOOKUP (Multiple Fallback Strategies)
          let purchaseOrderRef = null;

          // Strategy 1: Use description from frontend if provided
          if (item.description && item.description.trim() !== '') {
            purchaseOrderRef = item.description.trim();
          }

          // Strategy 2: Query product_details table (by customer)
          if (!purchaseOrderRef) {
            try {
              const [pdResult] = await db.query(
                `SELECT description 
                 FROM product_details 
                 WHERE product_id = :product_id 
                   AND customer_id = :customer_id
                   AND description IS NOT NULL
                   AND description != ''
                 ORDER BY created_at DESC
                 LIMIT 1`,
                {
                  product_id: item.product_id,
                  customer_id: order.customer_id
                }
              );

              if (pdResult && pdResult.length > 0) {
                purchaseOrderRef = pdResult[0].description;
              }
            } catch (err) {
              console.error(`❌ Query product_details by customer failed:`, err);
            }
          }

          // Strategy 3: Query product_details table (any customer)
          if (!purchaseOrderRef) {
            try {
              const [pdResult2] = await db.query(
                `SELECT description 
                 FROM product_details 
                 WHERE product_id = :product_id
                   AND description IS NOT NULL
                   AND description != ''
                 ORDER BY created_at DESC
                 LIMIT 1`,
                {
                  product_id: item.product_id
                }
              );

              if (pdResult2 && pdResult2.length > 0) {
                purchaseOrderRef = pdResult2[0].description;
              }
            } catch (err) {
              console.error(`❌ Query product_details (any) failed:`, err);
            }
          }

          // Strategy 4: Query inventory_transaction for latest PURCHASE_IN
          if (!purchaseOrderRef) {
            try {
              const [itResult] = await db.query(
                `SELECT reference_no 
                 FROM inventory_transaction 
                 WHERE product_id = :product_id
                   AND transaction_type IN ('PURCHASE_IN', 'purchase_in')
                   AND reference_no IS NOT NULL
                   AND reference_no != ''
                 ORDER BY created_at DESC
                 LIMIT 1`,
                {
                  product_id: item.product_id
                }
              );

              if (itResult && itResult.length > 0) {
                purchaseOrderRef = itResult[0].reference_no;
              }
            } catch (err) {
              console.error(`❌ Query inventory_transaction failed:`, err);
            }
          }

          // ========================================
          // ✅ NEW: Use pre_order_no if available and no PO found
          // ========================================
          if (!purchaseOrderRef && pre_order_no) {
            purchaseOrderRef = pre_order_no;
          }

          // Strategy 5: Fallback to order_no if all else fails
          if (!purchaseOrderRef) {
            purchaseOrderRef = order_no;
          }

          // Get actual_price for this product
          const actualPrice = categoryActualPrices[item.product_id] || 1;

          // ✅ INSERT INVENTORY TRANSACTION with all required fields
          const sqlInventory = `
            INSERT INTO inventory_transaction (
              product_id, 
              transaction_type, 
              quantity, 
              unit_price, 
              selling_price,
              actual_price,
              reference_no,
              notes,
              user_id,
              created_at
            ) VALUES (
              :product_id, 
              'SALE_OUT', 
              :quantity, 
              :unit_price, 
              :selling_price,
              :actual_price,
              :reference_no,
              :notes,
              :user_id,
              NOW()
            )
          `;

          // ========================================
          // ✅ UPDATED: Notes include pre_order_no reference
          // ========================================
          const notes = pre_order_no
            ? `Sale Order ${order_no} (PO: ${pre_order_no})${purchaseOrderRef !== order_no && purchaseOrderRef !== pre_order_no ? ` - Ref: ${purchaseOrderRef}` : ''}`
            : `Sale Order ${order_no}${purchaseOrderRef !== order_no ? ` (PO: ${purchaseOrderRef})` : ''}`;

          await db.query(sqlInventory, {
            product_id: item.product_id,
            quantity: -item.qty,                        // Negative for sale
            unit_price: item.price,                     // Selling price
            selling_price: item.price,                  // ✅ Explicit selling_price
            actual_price: actualPrice,                  // ✅ Conversion factor
            reference_no: purchaseOrderRef,             // ✅ Uses PO number or pre_order_no!
            notes: notes,
            user_id: req.auth?.id || null
          });

        }
      })
    );

    // Create customer_debt
    const sqlDebt = `
      INSERT INTO customer_debt 
        (customer_id, order_id,pre_order_no, category_id, qty, unit_price, actual_price, 
         total_amount, paid_amount, due_date, notes, created_by, description)
      VALUES 
        (:customer_id, :order_id, :pre_order_no, :category_id, :qty, :unit_price, :actual_price, 
         :total_amount, :paid_amount, :due_date, :notes, :created_by, :description)
    `;

    await Promise.all(order_details.map(async (item) => {
      const actualPrice = categoryActualPrices[item.product_id] || 0;
      const calculatedTotal = actualPrice > 0 ? (item.qty * item.price) / actualPrice : 0;
      const description = productDescriptions[item.product_id] || '';

      await db.query(sqlDebt, {
        customer_id: order.customer_id,
        order_id: orderResult.insertId,
        pre_order_no: pre_order_no,
        category_id: productCategoryIds[item.product_id] || null,
        qty: item.qty,
        unit_price: item.price,
        actual_price: actualPrice,
        total_amount: calculatedTotal,
        paid_amount: 0.00,
        due_date: order.due_date || null,
        notes: `Product ID: ${item.product_id}`,
        created_by: req.auth?.id || null,
        description: description
      });
    }));

    // Get final order details
    const [currentOrder] = await db.query(
      "SELECT * FROM `order` WHERE id = :id",
      { id: orderResult.insertId }
    );

    // ========================================
    // ✅ UPDATED: Return pre_order_no in response
    // ========================================
    res.json({
      order: currentOrder.length > 0 ? currentOrder[0] : null,
      order_details: order_details,
      message: "Order created successfully",
      pre_order_no: pre_order_no  // ✅ ADD THIS for frontend
    });

    // ========================================
    // ✅ UPDATE PRE-ORDER (if applicable)
    // ========================================
    if (order.pre_order_id) {
      try {

        // Update each product
        for (const item of order_details) {
          await db.query(`
            UPDATE pre_order_detail
            SET 
              remaining_qty = GREATEST(remaining_qty - :qty, 0),
              delivered_qty = COALESCE(delivered_qty, 0) + :qty,
              updated_at = NOW()
            WHERE pre_order_id = :pre_order_id
              AND product_id = :product_id
          `, {
            pre_order_id: order.pre_order_id,
            product_id: item.product_id,
            qty: item.qty
          });
        }

        // Check remaining
        const [remainingCheck] = await db.query(`
          SELECT SUM(remaining_qty) as total_remaining
          FROM pre_order_detail
          WHERE pre_order_id = :pre_order_id
        `, { pre_order_id: order.pre_order_id });

        const totalRemaining = parseFloat(remainingCheck[0]?.total_remaining || 0);
        const newStatus = totalRemaining > 0 ? 'partially_delivered' : 'delivered';

        // Update pre-order status
        await db.query(`
          UPDATE pre_order
          SET status = :status, updated_at = NOW()
          WHERE id = :pre_order_id
        `, {
          status: newStatus,
          pre_order_id: order.pre_order_id
        });

      } catch (error) {
        console.error("❌ Pre-Order deduction error:", error);
      }
    }

  } catch (error) {
    logError("Order.create", error, res);
  }
};

// Helper function
const newOrderNo = async (req, res) => {
  try {
    var sql =
      "SELECT " +
      "CONCAT('INV',LPAD((SELECT COALESCE(MAX(id),0) + 1 FROM `order`), 3, '0')) " +
      "as order_no";
    var [data] = await db.query(sql);
    return data[0].order_no;
  } catch (error) {
    logError("newOrderNo.create", error, res);
  }
};

exports.getOrderHistory = async (req, res) => {
  try {
    const { user_id } = req.query;
    if (user_id && isNaN(parseInt(user_id))) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    let sql = `
      SELECT o.*, 
             c.name as customer_name, 
             c.address as customer_address, 
             c.tel as customer_tel,
             u.name as user_name,
             b.name as branch_name,
             b.address as branch_address,
             b.tel as branch_tel
      FROM \`order\` o
      LEFT JOIN customer c ON o.customer_id = c.id
      LEFT JOIN user u ON o.user_id = u.id
      LEFT JOIN branch b ON u.branch_id = b.id
      WHERE 1=1
    `;
    const params = {};
    if (user_id) {
      sql += " AND o.user_id = :user_id";
      params.user_id = user_id;
    }

    sql += " ORDER BY o.create_at DESC";

    const [orders] = await db.query(sql, params);

    res.json({
      list: orders,
      total: orders.length,
      message: "Order history retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching order history:", error);
    res.status(500).json({
      error: "Failed to retrieve order history",
      details: error.message
    });
  }
};

// ✅ Order Detail API endpoint with Description
exports.getOrderDetail = async (req, res) => {
  try {
    const orderId = req.params.orderId;

    // Validate order ID
    if (!orderId || isNaN(parseInt(orderId))) {
      return res.status(400).json({ error: "Invalid order ID" });
    }

    // ✅ Query with description from customer_debt
    const sql = `
      SELECT 
        od.*,
        p.barcode,
        p.name as product_name,
        p.photo,
        p.unit,
        p.category_id,
        od.price,
        c.name as category_name,
        (od.qty * od.price) as grand_total,
        od.qty as total_quantity,
        o.customer_id,
        o.pre_order_no,
        
        -- ✅ យក description ពី robust lookup (ដូចក្នុង getList)
        COALESCE(
          -- Strategy 1: From customer_debt.description
          (
            SELECT cd.description
            FROM customer_debt cd
            WHERE cd.order_id = o.id
              AND cd.customer_id = o.customer_id
              AND cd.category_id = p.category_id
              AND cd.description IS NOT NULL
              AND cd.description != ''
              AND cd.description NOT LIKE 'Product ID:%'
            ORDER BY cd.id DESC
            LIMIT 1
          ),
          -- Strategy 2: From inventory_transaction.reference_no
          (
            SELECT it.reference_no
            FROM inventory_transaction it
            WHERE it.product_id = od.product_id
              AND it.transaction_type = 'SALE_OUT'
              AND it.reference_no IS NOT NULL
              AND it.reference_no != ''
              AND it.reference_no != o.order_no
              AND DATE(it.created_at) = DATE(o.create_at)
            ORDER BY it.created_at DESC
            LIMIT 1
          ),
          -- Strategy 3: From inventory_transaction.notes
          (
            SELECT 
              SUBSTRING_INDEX(SUBSTRING_INDEX(it.notes, 'PO: ', -1), ')', 1)
            FROM inventory_transaction it
            WHERE it.product_id = od.product_id
              AND it.transaction_type = 'SALE_OUT'
              AND it.notes LIKE '%PO:%'
              AND DATE(it.created_at) = DATE(o.create_at)
            ORDER BY it.created_at DESC
            LIMIT 1
          ),
          -- Strategy 4: From product_details
          (
            SELECT pd.description
            FROM product_details pd
            WHERE pd.customer_id = o.customer_id
              AND CAST(pd.category AS UNSIGNED) = p.category_id
              AND pd.description IS NOT NULL
              AND pd.description != ''
            ORDER BY pd.created_at DESC
            LIMIT 1
          ),
          -- Fallback
          p.description
        ) AS product_description
        
      FROM order_detail od
      LEFT JOIN product p ON od.product_id = p.id
      LEFT JOIN category c ON p.category_id = c.id
      LEFT JOIN \`order\` o ON od.order_id = o.id
      WHERE od.order_id = :orderId
      ORDER BY od.id ASC
    `;

    // Execute the query
    const [details] = await db.query(sql, { orderId });

    // Return the results
    res.json({
      list: details,
      total: details.length,
      message: "Order details retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({
      error: "Failed to retrieve order details",
      details: error.message
    });
  }
};

// ✅ Get One Order Summary with Description
exports.getone = async (req, res) => {
  try {
    const orderId = req.params.id;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    const sql = `
      SELECT 
        od.order_id,
        p.name AS product_name,
        c.name AS category_name,
        od.price,
        o.total_amount AS total_amount_price,
        o.customer_id,
        o.pre_order_no,
        p.discount,
        p.unit,
        p.category_id,
        SUM(od.qty) AS total_quantity,
        SUM(od.qty * od.price * (1 - COALESCE(p.discount, 0)/100) / NULLIF(p.actual_price, 0)) AS grand_total,
        
        -- ✅ បន្ថែម robust description lookup
        COALESCE(
          -- Strategy 1: From customer_debt.description
          (
            SELECT cd.description
            FROM customer_debt cd
            WHERE cd.order_id = o.id
              AND cd.customer_id = o.customer_id
              AND cd.category_id = p.category_id
              AND cd.description IS NOT NULL
              AND cd.description != ''
              AND cd.description NOT LIKE 'Product ID:%'
            ORDER BY cd.id DESC
            LIMIT 1
          ),
          -- Strategy 2: From inventory_transaction.reference_no
          (
            SELECT it.reference_no
            FROM inventory_transaction it
            WHERE it.product_id = od.product_id
              AND it.transaction_type = 'SALE_OUT'
              AND it.reference_no IS NOT NULL
              AND it.reference_no != ''
              AND it.reference_no != o.order_no
              AND DATE(it.created_at) = DATE(o.create_at)
            ORDER BY it.created_at DESC
            LIMIT 1
          ),
          -- Strategy 3: From inventory_transaction.notes
          (
            SELECT 
              SUBSTRING_INDEX(SUBSTRING_INDEX(it.notes, 'PO: ', -1), ')', 1)
            FROM inventory_transaction it
            WHERE it.product_id = od.product_id
              AND it.transaction_type = 'SALE_OUT'
              AND it.notes LIKE '%PO:%'
              AND DATE(it.created_at) = DATE(o.create_at)
            ORDER BY it.created_at DESC
            LIMIT 1
          ),
          -- Strategy 4: From product_details
          (
            SELECT pd.description
            FROM product_details pd
            WHERE pd.customer_id = o.customer_id
              AND CAST(pd.category AS UNSIGNED) = p.category_id
              AND pd.description IS NOT NULL
              AND pd.description != ''
            ORDER BY pd.created_at DESC
            LIMIT 1
          ),
          -- Fallback
          o.pre_order_no,
          p.description
        ) AS product_description
        
      FROM order_detail od
      INNER JOIN product p ON od.product_id = p.id
      INNER JOIN category c ON p.category_id = c.id
      INNER JOIN \`order\` o ON od.order_id = o.id
      WHERE od.order_id = ?
      GROUP BY 
        od.order_id, 
        p.name, 
        c.name, 
        od.price, 
        p.discount, 
        p.unit, 
        o.total_amount, 
        p.category_id, 
        o.customer_id, 
        o.pre_order_no,
        od.product_id,
        o.id,
        o.create_at
      ORDER BY c.name, p.name
    `;

    const [rows] = await db.query(sql, [orderId]);

    return res.json({
      error: false,
      list: rows
    });
  } catch (error) {
    console.error("Error in getone.order:", error);
    return res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
};

exports.update = async (req, res) => {
  try {
    var sql =
      "UPDATE  order set name=:name, code=:code, tel=:tel, email=:email, address=:address, website=:website, note=:note WHERE id=:id ";
    var [data] = await db.query(sql, {
      ...req.body,
    });
    res.json({
      data: data,
      message: "Update success!",
    });
  } catch (error) {
    logError("order.update", error, res);
  }
};

// In your backend controller
exports.processPayment = async (req, res) => {
  try {
    const { customer_id, order_id, amount, payment_method, notes = '' } = req.body;

    // 1. Validate amount
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "ចំនួនប្រាក់ត្រូវតែធំជាង 0"
      });
    }

    // 2. Get original order data with group filtering
    var [order] = await db.query(
      `SELECT o.total_amount, o.paid_amount, o.payment_status, o.user_id 
       FROM \`order\` o
       JOIN user u ON o.user_id = u.id
       JOIN user cu ON cu.group_id = u.group_id
       WHERE o.id = :order_id AND cu.id = :current_user_id 
       LIMIT 1`,
      {
        order_id,
        current_user_id: req.current_id
      }
    );

    if (!order || order.length === 0) {
      return res.status(404).json({
        success: false,
        error: "រកមិនឃើញការកម្មង់ ឬអ្នកមិនមានសិទ្ធិចូលប្រើ"
      });
    }

    const currentPaid = parseFloat(order[0].paid_amount);
    const totalAmount = parseFloat(order[0].total_amount);
    const newPaidAmount = currentPaid + parseFloat(amount);
    const user_id = order[0].user_id;

    // 3. Check for overpayment
    if (newPaidAmount > totalAmount) {
      return res.status(400).json({
        success: false,
        error: `បង់លើសចំនួន។ អាចបង់បានអតិបរមា: ${totalAmount - currentPaid}`
      });
    }

    // 4. Update order (with additional group check for security)
    var [updateOrder] = await db.query(
      `UPDATE \`order\` o
       JOIN user u ON o.user_id = u.id
       JOIN user cu ON cu.group_id = u.group_id
       SET o.paid_amount = :newPaidAmount,
           o.payment_method = :payment_method,
           o.payment_status = :payment_status,
           o.total_due = o.total_amount - :newPaidAmount,
           o.updated_at = NOW()
       WHERE o.id = :order_id AND cu.id = :current_user_id`,
      {
        newPaidAmount,
        payment_method,
        payment_status: newPaidAmount >= totalAmount ? 'Paid' : 'Partial',
        order_id,
        current_user_id: req.current_id
      }
    );

    // 5. Create payment record
    var [payment] = await db.query(
      `INSERT INTO payments
        (order_id, customer_id, amount, payment_method, notes, payment_date, created_by)
       VALUES (:order_id, :customer_id, :amount, :payment_method, :notes, NOW(), :created_by)`,
      {
        order_id,
        customer_id,
        amount,
        payment_method,
        notes,
        created_by: req.current_id
      }
    );

    // 6. Get detailed updated order data with formatted results (with group filtering)
    var [updatedOrderDetails] = await db.query(
      `SELECT 
        orders.id, 
        orders.order_no AS INV_NUMBER,
        orders.customer_id,
        c.name AS customer_name,
        c.address AS branch_name,
        c.tel AS tel,
        u.username AS create_by,
        orders.create_at AS order_date,
        orders.paid_amount,
        orders.total_amount,
        (orders.total_amount - orders.paid_amount) AS due_amount,
        CASE 
          WHEN (orders.total_amount - orders.paid_amount) = 0 THEN 'Paid'
          WHEN orders.paid_amount > 0 THEN 'Partial'
          ELSE 'Unpaid'
        END AS payment_status,
        orders.payment_method
      FROM \`order\` AS orders
      JOIN customer c ON orders.customer_id = c.id
      JOIN user u ON orders.user_id = u.id
      JOIN user cu ON cu.group_id = u.group_id
      WHERE orders.id = :order_id AND cu.id = :current_user_id`,
      {
        order_id,
        current_user_id: req.current_id
      }
    );

    // 7. Get recent payment history for this order (with group filtering for security)
    var [paymentHistory] = await db.query(
      `SELECT 
        p.id, 
        p.amount, 
        p.payment_method, 
        p.notes, 
        DATE_FORMAT(p.payment_date, '%Y-%m-%d %H:%i:%s') AS payment_date 
      FROM payments p
      JOIN \`order\` o ON p.order_id = o.id
      JOIN user u ON o.user_id = u.id
      JOIN user cu ON cu.group_id = u.group_id
      WHERE p.order_id = :order_id AND cu.id = :current_user_id
      ORDER BY p.payment_date DESC 
      LIMIT 5`,
      {
        order_id,
        current_user_id: req.current_id
      }
    );

    res.json({
      success: true,
      message: "បង់ប្រាក់បានជោគជ័យ",
      data: {
        order: updatedOrderDetails[0],
        payment_history: paymentHistory,
        new_balance: totalAmount - newPaidAmount,
        payment_status: newPaidAmount >= totalAmount ? 'Paid' : 'Partial'
      }
    });

  } catch (error) {
    console.error("កំហុសក្នុងការបង់ប្រាក់:", error);
    res.status(500).json({
      success: false,
      error: error.message || "បង់ប្រាក់មិនបានជោគជ័យ"
    });
  }
};

exports.getPaymentHistory = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { search, payment_method, from_date, to_date, page = 1, limit = 10 } = req.query;

    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const offset = (pageInt - 1) * limitInt;

    let sqlQuery = `
      SELECT 
        p.id,
        p.order_id,
        p.customer_id,
        p.slips,
        p.amount,
        p.payment_method,
        p.notes,
        p.description as product_description, -- ✅ យក description ពី payments table
        DATE_FORMAT(p.payment_date, '%Y-%m-%d %H:%i:%s') AS payment_date,
        DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
        DATE_FORMAT(p.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at,
        o.order_no, 
        c.name AS customer_name,
        c.tel AS customer_phone,
        c.email AS customer_email,
        u.username AS collected_by,
        o.total_amount AS order_total,
        o.paid_amount AS order_paid,
        (o.total_amount - o.paid_amount) AS order_balance
      FROM payments p
      JOIN \`order\` o ON p.order_id = o.id
      JOIN customer c ON p.customer_id = c.id
      JOIN user u ON o.user_id = u.id
      JOIN user cu ON cu.group_id = u.group_id
      WHERE cu.id = ?
    `;

    const queryParams = [req.current_id];
    const conditions = [];

    if (from_date) {
      conditions.push(`DATE(p.payment_date) >= DATE(?)`);
      queryParams.push(from_date);
    }

    if (to_date) {
      conditions.push(`DATE(p.payment_date) <= DATE(?)`);
      queryParams.push(to_date);
    }

    if (payment_method) {
      conditions.push(`p.payment_method = ?`);
      queryParams.push(payment_method);
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      conditions.push(`(
        c.name LIKE ? OR 
        c.tel LIKE ? OR 
        c.email LIKE ? OR 
        o.order_no LIKE ? OR 
        p.notes LIKE ? OR
        p.description LIKE ?
      )`);
      queryParams.push(term, term, term, term, term, term);
    }

    if (conditions.length) {
      sqlQuery += ` AND ${conditions.join(' AND ')}`;
    }

    sqlQuery += ` ORDER BY p.payment_date DESC LIMIT ? OFFSET ?`;
    queryParams.push(limitInt, offset);

    const countQuery = `
      SELECT COUNT(p.id) AS total
      FROM payments p
      JOIN \`order\` o ON p.order_id = o.id
      JOIN customer c ON p.customer_id = c.id
      JOIN user u ON o.user_id = u.id
      JOIN user cu ON cu.group_id = u.group_id
      WHERE cu.id = ?
      ${conditions.length ? `AND ${conditions.join(' AND ')}` : ''}
    `;
    const countQueryParams = [req.current_id, ...queryParams.slice(1, queryParams.length - 2)];

    const [countResult] = await db.query(countQuery, countQueryParams);
    const total = countResult[0]?.total || 0;

    let [list] = await db.query(sqlQuery, queryParams);

    list = list.map(row => {
      try {
        row.slips = row.slips ? JSON.parse(row.slips) : [];
        if (!Array.isArray(row.slips)) row.slips = [];
      } catch (e) {
        row.slips = [];
      }
      return row;
    });

    res.json({
      success: true,
      data: {
        list,
        pagination: {
          total,
          totalPages: Math.ceil(total / limitInt),
          currentPage: pageInt,
          pageSize: limitInt
        }
      }
    });

  } catch (error) {
    logError("order.getPaymentHistory", error, res);
  }
};

// exports.getPaymentHistory = async (req, res) => {
//   try {
//     const { user_id } = req.params;
//     const { search, payment_method, from_date, to_date, page = 1, limit = 10 } = req.query;

//     const pageInt = parseInt(page);
//     const limitInt = parseInt(limit);
//     const offset = (pageInt - 1) * limitInt;

//     let sqlQuery = `
//       SELECT 
//         p.id,
//         p.order_id,
//         p.customer_id,
//         p.slips,
//         p.amount,
//         p.payment_method,
//         p.notes,
//         DATE_FORMAT(p.payment_date, '%Y-%m-%d %H:%i:%s') AS payment_date,
//         DATE_FORMAT(p.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
//         DATE_FORMAT(p.updated_at, '%Y-%m-%d %H:%i:%s') AS updated_at,
//         o.order_no,
//         c.name AS customer_name,
//         c.tel AS customer_phone,
//         c.email AS customer_email,
//         u.username AS collected_by,
//         o.total_amount AS order_total,
//         o.paid_amount AS order_paid,
//         (o.total_amount - o.paid_amount) AS order_balance,
//         (SELECT ct.name 
//          FROM order_detail od 
//          JOIN product pr ON od.product_id = pr.id 
//          JOIN category ct ON pr.category_id = ct.id 
//          WHERE od.order_id = p.order_id LIMIT 1) AS category_name
//       FROM payments p
//       JOIN \`order\` o ON p.order_id = o.id
//       JOIN customer c ON p.customer_id = c.id
//       JOIN user u ON o.user_id = u.id
//       JOIN user cu ON cu.group_id = u.group_id
//       WHERE cu.id = ?
//     `;

//     const queryParams = [req.current_id]; // Use current_id from token instead of user_id param
//     const conditions = [];

//     if (from_date) { conditions.push(`p.payment_date >= ?`); queryParams.push(from_date); }
//     if (to_date) { conditions.push(`p.payment_date <= ?`); queryParams.push(to_date + ' 23:59:59'); }
//     if (payment_method) { conditions.push(`p.payment_method = ?`); queryParams.push(payment_method); }
//     if (search && search.trim() !== '') {
//       const term = `%${search.trim()}%`;
//       conditions.push(`(c.name LIKE ? OR o.order_no LIKE ? OR c.tel LIKE ? OR p.notes LIKE ?)`);
//       queryParams.push(term, term, term, term);
//     }

//     if (conditions.length) { sqlQuery += ` AND ${conditions.join(' AND ')}`; }

//     sqlQuery += ` ORDER BY p.payment_date DESC LIMIT ? OFFSET ?`;
//     queryParams.push(limitInt, offset);

//     const countQuery = `
//       SELECT COUNT(p.id) AS total
//       FROM payments p
//       JOIN \`order\` o ON p.order_id = o.id
//       JOIN customer c ON p.customer_id = c.id
//       JOIN user u ON o.user_id = u.id
//       JOIN user cu ON cu.group_id = u.group_id
//       WHERE cu.id = ?
//       ${conditions.length ? `AND ${conditions.join(' AND ')}` : ''}
//     `;
//     const countQueryParams = [req.current_id, ...queryParams.slice(1, queryParams.length - 2)];

//     const [countResult] = await db.query(countQuery, countQueryParams);
//     const total = countResult[0]?.total || 0;

//     let [list] = await db.query(sqlQuery, queryParams);

//     // Process slips (simply parse JSON)
//     list = list.map(row => {
//       try {
//         row.slips = row.slips ? JSON.parse(row.slips) : [];
//         if (!Array.isArray(row.slips)) row.slips = [];
//       } catch (e) {
//         row.slips = [];
//       }
//       return row;
//     });

//     res.json({
//       success: true,
//       data: {
//         list,
//         pagination: {
//           total,
//           totalPages: Math.ceil(total / limitInt),
//           currentPage: pageInt,
//           pageSize: limitInt
//         }
//       }
//     });

//   } catch (error) {
//     logError("order.getPaymentHistory", error, res);
//   }
// };

exports.updatePayment = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      amount,
      payment_method,
      payment_date,
      notes,
      bank
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: "ចំនួនទឹកប្រាក់ត្រូវតែធំជាង 0"
      });
    }

    const [existingPayment] = await connection.query(`
      SELECT 
        p.*,
        o.id as order_id,
        u.group_id
      FROM payments p
      JOIN \`order\` o ON p.order_id = o.id
      JOIN user u ON o.user_id = u.id
      WHERE p.id = ?
    `, [id]);

    if (!existingPayment.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: "រកមិនឃើញការទូទាត់នេះ"
      });
    }

    // Verify user belongs to the same group
    const [currentUser] = await connection.query(`
      SELECT group_id FROM user WHERE id = ?
    `, [req.current_id]);

    if (existingPayment[0].group_id !== currentUser[0].group_id) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        error: "អ្នកមិនមានសិទ្ធិកែប្រែការទូទាត់នេះទេ"
      });
    }

    const oldAmount = parseFloat(existingPayment[0].amount);
    const newAmount = parseFloat(amount);
    const amountDifference = newAmount - oldAmount;
    const orderId = existingPayment[0].order_id;

    // ✅ Update payment record
    await connection.query(`
      UPDATE payments SET 
        amount = ?,
        payment_method = ?,
        bank = ?,
        payment_date = ?,
        notes = ?,
        updated_at = NOW()
      WHERE id = ?
    `, [newAmount, payment_method, bank, payment_date, notes, id]);

    // ✅ Get all debts for this order
    const [debts] = await connection.query(`
      SELECT 
        id,
        total_amount,
        paid_amount,
        due_amount
      FROM customer_debt
      WHERE order_id = ?
      ORDER BY id ASC
    `, [orderId]);

    if (debts.length > 0) {
      // ✅ Calculate new total paid for this order
      const [paymentSum] = await connection.query(`
        SELECT COALESCE(SUM(amount), 0) as total_paid
        FROM payments
        WHERE order_id = ?
      `, [orderId]);

      const totalPaid = parseFloat(paymentSum[0].total_paid);

      // ✅ Calculate total order amount
      const totalOrderAmount = debts.reduce((sum, debt) =>
        sum + parseFloat(debt.total_amount), 0
      );

      // ✅ Distribute paid amount proportionally across all debts
      let remainingPaid = totalPaid;

      for (let i = 0; i < debts.length; i++) {
        const debt = debts[i];
        const debtTotal = parseFloat(debt.total_amount);

        let debtPaidAmount;

        if (i === debts.length - 1) {
          // Last item gets remaining amount to avoid rounding issues
          debtPaidAmount = Math.min(remainingPaid, debtTotal);
        } else {
          // Proportional distribution
          debtPaidAmount = totalOrderAmount > 0
            ? Math.min((debtTotal / totalOrderAmount) * totalPaid, debtTotal)
            : 0;
        }

        remainingPaid -= debtPaidAmount;

        // ✅ Update customer_debt (REMOVED due_amount AND payment_status - both auto-generated)
        await connection.query(`
          UPDATE customer_debt SET
            paid_amount = ?,
            last_payment_date = ?,
            updated_at = NOW()
          WHERE id = ?
        `, [
          Math.round(debtPaidAmount * 100) / 100,
          payment_date,
          debt.id
        ]);
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: "ការទូទាត់ត្រូវបានកែប្រែដោយជោគជ័យ",
      data: {
        old_amount: oldAmount,
        new_amount: newAmount,
        difference: amountDifference
      }
    });

  } catch (error) {
    await connection.rollback();
    logError(" updatePayment error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "មានបញ្ហាក្នុងការកែប្រែការទូទាត់"
    });
  } finally {
    connection.release();
  }
};

exports.deletePayment = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    // ✅ Check if payment exists and belongs to user's group
    const [existingPayment] = await connection.query(`
      SELECT p.*, u.group_id, o.id as order_id
      FROM payments p
      JOIN \`order\` o ON p.order_id = o.id
      JOIN user u ON o.user_id = u.id
      WHERE p.id = ?
    `, [id]);

    if (!existingPayment.length) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: "រកមិនឃើញការទូទាត់នេះ"
      });
    }

    // ✅ Verify user belongs to the same group
    const [currentUser] = await connection.query(`
      SELECT group_id FROM user WHERE id = ?
    `, [req.current_id]);

    if (existingPayment[0].group_id !== currentUser[0].group_id) {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        error: "អ្នកមិនមានសិទ្ធិលុបការទូទាត់នេះទេ"
      });
    }

    const payment = existingPayment[0];
    const orderId = payment.order_id;
    const deletedAmount = parseFloat(payment.amount) || 0;

    // ✅ Delete the payment record first
    await connection.query(`DELETE FROM payments WHERE id = ?`, [id]);

    // ✅ Get all debts for this order
    const [debts] = await connection.query(`
      SELECT 
        id,
        total_amount
      FROM customer_debt
      WHERE order_id = ?
      ORDER BY id ASC
    `, [orderId]);

    if (debts.length > 0) {
      // ✅ Recalculate total paid for this order (after deletion)
      const [paymentSum] = await connection.query(`
        SELECT COALESCE(SUM(amount), 0) as total_paid
        FROM payments
        WHERE order_id = ?
      `, [orderId]);

      const totalPaid = parseFloat(paymentSum[0].total_paid);

      // ✅ Calculate total order amount
      const totalOrderAmount = debts.reduce((sum, debt) =>
        sum + parseFloat(debt.total_amount), 0
      );

      // ✅ Distribute remaining paid amount proportionally across all debts
      let remainingPaid = totalPaid;

      for (let i = 0; i < debts.length; i++) {
        const debt = debts[i];
        const debtTotal = parseFloat(debt.total_amount);

        let debtPaidAmount;

        if (i === debts.length - 1) {
          // Last item gets remaining amount to avoid rounding issues
          debtPaidAmount = Math.min(remainingPaid, debtTotal);
        } else {
          // Proportional distribution
          debtPaidAmount = totalOrderAmount > 0
            ? Math.min((debtTotal / totalOrderAmount) * totalPaid, debtTotal)
            : 0;
        }

        remainingPaid -= debtPaidAmount;

        // ✅ Update customer_debt (only paid_amount, let DB auto-calculate due_amount & payment_status)
        await connection.query(`
          UPDATE customer_debt SET
            paid_amount = ?,
            last_payment_date = ${totalPaid > 0 ? 'last_payment_date' : 'NULL'},
            updated_at = NOW()
          WHERE id = ?
        `, [
          Math.round(debtPaidAmount * 100) / 100,
          debt.id
        ]);
      }
    }

    await connection.commit();

    res.json({
      success: true,
      message: "ការទូទាត់ត្រូវបានលុបដោយជោគជ័យ",
      data: {
        deleted_amount: deletedAmount,
        order_id: orderId
      }
    });

  } catch (error) {
    await connection.rollback();
    logError("payment.deletePayment error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "មានបញ្ហាក្នុងការលុបការទូទាត់"
    });
  } finally {
    connection.release();
  }
};

exports.remove = async (req, res) => {
  try {
    var [data] = await db.query("DELETE FROM order WHERE id = :id", {
      ...req.body,
    });
    res.json({
      data: data,
      message: "Data delete success!",
    });
  } catch (error) {
    logError("order.remove", error, res);
  }
};


exports.updateInvoice = async (req, res) => {
  const { id } = req.params;
  const { quantity, unit_price, due_date } = req.body;

  try {
    await db.query(
      "UPDATE `order` SET quantity = ?, unit_price = ?, due_date = ? WHERE id = ?",
      [quantity, unit_price, due_date, id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};


exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Missing invoice id",
      });
    }

    const sql = `DELETE FROM \`order\` WHERE id = :id`;
    const [result] = await db.query(sql, { id });

    res.json({
      success: true,
      message: "Invoice deleted successfully",
      data: result,
    });
  } catch (error) {
    logError("order.deleteInvoice", error, res);
  }
};


exports.updateOrderCompletion = async (req, res) => {
  try {
    const { order_id, is_completed } = req.body;


    // Validation
    if (!order_id) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    if (!req.current_id) {
      return res.status(401).json({
        success: false,
        message: "User authentication required"
      });
    }

    // ✅ FIXED: Corrected JOIN - o.user_id should join with u.id, not u.group_id
    const [existingOrder] = await db.query(`
      SELECT o.id, o.user_id, u.group_id
      FROM \`order\` o
      JOIN user u ON o.user_id = u.id
      WHERE o.id = :order_id
    `, { order_id });


    if (!existingOrder || existingOrder.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // ✅ Get current user's group
    const [currentUser] = await db.query(`
      SELECT group_id FROM user WHERE id = :current_id
    `, { current_id: req.current_id });


    if (!currentUser || currentUser.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    // ✅ Verify user belongs to the same group
    if (currentUser[0].group_id !== existingOrder[0].group_id) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update this order"
      });
    }

    // ✅ Update query
    const sql = `
      UPDATE \`order\`
      SET is_completed = :is_completed, 
          updated_at = NOW(),
          updated_by = :updated_by
      WHERE id = :order_id
    `;

    const [result] = await db.query(sql, {
      is_completed: is_completed ? 1 : 0,
      updated_by: req.current_id,
      order_id: order_id
    });


    // Check if update was successful
    if (result.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to update order completion status"
      });
    }

    // Log success

    res.json({
      success: true,
      message: "Order completion status updated successfully",
      data: {
        order_id,
        is_completed: Boolean(is_completed),
        updated_by: req.current_id,
        updated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("❌ Error updating order completion:", error);

    // ✅ Better error handling
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
// ✅ ENHANCED: Multiple fallback strategies for PO reference (លេខប័ណ្ណ)

exports.getList = async (req, res) => {
  try {
    const { from_date, to_date, txtSearch, order_date, delivery_date } = req.query;

    if (!req.current_id) {
      return res.status(400).json({ error: "User authentication required" });
    }

    let sqlWhere = " WHERE cu_user.id = ? ";
    let sqlParams = [req.current_id];

    if (order_date) {
      sqlWhere += " AND DATE(o.order_date) = DATE(?) ";
      sqlParams.push(order_date);
    } else if (delivery_date) {
      sqlWhere += " AND DATE(o.delivery_date) = DATE(?) ";
      sqlParams.push(delivery_date);
    } else if (from_date && to_date) {
      sqlWhere += " AND DATE(o.create_at) BETWEEN DATE(?) AND DATE(?) ";
      sqlParams.push(from_date, to_date);
    }

    if (txtSearch) {
      sqlWhere += " AND (o.order_no LIKE ? OR c.name LIKE ?) ";
      sqlParams.push(`%${txtSearch}%`, `%${txtSearch}%`);
    }
    // ✅ Get orders with PO reference
    const sqlOrders = `
      SELECT 
        o.id as order_id,
        o.order_no,
        o.pre_order_no,
        o.is_completed,
        o.total_amount,
        o.create_at,
        o.order_date,
        o.delivery_date,
        c.name AS customer_name, 
        c.tel AS customer_tel, 
        c.address AS customer_address,
        u.name AS create_by,
        
        -- ✅ Multiple strategies to get PO reference
        COALESCE(
          -- Strategy 1: From customer_debt.description
          (SELECT cd.description 
           FROM customer_debt cd
           WHERE cd.order_id = o.id 
             AND cd.description IS NOT NULL
             AND cd.description != ''
             AND cd.description NOT LIKE 'Product ID:%'
           ORDER BY cd.id ASC 
           LIMIT 1),
          
          -- Strategy 2: From inventory_transaction.reference_no (matching this order's products)
          (SELECT it.reference_no
           FROM inventory_transaction it
           INNER JOIN order_detail od ON it.product_id = od.product_id
           WHERE od.order_id = o.id 
             AND it.transaction_type = 'SALE_OUT'
             AND it.reference_no IS NOT NULL
             AND it.reference_no != ''
             AND it.reference_no != o.order_no
             AND DATE(it.created_at) = DATE(o.create_at)
           ORDER BY it.created_at DESC 
           LIMIT 1),
          
          -- Strategy 3: From inventory_transaction.notes (extract PO from notes)
          (SELECT 
             SUBSTRING_INDEX(SUBSTRING_INDEX(it.notes, 'PO: ', -1), ')', 1)
           FROM inventory_transaction it
           INNER JOIN order_detail od ON it.product_id = od.product_id
           WHERE od.order_id = o.id
             AND it.transaction_type = 'SALE_OUT'
             AND it.notes LIKE '%PO:%'
             AND DATE(it.created_at) = DATE(o.create_at)
           ORDER BY it.created_at DESC 
           LIMIT 1),
          
          -- Fallback: NULL (will show as "-" in frontend)
          NULL
        ) AS product_description
        
      FROM \`order\` o
      LEFT JOIN customer c ON o.customer_id = c.id
      INNER JOIN user u ON o.user_id = u.id
      INNER JOIN user cu_user ON cu_user.group_id = u.group_id
      ${sqlWhere}
      ORDER BY o.create_at DESC
    `;

    const [orders] = await db.query(sqlOrders, sqlParams);



    const orderIds = orders.map(o => o.order_id);

    let detailsList = [];

    if (orderIds.length > 0) {
      const placeholders = orderIds.map(() => '?').join(',');

      const sqlDetails = `
        SELECT 
          od.order_id,
          od.id,
          p.id AS product_id,
          p.name AS product_name,
          cat.name AS category_name,
          p.unit,
          p.actual_price,
          COALESCE(p.supplier_name, 'N/A') AS supplier_name,
          SUM(od.qty) AS total_quantity,
          od.price AS unit_price,
          ROUND(
            SUM(od.qty * od.price) / NULLIF(COALESCE(p.actual_price, 1190), 0),
            2
          ) AS grand_total
          
        FROM order_detail od
        LEFT JOIN product p ON od.product_id = p.id
        LEFT JOIN category cat ON p.category_id = cat.id
        WHERE od.order_id IN (${placeholders})
        GROUP BY od.order_id, od.id, p.id, od.price, p.actual_price
        ORDER BY p.name ASC
      `;

      [detailsList] = await db.query(sqlDetails, orderIds);
    }

    // ✅ Merge orders with details (this passes product_description to each row)
    const finalList = [];
    orders.forEach(order => {
      const orderDetails = detailsList.filter(d => d.order_id === order.order_id);
      if (orderDetails.length > 0) {
        orderDetails.forEach(detail => {
          finalList.push({
            ...order,  // ✅ This includes product_description
            ...detail
          });
        });
      } else {
        finalList.push(order);
      }
    });

    // ✅ Log merged results
    finalList.slice(0, 2).forEach(row => {

    });

    const sqlSummary = `
      SELECT COUNT(DISTINCT o.id) AS total_order, 
             SUM(DISTINCT o.total_amount) AS total_amount
      FROM \`order\` o
      LEFT JOIN customer c ON o.customer_id = c.id
      INNER JOIN user u ON o.user_id = u.id
      INNER JOIN user cu_user ON cu_user.group_id = u.group_id
      ${sqlWhere}
    `;

    const [summaryResult] = await db.query(sqlSummary, sqlParams);

    res.json({
      success: true,
      list: finalList,
      summary: summaryResult[0] || {}
    });

  } catch (error) {
    console.error("❌ Error:", error);
    logError("order.getList", error, res);
  }
};
exports.bulkUpdateOrderCompletion = async (req, res) => {
  try {
    const { order_ids, is_completed } = req.body;

    // Validation
    if (!order_ids || !Array.isArray(order_ids) || order_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "order_ids array is required"
      });
    }

    // ✅ Security: Verify all orders belong to user's group
    const placeholders = order_ids.map(() => '?').join(',');
    const [orderCheck] = await db.query(`
      SELECT o.id, u.group_id
      FROM \`order\` o
      JOIN user u ON o.user_id = u.id
      WHERE o.id IN (${placeholders})
    `, order_ids);

    const [currentUser] = await db.query(`
      SELECT group_id FROM user WHERE id = ?
    `, [req.current_id]);

    const unauthorizedOrders = orderCheck.filter(
      order => order.group_id !== currentUser[0]?.group_id
    );

    if (unauthorizedOrders.length > 0) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to update some orders"
      });
    }

    // ✅ Update multiple orders
    const sql = `
      UPDATE \`order\`
      SET is_completed = ?, 
          updated_at = NOW(),
          updated_by = ?
      WHERE id IN (${placeholders})
    `;

    const params = [is_completed ? 1 : 0, req.current_id, ...order_ids];
    const [result] = await db.query(sql, params);


    res.json({
      success: true,
      message: `${result.affectedRows} orders updated successfully`,
      data: {
        updated_count: result.affectedRows,
        order_ids,
        is_completed: Boolean(is_completed)
      }
    });

  } catch (error) {
    console.error("❌ Error bulk updating orders:", error);
    logError("order.bulkUpdateOrderCompletion", error, res);
  }
};


// ==================== GET COMPLETION STATISTICS ====================
// Get statistics about completed vs incomplete orders

exports.getOrderCompletionStats = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;

    let sql = `
      SELECT 
        COUNT(o.id) as total_orders,
        SUM(CASE WHEN o.is_completed = 1 THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN o.is_completed = 0 THEN 1 ELSE 0 END) as incomplete_orders,
        SUM(CASE WHEN o.is_completed = 1 THEN o.total_amount ELSE 0 END) as completed_amount,
        SUM(CASE WHEN o.is_completed = 0 THEN o.total_amount ELSE 0 END) as incomplete_amount,
        ROUND(
          (SUM(CASE WHEN o.is_completed = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(o.id), 0)) * 100, 
          2
        ) as completion_rate
      FROM \`order\` o
      JOIN user u ON o.user_id = u.id
      JOIN user cu ON cu.group_id = u.group_id
      WHERE cu.id = ?
    `;

    const params = [req.current_id];

    if (from_date && to_date) {
      sql += ` AND DATE(o.create_at) BETWEEN DATE(?) AND DATE(?)`;
      params.push(from_date, to_date);
    }

    const [stats] = await db.query(sql, params);

    res.json({
      success: true,
      data: stats[0] || {
        total_orders: 0,
        completed_orders: 0,
        incomplete_orders: 0,
        completed_amount: 0,
        incomplete_amount: 0,
        completion_rate: 0
      }
    });

  } catch (error) {
    console.error("❌ Error fetching completion stats:", error);
    logError("order.getOrderCompletionStats", error, res);
  }
};