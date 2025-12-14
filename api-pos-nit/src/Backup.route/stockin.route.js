const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  create,
  update,
  remove,
  newBarcode,
  productImage,
} = require("../controller/product.controller");
const { uploadFile } = require("../util/helper");

module.exports = (app) => {
  app.post(
    "/api/product",
    validate_token(),
    uploadFile.fields([
      { name: "upload_image", maxCount: 1 },
      { name: "upload_image_optional", maxCount: 4 },
    ]),
    create
  );
  app.get("/api/product", validate_token(), getList);
  app.put(
    "/api/product",
    validate_token(),
    uploadFile.fields([
      { name: "upload_image", maxCount: 1 },
      { name: "upload_image_optional", maxCount: 4 },
    ]),
    update
  );
  app.delete("/api/product", validate_token(), remove);
  app.post("/api/new_barcode", validate_token(), newBarcode);
  app.get("/api/product_image/:product_id", validate_token(), productImage);
};
