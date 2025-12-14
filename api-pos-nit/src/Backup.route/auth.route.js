// const {
//   getList,
//   register,
//   login,
//   profile,
//   validate_token,
//   remove,
//   update,
//   newBarcode,
// } = require("../controller/auth.controller");

// module.exports = (app) => {
//   app.get("/api/auth/get-list", validate_token("user.getlist"), getList);
//   app.post("/api/auth/register", validate_token("user.create"), register);
//   app.delete("/api/user", validate_token("user.remove"), remove);
//   app.put("/api/auth/register", validate_token("user.update"), update);
//   app.post("/api/auth/login", login);
//   app.post("/api/auth/profile", validate_token(), profile);
//   app.post("/api/auth/new_barcode", validate_token(), newBarcode);

// };

const {
  getList,
  register,
  login,
  profile,
  validate_token,
  remove,
  update,
  newBarcode,
  getuserProfile,
  updateuserProfile,
} = require("../controller/auth.controller");
const { uploadFile } = require("../util/helper");

module.exports = (app) => {
  app.get("/api/groups/get-list",  validate_token("user.getlist"), getList);
  app.post("/api/auth/register",  validate_token("user.create"),uploadFile.single("upload_image"), register);
  app.delete("/api/user", validate_token("user.remove"), remove);
  app.put("/api/auth/register", validate_token("user.update"), uploadFile.single("upload_image"),update);
  app.post("/api/auth/login", login);
  app.post("/api/auth/profile", validate_token(), profile);
  app.post("/api/auth/new_barcode", validate_token(), newBarcode);
  app.get("/api/auth/user-profile/:userId", validate_token(), getuserProfile);
  app.put("/api/user/profile/:userId", validate_token("user.update"), uploadFile.single("upload_image"), updateuserProfile);

};



// const { validate_token } = require("../controller/auth.controller");
// const {
//   getList,
//   create,
//   update,
//   remove,
//   newBarcode,
// } = require("../controller/product.controller_single_image");
// const { uploadFile } = require("../util/helper");

// // Import additional controllers
// const {
//   uploadProfileImage,
//   getProfileImage,
//   updateUserProfile,
//   getUserProfile,
// } = require("../controller/user.controller");

// module.exports = (app) => {
//   // Product routes
//   app.post(
//     "/api/product",
//     validate_token(),
//     uploadFile.single("upload_image"),
//     create
//   );
//   app.get("/api/product", validate_token(), getList);
//   app.put(
//     "/api/product",
//     validate_token(),
//     uploadFile.single("upload_image"),
//     update
//   );
//   app.delete("/api/product", validate_token(), remove);
//   app.post("/api/new_barcode", validate_token(), newBarcode);

//   // User profile routes
//   app.post(
//     "/api/user/upload-profile-image",
//     validate_token(),
//     uploadFile.single("profile_image"),
//     uploadProfileImage
//   );
//   app.get("/api/user/profile-image/:userId", validate_token(), getProfileImage);
//   app.put("/api/user/profile", validate_token(), updateUserProfile);
//   app.get("/api/user/profile", validate_token(), getUserProfile);
// };