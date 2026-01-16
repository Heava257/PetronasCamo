const { validate_token } = require("../controller/auth.controller");
const {   getList,
  create,
  update,
  remove,
  addPayment,
  getPaymentHistory,
  getAllPayments,
  updatePayment,
  deletePayment,
  getCategoryCards, } = require("../controller/company_payment.controller");


module.exports = (app) => {
  app.get("/api/payable", validate_token(), getList);
  app.post("/api/payable", validate_token(), create);
  app.put("/api/payable", validate_token(), update);
  app.delete("/api/payable", validate_token(), remove);
  app.post("/api/payable/payment", validate_token(), addPayment);
  app.get("/api/payable/payment-history", validate_token(), getPaymentHistory);
  app.get("/api/payable/all-payments", validate_token(), getAllPayments);
  app.put("/api/payable/payment", validate_token(), updatePayment);
  app.delete("/api/payable/payment", validate_token(), deletePayment);
  app.get("/api/payable/category-cards", validate_token(), getCategoryCards);
};