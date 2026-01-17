const path = require('path');

let localConfig = {};
try {
  localConfig = require("./config.local");
} catch {
  // Safe to ignore in production
}

const getDbConfig = () => {
  // 1. Try MYSQL_URL first (most robust)
  const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
  if (dbUrl && dbUrl.startsWith("mysql://")) {
    try {
      const url = new URL(dbUrl);
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

  // 2. Optimized Variable Selection
  const host = process.env.MYSQLHOST || process.env.DB_HOST || "mysql.railway.internal";
  let user = process.env.MYSQLUSER || process.env.DB_USER || "root";

  // Anti-placeholder logic for Railway
  if (user === "appuser" && !process.env.MYSQLUSER) {
    user = "root";
  }

  return {
    HOST: host,
    USER: user,
    PASSWORD: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
    DATABASE: process.env.MYSQLDATABASE || process.env.DB_DATABASE,
    PORT: process.env.MYSQLPORT || process.env.DB_PORT || 3306,
  };
};

const finalDb = getDbConfig();

module.exports = {
  config: {
    app_name: "POS-NIT",
    app_version: "1.0",
    frontend_url: process.env.FRONTEND_URL || "http://localhost:5173",
    
    // ✅ FIXED: Use absolute path for uploads
    image_path: path.join(__dirname, '../../public/uploads/'),
    
    db: finalDb,
    token: {
      access_token_key: process.env.ACCESS_TOKEN_KEY || localConfig.token?.access_token_key || "POS_NIT_DEFAULT_ACCESS_TOKEN_SECRET_2024",
      refresh_token_key: process.env.REFRESH_TOKEN_KEY || localConfig.token?.refresh_token_key || "POS_NIT_DEFAULT_REFRESH_TOKEN_SECRET_2024",
    },
  },
};

// --- Secure Logging ---
console.log("🔗 FINAL DB CONFIG:");
console.log(`   Host: ${finalDb.HOST}`);
console.log(`   User: ${finalDb.USER}`);
console.log(`   DB:   ${finalDb.DATABASE}`);
console.log(`   Port: ${finalDb.PORT}`);
console.log(`   Pass: ${finalDb.PASSWORD ? "[SET]" : "[NOT SET]"}`);