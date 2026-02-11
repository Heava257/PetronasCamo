const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

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
        namedPlaceholders: true, // ✅ CRITICAL for :user_id syntax
      };
    } catch (err) {
      console.warn("⚠️ Failed to parse database URL:", err.message);
    }
  }

  // 2. Optimized Variable Selection
  const host = process.env.MYSQLHOST || process.env.DB_HOST;
  const port = process.env.MYSQLPORT || process.env.DB_PORT || 3306;
  const user = process.env.MYSQLUSER || process.env.DB_USER || "root";
  const database = process.env.MYSQLDATABASE || process.env.DB_DATABASE || "railway";

  if (!process.env.MYSQLHOST && !process.env.DB_HOST) {
    console.warn("⚠️ WARNING: MYSQLHOST is missing. If you are on Railway, make sure to CONNECT the Backend to the Database service in the dashboard.");
  }

  return {
    HOST: host || "database.railway.internal", // Default to 'database' as service name matches your screenshot
    USER: user,
    PASSWORD: process.env.MYSQLPASSWORD || process.env.DB_PASSWORD,
    DATABASE: database,
    PORT: port,
    namedPlaceholders: true, // ✅ CRITICAL for :user_id syntax
  };
};

const finalDb = getDbConfig();

module.exports = {
  config: {
    app_name: "POS-NIT",
    app_version: "1.0",
    frontend_url: process.env.FRONTEND_URL || "http://localhost:5173",
    image_path: "/public/", // URL path for frontend
    upload_path: path.join(__dirname, '../../public/uploads/'), // Disk path for backend
    db: finalDb,
    token: {
      access_token_key: process.env.ACCESS_TOKEN_KEY || localConfig.token?.access_token_key || "POS_NIT_DEFAULT_ACCESS_TOKEN_SECRET_2024",
      refresh_token_key: process.env.REFRESH_TOKEN_KEY || localConfig.token?.refresh_token_key || "POS_NIT_DEFAULT_REFRESH_TOKEN_SECRET_2024",
    },
  },
};

