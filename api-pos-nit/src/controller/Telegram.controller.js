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
       WHERE u.id = :user_id`,
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
        is_active = :is_active,
        updated_at = NOW(),
        updated_by = :updated_by
      WHERE id = :id
    `, {
      id,
      is_active: newStatus,
      updated_by: currentUser[0]?.name
    });


    return res.json({
      success: true,
      message: `Configuration ${newStatus === 1 ? 'activated' : 'deactivated'} successfully`,
      message_kh: `${newStatus === 1 ? 'បើក' : 'បិទ'}ការកំណត់បានជោគជ័យ`,
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