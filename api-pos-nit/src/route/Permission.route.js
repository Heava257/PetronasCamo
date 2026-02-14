const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  getRolePermissions,
  updateRolePermissions,
  getPermissionsByBranch,
  getPermissionsByUser,
  getComparisonMatrix,
  forceRefreshRole,
  forceRefreshUser,
  clonePermissions,
  getGroups,
  create,
  update,
  remove
} = require("../controller/Permission.controller");

module.exports = (app) => {
  // List all available permissions and roles
  app.get(["/api/permission", "/api/permissions"],
    validate_token("permission.getlist"),
    getList
  );

  // Get permissions comparison matrix
  app.get(["/api/permission/comparison", "/api/permissions/comparison"],
    validate_token("permission.getlist"),
    getComparisonMatrix
  );

  // Get permissions for a specific branch
  app.get(["/api/permission/branch/:branch_name", "/api/permissions/branch/:branch_name"],
    validate_token("permission.getlist"),
    getPermissionsByBranch
  );

  // Get permissions for a specific user
  app.get(["/api/permission/user/:user_id", "/api/permissions/user/:user_id"],
    validate_token("permission.getlist"),
    getPermissionsByUser
  );

  // Get permissions for a specific role
  app.get(["/api/permission/role/:role_id", "/api/permissions/role/:role_id"],
    validate_token("permission.getone"),
    getRolePermissions
  );

  // Update permissions for a specific role
  app.put(["/api/permission/role/:role_id", "/api/permissions/role/:role_id", "/api/permission/role", "/api/permissions/role"],
    validate_token("permission.update"),
    updateRolePermissions
  );

  // Force refresh permissions for a role (logout all users)
  app.post(["/api/permission/refresh/role/:role_id", "/api/permissions/refresh/role/:role_id"],
    validate_token("permission.update"),
    forceRefreshRole
  );

  // Force refresh permissions for a specific user
  app.post(["/api/permission/refresh/user/:user_id", "/api/permissions/refresh/user/:user_id"],
    validate_token("permission.update"),
    forceRefreshUser
  );

  // Clone permissions from one role to another
  app.post(["/api/permission/clone", "/api/permissions/clone"],
    validate_token("permission.update"),
    clonePermissions
  );

  // Get distinct permission groups
  app.get(["/api/permission/groups", "/api/permissions/groups"],
    validate_token("permission.getlist"),
    getGroups
  );

  // Create new permission
  app.post(["/api/permission", "/api/permissions"],
    validate_token("permission.create"),
    create
  );

  // Update permission by ID
  app.put(["/api/permission/:id", "/api/permissions/:id"],
    validate_token("permission.update"),
    update
  );

  // Delete permission by ID
  app.delete(["/api/permission/:id", "/api/permissions/:id"],
    validate_token("permission.delete"),
    remove
  );
};
