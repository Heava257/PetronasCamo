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

// --- Railway/Render URL Parsing Support ---
const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
if (dbUrl && dbUrl.startsWith("mysql://")) {
  try {
    const url = new URL(dbUrl);
    module.exports.config.db.HOST = url.hostname;
    module.exports.config.db.USER = url.username;
    module.exports.config.db.PASSWORD = decodeURIComponent(url.password);
    module.exports.config.db.DATABASE = url.pathname.replace("/", "");
    module.exports.config.db.PORT = url.port || 3306;
    console.log("📍 Parsed database connection from MYSQL_URL/DATABASE_URL");
  } catch (err) {
    console.warn("⚠️ Failed to parse database URL:", err.message);
  }
}

// --- Debug Logging for Database (Safe) ---
const dbCfg = module.exports.config.db;
console.log("🔗 Database Configuration attempt:");
console.log(`   Host: ${dbCfg.HOST}`);
console.log(`   User: ${dbCfg.USER}`);
console.log(`   DB:   ${dbCfg.DATABASE}`);
console.log(`   Port: ${dbCfg.PORT}`);
console.log(`   Password Set: ${dbCfg.PASSWORD ? "YES" : "NO"}`);
// ----------------------------------
