const { validate_token } = require("../controller/auth.controller");
const { getList } = require("../controller/branch.controller");

module.exports = (app) => {
    app.get("/api/branch", validate_token("branch.getlist"), getList);
};
