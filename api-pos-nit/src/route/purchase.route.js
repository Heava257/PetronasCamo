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

const multer = require("multer");
const { storage } = require("../config/cloudinary");
const upload = multer({ storage: storage });

module.exports = (app) => {
  // GET /api/purchase - Get all purchase orders
  app.get("/api/purchase", validate_token(), getList);

  // GET /api/purchase/statistics - Get purchase statistics
  app.get("/api/purchase/statistics", validate_token(), getStatistics);

  // GET /api/purchase/:id - Get purchase order by ID
  app.get("/api/purchase/:id", validate_token(), getById);

  // POST /api/purchase - Create new purchase order (With Image)
  app.post("/api/purchase", validate_token("purchase.create"), upload.single('image'), create);

  // PUT /api/purchase/:id - Update purchase order (With Image)
  app.put("/api/purchase/:id", validate_token("purchase.update"), upload.single('image'), update);

  // DELETE /api/purchase/:id - Delete purchase order
  app.delete("/api/purchase/:id", validate_token("purchase.delete"), remove);

  // INTEGRATION: Inventory endpoints
  // GET /api/purchase/inventory/statistics - Get warehouse inventory statistics
  app.get("/api/purchase/inventory/statistics", validate_token(), getInventoryStatistics);

  // GET /api/purchase/inventory/transactions - Get recent inventory transactions
  app.get("/api/purchase/inventory/transactions", validate_token(), getRecentTransactions);
};
