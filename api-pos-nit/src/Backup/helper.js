const { config } = require("./config");
const connection = require("./connection");
const { logError } = require("./logError");
const fs = require("fs/promises");
const multer = require("multer");
const axios = require('axios');
const rateLimit = require("express-rate-limit");

exports.db = connection;
exports.logError = logError;

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

exports.formartDateClient = (data )=> {
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
  const TELEGRAM_TOKEN = "7944013925:AAGhl7BTtTaSYhODzg99xplHrJWAAuzJgnM";
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
  const TELEGRAM_TOKEN = "7018630729:AAGHS8Gw2Mywc-ybLo94SHyJ0icEptdEi6s";
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
  const TELEGRAM_TOKEN = "7918904743:AAHHcNK-R2EXcnsB3gAP-dYlYP38MwBxYT8";
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
  const TELEGRAM_TOKEN = "8488759873:AAFNycju0r_cBBsg_Dk-SRs1r1tuBFiXPB8";
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
  const TELEGRAM_TOKEN = "8046971725:AAFt4UJ-2D9pRdwb-BOUj3we96pwL4vo3vU";
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








exports.formatPrice = function(value) {
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
