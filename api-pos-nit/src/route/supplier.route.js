const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  create,
  update,
  remove,
} = require("../controller/supplier.controller");

module.exports = (app) => {
  // GET all suppliers with optional search
  app.get("/api/supplier", validate_token(), getList);

  // CREATE new supplier
  app.post("/api/supplier", validate_token("supplier.create"), create);

  // UPDATE existing supplier
  app.put("/api/supplier", validate_token("supplier.update"), update);

  // DELETE supplier
  app.delete("/api/supplier", validate_token("supplier.remove"), remove);
};