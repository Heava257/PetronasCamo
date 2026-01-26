
const controller = require("../controller/setting.controller");
const { validate_token } = require("../controller/auth.controller");

module.exports = (app) => {
    // Public route to get settings (needed for login page checks)
    app.get("/api/settings", controller.getSettings);
    // Protected routes for updating
    app.post("/api/settings", validate_token(), controller.updateSetting);
    app.put("/api/settings/bulk", validate_token(), controller.updateSettingsBulk);
};
