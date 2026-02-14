const { validate_token } = require("../controller/auth.controller");
const controller = require("../controller/supplier_payment.controller");

module.exports = (app) => {
    app.get("/api/supplier_payment/ledger", validate_token("supplier_payment.getlist"), controller.getLedger);
    app.get("/api/supplier_payment/export", validate_token("supplier_payment.getlist"), controller.exportExcel);
    app.post("/api/supplier_payment/import", validate_token("supplier_payment.create"), controller.importExcel);
    app.get("/api/supplier_payment/unpaid_invoices", validate_token("supplier_payment.getlist"), controller.getUnpaidInvoices);
    app.get("/api/supplier_payment", validate_token("supplier_payment.getlist"), controller.getList);
    app.post("/api/supplier_payment", validate_token("supplier_payment.create"), controller.create);
    app.delete("/api/supplier_payment/:id", validate_token("supplier_payment.remove"), controller.delete);
};
