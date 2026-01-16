

const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  createWithDetails,
  create,
  update,
  remove,
  getListByCurrentUserGroup,
  getInvoiceDetails, // ✅ Add this new method
} = require("../controller/fakeinvoice.controller.");

module.exports = (app) => {
  app.get("/api/fakeinvoice", validate_token(), getList);
  app.get("/api/fakeinvoice/detail/:id", validate_token(), getInvoiceDetails);
  app.post("/api/fakeinvoice/create-with-details", validate_token(), createWithDetails);
  app.post("/api/fakeinvoice", validate_token(), create);
  app.put("/api/fakeinvoice", validate_token(), update);
  app.delete("/api/fakeinvoice", validate_token(), remove);
  app.get("/api/fakeinvoice/group", validate_token(), getListByCurrentUserGroup);
  app.get("/api/fakeinvoice/user/:user_id", validate_token(), getList);
};