const { config } = require("./config");
const connection = require("./connection");
const { logError } = require("./logError");
const fs = require("fs/promises");
const multer = require("multer");
const axios = require('axios');
const crypto = require('crypto');
const { rateLimit } = require("express-rate-limit");
const fsSync = require("fs");
const path = require("path");
const { storage, deleteImage } = require("../config/cloudinary");

exports.db = connection;
exports.logError = logError;

exports.generateSessionToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

exports.toInt = () => {
  return true;
};

exports.isArray = (data) => {
  return true;
};

exports.isEmpty = (value) => {
  if (
    value == "" ||
    value == null ||
    value == undefined ||
    value == "null" ||
    value == "undefined"
  ) {
    return true;
  }
  return false;
};

exports.isEmail = (data) => {
  return true;
};

exports.formartDateServer = (data) => {
  return true;
};

exports.formartDateClient = (data) => {
  return true;
};

// ✅ Optimized Upload Directory Logic
const uploadDir = config.upload_path;
if (!fsSync.existsSync(uploadDir)) {
  fsSync.mkdirSync(uploadDir, { recursive: true });
  console.log('✅ Created upload directory:', uploadDir);
}

// ✅ UPDATED: Cloudinary upload configuration
exports.uploadFile = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5MB
  },
  fileFilter: function (req, file, callback) {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      callback(null, true);
    } else {
      callback(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'), false);
    }
  },
});

exports.removeFile = async (fileName) => {
  if (!fileName) return true;

  // ✅ New Cloudinary Deletion Logic
  if (fileName.includes("res.cloudinary.com")) {
    try {
      // Extract public_id from URL: .../upload/v12345/folder/id.jpg
      const parts = fileName.split('/');
      const lastPart = parts[parts.length - 1]; // "id.jpg"
      const folderPart = parts[parts.length - 2]; // "petronas-products" (if applicable)

      let publicId = lastPart.split('.')[0]; // "id"
      if (folderPart && folderPart !== 'upload') {
        publicId = `${folderPart}/${publicId}`;
      }

      console.log('☁️ Attempting Cloudinary delete for:', publicId);
      await deleteImage(publicId);
      return "Cloudinary file deleted successfully";
    } catch (err) {
      console.error('❌ Cloudinary delete error:', err.message);
      return true;
    }
  }

  // Fallback to local deletion for legacy files
  const filePath = path.join(uploadDir, fileName);
  try {
    await fs.unlink(filePath);
    console.log('✅ Local file deleted:', fileName);
    return "Local file deleted successfully";
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('ℹ️ Item already removed or not found:', fileName);
      return "File not found, but that's okay";
    }
    console.error('❌ Error deleting local file:', err.message);
    return true;
  }
};

exports.sendTelegramMessage = async (messageText) => {
  const TELEGRAM_TOKEN = "8038330594:AAGuWPsRpqZ_ewPRc5cwgZ4MQCkE1IevXSk";
  const CHAT_ID = "-5207829142";
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: messageText,
      parse_mode: "HTML",
    });
  } catch (err) {
    console.error("Telegram Error:", err.message);
  }
};

exports.sendTelegramMessagenewcustomer = async (messageText) => {
  const TELEGRAM_TOKEN = "7018630729:AAGHS8Gw2Mywc-ybLo94SHyJ0icEptdEi6sA";
  const CHAT_ID = "-1002471746151";
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: messageText,
      parse_mode: "HTML",
    });
  } catch (err) {
    console.error("Telegram Error:", err.message);
  }
};

exports.sendTelegramMessagenewcustomerPays = async (messageText, imageUrls = []) => {
  const TELEGRAM_TOKEN = "7918904743:AAHHcNK-R2EXcnsB3gAP-dYlYP38MwBxYT8A";
  const CHAT_ID = "-1002658440158";
  const apiBase = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
  try {
    await axios.post(`${apiBase}/sendMessage`, {
      chat_id: CHAT_ID,
      text: messageText,
      parse_mode: "HTML",
    });
    for (const imageUrl of imageUrls) {
      await axios.post(`${apiBase}/sendPhoto`, {
        chat_id: CHAT_ID,
        photo: imageUrl,
      });
    }
  } catch (err) {
    console.error("Telegram Error:", err.response?.data || err.message);
  }
};

exports.sendTelegramMessageIvoices_fake = async (messageText, imageUrls = []) => {
  const TELEGRAM_TOKEN = "7462727466:AAFgGq_JfaqFAium8ob2cR1DV3yD7YQpMOw";
  const CHAT_ID = "-1002829112188";
  const apiBase = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
  try {
    await axios.post(`${apiBase}/sendMessage`, {
      chat_id: CHAT_ID,
      text: messageText,
      parse_mode: "HTML",
    });
    for (const imageUrl of imageUrls) {
      await axios.post(`${apiBase}/sendPhoto`, {
        chat_id: CHAT_ID,
        photo: imageUrl,
      });
    }
  } catch (err) {
    console.error("Telegram Error:", err.response?.data || err.message);
  }
};

exports.sendTelegramMessagenewstock = async (messageText) => {
  const TELEGRAM_TOKEN = "8488759873:AAFNycju0r_cBBsg_Dk-SRs1r1tuBFiXPB8A";
  const CHAT_ID = "-1003037574963";
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: messageText,
      parse_mode: "HTML",
    });
  } catch (err) {
    console.error("Telegram Error:", err.message);
  }
};

exports.sendTelegramMessagenewLogin = async (messageText) => {
  const TELEGRAM_TOKEN = "8046971725:AAFt4UJ-2D9pRdwb-BOUj3we96pwL4vo3vUA";
  const CHAT_ID = "-1002862378477";
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  try {
    await axios.post(url, {
      chat_id: CHAT_ID,
      text: messageText,
      parse_mode: "HTML",
    });
  } catch (err) {
    console.error("Telegram Error:", err.message);
  }
};

exports.formatPrice = function (value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

exports.formatPriceArrow = (value) => {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

exports.formatPriceSafe = (value) => {
  try {
    const num = Number(value || 0);
    if (isNaN(num)) return '$0.00';
    return `$${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } catch (error) {
    console.error('Error formatting price:', error);
    return '$0.00';
  }
};

exports.formatPriceWithCurrency = (value, currency = '$') => {
  try {
    const num = Number(value || 0);
    if (isNaN(num)) return `${currency}0.00`;
    return `${currency}${num.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } catch (error) {
    console.error('Error formatting price:', error);
    return `${currency}0.00`;
  }
};

exports.formatPriceLocale = (value, locale = 'en-US', currency = 'USD') => {
  try {
    const num = Number(value || 0);
    if (isNaN(num)) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
      }).format(0);
    }
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(num);
  } catch (error) {
    console.error('Error formatting price:', error);
    return '$0.00';
  }
};

exports.formatPriceRecommended = (value) => {
  try {
    const num = Number(value || 0);
    if (isNaN(num)) return '$0.00';
    return `$${num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } catch (error) {
    console.error('Error formatting price:', error);
    return '$0.00';
  }
};

exports.parseUserAgent = (userAgent) => {
  const ua = userAgent.toLowerCase();
  let browser = 'Unknown';
  let version = '';
  if (ua.includes('firefox')) {
    browser = 'Firefox';
    version = ua.match(/firefox\/(\d+\.\d+)/)?.[1] || '';
  } else if (ua.includes('chrome') && !ua.includes('edg')) {
    browser = 'Chrome';
    version = ua.match(/chrome\/(\d+\.\d+)/)?.[1] || '';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Safari';
    version = ua.match(/version\/(\d+\.\d+)/)?.[1] || '';
  } else if (ua.includes('edg')) {
    browser = 'Edge';
    version = ua.match(/edg\/(\d+\.\d+)/)?.[1] || '';
  }

  let os = 'Unknown';
  if (ua.includes('windows nt 10.0')) os = 'Windows 10/11';
  else if (ua.includes('windows nt 6.3')) os = 'Windows 8.1';
  else if (ua.includes('windows nt 6.2')) os = 'Windows 8';
  else if (ua.includes('windows nt 6.1')) os = 'Windows 7';
  else if (ua.includes('mac os x')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  let deviceType = 'Desktop';
  if (ua.includes('mobile')) deviceType = 'Mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) deviceType = 'Tablet';

  let platform = 'Unknown';
  if (ua.includes('win')) platform = 'Windows';
  else if (ua.includes('mac')) platform = 'MacOS';
  else if (ua.includes('linux')) platform = 'Linux';
  else if (ua.includes('android')) platform = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) platform = 'iOS';

  return { browser, version, os, deviceType, platform, fullAgent: userAgent };
};

exports.getLocationFromIP = async (ip) => {
  try {
    if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return { country: 'Local Network', city: 'Localhost', isp: 'Local' };
    }
    return null;
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
};

const ipKeyGenerator = (req) => {
  try {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = forwarded
      ? forwarded.split(',')[0].trim()
      : req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown';
    const normalizedIp = ip.replace(/^::ffff:/, '').replace(/^::1$/, '127.0.0.1');
    return normalizedIp;
  } catch (error) {
    console.error('Error in ipKeyGenerator:', error);
    return 'unknown';
  }
};

exports.loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: ipKeyGenerator,
  skip: (req) => process.env.NODE_ENV === 'development',
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000 / 60);
    res.status(429).json({
      error: {
        message: `Too many login attempts. Please try again after ${retryAfter} minutes.`,
        message_kh: `ព្យាយាមចូលច្រើនពេក។ សូមព្យាយាមម្តងទៀតក្រោយពី ${retryAfter} នាទី។`,
        retry_after: retryAfter,
      }
    });
  }
});

exports.failedLoginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  skipFailedRequests: false,
  keyGenerator: ipKeyGenerator,
  skip: (req) => process.env.NODE_ENV === 'development',
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000 / 60);
    res.status(429).json({
      error: {
        message: `Too many failed login attempts. Please try again after ${retryAfter} minutes.`,
        message_kh: `ការព្យាយាមចូលបរាជ័យច្រើនពេក។ សូមព្យាយាមម្តងទៀតក្រោយពី ${retryAfter} នាទី។`,
        retry_after: retryAfter
      }
    });
  }
});

exports.usernameLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const username = req.body?.username || 'unknown';
    const ip = ipKeyGenerator(req);
    return `${username}-${ip}`;
  },
  skip: (req) => process.env.NODE_ENV === 'development',
  handler: (req, res) => {
    const retryAfter = Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000 / 60);
    res.status(429).json({
      error: {
        username: `Too many login attempts for this account. Please try again after ${retryAfter} minutes.`,
        username_kh: `ការព្យាយាមចូលច្រើនពេកសម្រាប់គណនីនេះ។ សូមព្យាយាមម្តងទៀតក្រោយពី ${retryAfter} នាទី។`,
        retry_after: retryAfter
      }
    });
  }
});

exports.trackUserActivity = async (req, res, next) => {
  try {
    if (req.current_id) {
      const userId = req.current_id;
      const sessionId = req.sessionID || req.headers['x-session-id'] || 'default';
      const ipAddress = ipKeyGenerator(req);
      const userAgent = req.get('User-Agent') || 'Unknown';
      updateUserActivity(userId, sessionId, ipAddress, userAgent).catch(err => {
        console.error('Failed to update user activity:', err);
      });
    }
    next();
  } catch (error) {
    console.error('Error in trackUserActivity middleware:', error);
    next();
  }
};

async function updateUserActivity(userId) {
  try {
    await connection.query(`
      UPDATE user 
      SET is_online = 1, 
          last_activity = NOW(), 
          online_status = 'online'
      WHERE id = ?
    `, [userId]);
  } catch (error) {
    console.error('Failed to update user activity:', error);
  }
}

exports.getOnlineUsers = async (req, res) => {
  try {
    const [onlineUsers] = await connection.query(`
      SELECT 
        u.id, u.name, u.username, u.profile_image, u.is_online, u.last_activity, u.online_status,
        r.name AS role_name, r.code AS role_code,
        TIMESTAMPDIFF(MINUTE, u.last_activity, NOW()) AS minutes_since_activity
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
      WHERE u.is_active = 1 AND u.is_online = 1 
        AND u.last_activity >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
      ORDER BY u.last_activity DESC
    `);
    res.json({
      success: true,
      online_users: onlineUsers,
      total_online: onlineUsers.length,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting online users:', error);
    res.status(500).json({ error: true, message: 'Failed to get online users' });
  }
};

exports.getUserStatus = async (req, res) => {
  try {
    const { user_id } = req.params;
    const [userStatus] = await connection.query(`
      SELECT 
        u.id, u.name, u.username, u.is_online, u.last_activity, u.online_status,
        TIMESTAMPDIFF(MINUTE, u.last_activity, NOW()) AS minutes_inactive,
        CASE
          WHEN TIMESTAMPDIFF(MINUTE, u.last_activity, NOW()) < 3 THEN 'online'
          WHEN TIMESTAMPDIFF(MINUTE, u.last_activity, NOW()) < 5 THEN 'away'
          ELSE 'offline'
        END AS computed_status
      FROM user u WHERE u.id = ?
    `, [user_id]);
    if (userStatus.length === 0) {
      return res.status(404).json({ error: true, message: 'User not found' });
    }
    res.json({ success: true, user: userStatus[0] });
  } catch (error) {
    console.error('Error getting user status:', error);
    res.status(500).json({ error: true, message: 'Failed to get user status' });
  }
};

exports.markUserOffline = async (userId) => {
  try {
    await connection.query(`UPDATE user SET is_online = 0, online_status = 'offline' WHERE id = ?`, [userId]);
    await connection.query(`UPDATE user_online_status SET is_online = 0 WHERE user_id = ?`, [userId]);
  } catch (error) {
    console.error('Failed to mark user offline:', error);
  }
};

exports.getAdminActivityStats = async (req, res) => {
  try {
    const [stats] = await connection.query(`
      SELECT r.name AS role_name, COUNT(*) AS total_users,
        SUM(CASE WHEN u.is_online = 1 THEN 1 ELSE 0 END) AS online_count,
        SUM(CASE WHEN u.online_status = 'away' THEN 1 ELSE 0 END) AS away_count,
        SUM(CASE WHEN u.is_online = 0 THEN 1 ELSE 0 END) AS offline_count
      FROM user u INNER JOIN role r ON u.role_id = r.id
      WHERE u.is_active = 1 AND r.code IN ('ADMIN', 'SUPER_ADMIN')
      GROUP BY r.name
    `);
    const [onlineAdmins] = await connection.query(`
      SELECT u.id, u.name, u.username, u.profile_image, u.online_status, u.last_activity, r.name AS role_name
      FROM user u INNER JOIN role r ON u.role_id = r.id
      WHERE u.is_online = 1 AND r.code IN ('ADMIN', 'SUPER_ADMIN')
      ORDER BY u.last_activity DESC
    `);
    res.json({ success: true, stats, online_admins: onlineAdmins, timestamp: new Date() });
  } catch (error) {
    console.error('Error getting admin activity stats:', error);
    res.status(500).json({ error: true, message: 'Failed to get admin activity stats' });
  }
};