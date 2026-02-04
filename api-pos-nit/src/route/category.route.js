const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  getListByGroup,
  getListByCurrentUserGroup,
  create,
  update,
  remove,
} = require("../controller/category.controller");

module.exports = (app) => {
  app.get("/api/category/user/:user_id", validate_token("category.view"), getList);
  app.get("/api/category/my-group", validate_token("category.view"), getListByCurrentUserGroup);
  app.post("/api/category", validate_token("category.create"), create);
  app.put("/api/category", validate_token("category.update"), update);
  app.delete("/api/category", validate_token("category.remove"), remove);
};