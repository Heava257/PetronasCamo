const {
    create,
    getLedger,
    delete: remove,
    exportExcel,
    getOne
} = require("../controller/customer_payment.controller");

const { validate_token } = require("../controller/auth.controller");
const multer = require("multer");
const { storage } = require("../config/cloudinary");
const upload = multer({ storage: storage });

module.exports = (app) => {
    app.post("/api/customer_payment", validate_token("customer-payment.create"), upload.single('slip_image'), create);
    app.get("/api/customer_payment/ledger", validate_token("customer-payment.getlist"), getLedger);
    app.get("/api/customer_payment/export_excel", validate_token("customer-payment.getlist"), exportExcel);
    app.post("/api/customer_payment/check_invoice", validate_token("customer-payment.create"), require("../controller/customer_payment.controller").checkInvoice);
    app.post("/api/customer_payment/check_reference", validate_token("customer-payment.create"), require("../controller/customer_payment.controller").checkReference);
    app.get("/api/customer_payment/pending_invoices", validate_token("customer-payment.create"), require("../controller/customer_payment.controller").getPendingInvoices);
    app.get("/api/customer_payment/debtors", validate_token("customer-payment.getlist"), require("../controller/customer_payment.controller").getDebtors);

    // Wildcard routes last
    app.get("/api/customer_payment/:id", validate_token("customer-payment.getone"), getOne);
    app.delete("/api/customer_payment/:id", validate_token("customer-payment.remove"), remove);
};
