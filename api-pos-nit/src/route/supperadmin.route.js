const { validate_token } = require("../controller/auth.controller");
const {
  createSuperAdmin,
  updateUserBySuperAdmin,
  deleteUser,
  getSystemStatistics,
  getBranchComparison,
  getAllAdmins,
  createNewAdmin,
  createUserWithRole, // ✅ NEW: Import the new function
  deactivateAdmin,
  reactivateAdmin,
  getAdminDetails,
  getInactiveAdmins,
  getAdminActivityStats,
  getUsers,
  getOnlineStatus,
  getAutoLogoutConfig,
  updateAutoLogoutConfig,
  getRoles // ✅ NEW: Import roles function
} = require("../controller/supperadmin.controller");
const { uploadFile } = require("../util/helper");

module.exports = (app) => {
  // ================================
  // Super Admin User Management
  // ================================
  app.get("/api/superadmin/users", validate_token(), getUsers);
  
  app.post(
    "/api/superadmin/create-superadmin",
    validate_token(),
    uploadFile.single("upload_image"),
    createSuperAdmin
  );
  
  app.put(
    "/api/superadmin/users/:user_id",
    validate_token(),
    uploadFile.single("upload_image"),
    updateUserBySuperAdmin
  );
  
  app.delete("/api/superadmin/users", validate_token(), deleteUser);
  
  app.get("/api/superadmin/statistics", validate_token(), getSystemStatistics);

  // ================================
  // Reports
  // ================================
  app.get("/api/report/branch-comparison", validate_token(), getBranchComparison);

  // ================================
  // Admin Management
  // ================================
  app.get("/api/admin/list", validate_token(), getAllAdmins);
  
  // Admin creation (transfer mode - creates ADMIN only)
  app.post(
    "/api/admin/create",
    validate_token(),
    uploadFile.single("upload_image"),
    createNewAdmin
  );

  // ✅ NEW: Create user with any role (not just ADMIN)
  app.post(
    "/api/admin/create-user",
    validate_token(),
    uploadFile.single("upload_image"),
    createUserWithRole
  );
  
  app.post("/api/admin/deactivate", validate_token(), deactivateAdmin);
  
  app.post("/api/admin/reactivate", validate_token(), reactivateAdmin);
  
  app.get("/api/admin/details/:admin_id", validate_token(), getAdminDetails);
  
  app.get("/api/admin/inactive", validate_token(), getInactiveAdmins);
  
  app.get("/api/admin/activity-stats", validate_token(), getAdminActivityStats);
  
  app.get("/api/admin/online-status", validate_token(), getOnlineStatus);

  // ================================
  // System Configuration
  // ================================
  app.get("/api/config/auto-logout", validate_token(), getAutoLogoutConfig);
  
  app.put("/api/config/auto-logout", validate_token(), updateAutoLogoutConfig);

  // ================================
  // Roles Management
  // ================================
  // ✅ NEW: Get all roles for dropdown selection
  app.get("/api/roles/list", validate_token(), getRoles);
};