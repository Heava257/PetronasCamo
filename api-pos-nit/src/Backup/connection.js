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

//     connection.release();  
//   })
//   .catch(error => {
//     console.error("Error connecting to MySQL:", error.message);
//   });

// pool.on('acquire', (connection) => {

// });

// pool.on('release', (connection) => {

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
 
