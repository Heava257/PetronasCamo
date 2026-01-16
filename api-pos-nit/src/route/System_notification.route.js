
const { validate_token } = require("../controller/auth.controller");
const { getBranchComparison } = require("../controller/supperadmin.controller");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats,
  getRecentNotifications,
  getNotificationAnalytics,
  getTopPerformers
} = require("../controller/System_notification.controller");

module.exports = (app) => {
  app.get("/api/notifications", validate_token(), getNotifications);
  app.get("/api/notifications/recent", validate_token(), getRecentNotifications);
  app.get("/api/notifications/stats", validate_token(), getNotificationStats);
  app.put("/api/notifications/:id/read", validate_token(), markAsRead);
  app.put("/api/notifications/read-all", validate_token(), markAllAsRead);
  app.delete("/api/notifications/:id", validate_token(), deleteNotification);
app.get("/api/notifications/analytics", validate_token(), getNotificationAnalytics);
app.get("/api/notifications/branch-comparison", validate_token(), getBranchComparison);
app.get("/api/notifications/top-performers", validate_token(), getTopPerformers);
};