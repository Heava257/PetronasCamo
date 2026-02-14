const { db, isEmpty, logError } = require("../util/helper");
exports.getList = async (req, res) => {
  try {
    const { txtSearch, status, id } = req.query;
    let sql = `
      SELECT 
        cp.id,
        cp.company_name,
        cp.description,
        cp.total_amount,
        cp.paid_amount,
        cp.remaining_amount,
        cp.status,
        cp.due_date,
        cp.create_at
      FROM company_payables cp
      WHERE 1=1
    `;

    const params = {};

    if (id !== undefined && id !== "") {
      sql += " AND cp.id = :id";
      params.id = id;
    }

    if (!isEmpty(txtSearch)) {
      sql += " AND (cp.company_name LIKE :txtSearch OR cp.description LIKE :txtSearch)";
      params.txtSearch = `%${txtSearch}%`;
    }

    if (status !== undefined && status !== "") {
      sql += " AND cp.status = :status";
      params.status = status;
    }

    sql += " ORDER BY cp.create_at DESC";

    const [list] = await db.query(sql, params);

    // ✅ Fetch items GROUPED BY CATEGORY with actual_price
    if (list && list.length > 0) {
      for (let payable of list) {
        const [items] = await db.query(
          `SELECT 
            MIN(pi.id) as id,
            pi.category_id,
            MAX(pi.product_name) as product_name,
            SUM(pi.quantity) as quantity,
            MAX(pi.unit) as unit,
            AVG(pi.unit_price) as unit_price,
            MAX(c.actual_price) as actual_price,
            SUM(pi.total_amount) as total_amount,
            COUNT(DISTINCT pi.description) as card_count,
            COUNT(*) as item_count
          FROM payable_items pi
          LEFT JOIN category c ON pi.category_id = c.id
          WHERE pi.payable_id = :payable_id 
          GROUP BY pi.category_id
          ORDER BY pi.category_id`,
          { payable_id: payable.id }
        );
        payable.items = items || [];
      }
    }

    res.json({ list });
  } catch (error) {
    logError("payable.getList", error, res);
  }
};


exports.getCategoryCards = async (req, res) => {
  try {
    const { payable_id, category_id } = req.query;

    if (!payable_id || !category_id) {
      return res.status(400).json({ 
        error: true, 
        message: "Missing required parameters: payable_id, category_id" 
      });
    }

    const sql = `
      SELECT 
        MIN(pi.id) as id,
        MAX(pi.product_id) as product_id,
        pi.category_id,
        MAX(pi.barcode) as barcode,
        MAX(pi.product_name) as product_name,
        pi.description AS card_number,
        SUM(pi.quantity) as quantity,
        MAX(pi.unit) as unit,
        AVG(pi.unit_price) as unit_price,
        MAX(c.actual_price) as actual_price,
        SUM(pi.total_amount) as total_amount,
        COUNT(*) as item_count
      FROM payable_items pi
      LEFT JOIN category c ON pi.category_id = c.id
      WHERE pi.payable_id = :payable_id 
        AND pi.category_id = :category_id
      GROUP BY pi.description
      ORDER BY pi.description
    `;

    const [items] = await db.query(sql, {
      payable_id,
      category_id
    });

    res.json({ items });
  } catch (error) {
    logError("payable.getCategoryCards", error, res);
  }
};


exports.getCardItems = async (req, res) => {
  try {
    const { payable_id, category_id, card_number } = req.query;

    if (!payable_id || !category_id || !card_number) {
      return res.status(400).json({ 
        error: true, 
        message: "Missing required parameters" 
      });
    }

    const sql = `
      SELECT 
        pi.id,
        pi.product_id,
        pi.category_id,
        pi.barcode,
        pi.product_name,
        pi.description,
        pi.quantity,
        pi.unit,
        pi.unit_price,
        c.actual_price,
        pi.total_amount,
        pi.create_by,
        pi.create_at
      FROM payable_items pi
      LEFT JOIN category c ON pi.category_id = c.id
      WHERE pi.payable_id = :payable_id 
        AND pi.category_id = :category_id
        AND pi.description = :card_number
      ORDER BY pi.id ASC
    `;

    const [items] = await db.query(sql, {
      payable_id,
      category_id,
      card_number
    });

    res.json({ items });
  } catch (error) {
    logError("payable.getCardItems", error, res);
  }
};

exports.create = async (req, res) => {
  try {
    const {
      company_name,
      description,
      total_amount,
      due_date,
      items, // Array of items: [{ product_id, category_id, barcode, product_name, card_number (description), quantity, unit, unit_price, total_amount }]
    } = req.body;

    // Start transaction
    await db.query("START TRANSACTION");

    try {
      // Insert payable
      const sql = `
        INSERT INTO company_payables 
          (company_name, description, total_amount, paid_amount, remaining_amount, status, due_date, create_by, create_at) 
        VALUES 
          (:company_name, :description, :total_amount, 0, :total_amount, 0, :due_date, :create_by, NOW())
      `;

      const [data] = await db.query(sql, {
        company_name,
        description,
        total_amount,
        due_date,
        create_by: req.auth?.name,
      });

      const payable_id = data.insertId;

      // Insert items if provided
      if (items && Array.isArray(items) && items.length > 0) {
        const itemSql = `
          INSERT INTO payable_items 
            (payable_id, product_id, category_id, barcode, product_name, description, 
             quantity, unit, unit_price, total_amount, create_by, create_at) 
          VALUES 
            (:payable_id, :product_id, :category_id, :barcode, :product_name, :description,
             :quantity, :unit, :unit_price, :total_amount, :create_by, NOW())
        `;

        for (let item of items) {
          await db.query(itemSql, {
            payable_id,
            product_id: item.product_id || null,
            category_id: item.category_id || null,
            barcode: item.barcode || null,
            product_name: item.product_name,
            description: item.card_number || null, // card_number maps to description field
            quantity: item.quantity || 0,
            unit: item.unit || null,
            unit_price: item.unit_price || 0,
            total_amount: item.total_amount || 0,
            create_by: req.auth?.name,
          });
        }
      }

      await db.query("COMMIT");

      res.json({
        data: { id: payable_id },
        message: "Payable created successfully!",
      });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    logError("payable.create", error, res);
  }
};

// Update payable
exports.update = async (req, res) => {
  try {
    const {
      id,
      company_name,
      description,
      total_amount,
      due_date,
      items,
    } = req.body;

    await db.query("START TRANSACTION");

    try {
      const [current] = await db.query(
        "SELECT paid_amount FROM company_payables WHERE id = :id",
        { id }
      );

      if (!current || current.length === 0) {
        await db.query("ROLLBACK");
        return res.status(404).json({ error: true, message: "Payable not found" });
      }

      const paid_amount = current[0].paid_amount;
      const remaining_amount = total_amount - paid_amount;
      const status = remaining_amount <= 0 ? 2 : (paid_amount > 0 ? 1 : 0);

      const sql = `
        UPDATE company_payables 
        SET 
          company_name = :company_name, 
          description = :description,
          total_amount = :total_amount, 
          remaining_amount = :remaining_amount,
          status = :status,
          due_date = :due_date
        WHERE id = :id
      `;

      await db.query(sql, {
        id,
        company_name,
        description,
        total_amount,
        remaining_amount,
        status,
        due_date,
      });

      // Update items
      if (items && Array.isArray(items)) {
        await db.query("DELETE FROM payable_items WHERE payable_id = :id", { id });

        if (items.length > 0) {
          const itemSql = `
            INSERT INTO payable_items 
              (payable_id, product_id, category_id, barcode, product_name, description, 
               quantity, unit, unit_price, total_amount, create_by, create_at) 
            VALUES 
              (:payable_id, :product_id, :category_id, :barcode, :product_name, :description,
               :quantity, :unit, :unit_price, :total_amount, :create_by, NOW())
          `;

          for (let item of items) {
            await db.query(itemSql, {
              payable_id: id,
              product_id: item.product_id || null,
              category_id: item.category_id || null,
              barcode: item.barcode || null,
              product_name: item.product_name,
              description: item.card_number || null, // card_number maps to description field
              quantity: item.quantity || 0,
              unit: item.unit || null,
              unit_price: item.unit_price || 0,
              total_amount: item.total_amount || 0,
              create_by: req.auth?.name,
            });
          }
        }
      }

      await db.query("COMMIT");

      res.json({
        message: "Payable updated successfully!",
      });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    logError("payable.update", error, res);
  }
};

// Delete payable
exports.remove = async (req, res) => {
  try {
    const { id } = req.body;

    await db.query("START TRANSACTION");

    try {
      // Delete items first (foreign key constraint)
      await db.query("DELETE FROM payable_items WHERE payable_id = :id", { id });

      // Delete payable
      await db.query("DELETE FROM company_payables WHERE id = :id", { id });

      await db.query("COMMIT");

      res.json({
        message: "Payable deleted successfully!",
      });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    logError("payable.remove", error, res);
  }
};
// ✅ Add Payment - Include product_id and category_id
exports.addPayment = async (req, res) => {
  try {
    const {
      payable_id,
      payment_amount,
      payment_date,
      payment_method,
      note,
      card_number,
      product_id,      // ✅ Add product_id
      category_id,     // ✅ Add category_id
    } = req.body;

    // Get current payable info
    const [payable] = await db.query(
      "SELECT * FROM company_payables WHERE id = :id",
      { id: payable_id }
    );

    if (!payable || payable.length === 0) {
      return res.status(404).json({ error: true, message: "Payable not found" });
    }

    const current = payable[0];
    const new_paid_amount = parseFloat(current.paid_amount) + parseFloat(payment_amount);
    const new_remaining_amount = parseFloat(current.total_amount) - new_paid_amount;
    
    let new_status = 0;
    if (new_remaining_amount <= 0) {
      new_status = 2;
    } else if (new_paid_amount > 0) {
      new_status = 1;
    }

    // ✅ Insert payment record with card_number, product_id, category_id
    const insertSql = `
      INSERT INTO payable_payments 
        (payable_id, payment_amount, payment_date, payment_method, note, card_number, 
         product_id, category_id, create_by, create_at) 
      VALUES 
        (:payable_id, :payment_amount, :payment_date, :payment_method, :note, :card_number,
         :product_id, :category_id, :create_by, NOW())
    `;

    await db.query(insertSql, {
      payable_id,
      payment_amount,
      payment_date,
      payment_method,
      note,
      card_number,
      product_id: product_id || null,      // ✅ Save product_id
      category_id: category_id || null,    // ✅ Save category_id
      create_by: req.auth?.name,
    });

    // Update payable
    const updateSql = `
      UPDATE company_payables 
      SET 
        paid_amount = :paid_amount,
        remaining_amount = :remaining_amount,
        status = :status
      WHERE id = :id
    `;

    await db.query(updateSql, {
      id: payable_id,
      paid_amount: new_paid_amount,
      remaining_amount: new_remaining_amount,
      status: new_status,
    });

    res.json({
      message: "Payment added successfully!",
    });
  } catch (error) {
    logError("payable.addPayment", error, res);
  }
};

// ✅ Update Payment - Include product_id and category_id
exports.updatePayment = async (req, res) => {
  try {
    const {
      id,
      payment_amount,
      payment_date,
      payment_method,
      note,
      card_number,
      product_id,      // ✅ Add product_id
      category_id,     // ✅ Add category_id
    } = req.body;

    await db.query("START TRANSACTION");

    try {
      // Get old payment info
      const [oldPayment] = await db.query(
        "SELECT * FROM payable_payments WHERE id = :id",
        { id }
      );

      if (!oldPayment || oldPayment.length === 0) {
        await db.query("ROLLBACK");
        return res.status(404).json({ error: true, message: "Payment not found" });
      }

      const old_payment_amount = parseFloat(oldPayment[0].payment_amount);
      const payable_id = oldPayment[0].payable_id;

      // Get current payable info
      const [payable] = await db.query(
        "SELECT * FROM company_payables WHERE id = :id",
        { id: payable_id }
      );

      if (!payable || payable.length === 0) {
        await db.query("ROLLBACK");
        return res.status(404).json({ error: true, message: "Payable not found" });
      }

      const current = payable[0];
      
      // Calculate new amounts
      let new_paid_amount = parseFloat(current.paid_amount) - old_payment_amount;
      new_paid_amount = new_paid_amount + parseFloat(payment_amount);
      
      const new_remaining_amount = parseFloat(current.total_amount) - new_paid_amount;
      
      let new_status = 0;
      if (new_remaining_amount <= 0) {
        new_status = 2;
      } else if (new_paid_amount > 0) {
        new_status = 1;
      }

      // ✅ Update payment record with product_id and category_id
      const updatePaymentSql = `
        UPDATE payable_payments 
        SET 
          payment_amount = :payment_amount,
          payment_date = :payment_date,
          payment_method = :payment_method,
          note = :note,
          card_number = :card_number,
          product_id = :product_id,
          category_id = :category_id
        WHERE id = :id
      `;

      await db.query(updatePaymentSql, {
        id,
        payment_amount,
        payment_date,
        payment_method,
        note,
        card_number,
        product_id: product_id || null,      // ✅ Update product_id
        category_id: category_id || null,    // ✅ Update category_id
      });

      // Update payable
      const updatePayableSql = `
        UPDATE company_payables 
        SET 
          paid_amount = :paid_amount,
          remaining_amount = :remaining_amount,
          status = :status
        WHERE id = :id
      `;

      await db.query(updatePayableSql, {
        id: payable_id,
        paid_amount: new_paid_amount,
        remaining_amount: new_remaining_amount,
        status: new_status,
      });

      await db.query("COMMIT");

      res.json({
        message: "Payment updated successfully!",
      });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    logError("payable.updatePayment", error, res);
  }
};

// ✅ Get Payment History - Include product_id and category_id
exports.getPaymentHistory = async (req, res) => {
  try {
    const { payable_id } = req.query;

    const sql = `
      SELECT 
        id,
        payment_amount,
        payment_date,
        payment_method,
        note,
        card_number,
        product_id,
        category_id,
        create_by,
        create_at
      FROM payable_payments
      WHERE payable_id = :payable_id
      ORDER BY payment_date DESC, create_at DESC
    `;

    const [list] = await db.query(sql, { payable_id });

    res.json({ list });
  } catch (error) {
    logError("payable.getPaymentHistory", error, res);
  }
};

// ✅ Get All Payments - Include product_id and category_id
exports.getAllPayments = async (req, res) => {
  try {
    const { txtSearch, payment_method, start_date, end_date } = req.query;
    
    let sql = `
      SELECT 
        pp.id,
        pp.payable_id,
        pp.payment_amount,
        pp.payment_date,
        pp.payment_method,
        pp.note,
        pp.card_number,
        pp.product_id,
        pp.category_id,
        pp.create_by,
        pp.create_at,
        cp.company_name
      FROM payable_payments pp
      LEFT JOIN company_payables cp ON pp.payable_id = cp.id
      WHERE 1=1
    `;

    const params = {};

    if (!isEmpty(txtSearch)) {
      sql += " AND (cp.company_name LIKE :txtSearch OR pp.id = :paymentId OR pp.card_number LIKE :txtSearch2)";
      params.txtSearch = `%${txtSearch}%`;
      params.txtSearch2 = `%${txtSearch}%`;
      const parsedId = parseInt(txtSearch);
      params.paymentId = isNaN(parsedId) ? 0 : parsedId;
    }

    if (!isEmpty(payment_method)) {
      sql += " AND pp.payment_method = :payment_method";
      params.payment_method = payment_method;
    }

    if (!isEmpty(start_date)) {
      sql += " AND pp.payment_date >= :start_date";
      params.start_date = start_date;
    }

    if (!isEmpty(end_date)) {
      sql += " AND pp.payment_date <= :end_date";
      params.end_date = end_date;
    }

    sql += " ORDER BY pp.payment_date DESC, pp.create_at DESC";

    const [list] = await db.query(sql, params);

    res.json({ list });
  } catch (error) {
    logError("payable.getAllPayments", error, res);
  }
};

// ✅ Delete payment (Refund)
exports.deletePayment = async (req, res) => {
  try {
    const { id } = req.body;

    await db.query("START TRANSACTION");

    try {
      // Get payment info before deleting
      const [payment] = await db.query(
        "SELECT * FROM payable_payments WHERE id = :id",
        { id }
      );

      if (!payment || payment.length === 0) {
        await db.query("ROLLBACK");
        return res.status(404).json({ error: true, message: "Payment not found" });
      }

      const payment_amount = parseFloat(payment[0].payment_amount);
      const payable_id = payment[0].payable_id;

      // Get current payable info
      const [payable] = await db.query(
        "SELECT * FROM company_payables WHERE id = :id",
        { id: payable_id }
      );

      if (!payable || payable.length === 0) {
        await db.query("ROLLBACK");
        return res.status(404).json({ error: true, message: "Payable not found" });
      }

      const current = payable[0];
      
      // Calculate new amounts (refund the payment)
      const new_paid_amount = parseFloat(current.paid_amount) - payment_amount;
      const new_remaining_amount = parseFloat(current.total_amount) - new_paid_amount;
      
      let new_status = 0;
      if (new_remaining_amount <= 0) {
        new_status = 2; // Fully paid
      } else if (new_paid_amount > 0) {
        new_status = 1; // Partially paid
      }

      // Delete payment record
      await db.query("DELETE FROM payable_payments WHERE id = :id", { id });

      // Update payable (refund)
      const updatePayableSql = `
        UPDATE company_payables 
        SET 
          paid_amount = :paid_amount,
          remaining_amount = :remaining_amount,
          status = :status
        WHERE id = :id
      `;

      await db.query(updatePayableSql, {
        id: payable_id,
        paid_amount: new_paid_amount,
        remaining_amount: new_remaining_amount,
        status: new_status,
      });

      await db.query("COMMIT");

      res.json({
        message: "Payment deleted and refunded successfully!",
      });
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    logError("payable.deletePayment", error, res);
  }
};
