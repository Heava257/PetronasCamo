
const { validate_token } = require("../controller/auth.controller");
const {
  getTelegramConfigs,
  createTelegramConfig,
  updateTelegramConfig,
  deleteTelegramConfig,
  testTelegramConfig,
  getBranches,
  getEventTypesList
} = require("../controller/Telegram.controller");

module.exports = (app) => {
  app.get("/api/telegram/configs", validate_token(), getTelegramConfigs);
  app.post("/api/telegram/configs", validate_token(), createTelegramConfig);
  app.put("/api/telegram/configs/:id", validate_token(), updateTelegramConfig);
  app.delete("/api/telegram/configs/:id", validate_token(), deleteTelegramConfig);
  app.post("/api/telegram/configs/:id/test", validate_token(), testTelegramConfig);
  app.get("/api/telegram/branches", validate_token(), getBranches);
  app.get("/api/telegram/event-types", validate_token(), getEventTypesList);

};