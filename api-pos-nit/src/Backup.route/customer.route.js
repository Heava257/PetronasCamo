const { validate_token } = require("../controller/auth.controller");
const {
  getListByCurrentUserGroup,
  create,
  update,
  remove,
  assignCustomerToUser,
  getDetailById,
  getCustomerStatistics,
  getCustomerOrderStats,
} = require("../controller/customer.controller");
module.exports = (app) => {
  // In your backend file (e.g., server.js or routes.js)
  app.get("/api/customer/my-group", validate_token("customer.getlist"), getListByCurrentUserGroup);
  app.get(
    "/api/customer/:id/detail",
    validate_token("customer.getone"),
    getDetailById
  );

  // Get customer statistics and analytics
  app.get(
    "/api/customer/statistics",
    validate_token("customer.getlist"),
    getCustomerStatistics
  );
  app.post("/api/customer", validate_token("customer.create"), create);
  app.post("/api/customer/user", validate_token("customer.create"), assignCustomerToUser);
  app.put("/api/customer/:id", validate_token("customer.update"), update);
  app.delete("/api/customer/:id", validate_token("customer.remove"), remove);
  // ក្នុង customer.route.js បន្ថែម route នេះ
app.get(
  "/api/order/customer-stats",
  validate_token("customer.getlist"),
  getCustomerOrderStats
);
};

