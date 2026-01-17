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
      HOST: process.env.DB_HOST || process.env.MYSQLHOST || "localhost",
      USER: process.env.DB_USER || process.env.MYSQLUSER,
      PASSWORD: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
      DATABASE: process.env.DB_DATABASE || process.env.MYSQLDATABASE,
      PORT: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
    },

    token: {
      access_token_key:
        process.env.ACCESS_TOKEN_KEY ||
        localConfig.token?.access_token_key ||
        "POS_NIT_DEFAULT_ACCESS_TOKEN_SECRET_2024", // Fallback to prevent crash

      refresh_token_key:
        process.env.REFRESH_TOKEN_KEY ||
        localConfig.token?.refresh_token_key ||
        "POS_NIT_DEFAULT_REFRESH_TOKEN_SECRET_2024", // Fallback to prevent crash
    },
  },
};
