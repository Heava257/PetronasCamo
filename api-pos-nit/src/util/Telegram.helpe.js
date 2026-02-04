
const axios = require('axios');
const { db } = require('./helper');


exports.sendSmartNotification = async ({
  event_type,
  branch_name = null,
  title = null,
  message,
  severity = 'normal',
  image_url = null
}) => {
  try {
    // 1. Check Global Setting
    const [globalSetting] = await db.query(`
      SELECT config_value FROM system_config 
      WHERE config_key = 'telegram_notifications_enabled' LIMIT 1
    `);
    if (globalSetting[0]?.config_value === 'false') {
      return { success: false, reason: 'globally_disabled' };
    }

    // 2. Fetch Matching Configs
    // Logic: 
    // - Config must be active
    // - If event_types is NULL, it's a global listener
    // - If event_types is set, it must contain our event_type
    // - If branch_name matches, or config is system-wide (branch_name is NULL)
    const [configs] = await db.query(`
      SELECT bot_token, chat_id, config_name, branch_name, event_types, config_type
      FROM telegram_config
      WHERE is_active = 1
    `);

    if (configs.length === 0) return { success: false, reason: 'no_config' };

    // 3. Filter Recipients based on event & branch
    const recipients = configs.filter(conf => {
      // Parse event types if they exist
      let enabledEvents = [];
      try {
        enabledEvents = conf.event_types ? (typeof conf.event_types === 'string' ? JSON.parse(conf.event_types) : conf.event_types) : null;
      } catch (e) {
        console.error(`Error parsing event_types for ${conf.config_name}:`, e.message);
      }

      // Check Event Match:
      // - If no event_types specified, matches everything
      // - If event_types specified, must contain the current event_type
      const eventMatches = !enabledEvents || (Array.isArray(enabledEvents) && enabledEvents.includes(event_type));

      // Check Branch Match:
      // - Super Admin or System configs match everything
      // - Global configs (branch_name is NULL) match everything
      // - Branch-specific configs must match exactly
      const branchMatches = conf.config_type === 'super_admin' ||
        conf.config_type === 'system' ||
        !conf.branch_name ||
        conf.branch_name === branch_name;

      return eventMatches && branchMatches;
    });

    // 4. If no specific recipients found, use the first active one as fallback 
    // (preserving old behavior but only if nothing else matched)
    let finalRecipients = recipients;
    if (finalRecipients.length === 0) {
      console.warn(`⚠️ No specific Telegram recipients found for event ${event_type} and branch ${branch_name}. Falling back to first active config.`);
      finalRecipients = [configs[0]];
    }

    // 5. Send to all matching recipients
    const results = await Promise.all(finalRecipients.map(async (recipient) => {
      try {
        // Send Message
        await axios.post(
          `https://api.telegram.org/bot${recipient.bot_token}/sendMessage`,
          {
            chat_id: recipient.chat_id,
            text: message,
            parse_mode: 'HTML'
          },
          { timeout: 10000 }
        );

        // Send Photo if exists
        if (image_url) {
          try {
            await axios.post(
              `https://api.telegram.org/bot${recipient.bot_token}/sendPhoto`,
              { chat_id: recipient.chat_id, photo: image_url },
              { timeout: 10000 }
            );
          } catch (e) { console.error(`Telegram Photo Error (${recipient.config_name}):`, e.message); }
        }
        return { name: recipient.config_name, success: true };
      } catch (e) {
        console.error(`Telegram Error (${recipient.config_name}):`, e.message);
        return { name: recipient.config_name, success: false, error: e.message };
      }
    }));

    return { success: true, recipients: results };
  } catch (error) {
    console.error('Telegram Global Error:', error.message);
    return { success: false, error: error.message };
  }
};

// --- Formatters ---
exports.formatOpeningStock = (branchName, products) => {
  let msg = `<b>(1) + ស្តុកដើគ្រា (សាខា ${branchName})</b>\n`;
  products.forEach((p, index) => {
    msg += `${index + 1}. ${p.name || 'Unknown'}/${p.unit || 'L'}: <b>${p.qty || 0}</b>\n`;
  });
  return msg;
};

exports.formatStockIn = (branchName, user, products) => {
  let msg = `<b>(2) + ស្តុកចូលក្នុងគ្រា (សាខា ${branchName})</b>\n`;
  msg += `1. អ្នកទទួល: ${user}\n`;
  msg += `2. ក្រុមហ៊ុន: ${products[0]?.supplier_name || 'N/A'}\n`;
  products.forEach((p, index) => {
    msg += `${index + 3}. ${p.name}: <b>+${p.qty}</b>\n`;
  });
  return msg;
};

exports.formatStockOut = (branchName, seller, buyer, products) => {
  let msg = `<b>(3) + ស្តុកចេញក្នុងគ្រា (សាខា ${branchName})</b>\n`;
  msg += `1. អ្នកលក់: ${seller}\n`;
  msg += `2. អ្នកទិញ: ${buyer}\n`;
  msg += `3. អាសយដ្ឋាន: -\n`;
  products.forEach((p, index) => {
    msg += `${index + 4}. ${p.name}: <b>${p.qty}</b>\n`;
  });
  return msg;
};

exports.formatDebtAlert = (branchName, customer, oldDebt, currentPurchase, paid, due) => {
  let msg = `<b>(4) + បំណុលអតិថិជន (សាខា ${branchName})</b>\n`;
  msg += `1. បំណុលដើមគ្រា: $${(oldDebt || 0).toFixed(2)}\n`;
  msg += `2. ទិញក្នុងគ្រា: $${(currentPurchase || 0).toFixed(2)}\n`;
  msg += `3. សងក្នុងគ្រា: $${(paid || 0).toFixed(2)}\n`;
  msg += `4. នៅសល់ចុងគ្រា: <b>$${(due || 0).toFixed(2)}</b>\n`;
  return msg;
};

exports.formatClosingStock = (branchName, products) => {
  let msg = `<b>(5) + ស្តុកចុងគ្រា (សាខា ${branchName})</b>\n`;
  products.forEach((p, index) => {
    msg += `${index + 1}. ${p.name}/${p.unit || 'L'}: <b>${p.remaining_qty}</b>\n`;
  });
  msg += `\nupdate by: System`;
  return msg;
};

/**
 * Get available event types
 */
exports.getEventTypes = () => {
  return {
    // Customer Events
    'new_customer': 'អតិថិជនថ្មី / New Customer',
    'customer_payment': 'ការបង់ប្រាក់អតិថិជន / Customer Payment',
    'customer_debt': 'បំណុលអតិថិជន / Customer Debt',

    // Order Events
    'order_created': 'បញ្ជាទិញថ្មី / New Order',
    'order_paid': 'បង់ប្រាក់បញ្ជាទិញ / Order Paid',
    'order_cancelled': 'បោះបង់បញ្ជាទិញ / Order Cancelled',
    'pre_order_created': 'កម្មង់ទុកមុន / Pre Order Created',
    // Purchase Events
    'purchase_created': 'ការទិញថ្មី / New Purchase',
    'purchase_status_changed': 'ប្តូរស្ថានភាពការទិញ / Purchase Status Changed',
    'purchase_delivered': 'ទទួលទំនិញ / Purchase Delivered',
    'supplier_payment': 'បង់ប្រាក់ឱ្យអ្នកផ្គត់ផ្គង់ / Supplier Payment',

    // Inventory Events
    'low_stock_alert': 'ស្តុកនៅសល់តិច / Low Stock Alert',
    'stock_received': 'ទទួលស្តុក / Stock Received',
    'stock_adjustment': 'កែសម្រួលស្តុក / Stock Adjustment',
    'inventory_movement': 'ចលនាស្តុក (In/Out/Rem) / Inventory Movement',

    // Finance Events
    'payment_received': 'ទទួលការបង់ប្រាក់ / Payment Received',
    'expense_created': 'ចំណាយថ្មី / New Expense',
    'daily_report': 'របាយការណ៍ប្រចាំថ្ងៃ / Daily Report',

    // System Events
    'system_event': 'ព្រឹត្តិការណ៍ប្រព័ន្ធ / System Event',
    'user_login': 'ចូលប្រព័ន្ធ / User Login',
    'unauthorized_access': 'ចូលដោយគ្មានការអនុញ្ញាត / Unauthorized Access',
    'new_user': 'គណនីថ្មី / New Account Created'
  };
};

/**
 * Handle user login notifications
 */
exports.sendLoginNotification = async (userData, loginInfo) => {
  const { name, username, branch_name, role_name } = userData;
  const { ip_address, user_agent, location_info, device_info, login_time } = loginInfo;

  const device = typeof device_info === 'string' ? JSON.parse(device_info) : device_info;
  const location = typeof location_info === 'string' ? JSON.parse(location_info) : location_info;

  const formattedTime = new Date(login_time).toLocaleString('en-US', {
    timeZone: 'Asia/Phnom_Penh',
    dateStyle: 'full',
    timeStyle: 'long'
  });

  const message = `
🔐 <b>ការចូលប្រព័ន្ធ / User Login Detected</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 <b>អ្នកប្រើប្រាស់ / User:</b> ${name}
🆔 <b>Username:</b> ${username}
🎭 <b>តួនាទី / Role:</b> ${role_name}
🏢 <b>សាខា / Branch:</b> ${branch_name || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ <b>ពេលវេលា / Login Time:</b>
${formattedTime}

🌐 <b>IP Address:</b> <code>${ip_address}</code>
${location && location.country ? `📍 <b>Location:</b> ${location.city || 'Unknown'}, ${location.country}` : ''}

💻 <b>Device Info:</b>
• Platform: ${device?.platform || 'Unknown'}
• Browser: ${device?.browser || 'Unknown'} ${device?.version || ''}
• Device: ${device?.deviceType || 'Unknown'}

━━━━━━━━━━━━━━━━━━━━━━━━━━
<i>This is an automated security alert.</i>
  `;

  return exports.sendSmartNotification({
    event_type: 'user_login',
    branch_name: branch_name,
    title: `🔐 User Login: ${username}`,
    message: message.trim(),
    severity: 'info'
  });
};

exports.sendBranchNotification = async (branch_name, message) => {
  return exports.sendSmartNotification({
    event_type: 'branch_event',
    branch_name: branch_name,
    message: message,
    severity: 'normal'
  });
};

exports.sendSuperAdminNotification = async (message) => {
  try {
    const [configs] = await db.query(`
      SELECT bot_token, chat_id
      FROM telegram_config
      WHERE config_type = 'super_admin'
        AND is_active = 1
      LIMIT 1
    `);

    if (configs.length === 0) {
      return { success: false, reason: 'no_super_admin_config' };
    }

    const { bot_token, chat_id } = configs[0];

    await axios.post(
      `https://api.telegram.org/bot${bot_token}/sendMessage`,
      {
        chat_id: chat_id,
        text: `🔴 SUPER ADMIN ALERT\n${message}`,
        parse_mode: 'HTML'
      }
    );

    return { success: true };

  } catch (error) {
    console.error('Failed to send Super Admin notification:', error);
    return { success: false, error: error.message };
  }
};

exports.testConfiguration = async (config_id) => {
  try {
    const [config] = await db.query(`
      SELECT * FROM telegram_config WHERE id = :config_id
    `, { config_id });

    if (config.length === 0) {
      return { success: false, error: 'Configuration not found' };
    }

    const { bot_token, chat_id, config_name } = config[0];

    const testMessage = `
🧪 <b>Test Message / សារសាកល្បង</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Configuration: ${config_name}
✅ Status: Working perfectly!

⏰ Time: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })}
    `;

    const response = await axios.post(
      `https://api.telegram.org/bot${bot_token}/sendMessage`,
      {
        chat_id: chat_id,
        text: testMessage,
        parse_mode: 'HTML'
      }
    );
    await db.query(`
      UPDATE telegram_config 
      SET last_test_at = NOW(),
          last_test_status = 'success'
      WHERE id = :config_id
    `, { config_id });

    return {
      success: true,
      message_id: response.data.result.message_id
    };

  } catch (error) {
    await db.query(`
      UPDATE telegram_config 
      SET last_test_at = NOW(),
          last_test_status = 'failed'
      WHERE id = :config_id
    `, { config_id });

    return {
      success: false,
      error: error.response?.data?.description || error.message
    };
  }
};