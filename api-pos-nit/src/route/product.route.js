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
  create,
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
    validate_token(),
    createOpeningStock
  );

  app.post(
    "/api/stock-in/opening/lock",
    validate_token(),
    lockOpeningStock
  );

  // ==========================================
  // STOCK IN ROUTES (Updated)
  // ==========================================
  app.post(
    "/api/stock-in/createMultiple",
    validate_token(),
    createMultiple
  );

  app.get(
    "/api/stock-in",
    validate_token(),
    getList
  );

  app.get(
    "/api/stock-in/:id",
    validate_token(),
    getList
  );

  app.put(
    "/api/stock-in/:id",
    validate_token(),
    update
  );

  app.delete(
    "/api/stock-in/:id",
    validate_token(),
    remove
  );

  // ==========================================
  // PRODUCT ROUTES (Updated with user-specific endpoint)
  // ==========================================
  app.get("/api/product/user/:id", validate_token(), getListByUser);
  app.get("/api/product", validate_token(), getList);
  app.post("/api/product", validate_token(), create);
  app.put("/api/product/:id", validate_token(), update);
  app.post("/api/product/createMultiple", validate_token(), createMultiple);
  app.get("/api/customer-products/my-group/:customer_id", validate_token(), getCustomerProducts);
  app.get("/api/product_detail/my-group", validate_token(), getProductDetail);
  app.get("/api/payments/total", validate_token(), getTotalPayments);
  app.get("/api/product_detail/update-completion", validate_token(), updateProductCompletion);
  app.get("/api/product/my-group", validate_token(), getListByCurrentUserGroup);
  app.delete("/api/product/:id", validate_token("product.remove"), remove);
  app.post("/api/new_barcode", validate_token(), newBarcode);
};