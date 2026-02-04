const { validate_token } = require("../controller/auth.controller");
const {
  getListExpanseType,
  getList,
  create,
  update,
  remove,
} = require("../controller/expanse.controller");
module.exports = (app) => {
  app.get("/api/expanse_type", validate_token(), getListExpanseType);
  app.get("/api/expense", validate_token(), getList);
  app.post("/api/expense", validate_token("expanse.create"), create);
  app.put("/api/expense/:id", validate_token("expanse.update"), update);
  app.delete("/api/expense/:id", validate_token("expanse.remove"), remove);
};


