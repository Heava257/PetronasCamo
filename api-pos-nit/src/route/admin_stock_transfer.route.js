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
  app.post("/api/admin_stock_transfer", validate_token("admin_stock_transfer.create"), create);
  app.get("/api/admin_stock_transfer", validate_token("admin_stock_transfer.getlist"), getList);
  app.put("/api/admin_stock_transfer", validate_token("admin_stock_transfer.update"), update);
  app.delete("/api/admin_stock_transfer/:id", validate_token("admin_stock_transfer.remove"), remove);
  app.post("/api/new_barcode", validate_token("admin_stock_transfer.create"), newBarcode);
  // app.get("/api/product_image/:product_id", validate_token(), productImage);
};
