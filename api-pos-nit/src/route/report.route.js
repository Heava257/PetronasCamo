const { validate_token } = require("../controller/auth.controller");
const report = require("../controller/report.controller");
module.exports = (app) => {
  app.get("/api/report_Sale_Sammary", validate_token("report_Sale_Summary.getlist"), report.report_Sale_Summary);
  app.get("/api/report_Expense_Summary", validate_token("report_Expense_Summary.getlist"), report.report_Expense_Summary);
  app.get("/api/report_Customer", validate_token("report_Customer.getlist"), report.report_Customer);
  app.get("/api/report_Purchase_Summary", validate_token("purchase_Summary.getlist"), report.report_Purchase_Summary);
  app.get("/api/top_sales", validate_token("Top_Sale.getlist"), report.top_sale);
  app.get("/api/report_Stock_Status", validate_token("report_Stock_Status.getlist"), report.report_Stock_Status);
  app.get("/api/report_Stock_Movement", validate_token("report_Stock_Movement.getlist"), report.report_Stock_Movement);
  app.get("/api/report_Purchase_History", validate_token("report_Purchase_History.getlist"), report.report_Purchase_History);
  app.get("/api/report_Outstanding_Debt", validate_token("report_Outstanding_Debt.getlist"), report.report_Outstanding_Debt);
  app.get("/api/report_Payment_History", validate_token("report_Payment_History.getlist"), report.report_Payment_History);
  app.get("/api/report_Profit_Loss", validate_token("report_Profit_Loss.getlist"), report.report_Profit_Loss);
  // routes/report.route.js

  app.get('/api/report_Expense_Category', validate_token(), report.report_Expense_Category); // ✅ Route verified
  app.get('/api/report_Income_vs_Expense', validate_token(), report.report_Income_vs_Expense);
  app.get('/api/report_Expense_Details', validate_token(), report.report_Expense_Details);



  app.get('/api/report/branch-comparison', validate_token(), report.branchComparison);
};
