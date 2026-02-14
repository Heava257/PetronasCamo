const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  update,
  remove,
  newBarcode,
  getProductDetail,
  getCustomerProducts,
  getListByCurrentUserGroup,
  updateProductCompletion,
  createMultiple,
  createSingleProduct,
  getTotalPayments,
  createOpeningStock,
  lockOpeningStock,
  getListByUser,
} = require("../controller/product.controller");
// Removed incorrect import of purchase create
// const { create } = require("../controller/purchase.controller");

module.exports = (app) => {
  // ==========================================
  // OPENING STOCK ROUTES (New)
  // ==========================================
  app.post(
    "/api/stock-in/opening",
    validate_token("product.create"),
    createOpeningStock
  );

  app.post(
    "/api/stock-in/opening/lock",
    validate_token("product.create"),
    lockOpeningStock
  );

  // ==========================================
  // STOCK IN ROUTES (Updated)
  // ==========================================
  app.post(
    "/api/stock-in/createMultiple",
    validate_token("product.create"),
    createMultiple
  );

  app.get(
    "/api/stock-in",
    validate_token("product.view"),
    getList
  );

  app.get(
    "/api/stock-in/:id",
    validate_token("product.view"),
    getList
  );

  app.put(
    "/api/stock-in/:id",
    validate_token("product.update"),
    update
  );

  app.delete(
    "/api/stock-in/:id",
    validate_token("product.remove"),
    remove
  );

  // ==========================================
  // PRODUCT ROUTES (Updated with user-specific endpoint)
  // ==========================================
  app.get("/api/product/user/:id", validate_token("product.view"), getListByUser);
  app.get("/api/product", validate_token("product.view"), getList);
  app.post("/api/product", validate_token("product.create"), createSingleProduct);
  app.put("/api/product/:id", validate_token("product.update"), update);
  app.post("/api/product/createMultiple", validate_token("product.create"), createMultiple);
  app.get("/api/customer-products/my-group/:customer_id", validate_token("product.view"), getCustomerProducts);
  app.get("/api/product_detail/my-group", validate_token("product.view"), getProductDetail);
  app.get("/api/payments/total", validate_token("product.view"), getTotalPayments);
  app.get("/api/product_detail/update-completion", validate_token("product.update"), updateProductCompletion);
  app.get("/api/product/my-group", validate_token("product.view"), getListByCurrentUserGroup);
  app.delete("/api/product/:id", validate_token("product.remove"), remove);
  app.post("/api/new_barcode", validate_token("product.view"), newBarcode);
};
