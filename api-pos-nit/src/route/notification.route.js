// ✅ notification.routes.js - Fixed Routes

const { validate_token } = require('../controller/auth.controller');
const { getOrdersWithLocations, getOrderDetailsForMap, updateDeliveryLocation } = require('../controller/Location.controller');
const {
  notifyInactiveAdmins,
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  replyToNotification,
  manualCleanup
} = require('../controller/notification.controller');

module.exports = (app) => {
  app.get('/api/notification/unread-count', validate_token(), getUnreadCount);
  app.get('/api/notification/my-notifications', validate_token(), getMyNotifications);
  app.post('/api/notification/mark-read', validate_token(), markAsRead);
  app.post('/api/notification/mark-all-read', validate_token(), markAllAsRead);
  app.post('/api/notification/reply', validate_token(), replyToNotification);
  app.delete('/api/notification/:notification_id', validate_token(), deleteNotification);
  app.post('/api/notification/manual-cleanup', validate_token(), manualCleanup);
  app.post('/api/admin/notify-inactive', validate_token(), notifyInactiveAdmins);


  app.get("/api/order/with-locations", validate_token(), getOrdersWithLocations);
  

  app.get("/api/order/:id/details", validate_token(), getOrderDetailsForMap);

  app.post("/api/order/update-location", validate_token(), updateDeliveryLocation);
};