require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// --- MySQL Connection ---
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT
});

db.connect((err) => {
  if (err) {
    console.error('❌ Error connecting to MySQL:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to MySQL database!');
});

// --- Test API route ---
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// --- Global error handler ---
app.use((err, req, res, next) => {
  console.error('❌ Global Error:', err);

  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(err.status || 500).json({
    error: true,
    message: isDevelopment ? err.message : 'Internal server error',
    message_kh: 'មានបញ្ហាកើតឡើង',
    ...(isDevelopment && { stack: err.stack })
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`📍 Server running at http://localhost:${PORT}`);
});
