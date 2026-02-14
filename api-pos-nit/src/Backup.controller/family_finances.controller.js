const { db, isArray, isEmpty, logError } = require("../util/helper");

exports.getList = async (req, res) => {
  try {
    const [list] = await db.query("SELECT * FROM family_finances ORDER BY id DESC");
    res.json({
      i_know_you_are_id: req.current_id,
      list: list,
    });
  } catch (error) {
    logError("family_finances.getList", error, res);
  }
};

exports.create = async (req, res) => {
  try {
    const sql = `
      INSERT INTO family_finances 
      (transaction_date, transaction_type, category, amount, description, payment_method, person_responsible) 
      VALUES 
      (:transaction_date, :transaction_type, :category, :amount, :description, :payment_method, :person_responsible)
    `;
    
    const [data] = await db.query(sql, {
      transaction_date: req.body.transaction_date,
      transaction_type: req.body.transaction_type,
      category: req.body.category,
      amount: req.body.amount,
      description: req.body.description,
      payment_method: req.body.payment_method,
      person_responsible: req.body.person_responsible
    });
    
    res.json({
      data: data,
      message: "Transaction recorded successfully!",
    });
  } catch (error) {
    logError("family_finances.create", error, res);
  }
}; 

exports.update = async (req, res) => {
  try {
    const [data] = await db.query(
      `UPDATE family_finances SET 
        transaction_date = :transaction_date,
        transaction_type = :transaction_type,
        category = :category,
        amount = :amount,
        description = :description,
        payment_method = :payment_method,
        person_responsible = :person_responsible
      WHERE id = :id`,
      {
        id: req.body.id,
        transaction_date: req.body.transaction_date,
        transaction_type: req.body.transaction_type,
        category: req.body.category,
        amount: req.body.amount,
        description: req.body.description,
        payment_method: req.body.payment_method,
        person_responsible: req.body.person_responsible
      }
    );
    
    res.json({
      data: data,
      message: "Transaction updated successfully!",
    });
  } catch (error) {
    logError("family_finances.update", error, res);
  }
};

exports.remove = async (req, res) => {
  try {
    const [data] = await db.query("DELETE FROM family_finances WHERE id = :id", {
      id: req.body.id,
    });
    
    res.json({
      data: data,
      message: "Transaction deleted successfully!",
    });
  } catch (error) {
    logError("family_finances.remove", error, res);
  }
};
