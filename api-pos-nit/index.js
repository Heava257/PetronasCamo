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

// CRITICAL: Add your Vercel domain here!
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://petronas-camo-online.vercel.app',  // ← YOUR VERCEL DOMAIN
  'https://petronas-api.onrender.com'
];

// CORS Configuration - MUST BE FIRST!
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log('✅ CORS allowed:', origin);
      return callback(null, true);
    }
    
    console.log('❌ CORS blocked:', origin);
    const msg = `CORS policy: Origin ${origin} is not allowed`;
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // 24 hours
}));

// Handle preflight requests
app.options('*', cors());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Static files with proper headers
app.use('/public', express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// API public route (for images)
app.use('/api/public', express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
  }
}));

// Security middleware
app.use(checkIPBlacklist);
app.use('/api', rateLimitMonitoring(100, 60000));
app.use(trackUserActivity);
app.use(postResponseAnalyzer);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: "Petronas POS API",
    version: "1.0",
    status: "OK",
    docs: "/health"
  });
});

// API Routes
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
require("./src/route/systemLog.routes")(app);

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    security: 'AI-Powered Monitoring Active 🛡️',
    cors: 'Enabled ✅',
    allowed_origins: allowedOrigins,
    features: {
      ip_blacklist: 'Active ✅',
      rate_limiting: 'Active ✅',
      ai_detection: 'Active ✅',
      post_response_analysis: 'Active ✅'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Route not found',
    message_kh: 'រកមិនឃើញផ្លូវនេះទេ',
    path: req.path
  });
});

// Global error handler
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

const PORT = process.env.PORT || 1000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 CORS enabled for:`, allowedOrigins);
});