
const express = require("express");
const cors = require("cors");
const app = express();
const path = require('path');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/public', express.static(path.join(__dirname, 'public')));


const { trackUserActivity } = require('./src/middleware/activity_tracker.middleware');
const {
  checkIPBlacklist,
  rateLimitMonitoring,
  postResponseAnalyzer
} = require('./src/middleware/securityMonitoring.middleware');


app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://petronas-camo-git-main-chivas-projects-e8c5c304.vercel.app',
    'https://petronas-api.onrender.com'
  ],
  credentials: true
}));

app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));
app.use(checkIPBlacklist);
app.use('/api', rateLimitMonitoring(100, 60000));
app.use(trackUserActivity);

app.use(postResponseAnalyzer);

app.get('/', (req, res) => {
  res.json({
    name: "Petronas POS API",
    version: "1.0",
    status: "OK",
    docs: "/health"
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
require("./src/route/dashbaord.route")(app);
require("./src/route/report.route")(app);
require("./src/route/currency.route")(app);
require("./src/route/invoices.route")(app);
require("./src/route/admin_stock_transfer.route")(app);
require("./src/route/StockUser.route")(app);
// require("./src/route/Chat_Application.route")(app);
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






app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    security: 'AI-Powered Monitoring Active 🛡️',
    cors: 'Enabled ✅',
    features: {
      ip_blacklist: 'Active ✅',
      rate_limiting: 'Active ✅',
      ai_detection: 'Active ✅',
      post_response_analysis: 'Active ✅'
    }
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: 'Route not found',
    message_kh: 'រកមិនឃើញផ្លូវនេះទេ',
    path: req.path
  });
});

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
});
