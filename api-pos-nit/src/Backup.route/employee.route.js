const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  create,
  update,
  remove,
} = require("../controller/employee.controller");
module.exports = (app) => {
  app.get("/api/employee", validate_token("employee.getlist"), getList);
  app.post("/api/employee", validate_token("employee.create"), create);
  app.put("/api/employee", validate_token("employee.update"), update);
  app.delete("/api/employee", validate_token("employee.remove"), remove);
};
