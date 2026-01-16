const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  getById,
  create,
  update,
  delete: remove,
  getStatistics,
  getInventoryStatistics,
  getRecentTransactions
} = require("../controller/purchase.controller");

module.exports = (app) => {
  // GET /api/purchase - Get all purchase orders
  app.get("/api/purchase", validate_token("purchase.getlist"), getList);
  
  // GET /api/purchase/statistics - Get purchase statistics
  app.get("/api/purchase/statistics", validate_token("purchase.getstatistics"), getStatistics);
  
  // GET /api/purchase/:id - Get purchase order by ID
  app.get("/api/purchase/:id", validate_token("purchase.getbyid"), getById);
  
  // POST /api/purchase - Create new purchase order
  app.post("/api/purchase", validate_token("purchase.create"), create);
  
  // PUT /api/purchase/:id - Update purchase order
  app.put("/api/purchase/:id", validate_token("purchase.update"), update);
  
  // DELETE /api/purchase/:id - Delete purchase order
  app.delete("/api/purchase/:id", validate_token("purchase.delete"), remove);

  // INTEGRATION: Inventory endpoints
  // GET /api/purchase/inventory/statistics - Get warehouse inventory statistics
  app.get("/api/purchase/inventory/statistics", validate_token("purchase.getstatistics"), getInventoryStatistics);
  
  // GET /api/purchase/inventory/transactions - Get recent inventory transactions
  app.get("/api/purchase/inventory/transactions", validate_token("purchase.getlist"), getRecentTransactions);
};
