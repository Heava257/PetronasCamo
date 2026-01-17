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

// ✅ Basic connection logging (detailed test occurs in index.js)
console.log(`📡 MySQL Pool Initialized (${config.db.HOST}:${config.db.PORT})`);

module.exports = pool;