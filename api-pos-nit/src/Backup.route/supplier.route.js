const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  create,
  update,
  remove,
} = require("../controller/supplier.controller");
module.exports = (app) => {
  app.get("/api/supplier", validate_token("supplier.getlist"), getList);
  app.post("/api/supplier", validate_token("supplier.create"), create);
  app.put("/api/supplier", validate_token("supplier.update"), update);
  app.delete("/api/supplier", validate_token("supplier.remove"), remove);
};
