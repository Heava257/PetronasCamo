
const { validate_token } = require("../controller/auth.controller");
const {
  getTelegramConfigs,
  createTelegramConfig,
  updateTelegramConfig,
  deleteTelegramConfig,
  testTelegramConfig,
  getBranches,
  getEventTypesList,
  handleWebhook
} = require("../controller/Telegram.controller");

module.exports = (app) => {
  app.get("/api/telegram/configs", validate_token("setting.update"), getTelegramConfigs);
  app.post("/api/telegram/configs", validate_token("setting.update"), createTelegramConfig);
  app.put("/api/telegram/configs/:id", validate_token("setting.update"), updateTelegramConfig);
  app.delete("/api/telegram/configs/:id", validate_token("setting.update"), deleteTelegramConfig);
  app.post("/api/telegram/configs/:id/test", validate_token("setting.update"), testTelegramConfig);
  app.get("/api/telegram/branches", validate_token("setting.update"), getBranches);
  app.get("/api/telegram/event-types", validate_token("setting.update"), getEventTypesList);

  // ✅ Public Webhook for Telegram (Using wildcard to support colons in tokens)
  app.post("/api/telegram/webhook/:bot_token*", handleWebhook);
};
