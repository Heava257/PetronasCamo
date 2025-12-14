const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  getCustomerReport,
} = require("../controller/dashbaord.controller");
module.exports = (app) => {
  app.get("/api/dashbaord", validate_token("dashboard.getlist"), getList);
//   app.get("/api/customer-report", validate_token("customer.report"), getCustomerReport);
};

