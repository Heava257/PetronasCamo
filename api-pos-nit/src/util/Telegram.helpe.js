
const axios = require('axios');
const { db } = require('./helper');


exports.sendSmartNotification = async ({
  event_type,
  branch_name = null,
  title = null,
  message,
  severity = 'normal'
}) => {
  try {
    // ✅ Check if notifications are globally enabled
    const [globalSetting] = await db.query(`
      SELECT config_value 
      FROM system_config 
      WHERE config_key = 'telegram_notifications_enabled'
      LIMIT 1
    `);

    if (globalSetting[0]?.config_value !== 'true') {
      return { success: false, reason: 'globally_disabled' };
    }

    const recipients = [];

    // ✅✅✅ STEP 1: Get Super Admin configs (receive ALL events) ✅✅✅
    const [superAdminConfigs] = await db.query(`
      SELECT id, config_name, bot_token, chat_id, event_types
      FROM telegram_config
      WHERE config_type = 'super_admin'
        AND is_active = 1
    `);

    superAdminConfigs.forEach(config => {
      recipients.push({
        config_id: config.id,
        config_name: config.config_name,
        bot_token: config.bot_token,
        chat_id: config.chat_id,
        level: 'SUPER_ADMIN',
        message: `🔴 ${title || 'SUPER ADMIN ALERT'}\n${message}`
      });
    });

    // ✅✅✅ STEP 2: Get Branch-specific configs with EVENT FILTERING ✅✅✅
    if (branch_name) {
      const [branchConfigs] = await db.query(`
        SELECT id, config_name, bot_token, chat_id, event_types
        FROM telegram_config
        WHERE config_type = 'branch'
          AND branch_name = :branch_name
          AND is_active = 1
      `, { branch_name });

      branchConfigs.forEach(config => {
        // ✅ Check if this group should receive this event type
        let shouldReceive = false;

        if (!config.event_types || config.event_types === null) {
          // NULL = receive all events (like manager group)
          shouldReceive = true;
        } else {
          try {
            const eventTypes = JSON.parse(config.event_types);

            // Check if event_type matches
            if (Array.isArray(eventTypes)) {
              // Check for wildcard "*" or specific event match
              shouldReceive = eventTypes.includes('*') || eventTypes.includes(event_type);
            }
          } catch (parseError) {
            console.error(`Failed to parse event_types for ${config.config_name}:`, parseError);
            // If parsing fails, don't send to be safe
            shouldReceive = false;
          }
        }

        // ✅ Only add to recipients if group should receive this event
        if (shouldReceive) {
          recipients.push({
            config_id: config.id,
            config_name: config.config_name,
            bot_token: config.bot_token,
            chat_id: config.chat_id,
            level: 'BRANCH',
            event_types: config.event_types,
            message: `🟡 ${title || (branch_name ? branch_name.toUpperCase() + ' ALERT' : 'ALERT')}\n${message}`
          });
        } else {
        }
      });
    }

    // ✅✅✅ STEP 3: Get System configs (if system event) ✅✅✅
    if (event_type === 'system_event') {
      const [systemConfigs] = await db.query(`
        SELECT id, config_name, bot_token, chat_id
        FROM telegram_config
        WHERE config_type = 'system'
          AND is_active = 1
      `);

      systemConfigs.forEach(config => {
        recipients.push({
          config_id: config.id,
          config_name: config.config_name,
          bot_token: config.bot_token,
          chat_id: config.chat_id,
          level: 'SYSTEM',
          message: message
        });
      });
    }

    if (recipients.length === 0) {
      return {
        success: false,
        reason: 'no_matching_recipients',
        message: `No Telegram groups configured for event type: ${event_type}`,
        event_type,
        branch_name
      };
    }


    // ✅ Send to all matching recipients
    const results = [];

    for (const recipient of recipients) {
      try {
        const response = await axios.post(
          `https://api.telegram.org/bot${recipient.bot_token}/sendMessage`,
          {
            chat_id: recipient.chat_id,
            text: recipient.message,
            parse_mode: 'HTML'
          },
          {
            timeout: 10000
          }
        );

        results.push({
          success: true,
          config_name: recipient.config_name,
          level: recipient.level,
          message_id: response.data.result.message_id
        });


        // ✅ Update last successful send
        await db.query(`
          UPDATE telegram_config 
          SET last_test_at = NOW(),
              last_test_status = 'success'
          WHERE id = :config_id
        `, { config_id: recipient.config_id });

      } catch (error) {
        console.error(`❌ Failed to send to ${recipient.config_name}:`, error.message);

        results.push({
          success: false,
          config_name: recipient.config_name,
          error: error.message
        });

        await db.query(`
          UPDATE telegram_config 
          SET last_test_at = NOW(),
              last_test_status = 'failed'
          WHERE id = :config_id
        `, { config_id: recipient.config_id });
      }
    }

    // ✅ Log notification
    try {
      await db.query(`
        INSERT INTO notification_log (
          event_type, 
          branch_name, 
          message, 
          recipients_count,
          success_count,
          sent_at,
          status
        ) VALUES (
          :event_type,
          :branch_name,
          :message,
          :recipients_count,
          :success_count,
          NOW(),
          :status
        )
      `, {
        event_type,
        branch_name,
        message: message.substring(0, 500),
        recipients_count: recipients.length,
        success_count: results.filter(r => r.success).length,
        status: results.every(r => r.success) ? 'success' : 'partial'
      });
    } catch (logError) {
      console.error('Failed to log notification:', logError);
    }

    return {
      success: true,
      recipients_count: recipients.length,
      success_count: results.filter(r => r.success).length,
      event_type,
      branch_name,
      results
    };

  } catch (error) {
    console.error('❌ Smart notification error:', error);
    return {
      success: false,
      error: error.message
    };
  }
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

    // Inventory Events
    'low_stock_alert': 'ស្តុកនៅសល់តិច / Low Stock Alert',
    'stock_received': 'ទទួលស្តុក / Stock Received',
    'stock_adjustment': 'កែសម្រួលស្តុក / Stock Adjustment',

    // Finance Events
    'payment_received': 'ទទួលការបង់ប្រាក់ / Payment Received',
    'expense_created': 'ចំណាយថ្មី / New Expense',
    'daily_report': 'របាយការណ៍ប្រចាំថ្ងៃ / Daily Report',

    // System Events
    'system_event': 'ព្រឹត្តិការណ៍ប្រព័ន្ធ / System Event',
    'user_login': 'ចូលប្រព័ន្ធ / User Login',
    'unauthorized_access': 'ចូលដោយគ្មានការអនុញ្ញាត / Unauthorized Access'
  };
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