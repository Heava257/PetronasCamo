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
  // If user provided 'mysql.railway.internal' but their service is named 'Database', we try to be smart.
  const rawHost = process.env.MYSQLHOST || process.env.DB_HOST;
  const host = (rawHost === "mysql.railway.internal") ? "database.railway.internal" : (rawHost || "database.railway.internal");

  const port = process.env.MYSQLPORT || process.env.DB_PORT || 3306;
  const user = process.env.MYSQLUSER || process.env.DB_USER || "root";
  const database = process.env.MYSQLDATABASE || process.env.DB_DATABASE || "railway";

  if (!process.env.MYSQL_URL && !process.env.MYSQLHOST) {
    console.warn("💡 Railway Tip: Connect your Backend to the Database in the dashboard to automatically set MYSQLHOST/MYSQLPASSWORD.");
  }

  return {
    HOST: host,
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

