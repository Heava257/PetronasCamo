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
const express = require("express");
const cors = require("cors");
const app = express();
const path = require('path');

const { trackUserActivity } = require('./src/middleware/activity_tracker.middleware');
const {
  checkIPBlacklist,
  rateLimitMonitoring,
  postResponseAnalyzer
} = require('./src/middleware/securityMonitoring.middleware');

// CORS Configuration - Robust Origin Checking
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'https://petronas-camo-online.vercel.app',
      'https://petronascamo-online.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000'
    ];

    // Check if origin matches exactly or is a vercel subdomain
    const isAllowed = allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.railway.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1');

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked for origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400
}));

app.options('*', cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Static files
app.use('/public', express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

app.use('/api/public', express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Security middleware
app.use(checkIPBlacklist);
app.use('/api', rateLimitMonitoring(500, 60000));
app.use(trackUserActivity);
app.use(postResponseAnalyzer);

// Root
app.get('/', (req, res) => {
  res.json({
    name: "Petronas POS API",
    version: "1.0",
    status: "OK"
  });
});

// Routes
require("./src/route/category.route")(app);
require("./src/route/auth.route")(app);
require("./src/route/role.route")(app);
require("./src/route/supplier.route")(app);
require("./src/route/config.route")(app);
require("./src/route/product.route")(app);
require("./src/route/customer.route")(app);
require("./src/route/expanse.route")(app);
require("./src/route/employee.route")(app);
require("./src/route/order.route")(app);
require("./src/route/dashbaord.route")(app);
require("./src/route/report.route")(app);
require("./src/route/currency.route")(app);
require("./src/route/invoices.route")(app);
require("./src/route/admin_stock_transfer.route")(app);
require("./src/route/StockUser.route")(app);
require("./src/route/expense_type.route")(app);
require("./src/route/delivery.route")(app);
require("./src/route/fakeinvoice.route")(app);
require("./src/route/notification.route")(app);
require("./src/route/online_status.route")(app);
require("./src/route/activity_tracker.route")(app);
require("./src/route/supperadmin.route")(app);
require("./src/route/Permission.route")(app);
require("./src/route/Security.route")(app);
require("./src/route/purchase.route")(app);
require("./src/route/Telegram.route")(app);
require("./src/route/System_notification.route")(app);
require("./src/route/inventory.route")(app);
require("./src/route/Closing.route")(app);
require("./src/route/Pre_order.route")(app);
require("./src/route/Location.route")(app);
require("./src/route/truck.route")(app);

// Only load systemLog if it exists
try {
  require("./src/route/systemLog.routes")(app);
} catch (err) {
  console.log('⚠️ systemLog.routes not found, skipping...');
}

// Health
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date(),
    cors: 'Vercel wildcard enabled ✅'
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Route not found',
    path: req.path
  });
});
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    error: true,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`📍 Server running at http://localhost:${PORT}`);
});

const PORT = process.env.PORT || 1000;
app.listen(PORT, async () => {
  console.log(`🚀 Server on port ${PORT}`);
  console.log('🔒 CORS: Vercel wildcard enabled');
});

  // ✅ Test Database Connection on Startup
  try {
    const { db } = require("./src/util/helper");
    await db.query("SELECT 1");
    console.log("✅ Database connected successfully");
  } catch (dbErr) {
    console.error("❌ Database Connection Failed!");
    console.error("Error Code:", dbErr.code);
    console.error("Error Details:", dbErr.message);

    // Suggest common fixes based on error code
    if (dbErr.code === 'ECONNREFUSED') {
      console.error("💡 TIP: The host/port is wrong or the DB is down. Check your environment variables (MYSQLHOST/MYSQLPORT).");
    } else if (dbErr.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error("💡 TIP: Username or password incorrect. Check MYSQLUSER/MYSQLPASSWORD.");
    }
  }
});
