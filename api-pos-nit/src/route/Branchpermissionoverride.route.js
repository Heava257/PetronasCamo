// branchPermissionOverride.route.js
const { validate_token } = require("../controller/auth.controller");
const {
  getBranchOverrides,
  addBranchOverride,
  deleteBranchOverride,
  getUserEffectivePermissions,
  getBranchOverrideSummary
} = require("../controller/Branchpermissionoverride.controlle");

module.exports = (app) => {
  app.get(
    "/api/branch-permissions/overrides/:branch_name/:role_id",
    validate_token(),
    getBranchOverrides
  );
  app.post(
    "/api/branch-permissions/overrides",
    validate_token(),
    addBranchOverride
  );

  app.delete(
    "/api/branch-permissions/overrides/:override_id",
    validate_token(),
    deleteBranchOverride
  );
  app.get(
    "/api/branch-permissions/effective/:user_id",
    validate_token(),
    getUserEffectivePermissions
  );
  app.get(
    "/api/branch-permissions/summary",
    validate_token(),
    getBranchOverrideSummary
  );
};