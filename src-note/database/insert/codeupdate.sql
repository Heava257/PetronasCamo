





















 npx update-browserslist-db@latest


 npm install react-spinners



npm install react-i18next i18next i18next-browser-languagedetector




exports.create = async (req, res) => {
  try {
    const { order, order_details = [] } = req.body;
    const totalLiters = order_details.reduce((sum, item) => sum + Number(item.qty || 0), 0);

    if (!order.customer_id || !order.total_amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Fetch Customer Data FIRST (before using it in telegram message)
    const [customerResult] = await db.query(
      "SELECT name, address, tel FROM customer WHERE id = :id",
      { id: order.customer_id }
    );
    const customer = customerResult.length > 0 ? customerResult[0] : { 
      name: `ID: ${order.customer_id}`, 
      address: "N/A", 
      tel: "N/A" 
    };

    // Fetch Product Details FIRST (before using in telegram message)
    const productCategories = {};
    for (const item of order_details) {
      const [productResult] = await db.query(
        `SELECT p.id, p.name AS product_name, c.name AS category_name
         FROM product p LEFT JOIN category c ON p.category_id = c.id
         WHERE p.id = :id`,
        { id: item.product_id }
      );
      if (productResult.length > 0) {
        productCategories[item.product_id] = `${productResult[0].category_name} / ${productResult[0].product_name}`;
      }
    }

    const order_no = await newOrderNo(); // Your own function to generate order number
    const order_date = order.order_date || new Date().toISOString().slice(0, 10);
    const delivery_date = order.delivery_date || order_date;
    const receive_date = order.receive_date || null;
    const createdBy = req.auth?.name || "System";

    const sqlOrder = `
      INSERT INTO \`order\` 
        (order_no, customer_id, total_amount, paid_amount, payment_method, 
         remark, user_id, create_by, order_date, delivery_date, receive_date) 
      VALUES 
        (:order_no, :customer_id, :total_amount, :paid_amount, :payment_method, 
         :remark, :user_id, :create_by, :order_date, :delivery_date, :receive_date)
    `;

    // Now build telegram message with available data
    let telegramText = `✅ <b>Order Completed!</b>\n\n`;
    telegramText += `━━━━━━━━━━━━━━━\n`;
    const formattedOrderDate = dayjs(order_date).format('DD-MM-YYYY');
    telegramText += `📅 Date: <b>${formattedOrderDate}</b>\n`;
    telegramText += `🧾 Order No: <b>${order_no}</b>\n`;
    telegramText += `👤 Customer: <b>${customer.name}</b>\n`;
    telegramText += `🏠 Address: <b>${customer.address}</b>\n`;
    telegramText += `📞 Phone: <b>${customer.tel}</b>\n`;
    telegramText += `💰 Total: <b>$${parseFloat(order.total_amount).toLocaleString()}</b>\n`;
    telegramText += `📝 Created By: <b>${createdBy}</b>\n\n`;

   telegramText += `📦 <b>Items:</b>\n`;
order_details.forEach((item, idx) => {
  let name = productCategories[item.product_id] || ''; // original name
  name = name.replace(/\/?\s*oil\s*\/?/i, '').trim(); // remove "oil" and surrounding slashes/spaces
  const qty = Number(item.qty).toLocaleString(); // e.g., 6,000
  telegramText += `  ${idx + 1}. <b>${name}</b>/<b>${qty}L</b>\n`;
});


    telegramText += `\n🔢 <b>Total Liters:</b> ${totalLiters.toLocaleString()}L\n`;
    telegramText += `━━━━━━━━━━━━━━━`;

    await sendTelegramMessage(telegramText);

    const [orderResult] = await db.query(sqlOrder, {
      ...order,
      order_no,
      user_id: req.auth?.id || null,
      create_by: req.auth?.name || "System",
      order_date,
      delivery_date,
      receive_date
    });

    const sqlOrderDetails = `
      INSERT INTO order_detail 
        (order_id, product_id, qty, price, discount, total) 
      VALUES 
        (:order_id, :product_id, :qty, :price, :discount, :total)
    `;

    await Promise.all(
      order_details.map(async (item) => {
        await db.query(sqlOrderDetails, {
          ...item,
          order_id: orderResult.insertId,
        });

        if (item.product_id !== 0) {
          const sqlUpdateStock = `
            UPDATE product 
            SET qty = qty - :qty 
            WHERE id = :product_id
          `;

          await db.query(sqlUpdateStock, {
            qty: item.qty,
            product_id: item.product_id
          });
        }
      })
    );

    const sqlDebt = `
      INSERT INTO customer_debt 
        (customer_id, order_id, total_amount, paid_amount, due_date, notes, created_by)
      VALUES 
        (:customer_id, :order_id, :total_amount, :paid_amount, :due_date, :notes, :created_by)
    `;

    await db.query(sqlDebt, {
      customer_id: order.customer_id,
      order_id: orderResult.insertId,
      total_amount: order.total_amount,
      paid_amount: order.paid_amount || 0.00,
      due_date: order.due_date || null,
      notes: order.notes || null,
      created_by: req.auth?.id || null
    });

    // Fetch current order for response
    const [currentOrder] = await db.query(
      "SELECT * FROM `order` WHERE id = :id",
      { id: orderResult.insertId }
    );

    res.json({
      order: currentOrder.length > 0 ? currentOrder[0] : null,
      order_details: order_details,
      message: "Order created successfully",
    });

  } catch (error) {
    logError("Order.create", error, res);
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
    } = req.body;

    if (!order_id || !customer_id || !amount || !user_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: order_id, customer_id, amount, user_id",
      });
    }

    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Payment amount must be greater than 0",
      });
    }

    const [debtRows] = await connection.query(
      `SELECT id, total_amount, paid_amount, due_amount, payment_status 
       FROM customer_debt 
       WHERE order_id = ? AND customer_id = ?`,
      [order_id, customer_id]
    );

    if (debtRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        error: "Debt record not found",
      });
    }

    const currentDebt = debtRows[0];
    const currentDueAmount = parseFloat(currentDebt.due_amount);

    if (paymentAmount > currentDueAmount) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        error: `Payment amount ($${paymentAmount}) cannot exceed due amount ($${currentDueAmount})`,
      });
    }
    const [[customerInfo]] = await connection.query(
      `SELECT name, tel, address FROM customer WHERE id = ?`,
      [customer_id]
    );


    const [[userInfo]] = await connection.query(
      `SELECT name FROM user WHERE id = ?`,
      [user_id]
    );

    const customerName = customerInfo?.name || `ID: ${customer_id}`;
    const customerPhone = customerInfo?.tel || 'N/A';
    const customerAddress = customerInfo?.address || 'N/A';
    const userName = userInfo?.name || `ID: ${user_id}`;


    const newPaidAmount = parseFloat(currentDebt.paid_amount) + paymentAmount;
    const newDueAmount = parseFloat(currentDebt.total_amount) - newPaidAmount;

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

    // Update customer debt table (paid_amount and last_payment_date only)
    await connection.query(
      `UPDATE customer_debt 
       SET paid_amount = ?, 
           last_payment_date = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [
        newPaidAmount,
        payment_date || new Date().toISOString().split("T")[0],
        currentDebt.id,
      ]
    );

    // ✅ Get updated payment_status and due_amount
    const [updatedDebtRows] = await connection.query(
      `SELECT due_amount, payment_status FROM customer_debt WHERE id = ?`,
      [currentDebt.id]
    );
    const actualDueAmount = updatedDebtRows[0]?.due_amount || 0;
    const actualPaymentStatus = updatedDebtRows[0]?.payment_status || 'Partial';

    // ✅ Now it is safe to check actualPaymentStatus
    if (actualPaymentStatus === "Paid") {
      await connection.query(
        `UPDATE customer_debt SET due_date = NULL WHERE id = ?`,
        [currentDebt.id]
      );
    }

    await connection.commit();

    const imageUrls = (req.files?.["upload_image_optional"] || []).map(
      (file) => config.image_path + file.filename
    );

    const formatDate = (dateStr) => {
      const d = new Date(dateStr || new Date());
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

const alertMessage = `
✅ <b>New Payment Received</b>
📅 <b>Date:</b> ${formatDate(payment_date)}
🧾 <b>Invoice:</b> ${order_id}
👤 <b>Customer:</b> ${customerName}
📞 <b>Phone:</b> ${customerPhone}
📍 <b>Address:</b> ${customerAddress}
💲 <b>Amount:</b> $${Number(paymentAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
💳 <b>Method:</b> ${payment_method}
🏦 <b>Bank:</b> ${bank || 'N/A'}
<i>Processed by: ${userName}</i>
`;


    // ✅ Send to Telegram
    await sendTelegramMessagenewcustomerPays(alertMessage, imageUrls);


    res.json({
      success: true,
      message: "Payment recorded and debt updated successfully.",
      data: {
        payment_id: paymentResult.insertId,
        new_paid_amount: newPaidAmount,
        new_due_amount: actualDueAmount,
        payment_status: actualPaymentStatus,
      },
    });
  } catch (error) {
    logError("updateCustomerDebt", error, res);
  } finally {
    connection.release();
  }
};
 

again 



ALTER TABLE fakeinvoice
MODIFY COLUMN unit_price DECIMAL(12,4);
