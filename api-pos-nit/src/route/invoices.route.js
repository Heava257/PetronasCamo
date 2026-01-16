const { validate_token } = require("../controller/auth.controller");
const { getList } = require("../controller/invoices.controller");

const { uploadFile } = require("../util/helper");
module.exports = (app) => {
 
  app.get("/api/invoices", validate_token(),getList);
  
};
