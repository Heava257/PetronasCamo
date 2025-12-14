const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  getDetail,
  create,
  update,
  remove,
} = require("../controller/delivery.controller");

module.exports = (app) => {
  app.get("/api/delivery-note", validate_token(), getList);
  app.get("/api/delivery-note/:id/detail", validate_token(), getDetail);
  app.post("/api/delivery-note", validate_token(), create);
  app.put("/api/delivery-note", validate_token(), update);
  app.delete("/api/delivery-note", validate_token(), remove);
};