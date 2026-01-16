// // src/route/auth.route.js
// const {
//   getList,
//   register,
//   login,
//   profile,
//   validate_token,
//   remove,
//   update,
//   newBarcode,
//   getuserProfile,
//   updateuserProfile,
//   refreshToken,

// } = require("../controller/auth.controller");

// const { uploadFile } = require("../util/helper");

// module.exports = (app) => {
//   // Group routes
//   app.get("/api/groups/get-list", validate_token("user.getlist"), getList);

//   // Auth routes
//   app.post("/api/refresh-token", refreshToken);
//   app.post(
//     "/api/auth/register",
//     validate_token("user.create"),
//     uploadFile.single("upload_image"),
//     register
//   );
//   app.put(
//     "/api/auth/register",
//     validate_token("user.update"),
//     uploadFile.single("upload_image"),
//     update
//   );

//   app.post("/api/auth/login", login);


//   // Profile
//   app.post("/api/auth/profile", validate_token(), profile);

//   // Barcode
//   app.post("/api/auth/new_barcode", validate_token(), newBarcode);

//   // User profile by ID
//   app.get("/api/auth/user-profile/:userId", validate_token(), getuserProfile);
//   app.put(
//     "/api/user/profile/:userId",
//     validate_token("user.update"),
//     uploadFile.single("upload_image"),
//     updateuserProfile
//   );

//   // User management
//   app.delete("/api/user", validate_token("user.remove"), remove);
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
  refreshToken,
  googleOAuth,
  googleOAuthCallback,
  appleOAuthCallback,
  appleOAuth,
} = require("../controller/auth.controller");
const { uploadFile, usernameLimiter, failedLoginLimiter } = require("../util/helper");

module.exports = (app) => {
  app.get("/api/groups/get-list", validate_token("user.getlist"), getList);
  app.post('/api/refresh-token', refreshToken);
  app.post("/api/auth/register", validate_token("user.create"), uploadFile.single("upload_image"), register);
  app.delete("/api/user", validate_token("user.remove"), remove);
  app.put("/api/auth/register", validate_token("user.update"), uploadFile.single("upload_image"), update);
  app.post("/api/auth/login", usernameLimiter, failedLoginLimiter, login);
  app.post("/api/auth/profile", validate_token(), profile);
  app.post("/api/auth/new_barcode", validate_token(), newBarcode);
  app.get("/api/auth/user-profile/:userId", validate_token(), getuserProfile);
  app.put("/api/user/profile/:userId", validate_token("user.update"), uploadFile.single("upload_image"), updateuserProfile);
  app.get("/api/auth/google", googleOAuth);
  app.get("/api/auth/google/callback", googleOAuthCallback);
  app.get("/api/auth/apple", appleOAuth);
  app.post("/api/auth/apple/callback", appleOAuthCallback);

};




