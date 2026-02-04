require('dotenv').config();
const express = require("express");
const cors = require("cors");
const path = require('path');
const fs = require('fs');

const app = express();

// ✅ Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middlewares
const { trackUserActivity } = require('./src/middleware/activity_tracker.middleware');
const {
  checkIPBlacklist,
  rateLimitMonitoring,
  postResponseAnalyzer
} = require('./src/middleware/securityMonitoring.middleware');

// Robust CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const allowedOrigins = [
      'https://web-pos-nit-production.up.railway.app',
      'https://petronas-cambodia.up.railway.app', // ✅ New Railway Frontend
      'http://localhost:5173',
      'http://localhost:3000'
    ];
    const isAllowed = allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.railway.app') ||
      origin.includes('localhost') ||
      origin.includes('127.0.0.1');
    if (isAllowed) {
      callback(null, true);
    } else {
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

// ✅ Static files configuration
const staticOptions = {
  setHeaders: (res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Cache-Control', 'public, max-age=31536000');
  }
};

// Serve uploads from multiple paths for flexibility
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads'), staticOptions));
app.use('/public/uploads', express.static(path.join(__dirname, 'public/uploads'), staticOptions));
app.use('/api/public/uploads', express.static(path.join(__dirname, 'public/uploads'), staticOptions));

// Legacy support
app.use('/public', express.static(path.join(__dirname, 'public'), staticOptions));
app.use('/api/public', express.static(path.join(__dirname, 'public'), staticOptions));

// Security monitoring
app.use(checkIPBlacklist);
app.use('/api', rateLimitMonitoring(500, 60000));
app.use(trackUserActivity);
app.use(postResponseAnalyzer);

// Routes
app.get('/', (req, res) => {
  res.json({
    name: "Petronas POS API",
    version: "1.0",
    status: "OK",
    timestamp: new Date()
  });
});

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
require("./src/route/customer_payment.route")(app);
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
require("./src/route/Branchpermissionoverride.route")(app); // ✅ Added
require("./src/route/Security.route")(app);
require("./src/route/purchase.route")(app);
require("./src/route/Telegram.route")(app);
require("./src/route/System_notification.route")(app);
require("./src/route/inventory.route")(app);
require("./src/route/Closing.route")(app);
require("./src/route/Pre_order.route")(app);
require("./src/route/Location.route")(app);
require("./src/route/branch.route")(app);
require("./src/route/truck.route")(app);
require("./src/route/upload.route")(app);
require("./src/route/supplier_payment.route")(app); // ✅ Supplier Payment Ledger
require("./src/route/ocr.route")(app); // ✅ OCR Bank Slips
require("./src/route/setting.route")(app); // ✅ System Settings

// Optional route
try {
  require("./src/route/systemLog.routes")(app);
} catch (err) {
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Test API
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API is working!',
    timestamp: new Date()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Route not found',
    path: req.path
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    error: true,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Server Startup
const PORT = process.env.PORT || 8000;
app.listen(PORT, async () => {

  // ✅ Test Database Connection on Startup
  try {
    const { db } = require("./src/util/helper");
    await db.query("SELECT 1");
    console.log(`✅ Connected to Database: ${require("./src/util/config").config.db.DATABASE} @ ${require("./src/util/config").config.db.HOST}`);
  } catch (dbErr) {
    console.error("❌ Database Connection Failed!");
    console.error("Error Code:", dbErr.code);
    console.error("Error Details:", dbErr.message);

    if (dbErr.code === 'ECONNREFUSED') {
      console.error("💡 TIP: Host/port is wrong or DB is down. Check MYSQLHOST/MYSQLPORT.");
    } else if (dbErr.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error("💡 TIP: Credentials incorrect. Check MYSQLUSER/MYSQLPASSWORD.");
    } else if (dbErr.code === 'ER_BAD_DB_ERROR') {
      console.error("💡 TIP: Database doesn't exist. Check MYSQLDATABASE.");
    }
  }
});