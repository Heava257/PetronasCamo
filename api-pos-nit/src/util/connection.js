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
  keepAliveInitialDelay: 0
});


module.exports = pool;