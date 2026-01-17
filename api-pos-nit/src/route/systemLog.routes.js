// systemLog.routes.js

const { validate_token } = require('../controller/auth.controller');
const {
  getSystemLogs,
  getLoginHistory,
  getUserActivity,
  getLogStats,
  cleanupOldLogs
} = require('../controller/systemLog.controller');

module.exports = (app) => {
  
  // ===== SYSTEM LOGS ROUTES =====
  
  // ✅ Get system logs (Admin only)
  app.get('/api/logs/system', validate_token(), getSystemLogs);

  // ✅ Get login history
  app.get('/api/logs/login-history', validate_token(), getLoginHistory);

  // ✅ Get user activity logs
  app.get('/api/logs/user-activity', validate_token(), getUserActivity);

  // ✅ Get log statistics (Admin only)
  app.get('/api/logs/stats', validate_token(), getLogStats);

  // ✅ Cleanup old logs (Super Admin only)
  app.post('/api/logs/cleanup', validate_token(), cleanupOldLogs);
  
  console.log('✅ System log routes loaded');
};