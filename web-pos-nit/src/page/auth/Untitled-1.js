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

    // ✅ Helper function to handle date values
    const formatDate = (dateValue) => {
      if (!dateValue || dateValue === '' || dateValue === null || dateValue === undefined) {
        return null;
      }
      // If it's already a valid date string, return it
      if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return dateValue;
      }
      // If it's a Date object, format it
      if (dateValue instanceof Date) {
        return dateValue.toISOString().split('T')[0];
      }
      // If it's a timestamp or other format, try to parse it
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

    // ✅ Calculate paid amount per item (distribute evenly)
    const paid_per_item = paid_amount / items.length;

    // ✅ Create separate invoice records for each item
    const createdInvoices = [];
    
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
      const item_due = item_total - paid_per_item;

      // Insert individual invoice record for each item
      const [insertResult] = await connection.query(
        `INSERT INTO fakeinvoice (
          order_no, customer_id, user_id, category_id, quantity, unit_price, actual_price,
          total_amount, paid_amount, total_due, payment_method, 
          remark, create_by, payment_status, order_date, 
          delivery_date, due_date, receive_date, destination
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          order_no, customer_id, user_id, item.category_id, item.quantity, item.unit_price, actual_price,
          item_total, paid_per_item, item_due, payment_method,
          remark, create_by, payment_status, formattedOrderDate,
          formattedDeliveryDate, formattedDueDate, formattedReceiveDate, destination
        ]
      );

      createdInvoices.push(insertResult.insertId);
    }

    await connection.commit();
    res.json({ 
      message: "Invoice created successfully!", 
      ids: createdInvoices,
      success: true 
    });

  } catch (error) {
    await connection.rollback();
    logError("fakeinvoices.create", error);
    res.status(500).json({ error: "Failed to create invoice", details: error.message });
  } finally {
    connection.release();
  }
};