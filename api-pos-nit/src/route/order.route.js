
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
  deletePayment,
  updateOrderCompletion,
  bulkUpdateOrderCompletion,
  getOrderCompletionStats,
  voidPayment
} = require("../controller/order.controller");

module.exports = (app) => {
  app.post("/api/order/completion", validate_token("order.update"), updateOrderCompletion);
  app.post("/api/order/bulk-update-completion", validate_token("order.update"), bulkUpdateOrderCompletion);
  app.get("/api/order/completion-stats", validate_token("order.view"), getOrderCompletionStats);
  app.post("/api/order/process-payment", validate_token("order.create"), processPayment);
  app.get("/api/order/history", validate_token("order.view"), getOrderHistory);
  app.get("/api/order", validate_token("order.view"), getList);
  app.post("/api/order", validate_token("order.create"), create);
  app.put("/api/order/:id", validate_token("order.update"), updateInvoice);
  app.delete("/api/order/:id", validate_token("order.remove"), deleteInvoice);
  app.get("/api/order_detail/:id", validate_token("order.view"), getone);
  app.get("/api/order_detail/:orderId", validate_token("order.view"), getOrderDetail);
  app.get("/api/payment/history/my-group", validate_token("order.view"), getPaymentHistory);
  app.put("/api/payment/:id", validate_token("order.update"), updatePayment);
  app.put("/api/payment/:id/void", validate_token("order.remove"), voidPayment);
  app.delete("/api/payment/:id", validate_token("order.remove"), deletePayment);
};
