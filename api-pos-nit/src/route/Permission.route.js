const { validate_token } = require("../controller/auth.controller");
const {
  getAllPermissions,
  getUserPermissions,
  getPermissionsByBranch,
  updateRolePermissions,
  getPermissionComparison,
  cloneRolePermissions,
  createPermission,
  updatePermission,
  deletePermission,
  getAllGroups,
  refreshUserPermissions,
  refreshRolePermissions
} = require("../controller/Permission.controller");

module.exports = (app) => {
  
  app.get("/api/permissions", validate_token(), getAllPermissions);

  app.get("/api/permissions/user/:user_id", validate_token(), getUserPermissions);

  app.get("/api/permissions/branch/:branch_name", validate_token(), getPermissionsByBranch);

  app.put("/api/permissions/role/:role_id", validate_token(), updateRolePermissions);

  app.get("/api/permissions/comparison", validate_token(), getPermissionComparison);

  app.post("/api/permissions/clone", validate_token(), cloneRolePermissions);

  
  app.post("/api/permissions", validate_token(), createPermission);

  app.put("/api/permissions/:permission_id", validate_token(), updatePermission);

  app.delete("/api/permissions/:permission_id", validate_token(), deletePermission);

  app.get("/api/permissions/groups", validate_token(), getAllGroups);

  // ✅ NEW: Force refresh endpoints
  app.post("/api/permissions/refresh/user/:user_id", validate_token(), refreshUserPermissions);
  
  app.post("/api/permissions/refresh/role/:role_id", validate_token(), refreshRolePermissions);
};