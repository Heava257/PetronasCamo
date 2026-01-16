let localConfig = {};
try {
  localConfig = require("./config.local");
} catch {
  console.warn("Local config not found, using env variables");
}

module.exports = {
  config: {
    app_name: "POS-NIT",
    app_version: "1.0",

    frontend_url: process.env.FRONTEND_URL || "http://localhost:5173",

    image_path: "/public/", // URL path, NOT disk path

    db: {
      HOST: process.env.DB_HOST,
      USER: process.env.DB_USER,
      PASSWORD: process.env.DB_PASSWORD,
      DATABASE: process.env.DB_DATABASE,
      PORT: process.env.DB_PORT || 3306,
    },

    token: {
      access_token_key:
        process.env.ACCESS_TOKEN_KEY ||
        localConfig.token?.access_token_key,

      refresh_token_key:
        process.env.REFRESH_TOKEN_KEY ||
        localConfig.token?.refresh_token_key,
    },
  },
};
