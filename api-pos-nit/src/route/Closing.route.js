// ✅ closing.route.js - Complete Routes for Closing System

const { validate_token } = require("../controller/auth.controller");
const shiftClosingController = require("../controller/shift_closing.controller");
const dailyClosingController = require("../controller/daily_closing.controller");
const stockReconciliationController = require("../controller/stock_reconciliation.controller");

module.exports = (app) => {

  // ========================================
  // SHIFT CLOSING ROUTES (វេន)
  // ========================================

  // Create new shift (បើកវេន)
  app.post("/api/closing/shift/create", validate_token("admin-ShiftClosing.create"), shiftClosingController.createShift);

  // Get current open shift
  app.get("/api/closing/shift/current", validate_token("admin-ShiftClosing.view"), shiftClosingController.getCurrentShift);

  // Close shift (បិទវេន)
  app.put("/api/closing/shift/:id/close", validate_token("admin-ShiftClosing.update"), shiftClosingController.closeShift);

  // Get shift list
  app.get("/api/closing/shift/list", validate_token("admin-ShiftClosing.getlist"), shiftClosingController.getShiftList);

  // Get shift by ID
  app.get("/api/closing/shift/:id", validate_token("admin-ShiftClosing.getone"), shiftClosingController.getShiftById);

  // Approve/Reject shift
  app.put("/api/closing/shift/:id/approve", validate_token("admin-ShiftClosing.update"), shiftClosingController.approveShift);

  // ========================================
  // DAILY CLOSING ROUTES (បិទថ្ងៃ)
  // ========================================

  // Create daily closing
  app.post("/api/closing/daily/create", validate_token("admin-DailyClosing.create"), dailyClosingController.createDailyClosing);

  // Get daily closing list
  app.get("/api/closing/daily/list", validate_token("admin-DailyClosing.getlist"), dailyClosingController.getDailyClosingList);

  // Get daily closing by ID
  app.get("/api/closing/daily/:id", validate_token("admin-DailyClosing.getone"), dailyClosingController.getDailyClosingById);

  // Approve daily closing
  app.put("/api/closing/daily/:id/approve", validate_token("admin-DailyClosing.update"), dailyClosingController.approveDailyClosing);

  // Get dashboard statistics
  app.get("/api/closing/daily/dashboard/stats", validate_token("admin-DailyClosing.view"), dailyClosingController.getDashboardStats);

  // ========================================
  // STOCK RECONCILIATION ROUTES (ផ្ទៀងផ្ទាត់ស្តុក)
  // ========================================

  // Create stock reconciliation
  app.post("/api/closing/stock/reconciliation/create", validate_token("admin-StockReconciliation.create"), stockReconciliationController.createReconciliation);

  // Get reconciliation list
  app.get("/api/closing/stock/reconciliation/list", validate_token("admin-StockReconciliation.getlist"), stockReconciliationController.getReconciliationList);

  // Get reconciliation by ID
  app.get("/api/closing/stock/reconciliation/:id", validate_token("admin-StockReconciliation.getone"), stockReconciliationController.getReconciliationById);

  // Update reconciliation status
  app.put("/api/closing/stock/reconciliation/:id/status", validate_token("admin-StockReconciliation.update"), stockReconciliationController.updateStatus);

  // Get variance report
  app.get("/api/closing/stock/variance-report", validate_token("admin-StockReconciliation.view"), stockReconciliationController.getVarianceReport);

  // ========================================
  // SHIFT EXPENSES ROUTES (ចំណាយក្នុងវេន)
  // ========================================

  // Add expense to shift
  app.post("/api/closing/shift/:shift_id/expense", validate_token("admin-ShiftClosing.update"), shiftClosingController.addExpense);

  // Get expenses for shift
  app.get("/api/closing/shift/:shift_id/expenses", validate_token("admin-ShiftClosing.view"), shiftClosingController.getExpenses);

  // Update expense
  app.put("/api/closing/expense/:id", validate_token("admin-ShiftClosing.update"), shiftClosingController.updateExpense);

  // Delete expense
  app.delete("/api/closing/expense/:id", validate_token("admin-ShiftClosing.update"), shiftClosingController.deleteExpense);

  // ========================================
  // REPORTS & ANALYTICS
  // ========================================

  // Get closing summary report
  app.get("/api/closing/reports/summary", validate_token(), (req, res) => {
    // To be implemented
    res.json({ message: "Summary report endpoint" });
  });

  // Get profit/loss report
  app.get("/api/closing/reports/profit-loss", validate_token(), (req, res) => {
    // To be implemented
    res.json({ message: "Profit/Loss report endpoint" });
  });

  // Export to Excel
  app.get("/api/closing/reports/export", validate_token(), (req, res) => {
    // To be implemented
    res.json({ message: "Export endpoint" });
  });

};
