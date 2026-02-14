const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  create,
  update,
  remove,
} = require("../controller/role.controller");
module.exports = (app) => {
  app.get("/api/role", validate_token("role.getlist||user.create||user.update||employee.create||employee.update"), getList);
  app.post("/api/role", validate_token("role.create"), create);
  app.put("/api/role", validate_token("role.update"), update);
  app.delete("/api/role", validate_token("role.remove"), remove);
};
