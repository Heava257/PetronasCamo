const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  create,
  update,
  remove,
  getone,
  processPayment,
  getPaymentHistory,
  getOrderHistory,
  getOrderDetail,
  updateInvoice,
  deleteInvoice,
  updatePayment,
  deletePayment
} = require("../controller/order.controller");

module.exports = (app) => {
  app.get("/api/order", validate_token("order.getlist"), getList);
  app.get("/api/order_detail/:id", validate_token(), getone); 
  app.post("/api/order", validate_token("order.create"), create);
  app.get("/api/order/history", validate_token("order.create"), getOrderHistory);
  app.get("/api/order_detail/:orderId", validate_token(), getOrderDetail);
  app.put("/api/order", validate_token("order.update"), update);
  app.delete("/api/order", validate_token("order.remove"), remove);
  app.put("/api/order/process-payment/my-group", validate_token(), processPayment);
  app.get("/api/payment/history/my-group", validate_token(), getPaymentHistory);
  app.put("/api/payment/:id", validate_token(), updatePayment);
  app.delete("/api/payment/:id", validate_token(), deletePayment);

  // ✅ Update specific invoice by ID
app.put("/api/order/:id", validate_token("order.update"), updateInvoice);

// 🗑️ Delete specific invoice by ID
app.delete("/api/order/:id", validate_token("order.remove"), deleteInvoice);

  
};
