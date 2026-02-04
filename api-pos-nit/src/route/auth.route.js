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
  logout,

  changePassword,
  registerFace,
  loginFace,
  verifyPassword
} = require("../controller/auth.controller");
const { uploadFile, usernameLimiter, failedLoginLimiter } = require("../util/helper");
module.exports = (app) => {
  app.post("/api/auth/login", usernameLimiter, failedLoginLimiter, login);
  app.post("/api/auth/logout", validate_token(), logout);
  app.post('/api/refresh-token', refreshToken);
  app.post("/api/auth/profile", validate_token(), profile);
  app.get("/api/auth/google", googleOAuth);
  app.get("/api/auth/google/callback", googleOAuthCallback);
  app.get("/api/auth/apple", appleOAuth);
  app.post("/api/auth/apple/callback", appleOAuthCallback);
  app.get("/api/auth/user-profile/:userId", validate_token(), getuserProfile);
  app.put(
    "/api/user/profile/:userId",
    validate_token("user.update"),
    uploadFile.single("upload_image"),
    updateuserProfile
  );
  app.get("/api/groups/get-list", validate_token("user.view"), getList);
  app.post("/api/auth/new_barcode", validate_token(), newBarcode);
  app.post(
    "/api/auth/register",
    validate_token("user.create"),
    uploadFile.single("upload_image"),
    register
  );
  app.put(
    "/api/auth/register",
    validate_token("user.update"),
    uploadFile.single("upload_image"),
    update
  );
  app.delete("/api/user", validate_token("user.remove"), remove);
  app.put("/api/user/change-password/:userId", validate_token(), changePassword);
  app.post("/api/auth/enroll-face", validate_token(), registerFace);
  app.post("/api/auth/login-face", loginFace);
  app.post("/api/auth/verify-password", validate_token(), verifyPassword);
};