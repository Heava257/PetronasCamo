const mysql = require('mysql2/promise');

// ✅ Direct environment variable usage (most reliable for Railway)
const pool = mysql.createPool({
  host: process.env.MYSQLHOST || 'localhost',
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'petronas_camo_db',
  port: parseInt(process.env.MYSQLPORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// ✅ Log connection details (without password)
console.log('🔗 Database Connection Config:');
console.log(`   Host: ${process.env.MYSQLHOST || 'localhost'}`);
console.log(`   User: ${process.env.MYSQLUSER || 'root'}`);
console.log(`   Database: ${process.env.MYSQLDATABASE || 'petronas_camo_db'}`);
console.log(`   Port: ${process.env.MYSQLPORT || 3306}`);
console.log(`   Password: ${process.env.MYSQLPASSWORD ? '[SET]' : '[NOT SET]'}`);

// ✅ Test connection
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('❌ Database connection failed:', err.message);
    console.error('Error code:', err.code);
  });

module.exports = pool;