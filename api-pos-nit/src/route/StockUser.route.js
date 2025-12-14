const { validate_token } = require("../controller/auth.controller");
const { getPaymentHistory } = require("../controller/order.controller");
const {
  getStockByUser,
  gettotal_due,
  newBarcode,
  create,
    remove,
  updateDebt,        // ✅ ADD THIS
  deleteDebt,      // ✅ ADD THIS
  updateCustomerDebt,
  gettotal_due_detail,
  updatePaymentHistory, 
 
} = require("../controller/stockUser.controller");
const { uploadFile } = require("../util/helper");
module.exports = (app) => {
  app.post("/api/stock", validate_token(),create);
  app.delete("/api/stock/:id", validate_token(), remove);
  app.get("/api/stock/:user_id", validate_token(), getStockByUser);
  app.post("/api/new_barcode", validate_token(), newBarcode);
  app.get("/api/gettotal_due/my-group", validate_token(), gettotal_due);
  app.get("/api/gettotal_due_detail/:order_id", validate_token(), gettotal_due_detail);
  app.get("/api/payment-history/:order_id", validate_token(), getPaymentHistory);
app.put("/api/payment-history/:payment_id", validate_token(), updatePaymentHistory);

  // app.put("/api/updateTotalDue", validate_token(), updateTotalDue);
 app.put(
  "/api/updateCustomerDebt/:order_id",
  validate_token(),
  uploadFile.fields([
    { name: "upload_image", maxCount: 1 },               // Single image (optional)
    { name: "upload_image_optional", maxCount: 4 }       // Multiple slip images
  ]),
  updateCustomerDebt
);
app.put("/api/debt/:debt_id", validate_token(), updateDebt);

// ✅ Delete specific debt record
app.delete("/api/debt/:debt_id", validate_token(), deleteDebt);


};
   


// const { validate_token } = require("../controller/auth.controller");
// const {
//   getList,
//   create,
//   update,
//   remove,
//   newBarcode,
//   productImage,
// } = require("../controller/product.controller");
// const { uploadFile } = require("../util/helper");

// module.exports = (app) => {
//   app.post(
//     "/api/product",
//     validate_token(),
//     uploadFile.fields([
//       { name: "upload_image", maxCount: 1 },
//       { name: "upload_image_optional", maxCount: 4 },
//     ]),
//     create
//   );
//   app.get("/api/product", validate_token(), getList);
//   app.put(
//     "/api/product",
//     validate_token(),
//     uploadFile.fields([
//       { name: "upload_image", maxCount: 1 },
//       { name: "upload_image_optional", maxCount: 4 },
//     ]),
//     update
//   );
//   app.delete("/api/product/:id", validate_token(), remove);
//   app.post("/api/new_barcode", validate_token(), newBarcode);
//   app.get("/api/product_image/:product_id", validate_token(), productImage);
// };
