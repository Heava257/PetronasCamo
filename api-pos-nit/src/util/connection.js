const mysql = require('mysql2/promise');
const { config } = require('./config');

// ✅ Centralized MySQL Pool Configuration
const pool = mysql.createPool({
  host: config.db.HOST,
  user: config.db.USER,
  password: config.db.PASSWORD,
  database: config.db.DATABASE,
  port: parseInt(config.db.PORT),
  namedPlaceholders: config.db.namedPlaceholders, // ✅ REQUIRED for :param syntax
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  connectTimeout: 10000, // 10 seconds timeout
  maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
});


module.exports = pool;