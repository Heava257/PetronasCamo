const { db, isArray, isEmpty, logError } = require("../util/helper");

exports.getList = async (req, res) => {
  try {
    const [list] = await db.query("SELECT * FROM invoices ORDER BY id DESC");
    res.json({
      i_know_you_are_id: req.current_id,
      list: list,
    });
  } catch (error) {
    logError("invoices.getList", error, res);
  }
};

exports.create = async (req, res) => {
    try {
        const { invoice_number, invoice_date, buyer_name, buyer_phone, seller_name, seller_phone, total_amount, tax, discount, net_total, items } = req.body;
        
        const [result] = await db.query(
          "INSERT INTO invoices (invoice_number, invoice_date, buyer_name, buyer_phone, seller_name, seller_phone, total_amount, tax, discount, net_total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [invoice_number, invoice_date, buyer_name, buyer_phone, seller_name, seller_phone, total_amount, tax, discount, net_total]
        );
    
        const invoiceId = result.insertId;
        for (const item of items) {
          await db.query(
            "INSERT INTO invoice_items (invoice_id, product_name, unit_price, quantity, subtotal) VALUES (?, ?, ?, ?, ?)",
            [invoiceId, item.product_name, item.unit_price, item.quantity, item.subtotal]
          );
        }
    
        res.json({ message: "Invoice created successfully", invoiceId });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
};

exports.update = async (req, res) => {
  try {
    var [data] = await db.query(
      "UPDATE category SET name=:name, description=:description, status=:status, parent_id=:parent_id WHERE id = :id",
      {
        id: req.body.id,
        name: req.body.name, // null
        description: req.body.description,
        status: req.body.status,
        parent_id: req.body.parent_id,
      }
    );
    res.json({
      data: data,
      message: "Data update success!",
    });
  } catch (error) {
    logError("update.create", error, res);
  }
};

exports.remove = async (req, res) => {
    try {
        await db.query("DELETE FROM invoice_items WHERE invoice_id = ?", [req.params.id]);
        await db.query("DELETE FROM invoices WHERE id = ?", [req.params.id]);
        res.json({ message: "Invoice deleted successfully" });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
};
