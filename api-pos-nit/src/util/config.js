let localConfig = {};
try {
  localConfig = require("./config.local");
} catch {
  console.warn("Local config not found, using env variables");
}

let dbSource = { host: "default", user: "default", pass: "default", db: "default", port: "default" };

const getDbConfig = () => {
  // 1. Try MYSQL_URL first (most robust)
  const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
  if (dbUrl && dbUrl.startsWith("mysql://")) {
    try {
      const url = new URL(dbUrl);
      dbSource = { host: "MYSQL_URL", user: "MYSQL_URL", pass: "MYSQL_URL", db: "MYSQL_URL", port: "MYSQL_URL" };
      return {
        HOST: url.hostname,
        USER: url.username,
        PASSWORD: decodeURIComponent(url.password),
        DATABASE: url.pathname.replace("/", ""),
        PORT: url.port || 3306,
      };
    } catch (err) {
      console.warn("⚠️ Failed to parse database URL:", err.message);
    }
  }

  // 2. Try individual Railway variables (MYSQL*) then custom variables (DB_*)
  return {
    HOST: process.env.MYSQLHOST || (dbSource.host = "DB_HOST", process.env.DB_HOST) || "mysql.railway.internal",
    USER: process.env.MYSQLUSER || (dbSource.user = "DB_USER", process.env.DB_USER) || "root",
    PASSWORD: process.env.MYSQLPASSWORD || (dbSource.pass = "DB_PASSWORD", process.env.DB_PASSWORD),
    DATABASE: process.env.MYSQLDATABASE || (dbSource.db = "DB_DATABASE", process.env.DB_DATABASE),
    PORT: process.env.MYSQLPORT || (dbSource.port = "DB_PORT", process.env.DB_PORT) || 3306,
  };
};

const finalDb = getDbConfig();

module.exports = {
  config: {
    app_name: "POS-NIT",
    app_version: "1.0",
    frontend_url: process.env.FRONTEND_URL || "http://localhost:5173",
    image_path: "/public/",
    db: finalDb,
    token: {
      access_token_key: process.env.ACCESS_TOKEN_KEY || localConfig.token?.access_token_key || "POS_NIT_DEFAULT_ACCESS_TOKEN_SECRET_2024",
      refresh_token_key: process.env.REFRESH_TOKEN_KEY || localConfig.token?.refresh_token_key || "POS_NIT_DEFAULT_REFRESH_TOKEN_SECRET_2024",
    },
  },
};

// --- Debug Logging for Database (Production Friendly) ---
console.log("🔗 Final Database Configuration:");
console.log(`   Host: ${finalDb.HOST}`);
console.log(`   User: ${finalDb.USER}`);
console.log(`   DB:   ${finalDb.DATABASE}`);
console.log(`   Port: ${finalDb.PORT}`);
console.log(`   Password: ${finalDb.PASSWORD ? "[SET]" : "[NOT SET]"}`);

if (process.env.RAILWAY_ENVIRONMENT) {
  console.log("📍 Running in Railway environment");
}
// ----------------------------------
