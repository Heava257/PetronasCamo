// branchPermissionOverride.route.js
const { validate_token } = require("../controller/auth.controller");
const {
  getBranchOverrides,
  addBranchOverride,
  deleteBranchOverride,
  updateBranchOverride,
  getUserEffectivePermissions,
  getBranchOverrideSummary
} = require("../controller/Branchpermissionoverride.controlle");

module.exports = (app) => {
  app.get(
    "/api/branch-permissions/overrides/:branch_name/:role_id",
    validate_token("permission.view"),
    getBranchOverrides
  );
  app.post(
    "/api/branch-permissions/overrides",
    validate_token("permission.update"),
    addBranchOverride
  );

  app.delete(
    "/api/branch-permissions/overrides/:override_id",
    validate_token("permission.update"),
    deleteBranchOverride
  );

  app.put(
    "/api/branch-permissions/overrides/:override_id",
    validate_token("permission.update"),
    updateBranchOverride
  );

  app.get(
    "/api/branch-permissions/effective/:user_id",
    validate_token("permission.view"),
    getUserEffectivePermissions
  );
  app.get(
    "/api/branch-permissions/summary",
    validate_token("permission.view"),
    getBranchOverrideSummary
  );
};