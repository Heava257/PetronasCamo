

const { validate_token } = require("../controller/auth.controller");
const {
  getList,
  create,
  update,
  remove,
  newBarcode,
  getProductDetail,
  getCustomerProducts,
  getListByCurrentUserGroup,
   updateProductCompletion,
   createMultiple,
   getTotalPayments,
  // productImage,
} = require("../controller/product.controller");
const { uploadFile } = require("../util/helper");

module.exports = (app) => {
  app.post("/api/product",validate_token(),create);
  app.post("/api/product/createMultiple",validate_token(),createMultiple);
  app.get("/api/customer-products/my-group/:customer_id", validate_token(), getCustomerProducts);
 app.get("/api/product_detail/my-group", validate_token(), getProductDetail);
app.get("/api/payments/total", validate_token(), getTotalPayments);
 app.post("/api/product_detail/update-completion", validate_token(), updateProductCompletion);
 app.get("/api/product/my-group", validate_token(), getListByCurrentUserGroup);


  app.get('/api/product/:user_id',validate_token(),getList);
  
  app.put("/api/product",validate_token("product.update"), update);
  app.delete("/api/product/:id", validate_token("product.remove"), remove);
  app.post("/api/new_barcode", validate_token(), newBarcode);
  // app.get("/api/product_image/:product_id", validate_token(), productImage);
};
