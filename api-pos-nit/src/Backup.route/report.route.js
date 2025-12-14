const { validate_token } = require("../controller/auth.controller");
const report = require("../controller/report.controller");
module.exports = (app) => {
  app.get("/api/report_Sale_Sammary", validate_token("report_Sale_Summary.getlist"),report.report_Sale_Summary);
  app.get("/api/report_Expense_Summary", validate_token("report_Expense_Summary.getlist"),report.report_Expense_Summary);
  app.get("/api/report_Customer", validate_token("report_Customer.getlist"),report.report_Customer);
  app.get("/api/report_Purchase_Summary", validate_token("purchase_Summary.getlist"),report.report_Purchase_Summary);
  app.get("/api/top_sales", validate_token("Top_Sale.getlist"),report.top_sale);
  

  
 
};
  