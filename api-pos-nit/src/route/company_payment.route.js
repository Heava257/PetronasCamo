const { validate_token } = require("../controller/auth.controller");
const { getList,
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
  app.get("/api/payable", validate_token("company-payment.getlist"), getList);
  app.post("/api/payable", validate_token("company-payment.create"), create);
  app.put("/api/payable", validate_token("company-payment.update"), update);
  app.delete("/api/payable", validate_token("company-payment.remove"), remove);
  app.post("/api/payable/payment", validate_token("company-payment.create"), addPayment);
  app.get("/api/payable/payment-history", validate_token("company-payment.getlist"), getPaymentHistory);
  app.get("/api/payable/all-payments", validate_token("company-payment.getlist"), getAllPayments);
  app.put("/api/payable/payment", validate_token("company-payment.update"), updatePayment);
  app.delete("/api/payable/payment", validate_token("company-payment.remove"), deletePayment);
  app.get("/api/payable/category-cards", validate_token("company-payment.view"), getCategoryCards);
};
