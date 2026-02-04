const { validate_token } = require("../controller/auth.controller");
const {
  createSuperAdmin,
  updateUserBySuperAdmin,
  deleteUser,
  getSystemStatistics,
  getBranchComparison,
  getAllAdmins,
  createNewAdmin,
  createUserWithRole,
  deactivateAdmin,
  reactivateAdmin,
  getAdminDetails,
  getInactiveAdmins,
  getAdminActivityStats,
  getUsers,
  getOnlineStatus,
  getAutoLogoutConfig,
  updateAutoLogoutConfig,
  getRoles
} = require("../controller/supperadmin.controller");
const { uploadFile } = require("../util/helper");

// 🔒 STRICT SUPER ADMIN CHECK MIDDLEWARE
const checkSuperAdmin = (req, res, next) => {
  // role_id 29 is Super Admin based on auth.controller.js
  const isSuper = req.auth?.role_id === 29 || req.auth?.role_code === 'SUPER_ADMIN';

  if (!isSuper) {
    return res.status(403).json({
      error: true,
      message: "🚫 Access Denied: Super Admin Only!",
      message_kh: "គ្មានសិទ្ធិដំណើរការការងារនេះទេ (Super Admin Only)"
    });
  }
  next();
};

module.exports = (app) => {
  // ================================
  // Super Admin User Management
  // ================================
  app.get("/api/superadmin/users", validate_token(), checkSuperAdmin, getUsers);

  app.post(
    "/api/superadmin/create-superadmin",
    validate_token(), checkSuperAdmin,
    uploadFile.single("upload_image"),
    createSuperAdmin
  );

  app.put(
    "/api/superadmin/users/:user_id",
    validate_token(), checkSuperAdmin,
    uploadFile.single("upload_image"),
    updateUserBySuperAdmin
  );

  app.delete("/api/superadmin/users", validate_token(), checkSuperAdmin, deleteUser);

  app.get("/api/superadmin/statistics", validate_token(), checkSuperAdmin, getSystemStatistics);

  // ================================
  // Reports
  // ================================
  app.get("/api/report/branch-comparison", validate_token(), checkSuperAdmin, getBranchComparison);

  // ================================
  // Admin Management
  // ================================
  app.get("/api/admin/list", validate_token(), checkSuperAdmin, getAllAdmins);

  // Admin creation (transfer mode - creates ADMIN only)
  app.post(
    "/api/admin/create",
    validate_token(), checkSuperAdmin,
    uploadFile.single("upload_image"),
    createNewAdmin
  );

  // ✅ NEW: Create user with any role
  app.post(
    "/api/admin/create-user",
    validate_token(), checkSuperAdmin,
    uploadFile.single("upload_image"),
    createUserWithRole
  );

  app.post("/api/admin/deactivate", validate_token(), checkSuperAdmin, deactivateAdmin);

  app.post("/api/admin/reactivate", validate_token(), checkSuperAdmin, reactivateAdmin);

  app.get("/api/admin/details/:admin_id", validate_token(), checkSuperAdmin, getAdminDetails);

  app.get("/api/admin/inactive", validate_token(), checkSuperAdmin, getInactiveAdmins);

  app.get("/api/admin/activity-stats", validate_token(), checkSuperAdmin, getAdminActivityStats);

  app.get("/api/admin/online-status", validate_token(), checkSuperAdmin, getOnlineStatus);

  // ================================
  // System Configuration
  // ================================
  app.get("/api/config/auto-logout", validate_token(), getAutoLogoutConfig);

  app.put("/api/config/auto-logout", validate_token(), checkSuperAdmin, updateAutoLogoutConfig);

  // ================================
  // Roles Management
  // ================================
  // ✅ NEW: Get all roles for dropdown selection
  app.get("/api/roles/list", validate_token(), checkSuperAdmin, getRoles);
};
