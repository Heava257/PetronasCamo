const { config } = require("./config");
const connection = require("./connection");
const { logError } = require("./logError");
const fs = require("fs/promises");
const multer = require("multer");
const axios = require('axios');
const crypto = require('crypto');
const rateLimit = require("express-rate-limit");

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

// exports.notEmpty = (value) => {
//   if (
//     value == "" ||
//     value == null ||
//     value == undefined ||
//     value == "null" ||
//     value == "undefined"
//   ) {
//     return false;
//   }
//   return true;
// };

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

exports.uploadFile = multer({
  storage: multer.diskStorage({
    destination: function (req, file, callback) {
      // image path
      callback(null, config.image_path);
    },
    filename: function (req, file, callback) {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      callback(null, file.fieldname + "-" + uniqueSuffix);
    },
  }),
  limits: {
    fileSize: 1024 * 1024 * 3, // max 3MB
  },
  fileFilter: function (req, file, callback) {
    if (
      file.mimetype != "image/png" &&
      file.mimetype !== "image/jpg" &&
      file.mimetype !== "image/jpeg"
    ) {
      // not allow
      callback(null, false);
    } else {
      callback(null, true);
    }
  },
});

exports.removeFile = async (fileName) => {
  var filePath = config.image_path + fileName;
  try {
    await fs.unlink(filePath);
    return "File deleted successfully";
  } catch (err) {
    // console.error("Error deleting file:", err);
    return true;
    // throw err;
  }
};


exports.sendTelegramMessage = async (messageText) => {
  const TELEGRAM_TOKEN = "7944013925:AAGhl7BTtTaSYhODzg99xplHrJWAAuzJgnMA";
  const CHAT_ID = "-1002627306293"; // Your chat ID

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
  const CHAT_ID = "-1002471746151"; // Your chat ID

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
  const CHAT_ID = "-1002658440158"; // Replace with your actual chat ID

  const apiBase = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

  try {
    // 1. Send the text message
    await axios.post(`${apiBase}/sendMessage`, {
      chat_id: CHAT_ID,
      text: messageText,
      parse_mode: "HTML",
    });

    // 2. Send each image (if any)
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
  const CHAT_ID = "-1002829112188"; // Replace with your actual chat ID

  const apiBase = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

  try {
    // 1. Send the text message
    await axios.post(`${apiBase}/sendMessage`, {
      chat_id: CHAT_ID,
      text: messageText,
      parse_mode: "HTML",
    });

    // 2. Send each image (if any)
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
  const CHAT_ID = "-1003037574963"; // Your chat ID

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
  const CHAT_ID = "-1002862378477"; // Your chat ID

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
    if (isNaN(num)) {
      return '$0.00';
    }
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
    if (isNaN(num)) {
      return `${currency}0.00`;
    }
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

    if (isNaN(num)) {
      return '$0.00';
    }

    return `$${num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  } catch (error) {
    console.error('Error formatting price:', error);
    return '$0.00';
  }
};



// Helper function to parse User Agent
exports.parseUserAgent = (userAgent) => {
  const ua = userAgent.toLowerCase();
  
  // Detect browser
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

  // Detect OS
  let os = 'Unknown';
  if (ua.includes('windows nt 10.0')) os = 'Windows 10/11';
  else if (ua.includes('windows nt 6.3')) os = 'Windows 8.1';
  else if (ua.includes('windows nt 6.2')) os = 'Windows 8';
  else if (ua.includes('windows nt 6.1')) os = 'Windows 7';
  else if (ua.includes('mac os x')) os = 'macOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

  // Detect device type
  let deviceType = 'Desktop';
  if (ua.includes('mobile')) deviceType = 'Mobile';
  else if (ua.includes('tablet') || ua.includes('ipad')) deviceType = 'Tablet';

  // Detect platform
  let platform = 'Unknown';
  if (ua.includes('win')) platform = 'Windows';
  else if (ua.includes('mac')) platform = 'MacOS';
  else if (ua.includes('linux')) platform = 'Linux';
  else if (ua.includes('android')) platform = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) platform = 'iOS';

  return {
    browser,
    version,
    os,
    deviceType,
    platform,
    fullAgent: userAgent
  };
}

// Helper function to get location from IP (optional - requires IP geolocation API)
exports.getLocationFromIP = async (ip) => {
  try {
    // Skip for localhost/private IPs
    if (ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return {
        country: 'Local Network',
        city: 'Localhost',
        isp: 'Local'
      };
    }

    // You can use a free IP geolocation service
    // Example: ipapi.co, ip-api.com, ipgeolocation.io
    // Uncomment and configure if you want to use it:
    
    /*
    const fetch = require('node-fetch');
    const response = await fetch(`http://ip-api.com/json/${ip}`);
    const data = await response.json();
    
    return {
      country: data.country || 'Unknown',
      city: data.city || 'Unknown',
      isp: data.isp || 'Unknown',
      lat: data.lat,
      lon: data.lon
    };
    */
    
    return null; // Return null if not using IP geolocation
  } catch (error) {
    console.error('Error getting location:', error);
    return null;
  }
}


exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 login attempts per IP (including successful)
  skipSuccessfulRequests: false, // ⚠️ Count ALL attempts
  skipFailedRequests: false, // Count failed attempts
  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req) => {
    return req.ip || 
           req.headers['x-forwarded-for']?.split(',')[0] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress || 
           'unknown';
  },
  
  handler: (req, res) => {
    const retryAfter = Math.ceil(req.rateLimit.resetTime / 1000 / 60);
    
    res.status(429).json({
      error: {
        message: `Too many login attempts from this IP. Please try again after ${retryAfter} minutes.`,
        message_kh: `ព្យាយាមចូលច្រើនពេកពី IP នេះ។ សូមព្យាយាមម្តងទៀតក្រោយពី ${retryAfter} នាទី។`,
        retry_after: retryAfter,
        limit: req.rateLimit.limit,
        current: req.rateLimit.current,
        reset_time: new Date(req.rateLimit.resetTime).toISOString()
      }
    });
  }
});

exports.failedLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, 
  skipSuccessfulRequests: true, 
  skipFailedRequests: false, 
  
  keyGenerator: (req) => {
    return req.ip || 
           req.headers['x-forwarded-for']?.split(',')[0] || 
           req.connection.remoteAddress || 
           'unknown';
  },
  
  handler: (req, res) => {
    const retryAfter = Math.ceil(req.rateLimit.resetTime / 1000 / 60);
    
    res.status(429).json({
      error: {
        message: `Too many failed login attempts. Please try again after ${retryAfter} minutes.`,
        message_kh: `ការព្យាយាមចូលបរាជ័យច្រើនពេក។ សូមព្យាយាមម្តងទៀតក្រោយពី ${retryAfter} នាទី។`,
        retry_after: retryAfter,
        reset_time: new Date(req.rateLimit.resetTime).toISOString()
      }
    });
  }
});

exports.usernameLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  skipSuccessfulRequests: true,
  
  keyGenerator: (req) => {
    const username = req.body?.username || 'unknown';
    const ip = req.ip || 'unknown';
    return `${username}-${ip}`;
  },
  
  handler: (req, res) => {
    const retryAfter = Math.ceil(req.rateLimit.resetTime / 1000 / 60);
    
    res.status(429).json({
      error: {
        username: `Too many login attempts for this account. Please try again after ${retryAfter} minutes.`,
        username_kh: `ការព្យាយាមចូលច្រើនពេកសម្រាប់គណនីនេះ។ សូមព្យាយាមម្តងទៀតក្រោយពី ${retryAfter} នាទី។`,
        retry_after: retryAfter
      }
    });
  }
});