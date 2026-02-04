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

  app.get("/api/permissions", validate_token("permission.view"), getAllPermissions);

  app.get("/api/permissions/user/:user_id", validate_token("permission.view"), getUserPermissions);

  app.get("/api/permissions/branch/:branch_name", validate_token("permission.view"), getPermissionsByBranch);

  app.put("/api/permissions/role/:role_id", validate_token("permission.update"), updateRolePermissions);

  app.get("/api/permissions/comparison", validate_token("permission.view"), getPermissionComparison);

  app.post("/api/permissions/clone", validate_token("permission.create"), cloneRolePermissions);


  app.post("/api/permissions", validate_token("permission.create"), createPermission);

  app.put("/api/permissions/:permission_id", validate_token("permission.update"), updatePermission);

  app.delete("/api/permissions/:permission_id", validate_token("permission.remove"), deletePermission);

  app.get("/api/permissions/groups", validate_token("permission.view"), getAllGroups);

  // ✅ NEW: Force refresh endpoints
  app.post("/api/permissions/refresh/user/:user_id", validate_token("permission.update"), refreshUserPermissions);

  app.post("/api/permissions/refresh/role/:role_id", validate_token("permission.update"), refreshRolePermissions);
};