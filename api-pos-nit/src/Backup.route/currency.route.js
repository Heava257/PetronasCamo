const { validate_token } = require("../controller/auth.controller");
const curency = require("../controller/currency.controller");
module.exports = (app) => {
  app.get("/api/currency", validate_token(),curency.curency);

};
  