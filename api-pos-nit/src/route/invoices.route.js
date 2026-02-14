const { validate_token } = require("../controller/auth.controller");
const { getList } = require("../controller/invoices.controller");

const { uploadFile } = require("../util/helper");
module.exports = (app) => {

  app.get("/api/invoices", validate_token("invoices.getlist"), getList);

  // DEBUG ROUTE - Check if backend updates are live
  app.get("/api/invoices-debug", (req, res) => {
    res.json({ message: "Backend is live and updated!" });
  });

  // DEBUG ROUTE - Check invoice list without auth
  app.get("/api/invoices-test", getList);

};
