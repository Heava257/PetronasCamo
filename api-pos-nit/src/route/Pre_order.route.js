const { validate_token } = require("../controller/auth.controller");
const preOrderController = require("../controller/Pre_order.controller");

module.exports = (app) => {

    // ========================================
    // PRE-ORDER MANAGEMENT
    // ========================================

    // Create pre-order (បង្កើតកម្មង់ជាមុន)
    app.post("/api/pre-order/create", validate_token("pre-order.create"), preOrderController.createPreOrder);

    // Check duplicate pre-order number
    app.get("/api/pre-order/check-duplicate", validate_token("pre-order.create"), preOrderController.checkDuplicate);

    // Get pre-order list (បញ្ជីកម្មង់)
    app.get("/api/pre-order/list", validate_token("pre-order.getlist"), preOrderController.getPreOrderList);

    // Get pre-order by ID (ព័ត៌មានលម្អិត)
    app.get("/api/pre-order/:id", validate_token("pre-order.view"), preOrderController.getPreOrderById);

    // Convert to POS order (TODO: Restore if needed, currently removed from controller)
    // app.post("/api/pre-order/:id/convert", validate_token("pre-order.convert"), preOrderController.convertToOrder);

    // Update status (ធ្វើបច្ចុប្បន្នភាព Status)
    app.put("/api/pre-order/:id/status", validate_token("pre-order.update"), preOrderController.updateStatus);

    // Update pre-order (កែប្រែកម្មង់)
    app.put("/api/pre-order/:id", validate_token("pre-order.update"), preOrderController.updatePreOrder);

    // Delete pre-order (លុបកម្មង់)
    app.delete("/api/pre-order/:id", validate_token("pre-order.delete"), preOrderController.deletePreOrder);

    // Add payment (បន្ថែមការទូទាត់)
    app.post("/api/pre-order/:id/payment", validate_token("pre-order.payment"), preOrderController.addPayment);

    // Record Delivery (កត់ត្រាការដឹកជញ្ជូន)
    app.post("/api/pre-order/record-delivery", validate_token("pre-order.update"), preOrderController.recordDelivery);

};
