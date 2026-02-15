const { db } = require("../util/helper");
const { logError } = require("../util/logError");
const { getEventTypes } = require("../util/Telegram.helpe");
const axios = require('axios');

exports.getTelegramConfigs = async (req, res) => {
  try {
    const currentUserId = req.current_id;

    const [currentUser] = await db.query(
      `SELECT r.code AS role_code 
       FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Access denied. Super Admin only.",
        message_kh: "បដិសេធការចូលប្រើ។ សម្រាប់ Super Admin តែប៉ុណ្ណោះ"
      });
    }

    // ✅✅✅ FIXED: Added event_types column to SELECT
    const [configs] = await db.query(`
      SELECT 
        id,
        config_type,
        config_name,
        bot_token,
        chat_id,
        branch_name,
        event_types,
        description,
        is_active,
        last_test_at,
        last_test_status,
        created_at,
        created_by,
        updated_at,
        updated_by
      FROM telegram_config
      ORDER BY 
        CASE config_type
          WHEN 'super_admin' THEN 1
          WHEN 'branch' THEN 2
          WHEN 'system' THEN 3
          ELSE 4
        END,
        branch_name ASC,
        created_at DESC
    `);

    // ✅✅✅ FIXED: Parse JSON string to array for frontend
    const processedConfigs = configs.map(config => ({
      ...config,
      event_types: config.event_types ? JSON.parse(config.event_types) : null
    }));

    const [stats] = await db.query(`
      SELECT 
        COUNT(*) AS total_configs,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_configs,
        SUM(CASE WHEN config_type = 'branch' THEN 1 ELSE 0 END) AS branch_configs,
        SUM(CASE WHEN last_test_status = 'success' THEN 1 ELSE 0 END) AS working_configs
      FROM telegram_config
    `);


    return res.json({
      success: true,
      configs: processedConfigs,
      stats: stats[0] || {
        total_configs: 0,
        active_configs: 0,
        branch_configs: 0,
        working_configs: 0
      }
    });

  } catch (error) {
    console.error('❌ Error in getTelegramConfigs:', error);
    logError("telegram.getTelegramConfigs", error, res);
    return res.status(500).json({
      error: true,
      message: "Failed to get Telegram configurations"
    });
  }
};
/**
 * Create Telegram configuration
 * @route POST /api/telegram/configs
 */
exports.createTelegramConfig = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const {
      config_type,
      config_name,
      bot_token,
      chat_id,
      branch_name,
      description,
      event_types, // ✅ Extract event_types
      is_active = 1
    } = req.body;

    // ✅ Process event_types (Convert array to JSON string)
    const eventTypesJson = (event_types && Array.isArray(event_types) && event_types.length > 0)
      ? JSON.stringify(event_types)
      : null;

    // ✅ Verify Super Admin
    const [currentUser] = await db.query(
      `SELECT u.name, r.code AS role_code 
       FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Only Super Admin can create Telegram configurations",
        message_kh: "មានតែ Super Admin ទេដែលអាចបង្កើតការកំណត់ Telegram"
      });
    }

    // ✅ Validation
    if (!config_type || !config_name || !bot_token || !chat_id) {
      return res.status(400).json({
        error: true,
        message: "Missing required fields: config_type, config_name, bot_token, chat_id",
        message_kh: "ត្រូវការព័ត៌មានចាំបាច់"
      });
    }

    // ✅ Validate config_type
    const validTypes = ['super_admin', 'branch', 'system'];
    if (!validTypes.includes(config_type)) {
      return res.status(400).json({
        error: true,
        message: "Invalid config_type. Must be: super_admin, branch, or system",
        message_kh: "ប្រភេទការកំណត់មិនត្រឹមត្រូវ"
      });
    }

    // ✅ Check for EXACT duplicate (same bot_token + chat_id)
    const [existing] = await db.query(`
      SELECT id, config_name FROM telegram_config 
      WHERE bot_token = :bot_token AND chat_id = :chat_id
      LIMIT 1
    `, {
      bot_token,
      chat_id
    });

    if (existing.length > 0) {
      return res.status(409).json({
        error: true,
        message: `Configuration already exists for this bot token and chat ID (${existing[0].config_name})`,
        message_kh: "មានការកំណត់សម្រាប់ bot និង chat ID នេះរួចហើយ",
        existing_config: existing[0].config_name
      });
    }

    // ✅✅✅ FIXED: Correct INSERT query with proper column-value mapping
    const [result] = await db.query(`
      INSERT INTO telegram_config (
        config_type,
        config_name,
        bot_token,
        chat_id,
        branch_name,
        description,
        event_types,
        is_active,
        created_at,
        created_by
      ) VALUES (
        :config_type,
        :config_name,
        :bot_token,
        :chat_id,
        :branch_name,
        :description,
        :event_types,
        :is_active,
        NOW(),
        :created_by
      )
    `, {
      config_type,
      config_name,
      bot_token,
      chat_id,
      branch_name: branch_name || null,
      description: description || null,
      event_types: eventTypesJson,  // ✅ Save event types as JSON string
      is_active,
      created_by: currentUser[0]?.name
    });

    const configId = result.insertId;

    // ✅ Log activity
    try {
      await db.query(`
        INSERT INTO user_activity_log (
          user_id,
          action_type,
          action_description,
          ip_address,
          created_at,
          created_by
        ) VALUES (
          :user_id,
          'TELEGRAM_CONFIG_CREATED',
          :description,
          :ip_address,
          NOW(),
          :created_by
        )
      `, {
        user_id: currentUserId,
        description: `Created Telegram config: ${config_name} (${config_type}) for ${branch_name || 'system'} with event filters: ${event_types ? event_types.join(', ') : 'ALL'}`,
        ip_address: req.ip || 'Unknown',
        created_by: currentUserId
      });
    } catch (logErr) {
      console.error("Failed to log activity:", logErr);
    }



    return res.status(201).json({
      success: true,
      message: "Telegram configuration created successfully",
      message_kh: "បង្កើតការកំណត់ Telegram បានជោគជ័យ",
      data: {
        id: configId,
        config_name,
        config_type,
        branch_name,
        event_types: event_types || null
      }
    });

  } catch (error) {
    console.error('❌ Error in createTelegramConfig:', error);
    logError("telegram.createTelegramConfig", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to create Telegram configuration",
      message_kh: "មិនអាចបង្កើតការកំណត់ Telegram បានទេ",
      details: error.message
    });
  }
};
/**
 * Update Telegram configuration
 * @route PUT /api/telegram/configs/:id
 */
exports.updateTelegramConfig = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { id } = req.params;
    const {
      config_name,
      bot_token,
      chat_id,
      branch_name,
      description,
      event_types, // ✅ Extract event_types
      is_active
    } = req.body;

    // ✅ Process event_types
    const eventTypesJson = (event_types && Array.isArray(event_types) && event_types.length > 0)
      ? JSON.stringify(event_types)
      : null;

    // ✅ Verify Super Admin
    const [currentUser] = await db.query(
      `SELECT u.name, r.code AS role_code 
       FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Access denied. Super Admin only.",
        message_kh: "បដិសេធការចូលប្រើ។ សម្រាប់ Super Admin តែប៉ុណ្ណោះ"
      });
    }

    // ✅ Check if config exists
    const [existing] = await db.query(
      "SELECT id, config_name, config_type FROM telegram_config WHERE id = :id",
      { id }
    );

    if (existing.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Configuration not found",
        message_kh: "រកមិនឃើញការកំណត់"
      });
    }

    // ✅✅✅ FIXED: Check duplicate only for same bot+chat (excluding current record)
    if (bot_token && chat_id) {
      const [duplicate] = await db.query(`
        SELECT id, config_name FROM telegram_config 
        WHERE bot_token = :bot_token 
          AND chat_id = :chat_id 
          AND id != :id
        LIMIT 1
      `, {
        bot_token,
        chat_id,
        id
      });

      if (duplicate.length > 0) {
        return res.status(409).json({
          error: true,
          message: `Another configuration exists with same bot token and chat ID (${duplicate[0].config_name})`,
          message_kh: "មានការកំណត់ផ្សេងដែលប្រើ bot និង chat ID នេះរួចហើយ",
          existing_config: duplicate[0].config_name
        });
      }
    }

    // ✅ Update configuration
    await db.query(`
      UPDATE telegram_config SET
        config_name = :config_name,
        bot_token = :bot_token,
        chat_id = :chat_id,
      branch_name = :branch_name,
        description = :description,
        event_types = :event_types,
        is_active = :is_active,
        updated_at = NOW(),
        updated_by = :updated_by
      WHERE id = :id
    `, {
      id,
      config_name,
      bot_token,
      chat_id,
      branch_name: branch_name || null,
      description: description || null,
      event_types: eventTypesJson, // ✅ Update event types
      is_active: is_active !== undefined ? is_active : 1,
      updated_by: currentUser[0]?.name
    });

    // ✅ Log activity
    try {
      await db.query(`
        INSERT INTO user_activity_log (
          user_id,
          action_type,
          action_description,
          created_at,
          created_by
        ) VALUES (
          :user_id,
          'TELEGRAM_CONFIG_UPDATED',
          :description,
          NOW(),
          :created_by
        )
      `, {
        user_id: currentUserId,
        description: `Updated Telegram config: ${config_name}`,
        created_by: currentUserId
      });
    } catch (logErr) {
      console.error("Failed to log activity:", logErr);
    }



    return res.json({
      success: true,
      message: "Configuration updated successfully",
      message_kh: "កែប្រែការកំណត់បានជោគជ័យ"
    });

  } catch (error) {
    console.error('❌ Error in updateTelegramConfig:', error);
    logError("telegram.updateTelegramConfig", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to update configuration",
      message_kh: "មិនអាចកែប្រែការកំណត់បានទេ",
      details: error.message
    });
  }
};

/**
 * Delete Telegram configuration
 * @route DELETE /api/telegram/configs/:id
 */
exports.deleteTelegramConfig = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { id } = req.params;

    // ✅ Verify Super Admin
    const [currentUser] = await db.query(
      `SELECT u.name, r.code AS role_code 
       FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Access denied. Super Admin only.",
        message_kh: "បដិសេធការចូលប្រើ។ សម្រាប់ Super Admin តែប៉ុណ្ណោះ"
      });
    }

    // ✅ Get config info before deleting
    const [config] = await db.query(
      "SELECT config_name, config_type, branch_name FROM telegram_config WHERE id = :id",
      { id }
    );

    if (config.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Configuration not found",
        message_kh: "រកមិនឃើញការកំណត់"
      });
    }

    // ✅ Delete configuration
    await db.query("DELETE FROM telegram_config WHERE id = :id", { id });

    // ✅ Log activity
    try {
      await db.query(`
        INSERT INTO user_activity_log (
          user_id,
          action_type,
          action_description,
          created_at,
          created_by
        ) VALUES (
          :user_id,
          'TELEGRAM_CONFIG_DELETED',
          :description,
          NOW(),
          :created_by
        )
      `, {
        user_id: currentUserId,
        description: `Deleted Telegram config: ${config[0].config_name} (${config[0].config_type}) - Branch: ${config[0].branch_name || 'N/A'}`,
        created_by: currentUserId
      });
    } catch (logErr) {
      console.error("Failed to log activity:", logErr);
    }


    return res.json({
      success: true,
      message: "Configuration deleted successfully",
      message_kh: "លុបការកំណត់បានជោគជ័យ"
    });

  } catch (error) {
    console.error('❌ Error in deleteTelegramConfig:', error);
    logError("telegram.deleteTelegramConfig", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to delete configuration",
      message_kh: "មិនអាចលុបការកំណត់បានទេ",
      details: error.message
    });
  }
};

/**
 * Test Telegram configuration
 * @route POST /api/telegram/configs/:id/test
 */
exports.testTelegramConfig = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { id } = req.params;

    // ✅ Verify Super Admin
    const [currentUser] = await db.query(
      `SELECT u.name, r.code AS role_code 
       FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Access denied. Super Admin only.",
        message_kh: "បដិសេធការចូលប្រើ។ សម្រាប់ Super Admin តែប៉ុណ្ណោះ"
      });
    }

    // ✅ Get configuration
    const [config] = await db.query(
      "SELECT * FROM telegram_config WHERE id = :id",
      { id }
    );

    if (config.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Configuration not found",
        message_kh: "រកមិនឃើញការកំណត់"
      });
    }

    const { bot_token, chat_id, config_name, config_type, branch_name } = config[0];

    // ✅ Send test message
    const testMessage = `
🧪 <b>Test Message / សារសាកល្បង</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Telegram configuration is working!
✅ ការកំណត់ Telegram ដំណើរការបានល្អ!

📝 <b>Configuration Details:</b>
• Name: ${config_name}
• Type: ${config_type}
${branch_name ? `• Branch: ${branch_name}` : ''}
• Tested by: ${currentUser[0]?.name || 'Unknown'}

⏰ <b>Time:</b> ${new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Phnom_Penh',
      dateStyle: 'full',
      timeStyle: 'long'
    })}

━━━━━━━━━━━━━━━━━━━━━━━━━━
<i>This is an automated test message from PETRONAS system.</i>
    `;

    try {
      const response = await axios.post(
        `https://api.telegram.org/bot${bot_token}/sendMessage`,
        {
          chat_id: chat_id,
          text: testMessage,
          parse_mode: 'HTML'
        },
        {
          timeout: 10000 // 10 second timeout
        }
      );

      // ✅ Update test status
      await db.query(`
        UPDATE telegram_config SET
          last_test_at = NOW(),
          last_test_status = 'success'
        WHERE id = :id
      `, { id });


      return res.json({
        success: true,
        message: "Test message sent successfully! Check your Telegram group.",
        message_kh: "ផ្ញើសារសាកល្បងបានជោគជ័យ! ពិនិត្យមើល Telegram group របស់អ្នក។",
        data: {
          config_name,
          telegram_message_id: response.data.result.message_id,
          sent_at: new Date().toISOString(),
          chat_id: chat_id
        }
      });

    } catch (telegramError) {
      console.error('❌ Telegram API Error:', telegramError.response?.data || telegramError.message);

      // ✅ Update test status as failed
      await db.query(`
        UPDATE telegram_config SET
          last_test_at = NOW(),
          last_test_status = 'failed'
        WHERE id = :id
      `, { id });

      const errorMessage = telegramError.response?.data?.description || telegramError.message;

      return res.status(400).json({
        error: true,
        message: "Failed to send test message to Telegram",
        message_kh: "មិនអាចផ្ញើសារសាកល្បងទៅ Telegram បានទេ",
        details: errorMessage,
        suggestions: [
          "Check if bot token is correct",
          "Verify chat ID is correct",
          "Ensure bot is added to the group/channel",
          "Check if bot has permission to send messages"
        ]
      });
    }

  } catch (error) {
    console.error('❌ Error in testTelegramConfig:', error);
    logError("telegram.testTelegramConfig", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to test configuration",
      message_kh: "មិនអាចសាកល្បងការកំណត់បានទេ",
      details: error.message
    });
  }
};



/**
 * Get branches for dropdown
 * @route GET /api/telegram/branches
 */
exports.getBranches = async (req, res) => {
  try {
    const [branches] = await db.query(`
      SELECT DISTINCT branch_name 
      FROM user 
      WHERE branch_name IS NOT NULL 
        AND branch_name != ''
        AND branch_name != 'null'
      ORDER BY branch_name ASC
    `);

    return res.json({
      success: true,
      branches: branches.map(b => b.branch_name)
    });

  } catch (error) {
    console.error('❌ Error in getBranches:', error);
    logError("telegram.getBranches", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to get branches",
      message_kh: "មិនអាចទាញបញ្ជីសាខាបានទេ"
    });
  }
};

/**
 * Toggle Telegram configuration active status
 * @route PATCH /api/telegram/configs/:id/toggle
 */
exports.toggleTelegramConfig = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { id } = req.params;

    // ✅ Verify Super Admin
    const [currentUser] = await db.query(
      `SELECT u.name, r.code AS role_code 
       FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = : user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Access denied",
        message_kh: "បដិសេធការចូលប្រើ"
      });
    }

    // ✅ Get current status
    const [config] = await db.query(
      "SELECT id, config_name, is_active FROM telegram_config WHERE id = :id",
      { id }
    );

    if (config.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Configuration not found",
        message_kh: "រកមិនឃើញការកំណត់"
      });
    }

    const newStatus = config[0].is_active === 1 ? 0 : 1;

    // ✅ Toggle status
    await db.query(`
      UPDATE telegram_config SET
        is_active = : is_active,
      updated_at = NOW(),
      updated_by = : updated_by
      WHERE id = : id
      `, {
      id,
      is_active: newStatus,
      updated_by: currentUser[0]?.name
    });


    return res.json({
      success: true,
      message: `Configuration ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`,
      message_kh: `${newStatus === 1 ? 'បើក' : 'បិទ'} ការកំណត់បានជោគជ័យ`,
      data: {
        id,
        is_active: newStatus
      }
    });

  } catch (error) {
    console.error('❌ Error in toggleTelegramConfig:', error);
    logError("telegram.toggleTelegramConfig", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to toggle configuration",
      message_kh: "មិនអាចប្តូរស្ថានភាពបានទេ"
    });
  }
};

/**
 * Get available event types
 * @route GET /api/telegram/event-types
 */
exports.getEventTypesList = async (req, res) => {
  try {
    const eventTypes = getEventTypes();

    return res.json({
      success: true,
      event_types: eventTypes
    });

  } catch (error) {
    console.error('❌ Error in getEventTypesList:', error);
    logError("telegram.getEventTypesList", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to get event types",
      message_kh: "មិនអាចទាញបញ្ជីព្រឹត្តិការណ៍បានទេ"
    });
  }
};

const fs = require('fs');
const path = require('path');

/**
 * Handle Webhook from Telegram
 */
exports.handleWebhook = async (req, res) => {
  const logFile = path.join(__dirname, '../../debug_telegram.log');
  try {
    const { message, callback_query } = req.body;
    const bot_token = req.params.bot_token;

    // Log incoming update
    fs.appendFileSync(logFile, `[${new Date().toISOString()}] Incoming update for bot ${bot_token.substring(0, 5)}...: ${JSON.stringify(req.body)}\n`);

    // 1. Handle Messages
    if (message && message.text) {
      const chatId = message.chat.id;
      const text = message.text.toLowerCase();

      if (text === '/start' || text === 'menu' || text === 'មឺនុយ') {
        await sendMainMenu(bot_token, chatId);
      } else {
        // Check for date pattern (e.g., 2024-02-15 or 15-02-2024 or range)
        const dateRange = parseTelegramDate(text);
        if (dateRange) {
          await handleSummaryRange(bot_token, chatId, dateRange.start, dateRange.end, dateRange.label);
        }
      }
    }

    // 2. Handle Callback Queries (Button Clicks)
    if (callback_query) {
      const chatId = callback_query.message.chat.id;
      const messageId = callback_query.message.message_id;
      const action = callback_query.data;

      if (action === 'main_menu') {
        await editToMainMenu(bot_token, chatId, messageId);
      } else if (action === 'report_menu') {
        await sendReportMenu(bot_token, chatId, messageId);
      } else if (action === 'stock_report') {
        await handleStockReport(bot_token, chatId, messageId);
      } else if (action.startsWith('sale_report_')) {
        const period = action.replace('sale_report_', '');
        await handleSaleReport(bot_token, chatId, messageId, period);
      } else if (action.startsWith('payment_report_')) {
        const period = action.replace('payment_report_', '');
        await handlePaymentReport(bot_token, chatId, messageId, period);
      } else if (action === 'summary_today') {
        await handleSummaryToday(bot_token, chatId);
      } else if (action === 'expense_report_today') {
        await handleExpenseReport(bot_token, chatId);
      } else if (action === 'custom_date_help') {
        await sendCustomDateHelp(bot_token, chatId);
      }

      // Answer callback query to stop loading state
      try {
        await axios.post(`https://api.telegram.org/bot${bot_token}/answerCallbackQuery`, {
          callback_query_id: callback_query.id
        });
      } catch (e) { }
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook Error:', error.message);
    return res.status(200).send('OK'); // Always return 200 to Telegram
  }
};

// --- Helper Functions for Telegram UI (PREMIUM UI) ---

async function sendMainMenu(token, chatId) {
  const text = `
✨ <b>ស្វាគមន៍មកកាន់ប្រព័ន្ធគ្រប់គ្រង PETRONAS</b> ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━
👋 សួស្តី! នេះគឺជាមឺនុយបញ្ជាសម្រាប់គ្រប់គ្រង និងពិនិត្យរបាយការណ៍អាជីវកម្មរបស់លោកអ្នក។

🚀 <b>សូមជ្រើសរើសមុខងារខាងក្រោម៖</b>
`;
  const keyboard = {
    inline_keyboard: [
      [{ text: "📊 របាយការណ៍អាជីវកម្ម", callback_data: "report_menu" }],
      [{ text: "📦 ពិនិត្យស្តុកបច្ចុប្បន្ន", callback_data: "stock_report" }],
      [{ text: "� ចំណាយថ្ងៃនេះ", callback_data: "expense_report_today" }],
      [{ text: "📅 សេចក្តីសរុបថ្ងៃនេះ", callback_data: "summary_today" }],
      [{ text: "�🔄 ធ្វើបច្ចុប្បន្នភាពមឺនុយ", callback_data: "main_menu" }]
    ]
  };
  await sendTelegram(token, "sendMessage", { chat_id: chatId, text, parse_mode: 'HTML', reply_markup: keyboard });
}

async function editToMainMenu(token, chatId, messageId) {
  const text = `
✨ <b>ស្វាគមន៍មកកាន់ប្រព័ន្ធគ្រប់គ្រង PETRONAS</b> ✨
━━━━━━━━━━━━━━━━━━━━━━━━━━
🚀 <b>សូមជ្រើសរើសមុខងារខាងក្រោម៖</b>
`;
  const keyboard = {
    inline_keyboard: [
      [{ text: "📊 របាយការណ៍អាជីវកម្ម", callback_data: "report_menu" }],
      [{ text: "📦 ពិនិត្យស្តុកបច្ចុប្បន្ន", callback_data: "stock_report" }],
      [{ text: "📉 ចំណាយថ្ងៃនេះ", callback_data: "expense_report_today" }],
      [{ text: "📅 សេចក្តីសរុបថ្ងៃនេះ", callback_data: "summary_today" }]
    ]
  };
  await sendTelegram(token, "editMessageText", { chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML', reply_markup: keyboard });
}

async function sendReportMenu(token, chatId, messageId) {
  const text = `
📊 <b>មឺនុយរបាយការណ៍ (Reports Menu)</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━
សូមជ្រើសរើសចន្លោះកាលបរិច្ឆេទ ឬប្រភេទរបាយការណ៍៖
`;
  const keyboard = {
    inline_keyboard: [
      [{ text: "💰 លក់ (ថ្ងៃនេះ)", callback_data: "sale_report_today" }, { text: "💰 លក់ (ម្សិលមិញ)", callback_data: "sale_report_yesterday" }],
      [{ text: "📅 លក់ (សប្តាហ៍នេះ)", callback_data: "sale_report_week" }, { text: "🔍 ជ្រើសរើសថ្ងៃតាមចិត្ត", callback_data: "custom_date_help" }],
      [{ text: "💳 ការបង់ប្រាក់ (ថ្ងៃនេះ)", callback_data: "payment_report_today" }],
      [{ text: "⬅️ ត្រឡប់ទៅមឺនុយដើម", callback_data: "main_menu" }]
    ]
  };
  await sendTelegram(token, "editMessageText", { chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML', reply_markup: keyboard });
}

async function sendCustomDateHelp(token, chatId) {
  const text = `
🔍 <b>របៀបពិនិត្យរបាយការណ៍តាមកាលបរិច្ឆេទ</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━
លោកអ្នកអាចវាយបញ្ចូលកាលបរិច្ឆេទផ្ទាល់ក្នុង Telegram៖

📅 <b>មើលថ្ងៃជាក់លាក់៖</b>
វាយ: <code>2024-02-15</code> ឬ <code>15-02-2024</code>

⏳ <b>មើលជាចន្លោះថ្ងៃ (Range)៖</b>
វាយ: <code>2024-02-01 to 2024-02-15</code>

<i>Bot នឹងបង្ហាញសេចក្តីសរុប (Summary) សម្រាប់កាលបរិច្ឆេទដែលលោកអ្នកបានវាយ។</i>
`;
  const keyboard = { inline_keyboard: [[{ text: "⬅️ ត្រឡប់ក្រោយ", callback_data: "report_menu" }]] };
  await sendTelegram(token, "sendMessage", { chat_id: chatId, text, parse_mode: 'HTML', reply_markup: keyboard });
}

function parseTelegramDate(text) {
  const dayjs = require('dayjs');
  const customParseFormat = require('dayjs/plugin/customParseFormat');
  dayjs.extend(customParseFormat);

  // Clean text
  const cleanText = text.replace(/\s+/g, ' ').trim();

  // Pattern for range: "YYYY-MM-DD to YYYY-MM-DD" or similar
  const rangeMatch = cleanText.match(/(\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4})\s*(to|ដល់|-)\s*(\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4})/i);
  if (rangeMatch) {
    const startStr = rangeMatch[1];
    const endStr = rangeMatch[3];
    const formats = ['YYYY-MM-DD', 'DD-MM-YYYY', 'YYYY/MM/DD', 'DD/MM/YYYY'];
    const start = dayjs(startStr, formats);
    const end = dayjs(endStr, formats);
    if (start.isValid() && end.isValid()) {
      return {
        start: start.format('YYYY-MM-DD'),
        end: end.format('YYYY-MM-DD'),
        label: `${start.format('DD/MM/YYYY')} - ${end.format('DD/MM/YYYY')}`
      };
    }
  }

  // Pattern for single date: "YYYY-MM-DD"
  const formats = ['YYYY-MM-DD', 'DD-MM-YYYY', 'YYYY/MM/DD', 'DD/MM/YYYY'];
  const singleDate = dayjs(cleanText, formats, true);
  if (singleDate.isValid()) {
    return {
      start: singleDate.format('YYYY-MM-DD'),
      end: singleDate.format('YYYY-MM-DD'),
      label: singleDate.format('DD/MM/YYYY')
    };
  }

  return null;
}

async function handleSummaryRange(token, chatId, startDate, endDate, label) {
  try {
    const [[sales]] = await db.query(
      "SELECT COALESCE(SUM(total_amount), 0) as total FROM customer_debt cd JOIN `order` o ON cd.order_id = o.id WHERE DATE(o.order_date) BETWEEN ? AND ?",
      [startDate, endDate]
    );
    const [[expenses]] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM expense WHERE DATE(expense_date) BETWEEN ? AND ?",
      [startDate, endDate]
    );
    const [[payments]] = await db.query(
      "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE DATE(payment_date) BETWEEN ? AND ?",
      [startDate, endDate]
    );

    const totalSale = parseFloat(sales.total);
    const totalExp = parseFloat(expenses.total);
    const totalPay = parseFloat(payments.total);
    const netProfit = totalSale - totalExp;

    let msg = `📊 <b>សេចក្តីសរុប (${label})</b>\n━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 <b>លក់សរុប:</b> <code>$${totalSale.toLocaleString()}</code>\n`;
    msg += `📉 <b>ចំណាយសរុប:</b> <code>$${totalExp.toLocaleString()}</code>\n`;
    msg += `💳 <b>ប្រមូលប្រាក់បាន:</b> <code>$${totalPay.toLocaleString()}</code>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `${netProfit >= 0 ? '📈' : '📉'} <b>ចំណេញដុល:</b> <code>$${netProfit.toLocaleString()}</code>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n⏰ <i>ប្រព័ន្ធទាញទិន្នន័យនាពេល: ${new Date().toLocaleString()}</i>`;

    const keyboard = { inline_keyboard: [[{ text: "⬅️ ត្រឡប់ក្រោយ", callback_data: "report_menu" }]] };
    await sendTelegram(token, "sendMessage", { chat_id: chatId, text: msg, parse_mode: 'HTML', reply_markup: keyboard });
  } catch (e) {
    console.error('handleSummaryRange error:', e);
  }
}

async function handleStockReport(token, chatId, messageId) {
  try {
    const [rows] = await db.query(`
      SELECT p.name, SUM(it.quantity) as qty, p.unit
      FROM product p
      JOIN inventory_transaction it ON p.id = it.product_id
      GROUP BY p.id, p.name, p.unit
      HAVING qty > 0.1
    `);

    let msg = `📦 <b>ស្ថានភាពស្តុកបច្ចុប្បន្ន (Current Stock)</b>\n━━━━━━━━━━━━━━━━━━━━\n`;
    if (rows.length === 0) {
      msg += `<i>❌ មិនមានទិន្នន័យស្តុក</i>\n`;
    } else {
      rows.forEach((r, i) => {
        const icon = r.name.toLowerCase().includes('gas') || r.name.toLowerCase().includes('fuel') ? '⛽' : '📦';
        msg += `${i + 1}. ${icon} ${r.name}: <code>${parseFloat(r.qty).toLocaleString()} ${r.unit || 'L'}</code>\n`;
      });
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n⏰ <i>ធ្វើបច្ចុប្បន្នភាពនៅ: ${new Date().toLocaleString()}</i>`;

    const keyboard = { inline_keyboard: [[{ text: "⬅️ ត្រឡប់ក្រោយ", callback_data: "main_menu" }]] };
    await sendTelegram(token, "sendMessage", { chat_id: chatId, text: msg, parse_mode: 'HTML', reply_markup: keyboard });
  } catch (e) { console.error(e); }
}

async function handleSaleReport(token, chatId, messageId, period) {
  try {
    let dateFilter = "DATE(o.order_date) = CURDATE()";
    let title = "ថ្ងៃនេះ";
    if (period === 'yesterday') {
      dateFilter = "DATE(o.order_date) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)";
      title = "ម្សិលមិញ";
    } else if (period === 'week') {
      dateFilter = "YEARWEEK(o.order_date, 1) = YEARWEEK(CURDATE(), 1)";
      title = "សប្តាហ៍នេះ";
    }

    const [sales] = await db.query(`
      SELECT 
        u.branch_name,
        SUM(cd.total_amount) as total,
        COUNT(DISTINCT o.id) as count
      FROM customer_debt cd
      JOIN \`order\` o ON cd.order_id = o.id
      JOIN user u ON o.user_id = u.id
      WHERE ${dateFilter}
      GROUP BY u.branch_name
    `);

    let msg = `💰 <b>របាយការណ៍លក់ (${title})</b>\n━━━━━━━━━━━━━━━━━━━━\n`;
    let grandTotal = 0;
    if (sales.length === 0) {
      msg += `<i>❌ មិនទាន់មានការលក់ក្នុង${title}នៅឡើយទេ</i>\n`;
    } else {
      sales.forEach(s => {
        msg += `📍 <b>${s.branch_name || 'Head Office'}</b>\n`;
        msg += `   • ចំនួនប្រតិបត្តិការ: ${s.count}\n`;
        msg += `   • ទឹកប្រាក់លក់បាន: <code>$${parseFloat(s.total).toLocaleString()}</code>\n\n`;
        grandTotal += parseFloat(s.total);
      });
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n💵 <b>សរុបរួម: <u>$${grandTotal.toLocaleString()}</u></b>`;

    const keyboard = { inline_keyboard: [[{ text: "⬅️ ត្រឡប់ក្រោយ", callback_data: "report_menu" }]] };
    await sendTelegram(token, "sendMessage", { chat_id: chatId, text: msg, parse_mode: 'HTML', reply_markup: keyboard });
  } catch (e) { console.error(e); }
}

async function handlePaymentReport(token, chatId, messageId, period) {
  try {
    const [payments] = await db.query(`
      SELECT 
        u.branch_name,
        SUM(pay.amount) as total,
        COUNT(pay.id) as count
      FROM payments pay
      JOIN \`order\` o ON pay.order_id = o.id
      JOIN user u ON o.user_id = u.id
      WHERE DATE(pay.payment_date) = CURDATE()
      GROUP BY u.branch_name
    `);

    let msg = `💳 <b>ការបង់ប្រាក់ថ្ងៃនេះ (Payments Today)</b>\n━━━━━━━━━━━━━━━━━━━━\n`;
    let grandTotal = 0;
    if (payments.length === 0) {
      msg += `<i>❌ មិនទាន់មានការបង់ប្រាក់នៅឡើយទេ</i>\n`;
    } else {
      payments.forEach(p => {
        msg += `📍 <b>${p.branch_name || 'Head Office'}</b>\n`;
        msg += `   • បង់ប្រាក់សរុប: <code>$${parseFloat(p.total).toLocaleString()}</code>\n\n`;
        grandTotal += parseFloat(p.total);
      });
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n💵 <b>សរុបរួម: <u>$${grandTotal.toLocaleString()}</u></b>`;

    const keyboard = { inline_keyboard: [[{ text: "⬅️ ត្រឡប់ក្រោយ", callback_data: "report_menu" }]] };
    await sendTelegram(token, "sendMessage", { chat_id: chatId, text: msg, parse_mode: 'HTML', reply_markup: keyboard });
  } catch (e) { console.error(e); }
}

async function handleExpenseReport(token, chatId) {
  try {
    const [expenses] = await db.query(`
      SELECT 
        et.name as type,
        SUM(e.amount) as total
      FROM expense e
      JOIN expense_type et ON e.expense_type_id = et.id
      WHERE DATE(e.expense_date) = CURDATE()
      GROUP BY et.name
    `);

    let msg = `📉 <b>របាយការណ៍ចំណាយថ្ងៃនេះ (Expenses Today)</b>\n━━━━━━━━━━━━━━━━━━━━\n`;
    let grandTotal = 0;
    if (expenses.length === 0) {
      msg += `<i>✅ មិនមានការចំណាយក្នុងថ្ងៃនេះទេ</i>\n`;
    } else {
      expenses.forEach(e => {
        msg += `• ${e.type}: <code>$${parseFloat(e.total).toLocaleString()}</code>\n`;
        grandTotal += parseFloat(e.total);
      });
    }
    msg += `━━━━━━━━━━━━━━━━━━━━\n💸 <b>សរុបការចំណាយ: <u>$${grandTotal.toLocaleString()}</u></b>`;

    const keyboard = { inline_keyboard: [[{ text: "⬅️ ត្រឡប់ក្រោយ", callback_data: "main_menu" }]] };
    await sendTelegram(token, "sendMessage", { chat_id: chatId, text: msg, parse_mode: 'HTML', reply_markup: keyboard });
  } catch (e) {
    console.error('Expense Report Error:', e);
    await sendTelegram(token, "sendMessage", { chat_id: chatId, text: `❌ មានបញ្ហាក្នុងការទាញរបាយការណ៍ចំណាយ៖ ${e.message}` });
  }
}

async function handleSummaryToday(token, chatId) {
  try {
    const [[sales]] = await db.query("SELECT COALESCE(SUM(total_amount), 0) as total FROM customer_debt cd JOIN `order` o ON cd.order_id = o.id WHERE DATE(o.order_date) = CURDATE()");
    const [[expenses]] = await db.query("SELECT COALESCE(SUM(amount), 0) as total FROM expense WHERE DATE(expense_date) = CURDATE()");
    const [[payments]] = await db.query("SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE DATE(payment_date) = CURDATE()");

    const totalSale = parseFloat(sales?.total || 0);
    const totalExp = parseFloat(expenses?.total || 0);
    const totalPay = parseFloat(payments?.total || 0);
    const netProfit = totalSale - totalExp;

    let msg = `📊 <b>សេចក្តីសរុបថ្ងៃនេះ (Today's Summary)</b>\n━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 <b>លក់សរុប:</b> <code>$${totalSale.toLocaleString()}</code>\n`;
    msg += `📉 <b>ចំណាយសរុប:</b> <code>$${totalExp.toLocaleString()}</code>\n`;
    msg += `💳 <b>ប្រមូលប្រាក់បាន:</b> <code>$${totalPay.toLocaleString()}</code>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `${netProfit >= 0 ? '📈' : '📉'} <b>ចំណេញដុល (Sales - Exp):</b> <code>$${netProfit.toLocaleString()}</code>\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n⏰ <i>Update at: ${new Date().toLocaleString()}</i>`;

    const keyboard = { inline_keyboard: [[{ text: "⬅️ ត្រឡប់ក្រោយ", callback_data: "main_menu" }]] };
    await sendTelegram(token, "sendMessage", { chat_id: chatId, text: msg, parse_mode: 'HTML', reply_markup: keyboard });
  } catch (e) {
    console.error('Summary Today Error:', e);
    await sendTelegram(token, "sendMessage", { chat_id: chatId, text: `❌ មានបញ្ហាក្នុងការទាញរបាយការណ៍សរុប៖ ${e.message}` });
  }
}

async function sendTelegram(token, method, data) {
  try {
    await axios.post(`https://api.telegram.org/bot${token}/${method}`, data);
  } catch (err) {
    console.error(`Telegram Error (${method}):`, err.response?.data || err.message);
  }
}
