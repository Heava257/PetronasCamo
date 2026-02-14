

const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  createWithDetails,
  create,
  update,
  remove,
  getListByCurrentUserGroup,
  getInvoiceDetails, // ✅ Add this new method
} = require("../controller/fakeinvoice.controller");

module.exports = (app) => {
  app.get("/api/fakeinvoice", validate_token("fakeinvoice.getlist"), getList);
  app.get("/api/fakeinvoice/detail/:id", validate_token("fakeinvoice.getlist"), getInvoiceDetails);
  app.post("/api/fakeinvoice/create-with-details", validate_token("fakeinvoice.create"), createWithDetails);
  app.post("/api/fakeinvoice", validate_token("fakeinvoice.create"), create);
  app.put("/api/fakeinvoice", validate_token("fakeinvoice.update"), update);
  app.delete("/api/fakeinvoice", validate_token("fakeinvoice.delete"), remove);
  app.get("/api/fakeinvoice/group", validate_token("fakeinvoice.getlist"), getListByCurrentUserGroup);
  app.get("/api/fakeinvoice/user/:user_id", validate_token("fakeinvoice.getlist"), getList);
};
