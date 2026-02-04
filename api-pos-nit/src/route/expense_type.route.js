const { validate_token } = require("../controller/auth.controller");

const {
  getExpenseTypes,
  createExpenseType,
  updateExpenseType,
  deleteExpenseType,
  getOilExpenseTotal
} = require("../controller/expense_type.controller");

module.exports = (app) => {
  app.get("/api/expense_type", validate_token(), getExpenseTypes);
  app.post("/api/expense_type", validate_token("expanse_type.create"), createExpenseType);
  app.put("/api/expense_type/:id", validate_token("expanse_type.update"), updateExpenseType);
  app.delete("/api/expense_type/:id", validate_token("expanse_type.remove"), deleteExpenseType);
  app.get("/api/oil_expense_total/:user_id", validate_token(), getOilExpenseTotal);
};