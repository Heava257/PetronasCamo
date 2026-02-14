// const { validate_token } = require("../controller/auth.controller");
// const { getList } = require("../controller/config.controller");
// module.exports = (app) => {
//   app.get("/api/config", validate_token(), getList);
// };
// config.route.js
const { validate_token } = require("../controller/auth.controller");
const { getList } = require("../controller/config.controller");

module.exports = (app) => {
  app.get("/api/config", validate_token(), (req, res) => {
    // Pass the authenticated user's ID to the controller
    getList(req, res);
  });
};
