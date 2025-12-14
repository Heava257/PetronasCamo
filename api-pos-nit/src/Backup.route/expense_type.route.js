const { validate_token } = require("../controller/auth.controller");

const { 
  getExpenseTypes, 
  createExpenseType, 
  updateExpenseType, 
  deleteExpenseType, 
  getOilExpenseTotal
} = require("../controller/expense_type.controller");

module.exports = (app) => {
  // Fix the route naming to match the controller (expense_type instead of expanse_type)
  app.get("/api/expense_type", validate_token(), getExpenseTypes);
  app.post("/api/expense_type", validate_token(), createExpenseType);
  app.put("/api/expense_type/:id", validate_token(), updateExpenseType);
  app.delete("/api/expense_type/:id", validate_token(), deleteExpenseType);
  app.get("/api/oil_expense_total/:user_id", validate_token(), getOilExpenseTotal);
};