const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  getDetail,
  create,
  update,
  remove,

  // Delivery Tracking Functions
  updateDeliveryStatus,
  getDeliveryTracking,
  getDriverLocation,
  updateDeliveryLocation,
  getActiveDeliveriesWithLocation,

  // Reports
  getDeliveryPerformanceReport,
  getVehicleUtilizationReport,
  getDriverPerformanceReport,
  getDeliveryStats,
  getDeliveriesToday,
  getDeliveryNoteDetail,
  getActiveDeliveries,
  assignTruckToOrder,
  updateOrderDeliveryStatus,
  reportIssue,
  addNote,
  uploadPhoto,
  completeDelivery,
  updateLocation,
  getMyHistory,
  getMyAssignments,
  authByTruck,
  authByPhone,
  checkDriverAuth
} = require("../controller/delivery.controller");
const { uploadFile } = require("../util/helper");

module.exports = (app) => {
  // Reports
  app.get("/api/reports/delivery-performance", validate_token(), getDeliveryPerformanceReport);
  app.get("/api/reports/vehicle-utilization", validate_token(), getVehicleUtilizationReport);
  app.get("/api/reports/driver-performance", validate_token(), getDriverPerformanceReport);

  // Order Delivery Stats
  app.get("/api/orders/delivery-stats", validate_token(), getDeliveryStats);
  app.get("/api/orders/delivery-today", validate_token(), getDeliveriesToday);

  // Delivery Notes
  app.get("/api/delivery-note", validate_token("delivery-note.getlist"), getList);
  app.get("/api/delivery-note/:id/detail", validate_token("delivery-note.view"), getDeliveryNoteDetail);
  app.post("/api/delivery-note", validate_token("delivery-note.create"), create);
  app.put("/api/delivery-note", validate_token("delivery-note.update"), update);
  app.delete("/api/delivery-note", validate_token("delivery-note.remove"), remove);

  // Delivery Tracking (for drivers/admin)
  app.get("/api/delivery/tracking/:orderId", validate_token(), getDeliveryTracking);
  app.get("/api/delivery/active", validate_token(), getActiveDeliveries);
  app.get("/api/delivery/active-with-location", validate_token(), getActiveDeliveriesWithLocation);

  app.post("/api/delivery/tracking/update", validate_token(), updateDeliveryStatus);
  app.post("/api/delivery/location/update", validate_token(), updateDeliveryLocation);
  app.get("/api/delivery/driver-location/:orderId", validate_token(), getDriverLocation);

  // Order Delivery Management
  app.put("/api/orders/:id/update-delivery-status", validate_token(), updateOrderDeliveryStatus);
  app.put("/api/orders/:id/assign-truck", validate_token(), assignTruckToOrder);





  // ✅ Authentication
  app.get("/api/driver/check-auth", validate_token(), checkDriverAuth);
  // routes/delivery.routes.js
  app.post("/api/driver/auth-by-phone", (req, res, next) => {
    next();
  }, authByPhone);

  app.post("/api/driver/auth-by-truck", (req, res, next) => {
    next();
  }, authByTruck);

  // ✅ Delivery Management
  app.get("/api/driver/my-assignments", validate_token(), getMyAssignments);
  app.get("/api/driver/my-history", validate_token(), getMyHistory);

  // ✅ Location & Status Updates
  app.post("/api/order/update-location", validate_token(), updateLocation);
  app.post("/api/order/complete-delivery", validate_token(), completeDelivery);

  app.post("/api/delivery/upload-photo",
    validate_token(),
    uploadFile.single('upload_image'),
    uploadPhoto
  );
  app.post("/api/delivery/add-note", validate_token(), addNote);

  // ✅ Issue Reporting
  app.post("/api/order/report-issue", validate_token(), reportIssue);




};
