const { validate_token } = require("../controller/auth.controller");
const controller = require("../controller/supplier_payment.controller");

module.exports = (app) => {
    app.get("/api/supplier_payment/ledger", validate_token(), controller.getLedger);
    app.get("/api/supplier_payment/export", validate_token(), controller.exportExcel);
    app.post("/api/supplier_payment/import", validate_token(), controller.importExcel);
    app.get("/api/supplier_payment", validate_token(), controller.getList);
    app.post("/api/supplier_payment", validate_token(), controller.create);
    app.delete("/api/supplier_payment/:id", validate_token(), controller.delete);
};
