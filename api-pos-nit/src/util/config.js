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
      // PREFER MYSQL* variables as they are auto-injected by Railway for production
      HOST: process.env.MYSQLHOST || process.env.DB_HOST || "localhost",
      USER: process.env.MYSQLUSER || process.env.DB_USER || "root",
      PASSWORD: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
      DATABASE: process.env.MYSQLDATABASE || process.env.DB_DATABASE,
      PORT: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
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

// --- Discovery Mode: finding available DB environment variables ---
console.log("🔍 Environment Variable Discovery:");
const interestingKeys = Object.keys(process.env).filter(key =>
  key.includes("DB") || key.includes("MYSQL") || key.includes("HOST") || key.includes("USER") || key.includes("PASS")
);
interestingKeys.forEach(key => {
  let val = process.env[key];
  if (key.includes("PASS") || key.includes("URL") || key.includes("TOKEN")) {
    val = val ? "[HIDDEN]" : "[EMPTY]";
  }
  console.log(`   ${key}: ${val}`);
});

// --- Debug Logging for Database (Final Config) ---
const dbCfg = module.exports.config.db;
console.log("🔗 Final Database Configuration:");
console.log(`   Host: ${dbCfg.HOST}`);
console.log(`   User: ${dbCfg.USER}`);
console.log(`   DB:   ${dbCfg.DATABASE}`);
console.log(`   Port: ${dbCfg.PORT}`);
console.log(`   Password Set: ${dbCfg.PASSWORD ? "YES" : "NO"}`);
// ----------------------------------
