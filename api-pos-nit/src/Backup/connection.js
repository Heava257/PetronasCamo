// const mysql = require("mysql2/promise");
// const { config } = require("./config");

// const pool = mysql.createPool({
//   host: config.db.HOST,
//   user: config.db.USER,
//   password: config.db.PASSWORD,
//   database: config.db.DATABASE,
//   port: config.db.PORT,
//   namedPlaceholders: true,
// });

// pool.getConnection()
//   .then(connection => {
//     console.log("MySQL connected successfully");
//     connection.release();  
//   })
//   .catch(error => {
//     console.error("Error connecting to MySQL:", error.message);
//   });

// pool.on('acquire', (connection) => {
//   console.log(`Connection ${connection.threadId} acquired`);
// });

// pool.on('release', (connection) => {
//   console.log(`Connection ${connection.threadId} released`);
// });

// module.exports = pool;
const mysql = require("mysql2/promise");
const { config } = require("./config");
module.exports = mysql.createPool({
  host: config.db.HOST,
  user: config.db.USER,
  password: config.db.PASSWORD,
  database: config.db.DATABASE,
  port: config.db.PORT,
  namedPlaceholders: true,
});
 