const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  create,
  update,
  remove
} = require("../controller/family_finances.controller");

module.exports = (app) => {
  // Create new financial transaction
  app.post("/api/family_finances", validate_token(), create);
  
  // Get all financial transactions
  app.get("/api/family_finances", validate_token(), getList);
  
  // Update existing transaction
  app.put("/api/family_finances", validate_token(), update);
  
  // Delete transaction
  app.delete("/api/family_finances", validate_token(), remove);
};