// ✅ pre_order.route.js - Routes for Pre-Order System

const { validate_token } = require("../controller/auth.controller");
const preOrderController = require("../controller/Pre_order.controller");

module.exports = (app) => {

    // ========================================
    // PRE-ORDER MANAGEMENT
    // ========================================

    // Create pre-order (បង្កើតកម្មង់ជាមុន)
    app.post("/api/pre-order/create", validate_token(), preOrderController.createPreOrder);

    // Get pre-order list (បញ្ជីកម្មង់)
    app.get("/api/pre-order/list", validate_token(), preOrderController.getPreOrderList);

    // Get pre-order by ID (ព័ត៌មានលម្អិត)
    app.get("/api/pre-order/:id", validate_token(), preOrderController.getPreOrderById);

    // Convert to POS order (បំលែងទៅជា Order)
    app.post("/api/pre-order/:id/convert", validate_token(), preOrderController.convertToOrder);

    // Update status (ធ្វើបច្ចុប្បន្នភាព Status)
    app.put("/api/pre-order/:id/status", validate_token(), preOrderController.updateStatus);

    // Update pre-order (កែប្រែកម្មង់)
    app.put("/api/pre-order/:id", validate_token(), preOrderController.updatePreOrder);

    // Delete pre-order (លុបកម្មង់)
    app.delete("/api/pre-order/:id", validate_token(), preOrderController.deletePreOrder);

    // Add payment (បន្ថែមការទូទាត់)
    app.post("/api/pre-order/:id/payment", validate_token(), preOrderController.addPayment);
    // ADD THIS:
    app.post(
        "/api/pre-order/deduct-qty",
        validate_token(),
        preOrderController.deductPreOrderQty
    );

};