require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const path = require('path');

const app = express();

/* ======================
   BASIC MIDDLEWARE
====================== */
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));

/* ======================
   MYSQL CONNECTION
====================== */
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT
});

db.connect((err) => {
  if (err) {
    console.error('❌ MySQL connection failed:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to MySQL database!');
});

/* ======================
   STATIC FILES
====================== */
app.use('/public', express.static(path.join(__dirname, 'public')));

/* ======================
   HEALTH & TEST
====================== */
app.get('/', (req, res) => {
  res.json({
    name: 'Petronas POS API',
    status: 'OK'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date()
  });
});

/* ======================
   ROUTES
====================== */
require("./src/route/category.route")(app);
require("./src/route/auth.route")(app);
// (keep the rest of your routes here)

/* ======================
   404 HANDLER
====================== */
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Route not found'
  });
});

/* ======================
   ERROR HANDLER
====================== */
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: true,
    message: err.message
  });
});

/* ======================
   START SERVER (ONCE)
====================== */
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
