const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  create,
  update,
  remove,
  newBarcode,
  // productImage,
} = require("../controller/admin_stock_transfer.contoller");
const { uploadFile } = require("../util/helper");

module.exports = (app) => {
  app.post("/api/admin_stock_transfer",validate_token(),create);
  app.get("/api/admin_stock_transfer", validate_token(), getList);
  app.put("/api/admin_stock_transfer",validate_token(), update);
  app.delete("/api/admin_stock_transfer/:id", validate_token(), remove);
  app.post("/api/new_barcode", validate_token(), newBarcode);
  // app.get("/api/product_image/:product_id", validate_token(), productImage);
};
