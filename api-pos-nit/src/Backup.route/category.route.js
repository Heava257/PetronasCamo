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
  // ទាញទិន្នន័យតាម user_id (របស់ចាស់)
  app.get("/api/category/user/:user_id", validate_token("category.getlist"), getList);
  
  // ទាញទិន្នន័យតាម group_id (របស់ថ្មី)
  // app.get("/api/category/group/:group_id", validate_token("category.getlist"), getListByGroup);
  
  // ទាញទិន្នន័យតាម current user's group (ប្រើ token)
  app.get("/api/category/my-group", validate_token("category.getlist"), getListByCurrentUserGroup);
  
  app.post("/api/category", validate_token("category.create"), create);
  app.put("/api/category", validate_token("category.update"), update);
  app.delete("/api/category", validate_token("category.remove"), remove);
};
