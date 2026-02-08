const { db, sendTelegramMessagenewLogin } = require("../util/helper");
const { logError } = require("../util/logError");
const bcrypt = require("bcrypt");
const { sendSmartNotification } = require("../util/Telegram.helpe");

// ================================
// Helper Function: Get branch_id from branch_name if needed
const getBranchIdByName = async (branch_name) => {
  try {
    const [branch] = await db.query("SELECT id FROM branch WHERE name = ?", [branch_name]);
    return branch[0]?.id || null;
  } catch (error) {
    console.error('❌ Error in getBranchIdByName:', error);
    return null;
  }
};

exports.getRoles = async (req, res) => {
  try {
    const currentUserId = req.current_id;

    // ✅ Verify user is authenticated
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code 
       FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (!currentUser || currentUser.length === 0) {
      return res.status(404).json({
        error: true,
        message: "User not found",
        message_kh: "មិនមានអ្នកប្រើប្រាស់នេះ"
      });
    }

    // ✅ FIXED: Removed is_active column check
    const [roles] = await db.query(`
      SELECT id, name, code
      FROM role 
      ORDER BY 
        CASE code
          WHEN 'SUPER_ADMIN' THEN 1
          WHEN 'ADMIN' THEN 2
          ELSE 3
        END,
        name
    `);


    return res.json({
      success: true,
      roles: roles || [],
      total: roles.length
    });

  } catch (error) {
    console.error("❌ Error in getRoles:", error);

    return res.status(500).json({
      error: true,
      message: "Failed to get roles",
      message_kh: "មិនអាចទាញបញ្ជី roles បានទេ",
      details: error.message
    });
  }
};

// ✅ CORRECTED VERSION - Uses customer_debt table for paid/due amounts
exports.getBranchComparison = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { from_date, to_date } = req.query;

    if (!from_date || !to_date) {
      return res.status(400).json({
        error: true,
        message: "from_date and to_date parameters are required",
        message_kh: "ត្រូវការកាលបរិច្ឆេទចាប់ផ្តើម និងបញ្ចប់"
      });
    }

    // Verify user
    const [currentUser] = await db.query(
      `SELECT 
        u.id,
        u.username,
        u.name,
        u.role_id,
        r.code AS role_code,
        r.name AS role_name
       FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (!currentUser || currentUser.length === 0) {
      console.error('❌ User not found for ID:', currentUserId);
      return res.status(404).json({
        error: true,
        message: "User not found. Please login again.",
        message_kh: "មិនមានអ្នកប្រើប្រាស់នេះ សូមចូលប្រើប្រាស់ម្តងទៀត"
      });
    }

    const userRole = currentUser[0]?.role_code;
    if (userRole !== 'SUPER_ADMIN') {
      console.warn('⚠️ Access denied for user:', {
        user_id: currentUserId,
        username: currentUser[0]?.username,
        role_found: userRole,
        required_role: 'SUPER_ADMIN'
      });

      return res.status(403).json({
        error: true,
        message: "Access denied. Super Admin only.",
        message_kh: "បដិសេធការចូលប្រើ។ សម្រាប់ Super Admin តែប៉ុណ្ណោះ",
        debug: {
          your_role: userRole,
          required_role: 'SUPER_ADMIN'
        }
      });
    }

    // ✅ FIXED: Get data from customer_debt table instead of order table
    const [branchComparison] = await db.query(`
      SELECT 
        COALESCE(u.branch_name, 'Unknown') AS branch_name,
        COUNT(DISTINCT cd.order_id) AS total_orders,
        COALESCE(SUM(cd.total_amount), 0) AS total_revenue,
        COALESCE(SUM(cd.paid_amount), 0) AS total_paid,
        COALESCE(SUM(cd.due_amount), 0) AS total_due,
        COUNT(DISTINCT cd.customer_id) AS unique_customers,
        COALESCE(AVG(cd.total_amount), 0) AS avg_order_value
      FROM customer_debt cd
      INNER JOIN \`order\` o ON cd.order_id = o.id
      INNER JOIN user u ON o.user_id = u.id
      WHERE o.order_date BETWEEN :from_date AND :to_date
      GROUP BY u.branch_name
      ORDER BY total_revenue DESC
    `, { from_date, to_date });

    // ✅ FIXED: Get summary from customer_debt table
    const [summary] = await db.query(`
      SELECT 
        COUNT(DISTINCT cd.order_id) AS total_orders,
        COALESCE(SUM(cd.total_amount), 0) AS total_revenue,
        COALESCE(SUM(cd.paid_amount), 0) AS total_paid,
        COALESCE(SUM(cd.due_amount), 0) AS total_due,
        COUNT(DISTINCT cd.customer_id) AS total_customers
      FROM customer_debt cd
      INNER JOIN \`order\` o ON cd.order_id = o.id
      WHERE o.order_date BETWEEN :from_date AND :to_date
    `, { from_date, to_date });

    res.json({
      success: true,
      branchComparison: branchComparison || [],
      summary: summary[0] || {
        total_orders: 0,
        total_revenue: 0,
        total_paid: 0,
        total_due: 0,
        total_customers: 0
      },
      metadata: {
        date_range: {
          from: from_date,
          to: to_date
        },
        requested_by: {
          user_id: currentUserId,
          username: currentUser[0]?.username,
          role: userRole
        },
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error in getBranchComparison:', error);
    logError("supperadmin.getBranchComparison", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to generate branch comparison report",
      message_kh: "មិនអាចបង្កើតរបាយការណ៍ប្រៀបធៀបសាខាបានទេ",
      details: error.message
    });
  }
};

// ==========================================
// ALTERNATIVE VERSION - If you have both order amounts AND customer_debt
// Use this if order table also has total_amount
// ==========================================
exports.getBranchComparisonAlternative = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { from_date, to_date } = req.query;

    if (!from_date || !to_date) {
      return res.status(400).json({
        error: true,
        message: "from_date and to_date parameters are required",
        message_kh: "ត្រូវការកាលបរិច្ឆេទចាប់ផ្តើម និងបញ្ចប់"
      });
    }

    const [currentUser] = await db.query(
      `SELECT u.id, u.username, u.name, r.code AS role_code
       FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (!currentUser || currentUser.length === 0) {
      return res.status(404).json({
        error: true,
        message: "User not found"
      });
    }

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Access denied. Super Admin only."
      });
    }

    // ✅ This version gets total_amount from order and paid/due from customer_debt
    const [branchComparison] = await db.query(`
      SELECT 
        COALESCE(u.branch_name, 'Unknown') AS branch_name,
        COUNT(DISTINCT o.id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_revenue,
        COALESCE(SUM(cd.paid_amount), 0) AS total_paid,
        COALESCE(SUM(cd.due_amount), 0) AS total_due,
        COUNT(DISTINCT o.customer_id) AS unique_customers,
        COALESCE(AVG(o.total_amount), 0) AS avg_order_value
      FROM \`order\` o
      INNER JOIN user u ON o.user_id = u.id
      LEFT JOIN customer_debt cd ON o.id = cd.order_id
      WHERE o.order_date BETWEEN :from_date AND :to_date
      GROUP BY u.branch_name
      ORDER BY total_revenue DESC
    `, { from_date, to_date });

    const [summary] = await db.query(`
      SELECT 
        COUNT(DISTINCT o.id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_revenue,
        COALESCE(SUM(cd.paid_amount), 0) AS total_paid,
        COALESCE(SUM(cd.due_amount), 0) AS total_due,
        COUNT(DISTINCT o.customer_id) AS total_customers
      FROM \`order\` o
      LEFT JOIN customer_debt cd ON o.id = cd.order_id
      WHERE o.order_date BETWEEN :from_date AND :to_date
    `, { from_date, to_date });

    res.json({
      success: true,
      branchComparison: branchComparison || [],
      summary: summary[0] || {
        total_orders: 0,
        total_revenue: 0,
        total_paid: 0,
        total_due: 0,
        total_customers: 0
      },
      metadata: {
        date_range: {
          from: from_date,
          to: to_date
        },
        requested_by: {
          user_id: currentUserId,
          username: currentUser[0]?.username,
          role: currentUser[0]?.role_code
        },
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error in getBranchComparison:', error);
    logError("supperadmin.getBranchComparison", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to generate branch comparison report",
      details: error.message
    });
  }
};

exports.getSystemStats = async (req, res) => {
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
        message: "Access denied. Super Admin only."
      });
    }
    const [userStats] = await db.query(`
      SELECT 
        COUNT(*) AS total_users,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_users,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactive_users
      FROM user
    `);

    const [orderStats] = await db.query(`
      SELECT 
        COUNT(*) AS total_orders,
        SUM(total_amount) AS total_revenue,
        SUM(paid_amount) AS total_paid,
        SUM(total_due) AS total_outstanding
      FROM \`order\`
    `);

    const [branchStats] = await db.query(`
      SELECT 
        COUNT(DISTINCT branch_name) AS total_branches
      FROM user
      WHERE branch_name IS NOT NULL
    `);

    res.json({
      success: true,
      stats: {
        users: userStats[0],
        orders: orderStats[0],
        branches: branchStats[0]
      }
    });

  } catch (error) {
    logError("supperadmin.getSystemStats", error, res);
  }
};

exports.getAllAdmins = async (req, res) => {
  try {
    const [admins] = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.username,
        u.email,
        u.tel,
        u.branch_name,
        u.profile_image,
        u.is_active,
        u.is_online,
        u.last_activity,
        u.online_status,
        u.last_login,
        u.create_at,
        u.create_by,
        r.name AS role_name,
        r.code AS role_code,
        (SELECT COUNT(*) FROM user WHERE branch_name = u.branch_name AND id != u.id) AS managed_users_count
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
      WHERE r.code IN ('ADMIN', 'SUPER_ADMIN')
      ORDER BY u.create_at DESC
    `);

    const [stats] = await db.query(`
      SELECT 
        COUNT(*) AS total_admins,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_admins,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactive_admins,
        SUM(CASE WHEN role_code = 'SUPER_ADMIN' THEN 1 ELSE 0 END) AS super_admins
      FROM (
        SELECT u.*, r.code AS role_code
        FROM user u
        INNER JOIN role r ON u.role_id = r.id
        WHERE r.code IN ('ADMIN', 'SUPER_ADMIN')
      ) AS admin_users
    `);

    res.json({
      success: true,
      admins: admins,
      stats: stats[0] || {}
    });

  } catch (error) {
    console.error("Error getting admin list:", error);
    res.status(500).json({
      error: true,
      message: "Failed to get admin list"
    });
  }
};

exports.createNewAdmin = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const {
      old_admin_id,
      name,
      username,
      password,
      email,
      tel,
      address,
      branch_name,
      transfer_permissions
    } = req.body;

    const [currentUser] = await db.query(
      `SELECT u.id, u.username, u.name, r.code AS role_code, r.name AS role_name
       FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Only Super Admin can create new admin accounts",
        message_kh: "មានតែ Super Admin ទេដែលអាចបង្កើតគណនី Admin បាន"
      });
    }

    if (!name || !username || !password) {
      return res.status(400).json({
        error: true,
        message: "Name, username, and password are required",
        message_kh: "ត្រូវការឈ្មោះ, Username និងពាក្យសម្ងាត់"
      });
    }

    const [existingUser] = await db.query(
      "SELECT id FROM user WHERE username = :username LIMIT 1",
      { username }
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Username already exists!",
        message_kh: "Username នេះមានរួចហើយ!"
      });
    }

    let oldAdminInfo = null;
    if (old_admin_id && transfer_permissions) {
      const [oldAdmin] = await db.query(
        `SELECT u.*, r.code AS role_code, r.name AS role_name
         FROM user u
         INNER JOIN role r ON u.role_id = r.id
         WHERE u.id = :admin_id AND r.code = 'ADMIN'`,
        { admin_id: old_admin_id }
      );

      if (oldAdmin.length === 0) {
        return res.status(404).json({
          error: true,
          message: "Old admin not found or not an admin user",
          message_kh: "មិនមាន Admin ចាស់នេះ ឬគាត់មិនមែនជា Admin"
        });
      }

      oldAdminInfo = oldAdmin[0];
    }

    const [adminRole] = await db.query(
      "SELECT id FROM role WHERE code = 'ADMIN' LIMIT 1"
    );

    if (adminRole.length === 0) {
      return res.status(500).json({
        error: true,
        message: "Admin role not found in system",
        message_kh: "មិនមាន Admin role ក្នុងប្រព័ន្ធ"
      });
    }

    const adminRoleId = adminRole[0].id;

    const hashedPassword = bcrypt.hashSync(password, 10);

    const [newAdminResult] = await db.query(`
      INSERT INTO user (
        role_id,
        name,
        username,
        email,
        password,
        tel,
        address,
        branch_name,
        profile_image,
        is_active,
        create_by,
        create_at
      ) VALUES (
        :role_id,
        :name,
        :username,
        :email,
        :password,
        :tel,
        :address,
        :branch_name,
        :profile_image,
        1,
        :create_by,
        NOW()
      )
    `, {
      role_id: adminRoleId,
      name: name,
      username: username,
      email: email || username,
      password: hashedPassword,
      tel: tel || null,
      address: address || null,
      branch_name: branch_name || oldAdminInfo?.branch_name || null,
      profile_image: req.file?.path || null,
      create_by: currentUser[0]?.name
    });

    const newAdminId = newAdminResult.insertId;

    await db.query(`
        UPDATE user 
        SET branch_id = :branch_id 
        WHERE id = :admin_id
      `, {
      admin_id: newAdminId,
      branch_id: await getBranchIdByName(branch_name || oldAdminInfo?.branch_name)
    });

    await db.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES (:user_id, :role_id)",
      { user_id: newAdminId, role_id: adminRoleId }
    );

    if (old_admin_id && transfer_permissions && oldAdminInfo) {
      // No more group_id to update, users remain in their branch
      await db.query(`
          INSERT INTO user_roles (user_id, role_id)
          SELECT :new_admin_id, role_id
          FROM user_roles
          WHERE user_id = :old_admin_id
          AND role_id NOT IN (SELECT role_id FROM user_roles WHERE user_id = :new_admin_id)
        `, {
        new_admin_id: newAdminId,
        old_admin_id: old_admin_id
      });

      await db.query(
        `UPDATE user 
         SET is_active = 0, 
             updated_at = NOW(),
             updated_by = :updated_by
         WHERE id = :admin_id`,
        {
          admin_id: old_admin_id,
          updated_by: currentUser[0]?.name
        }
      );
    }

    try {
      await db.query(`
        INSERT INTO user_activity_log (
          user_id,
          action_type,
          action_description,
          ip_address,
          user_agent,
          created_at,
          created_by
        ) VALUES (
          :user_id,
          'ADMIN_CREATED',
          :description,
          :ip_address,
          :user_agent,
          NOW(),
          :created_by
        )
      `, {
        user_id: newAdminId,
        description: transfer_permissions
          ? `New admin account created with permissions transferred from admin ID ${old_admin_id}`
          : `New admin account created: ${name} (${username})`,
        ip_address: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'Unknown',
        user_agent: req.get('User-Agent') || 'Unknown',
        created_by: currentUserId
      });
    } catch (logError) {
      console.error("Failed to log admin creation:", logError);
    }

    const creationTime = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Phnom_Penh',
      dateStyle: 'full',
      timeStyle: 'long'
    });

    let alertMessage = `🔐 <b>គណនី Admin ថ្មីត្រូវបានបង្កើត / New Admin Account Created</b>\n`;
    alertMessage += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    alertMessage += `👤 <b>Admin ថ្មី / New Admin:</b> ${name}\n`;
    alertMessage += `🆔 <b>Username:</b> ${username}\n`;
    alertMessage += `📧 <b>Email:</b> ${email || username}\n`;
    alertMessage += `🏢 <b>សាខា / Branch:</b> ${branch_name || 'N/A'}\n`;
    alertMessage += `📱 <b>Tel:</b> ${tel || 'N/A'}\n`;

    if (transfer_permissions && oldAdminInfo) {
      alertMessage += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      alertMessage += `🔄 <b>ការផ្ទេរសិទ្ធិ / Permission Transfer:</b>\n`;
      alertMessage += `📤 <b>ពី Admin ចាស់ / From:</b> ${oldAdminInfo.name} (ID: ${old_admin_id})\n`;
      alertMessage += `📥 <b>ទៅ Admin ថ្មី / To:</b> ${name} (ID: ${newAdminId})\n`;
      alertMessage += `⚠️ <b>Status:</b> Admin ចាស់ត្រូវបានបិទ / Old admin deactivated\n`;
    }

    alertMessage += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    alertMessage += `👨‍💼 <b>បង្កើតដោយ / Created By:</b>\n`;
    alertMessage += `${currentUser[0]?.name} (${currentUser[0]?.username})\n`;
    alertMessage += `🎭 <b>Role:</b> ${currentUser[0]?.role_name}\n\n`;
    alertMessage += `⏰ <b>Time:</b> ${creationTime}\n\n`;
    alertMessage += `🆔 <b>New Admin ID:</b> ${newAdminId}\n`;
    alertMessage += `✅ <b>Status:</b> Active`;

    try {
      await sendSmartNotification({
        event_type: 'admin_created',
        branch_name: branch_name || null,
        message: alertMessage,
        severity: 'critical'
      });
    } catch (notifError) {
      console.error("❌ Failed to send admin creation notification:", notifError);
    }

    return res.status(201).json({
      success: true,
      message: transfer_permissions
        ? "New admin created and permissions transferred successfully!"
        : "New admin account created successfully!",
      message_kh: transfer_permissions
        ? "បង្កើត Admin ថ្មី និងផ្ទេរសិទ្ធិបានជោគជ័យ!"
        : "បង្កើតគណនី Admin ថ្មីបានជោគជ័យ!",
      data: {
        admin_id: newAdminId,
        username: username,
        name: name,
        email: email || username,
        role: 'ADMIN',
        branch_name: branch_name,
        is_active: true,
        created_at: creationTime,
        transferred_from: transfer_permissions ? old_admin_id : null,
        old_admin_deactivated: transfer_permissions ? true : false
      }
    });

  } catch (error) {
    console.error("❌ Error in createNewAdmin:", error);
    logError("admin.createNewAdmin", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to create admin account",
      message_kh: "មិនអាចបង្កើតគណនី Admin បានទេ",
      details: error.message
    });
  }
};

// ================================
// 🆕 NEW: Create User with ANY Role
// ================================
exports.createUserWithRole = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const {
      name,
      username,
      password,
      email,
      tel,
      address,
      branch_name,
      role_id
    } = req.body;


    // ✅ Verify Super Admin
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code, u.name, u.username
       FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Only Super Admin can create users",
        message_kh: "មានតែ Super Admin ទេដែលអាចបង្កើតអ្នកប្រើប្រាស់"
      });
    }

    // ✅ Validate required fields
    if (!name || !username || !password || !role_id) {
      return res.status(400).json({
        error: true,
        message: "Name, username, password, and role_id are required",
        message_kh: "ត្រូវការឈ្មោះ, Username, ពាក្យសម្ងាត់ និង Role"
      });
    }

    // ✅ Check if username exists
    const [existingUser] = await db.query(
      "SELECT id FROM user WHERE username = :username LIMIT 1",
      { username }
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Username already exists!",
        message_kh: "Username នេះមានរួចហើយ!"
      });
    }

    // ✅ Verify role exists
    const [roleData] = await db.query(
      "SELECT id, code, name FROM role WHERE id = :role_id LIMIT 1",
      { role_id }
    );

    if (roleData.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Role not found",
        message_kh: "មិនមាន Role នេះ"
      });
    }

    const roleCode = roleData[0].code;
    const roleName = roleData[0].name;


    // ✅ Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // ✅ Create user
    const [newUserResult] = await db.query(`
      INSERT INTO user (
        role_id,
        name,
        username,
        email,
        password,
        tel,
        address,
        branch_name,
        profile_image,
        is_active,
        create_by,
        create_at
      ) VALUES (
        :role_id,
        :name,
        :username,
        :email,
        :password,
        :tel,
        :address,
        :branch_name,
        :profile_image,
        1,
        :create_by,
        NOW()
      )
    `, {
      role_id: role_id,
      name: name,
      username: username,
      email: email || username,
      password: hashedPassword,
      tel: tel || null,
      address: address || null,
      branch_name: branch_name || null,
      profile_image: req.file?.path || null,
      create_by: currentUser[0]?.name
    });

    const newUserId = newUserResult.insertId;

    // ✅ Set branch_id if branch_name is provided
    if (branch_name) {
      const branchId = await getBranchIdByName(branch_name);
      if (branchId) {
        await db.query(
          "UPDATE user SET branch_id = :branch_id WHERE id = :user_id",
          { branch_id: branchId, user_id: newUserId }
        );
      }
    }

    // ✅ Insert into user_roles
    await db.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES (:user_id, :role_id)",
      { user_id: newUserId, role_id: role_id }
    );

    // ✅ Log activity
    try {
      await db.query(`
        INSERT INTO user_activity_log (
          user_id,
          action_type,
          action_description,
          ip_address,
          user_agent,
          created_at,
          created_by
        ) VALUES (
          :user_id,
          'USER_CREATED',
          :description,
          :ip_address,
          :user_agent,
          NOW(),
          :created_by
        )
      `, {
        user_id: newUserId,
        description: `User created with role ${roleName} (${roleCode}) in branch ${branch_name || 'N/A'}`,
        ip_address: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'Unknown',
        user_agent: req.get('User-Agent') || 'Unknown',
        created_by: currentUserId
      });
    } catch (logError) {
      console.error("Failed to log user creation:", logError);
    }

    // ✅ Send Telegram notification
    const creationTime = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Phnom_Penh',
      dateStyle: 'full',
      timeStyle: 'long'
    });

    const alertMessage = `
👤 <b>អ្នកប្រើប្រាស់ថ្មី / New User Created</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 <b>Name:</b> ${name}
🆔 <b>Username:</b> ${username}
📧 <b>Email:</b> ${email || username}
🏢 <b>Branch:</b> ${branch_name || 'N/A'}
📱 <b>Tel:</b> ${tel || 'N/A'}

🎭 <b>Role:</b> ${roleName} (${roleCode})

━━━━━━━━━━━━━━━━━━━━━━━━━━
👨‍💼 <b>Created By:</b>
${currentUser[0]?.name} (${currentUser[0]?.username})

⏰ <b>Time:</b> ${creationTime}

🆔 <b>User ID:</b> ${newUserId}
✅ <b>Status:</b> Active
    `;

    try {
      await sendSmartNotification({
        event_type: 'user_created',
        branch_name: branch_name || null,
        message: alertMessage,
        severity: 'info'
      });
    } catch (notifError) {
      console.error("❌ Failed to send user creation notification:", notifError);
    }

    return res.status(201).json({
      success: true,
      message: "User created successfully!",
      message_kh: "បង្កើតអ្នកប្រើប្រាស់បានជោគជ័យ!",
      data: {
        user_id: newUserId,
        username: username,
        name: name,
        email: email || username,
        role: roleName,
        role_code: roleCode,
        branch_name: branch_name,
        is_active: true,
        created_at: creationTime
      }
    });

  } catch (error) {
    console.error("❌ Error in createUserWithRole:", error);
    logError("superadmin.createUserWithRole", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to create user",
      message_kh: "មិនអាចបង្កើតអ្នកប្រើប្រាស់បានទេ",
      details: error.message
    });
  }
};

exports.deactivateAdmin = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { admin_id } = req.body;

    const [currentUser] = await db.query(
      `SELECT u.id, u.username, u.name, r.code AS role_code
       FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Only Super Admin can deactivate admin accounts",
        message_kh: "មានតែ Super Admin ទេដែលអាចបិទគណនី Admin"
      });
    }

    if (!admin_id) {
      return res.status(400).json({
        error: true,
        message: "Admin ID is required",
        message_kh: "ត្រូវការ Admin ID"
      });
    }

    const [adminUser] = await db.query(
      `SELECT u.*, r.code AS role_code, r.name AS role_name
       FROM user u
       INNER JOIN role r ON u.role_id = r.id
       WHERE u.id = :admin_id AND r.code = 'ADMIN'`,
      { admin_id }
    );

    if (adminUser.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Admin not found or not an admin user",
        message_kh: "មិនមាន Admin នេះ ឬគាត់មិនមែនជា Admin"
      });
    }

    if (parseInt(admin_id) === parseInt(currentUserId)) {
      return res.status(400).json({
        error: true,
        message: "You cannot deactivate your own account",
        message_kh: "អ្នកមិនអាចបិទគណនីខ្លួនឯងបានទេ"
      });
    }

    await db.query(
      `UPDATE user 
       SET is_active = 0,
           updated_at = NOW(),
           updated_by = :updated_by
       WHERE id = :admin_id`,
      {
        admin_id: admin_id,
        updated_by: currentUser[0]?.name
      }
    );

    try {
      await db.query(`
        INSERT INTO user_activity_log (
          user_id,
          action_type,
          action_description,
          ip_address,
          user_agent,
          created_at,
          created_by
        ) VALUES (
          :user_id,
          'ADMIN_DEACTIVATED',
          :description,
          :ip_address,
          :user_agent,
          NOW(),
          :created_by
        )
      `, {
        user_id: admin_id,
        description: `Admin account deactivated: ${adminUser[0].name} (${adminUser[0].username})`,
        ip_address: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'Unknown',
        user_agent: req.get('User-Agent') || 'Unknown',
        created_by: currentUserId
      });
    } catch (logError) {
      console.error("Failed to log admin deactivation:", logError);
    }

    const alertMessage = `
⛔ <b>គណនី Admin ត្រូវបានបិទ / Admin Account Deactivated</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 <b>Admin ដែលត្រូវបានបិទ / Deactivated Admin:</b>
${adminUser[0].name} (${adminUser[0].username})

🆔 <b>Admin ID:</b> ${admin_id}
🏢 <b>Branch:</b> ${adminUser[0].branch_name || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━
👨‍💼 <b>បិទដោយ / Deactivated By:</b>
${currentUser[0]?.name} (${currentUser[0]?.username})

⏰ <b>Time:</b> ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })}
    `;

    sendTelegramMessagenewLogin(alertMessage).catch(err => {
      console.error("Failed to send Telegram alert:", err.message);
    });

    return res.json({
      success: true,
      message: "Admin account deactivated successfully",
      message_kh: "បិទគណនី Admin បានជោគជ័យ",
      data: {
        admin_id: admin_id,
        username: adminUser[0].username,
        name: adminUser[0].name,
        is_active: false
      }
    });

  } catch (error) {
    console.error("❌ Error in deactivateAdmin:", error);
    logError("admin.deactivateAdmin", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to deactivate admin account",
      message_kh: "មិនអាចបិទគណនី Admin បានទេ"
    });
  }
};

exports.reactivateAdmin = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { admin_id } = req.body;

    const [currentUser] = await db.query(
      `SELECT r.code AS role_code, u.name, u.username
       FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Only Super Admin can reactivate admin accounts",
        message_kh: "មានតែ Super Admin ទេដែលអាចបើកគណនី Admin ម្តងទៀត"
      });
    }

    await db.query(
      `UPDATE user 
       SET is_active = 1,
           updated_at = NOW(),
           updated_by = :updated_by
       WHERE id = :admin_id`,
      {
        admin_id: admin_id,
        updated_by: currentUser[0]?.name
      }
    );

    return res.json({
      success: true,
      message: "Admin account reactivated successfully",
      message_kh: "បើកគណនី Admin ម្តងទៀតបានជោគជ័យ"
    });

  } catch (error) {
    logError("admin.reactivateAdmin", error, res);
  }
};

exports.getAdminDetails = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { admin_id } = req.params;

    const [currentUser] = await db.query(
      `SELECT r.code AS role_code FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Access denied. Super Admin only."
      });
    }

    const [adminInfo] = await db.query(`
      SELECT 
        u.*,
        r.name AS role_name,
        r.code AS role_code,
        (SELECT COUNT(*) FROM user WHERE branch_name = u.branch_name AND id != u.id) AS managed_users_count,
        (SELECT COUNT(*) FROM login_history WHERE user_id = u.id) AS login_count,
        (SELECT MAX(login_time) FROM login_history WHERE user_id = u.id AND status = 'success') AS last_login_time
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
      WHERE u.id = :admin_id AND r.code IN ('ADMIN', 'SUPER_ADMIN')
    `, { admin_id });

    if (adminInfo.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Admin not found"
      });
    }

    const [managedUsers] = await db.query(`
      SELECT id, name, username, branch_name, is_active
      FROM user
      WHERE branch_name = :branch_name AND id != :admin_id
      ORDER BY is_active DESC, name ASC
    `, {
      branch_name: adminInfo[0].branch_name,
      admin_id: admin_id
    });

    delete adminInfo[0].password;

    return res.json({
      success: true,
      admin: adminInfo[0],
      managed_users: managedUsers
    });

  } catch (error) {
    logError("admin.getAdminDetails", error, res);
  }
};

exports.getInactiveAdmins = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { days = 7 } = req.query;

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

    const [inactiveAdmins] = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.username,
        u.email,
        u.tel,
        u.branch_name,
        u.profile_image,
        u.is_active,
        u.is_online,
        u.last_activity AS user_last_activity,
        u.online_status,
        u.create_at AS created_date,
        r.name AS role_name,
        r.code AS role_code,
        COALESCE(MAX(lh.login_time), u.create_at) AS last_login_activity,
        DATEDIFF(NOW(), COALESCE(MAX(lh.login_time), u.create_at)) AS days_inactive,
        COUNT(DISTINCT lh.id) AS total_logins,
        CASE 
          WHEN MAX(lh.login_time) IS NULL THEN 'Never Logged In'
          WHEN DATEDIFF(NOW(), MAX(lh.login_time)) >= 180 THEN 'Inactive 180+ Days (6+ months)'
          WHEN DATEDIFF(NOW(), MAX(lh.login_time)) >= 90 THEN 'Inactive 90-179 Days (3-6 months)'
          WHEN DATEDIFF(NOW(), MAX(lh.login_time)) >= 60 THEN 'Inactive 60-89 Days (2-3 months)'
          WHEN DATEDIFF(NOW(), MAX(lh.login_time)) >= 30 THEN 'Inactive 30-59 Days (1-2 months)'
          WHEN DATEDIFF(NOW(), MAX(lh.login_time)) >= 14 THEN 'Inactive 14-29 Days'
          WHEN DATEDIFF(NOW(), MAX(lh.login_time)) >= 7 THEN 'Inactive 7-13 Days'
          WHEN DATEDIFF(NOW(), MAX(lh.login_time)) >= 3 THEN 'Inactive 3-6 Days'
          WHEN DATEDIFF(NOW(), MAX(lh.login_time)) >= 2 THEN 'Inactive 2-3 Days'
          ELSE 'Active (< 2 days)'
        END AS activity_status,
        (SELECT COUNT(*) FROM user WHERE branch_name = u.branch_name AND id != u.id) AS managed_users_count
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
      LEFT JOIN login_history lh ON u.id = lh.user_id AND lh.status = 'success'
      WHERE r.code IN ('ADMIN', 'SUPER_ADMIN')
        AND u.is_active = 1
      GROUP BY u.id, u.name, u.username, u.email, u.tel, u.branch_name, u.profile_image, 
               u.is_active, u.is_online, u.last_activity, u.online_status,
               u.create_at, r.name, r.code
      HAVING days_inactive >= :min_days
      ORDER BY days_inactive DESC
    `, { min_days: parseInt(days) });

    const neverLoggedIn = inactiveAdmins.filter(a => a.total_logins === 0);
    const inactive180Plus = inactiveAdmins.filter(a => a.total_logins > 0 && a.days_inactive >= 180);
    const inactive90to179 = inactiveAdmins.filter(a => a.total_logins > 0 && a.days_inactive >= 90 && a.days_inactive < 180);
    const inactive60to89 = inactiveAdmins.filter(a => a.total_logins > 0 && a.days_inactive >= 60 && a.days_inactive < 90);
    const inactive30to59 = inactiveAdmins.filter(a => a.total_logins > 0 && a.days_inactive >= 30 && a.days_inactive < 60);
    const inactive14to29 = inactiveAdmins.filter(a => a.total_logins > 0 && a.days_inactive >= 14 && a.days_inactive < 30);
    const inactive7to13 = inactiveAdmins.filter(a => a.total_logins > 0 && a.days_inactive >= 7 && a.days_inactive < 14);
    const inactive3to6 = inactiveAdmins.filter(a => a.total_logins > 0 && a.days_inactive >= 3 && a.days_inactive < 7);
    const inactive2to3 = inactiveAdmins.filter(a => a.total_logins > 0 && a.days_inactive >= 2 && a.days_inactive < 3);

    const stats = {
      total_inactive: inactiveAdmins.length,
      never_logged_in: neverLoggedIn.length,
      inactive_180_plus: inactive180Plus.length,
      inactive_90_to_179: inactive90to179.length,
      inactive_60_to_89: inactive60to89.length,
      inactive_30_to_59: inactive30to59.length,
      inactive_14_to_29: inactive14to29.length,
      inactive_7_to_13: inactive7to13.length,
      inactive_3_to_6: inactive3to6.length,
      inactive_2_to_3: inactive2to3.length,
      total_managed_users: inactiveAdmins.reduce((sum, a) => sum + (a.managed_users_count || 0), 0)
    };

    const formattedAdmins = inactiveAdmins.map(admin => ({
      ...admin,
      last_activity: admin.last_login_activity,
    }));

    res.json({
      success: true,
      inactive_admins: formattedAdmins,
      categories: {
        never_logged_in: neverLoggedIn.map(a => ({ ...a, last_activity: a.last_login_activity })),
        inactive_180_plus: inactive180Plus.map(a => ({ ...a, last_activity: a.last_login_activity })),
        inactive_90_to_179: inactive90to179.map(a => ({ ...a, last_activity: a.last_login_activity })),
        inactive_60_to_89: inactive60to89.map(a => ({ ...a, last_activity: a.last_login_activity })),
        inactive_30_to_59: inactive30to59.map(a => ({ ...a, last_activity: a.last_login_activity })),
        inactive_14_to_29: inactive14to29.map(a => ({ ...a, last_activity: a.last_login_activity })),
        inactive_7_to_13: inactive7to13.map(a => ({ ...a, last_activity: a.last_login_activity })),
        inactive_3_to_6: inactive3to6.map(a => ({ ...a, last_activity: a.last_login_activity })),
        inactive_2_to_3: inactive2to3.map(a => ({ ...a, last_activity: a.last_login_activity }))
      },
      stats: stats,
      filter: {
        min_days: parseInt(days),
        applied_at: new Date()
      }
    });

  } catch (error) {
    console.error('❌ Error in getInactiveAdmins:', error);
    logError("admin.getInactiveAdmins", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to retrieve inactive admins",
      message_kh: "មិនអាចទាញបញ្ជីអ្នកគ្រប់គ្រងមិនសកម្មបានទេ",
      debug: error.message
    });
  }
};

exports.getOnlineStatus = async (req, res) => {
  try {
    const currentUserId = req.current_id;

    const [currentUser] = await db.query(
      `SELECT r.code AS role_code 
       FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (!currentUser || currentUser.length === 0) {
      return res.status(404).json({
        error: true,
        message: "User not found",
        message_kh: "មិនមានអ្នកប្រើប្រាស់នេះ"
      });
    }

    const [admins] = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.username,
        u.profile_image,
        u.is_online,
        u.last_activity,
        u.online_status,
        r.name AS role_name,
        r.code AS role_code,
        CASE
          WHEN u.last_activity IS NULL THEN NULL
          WHEN TIMESTAMPDIFF(MINUTE, u.last_activity, NOW()) < 3 THEN 'online'
          WHEN TIMESTAMPDIFF(MINUTE, u.last_activity, NOW()) < 5 THEN 'away'
          WHEN TIMESTAMPDIFF(MINUTE, u.last_activity, NOW()) < 60 THEN 'inactive'
          ELSE 'offline'
        END AS computed_status,
        TIMESTAMPDIFF(MINUTE, u.last_activity, NOW()) AS minutes_since_activity
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
      WHERE r.code IN ('ADMIN', 'SUPER_ADMIN')
        AND u.is_active = 1
      ORDER BY 
        CASE 
          WHEN TIMESTAMPDIFF(MINUTE, u.last_activity, NOW()) < 3 THEN 1
          WHEN TIMESTAMPDIFF(MINUTE, u.last_activity, NOW()) < 5 THEN 2
          WHEN TIMESTAMPDIFF(MINUTE, u.last_activity, NOW()) < 60 THEN 3
          ELSE 4
        END,
        u.last_activity DESC
    `);

    const stats = {
      total_admins: admins.length,
      online_count: admins.filter(a => a.computed_status === 'online').length,
      away_count: admins.filter(a => a.computed_status === 'away').length,
      inactive_count: admins.filter(a => a.computed_status === 'inactive').length,
      offline_count: admins.filter(a => a.computed_status === 'offline' || !a.last_activity).length,
    };

    const byStatus = {
      online: admins.filter(a => a.computed_status === 'online'),
      away: admins.filter(a => a.computed_status === 'away'),
      inactive: admins.filter(a => a.computed_status === 'inactive'),
      offline: admins.filter(a => a.computed_status === 'offline' || !a.last_activity),
    };

    res.json({
      success: true,
      admins: admins,
      stats: stats,
      by_status: byStatus,
      last_updated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in getOnlineStatus:', error);
    logError("admin.getOnlineStatus", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to get online status",
      message_kh: "មិនអាចទទួលបាន online status",
      debug: error.message
    });
  }
};

exports.getAdminActivityStats = async (req, res) => {
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
        message: "Access denied. Super Admin only."
      });
    }

    const [activityStats] = await db.query(`
      SELECT 
        CASE 
          WHEN last_login IS NULL THEN 'Never Logged In'
          WHEN days_inactive >= 90 THEN '90+ Days'
          WHEN days_inactive >= 60 THEN '60-89 Days'
          WHEN days_inactive >= 30 THEN '30-59 Days'
          WHEN days_inactive >= 14 THEN '14-29 Days'
          WHEN days_inactive >= 7 THEN '7-13 Days'
          ELSE 'Active (< 7 days)'
        END AS period,
        COUNT(*) AS count
      FROM (
        SELECT 
          u.id,
          MAX(lh.login_time) AS last_login,
          DATEDIFF(NOW(), COALESCE(MAX(lh.login_time), u.create_at)) AS days_inactive
        FROM user u
        INNER JOIN role r ON u.role_id = r.id
        LEFT JOIN login_history lh ON u.id = lh.user_id AND lh.status = 'success'
        WHERE r.code IN ('ADMIN', 'SUPER_ADMIN')
          AND u.is_active = 1
        GROUP BY u.id, u.create_at
      ) AS admin_activity
      GROUP BY period
      ORDER BY 
        CASE period
          WHEN 'Never Logged In' THEN 1
          WHEN '90+ Days' THEN 2
          WHEN '60-89 Days' THEN 3
          WHEN '30-59 Days' THEN 4
          WHEN '14-29 Days' THEN 5
          WHEN '7-13 Days' THEN 6
          ELSE 7
        END
    `);

    const [overallStatsRaw] = await db.query(`
      SELECT 
        COUNT(*) AS total_active_admins,
        SUM(CASE WHEN last_login IS NULL THEN 1 ELSE 0 END) AS never_logged_in,
        SUM(CASE WHEN days_inactive >= 30 THEN 1 ELSE 0 END) AS inactive_30_plus,
        SUM(CASE WHEN days_inactive < 7 THEN 1 ELSE 0 END) AS active_last_week
      FROM (
        SELECT 
          u.id,
          MAX(lh.login_time) AS last_login,
          DATEDIFF(NOW(), COALESCE(MAX(lh.login_time), u.create_at)) AS days_inactive
        FROM user u
        INNER JOIN role r ON u.role_id = r.id
        LEFT JOIN login_history lh ON u.id = lh.user_id AND lh.status = 'success'
        WHERE r.code IN ('ADMIN', 'SUPER_ADMIN')
          AND u.is_active = 1
        GROUP BY u.id, u.create_at
      ) AS admin_summary
    `);

    res.json({
      success: true,
      activity_breakdown: activityStats,
      overall: overallStatsRaw[0] || {
        total_active_admins: 0,
        never_logged_in: 0,
        inactive_30_plus: 0,
        active_last_week: 0
      },
      generated_at: new Date()
    });

  } catch (error) {
    console.error('❌ Error in getAdminActivityStats:', error);
    logError("admin.getAdminActivityStats", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to retrieve admin activity statistics",
      message_kh: "មិនអាចទាញស្ថិតិសកម្មភាព Admin បានទេ"
    });
  }
};

exports.getSuperAdminUsers = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { branch_name, role_code, is_active, search } = req.query;

    const [currentUser] = await db.query(
      `SELECT r.code AS role_code, u.name, u.username
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

    let sql = `
      SELECT 
        u.id,
        u.name,
        u.username,
        u.tel,
        u.address,
        u.branch_name,
        u.branch_id,
        u.profile_image,
        u.is_active,
        u.barcode,
        u.create_by,
        u.create_at,
        u.last_login,
        r.id AS role_id,
        r.name AS role_name,
        r.code AS role_code,
        (SELECT COUNT(*) FROM user u2 WHERE u2.branch_name = u.branch_name AND u2.id != u.id) AS managed_users_count,
        (SELECT MAX(lh.login_time) FROM login_history lh WHERE lh.user_id = u.id AND lh.status = 'success') AS last_login_time,
        (SELECT COUNT(*) FROM login_history lh WHERE lh.user_id = u.id) AS total_logins
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
      WHERE 1=1
    `;

    const params = {};

    if (branch_name && branch_name !== 'all') {
      sql += ` AND u.branch_name = :branch_name`;
      params.branch_name = branch_name;
    }

    if (role_code && role_code !== 'all') {
      sql += ` AND r.code = :role_code`;
      params.role_code = role_code;
    }

    if (is_active !== undefined && is_active !== 'all') {
      sql += ` AND u.is_active = :is_active`;
      params.is_active = parseInt(is_active);
    }

    if (search) {
      sql += ` AND (u.name LIKE :search OR u.username LIKE :search OR u.tel LIKE :search OR u.barcode LIKE :search)`;
      params.search = `%${search}%`;
    }

    sql += ` ORDER BY u.is_active DESC, u.create_at DESC`;

    const [users] = await db.query(sql, params);

    const [stats] = await db.query(`
      SELECT 
        COUNT(*) AS total_users,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_users,
        COUNT(DISTINCT branch_name) AS total_branches
      FROM user
    `);

    const [branches] = await db.query(`
      SELECT DISTINCT branch_name 
      FROM user 
      WHERE branch_name IS NOT NULL
      ORDER BY branch_name
    `);

    const [roles] = await db.query(`
      SELECT id, name, code 
      FROM role 
      ORDER BY id
    `);

    return res.json({
      success: true,
      users: users,
      stats: stats[0],
      branches: branches.map(b => b.branch_name),
      roles: roles,
      filters_applied: {
        branch_name: branch_name || 'all',
        role_code: role_code || 'all',
        is_active: is_active !== undefined ? is_active : 'all',
        search: search || null
      }
    });

  } catch (error) {
    console.error('❌ Error in getSuperAdminUsers:', error);
    logError("superadmin.getSuperAdminUsers", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to retrieve users",
      message_kh: "មិនអាចទាញបញ្ជីអ្នកប្រើប្រាស់បានទេ"
    });
  }
};

exports.createSuperAdmin = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const {
      name,
      username,
      password,
      email,
      tel,
      address,
      branch_name,
    } = req.body;

    const [currentUser] = await db.query(
      `SELECT r.code AS role_code, u.name, u.username
       FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Only Super Admin can create other Super Admin accounts",
        message_kh: "មានតែ Super Admin ទេដែលអាចបង្កើតគណនី Super Admin ផ្សេងទៀត"
      });
    }

    if (!name || !username || !password) {
      return res.status(400).json({
        error: true,
        message: "Name, username, and password are required",
        message_kh: "ត្រូវការឈ្មោះ, Username និងពាក្យសម្ងាត់"
      });
    }

    const [existingUser] = await db.query(
      "SELECT id FROM user WHERE username = :username LIMIT 1",
      { username }
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Username already exists!",
        message_kh: "Username នេះមានរួចហើយ!"
      });
    }

    const [superAdminRole] = await db.query(
      "SELECT id FROM role WHERE code = 'SUPER_ADMIN' LIMIT 1"
    );

    if (superAdminRole.length === 0) {
      return res.status(500).json({
        error: true,
        message: "Super Admin role not found in system",
        message_kh: "មិនមាន Super Admin role ក្នុងប្រព័ន្ធ"
      });
    }

    const superAdminRoleId = superAdminRole[0].id;

    const hashedPassword = bcrypt.hashSync(password, 10);

    const [newUserResult] = await db.query(`
      INSERT INTO user (
        role_id,
        name,
        username,
        email,
        password,
        tel,
        address,
        branch_name,
        profile_image,
        is_active,
        create_by,
        create_at
      ) VALUES (
        :role_id,
        :name,
        :username,
        :email,
        :password,
        :tel,
        :address,
        :branch_name,
        :profile_image,
        1,
        :create_by,
        NOW()
      )
    `, {
      role_id: superAdminRoleId,
      name: name,
      username: username,
      email: email || username,
      password: hashedPassword,
      tel: tel || null,
      address: address || null,
      branch_name: branch_name || 'Head Office',
      profile_image: req.file?.path || null,
      create_by: currentUser[0]?.name
    });

    const newUserId = newUserResult.insertId;

    await db.query(
      "INSERT INTO user_roles (user_id, role_id) VALUES (:user_id, :role_id)",
      { user_id: newUserId, role_id: superAdminRoleId }
    );

    try {
      await db.query(`
        INSERT INTO user_activity_log (
          user_id,
          action_type,
          action_description,
          ip_address,
          user_agent,
          created_at,
          created_by
        ) VALUES (
          :user_id,
          'SUPER_ADMIN_CREATED',
          :description,
          :ip_address,
          :user_agent,
          NOW(),
          :created_by
        )
      `, {
        user_id: newUserId,
        description: `New Super Admin account created: ${name} (${username})`,
        ip_address: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'Unknown',
        user_agent: req.get('User-Agent') || 'Unknown',
        created_by: currentUserId
      });
    } catch (logError) {
      console.error("Failed to log Super Admin creation:", logError);
    }

    const creationTime = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Phnom_Penh',
      dateStyle: 'full',
      timeStyle: 'long'
    });

    const alertMessage = `
👑 <b>SUPER ADMIN CREATED / បង្កើត Super Admin</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 <b>New Super Admin:</b> ${name}
🆔 <b>Username:</b> ${username}
📧 <b>Email:</b> ${email || username}
🏢 <b>Branch:</b> ${branch_name || 'Head Office'}
📱 <b>Tel:</b> ${tel || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━
👨‍💼 <b>Created By:</b>
${currentUser[0]?.name} (${currentUser[0]?.username})

⏰ <b>Time:</b> ${creationTime}

🆔 <b>User ID:</b> ${newUserId}
✅ <b>Status:</b> Active

━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ <b>CRITICAL NOTICE:</b>
A new Super Admin account with full system access has been created.
    `;

    sendTelegramMessagenewLogin(alertMessage).catch(err => {
      console.error("Failed to send Telegram alert:", err.message);
    });

    return res.status(201).json({
      success: true,
      message: "Super Admin account created successfully!",
      message_kh: "បង្កើតគណនី Super Admin បានជោគជ័យ!",
      data: {
        user_id: newUserId,
        username: username,
        name: name,
        email: email || username,
        role: 'SUPER_ADMIN',
        branch_name: branch_name,
        is_active: true,
        created_at: creationTime
      }
    });

  } catch (error) {
    console.error("❌ Error in createSuperAdmin:", error);
    logError("superadmin.createSuperAdmin", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to create Super Admin account",
      message_kh: "មិនអាចបង្កើតគណនី Super Admin បានទេ",
      details: error.message
    });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { branch_name, role_code, is_active, search } = req.query;

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
        message: "Access denied. Super Admin only."
      });
    }

    let whereConditions = ['1=1'];
    let queryParams = {};

    if (branch_name && branch_name !== 'all') {
      whereConditions.push('u.branch_name = :branch_name');
      queryParams.branch_name = branch_name;
    }

    if (role_code && role_code !== 'all') {
      whereConditions.push('r.code = :role_code');
      queryParams.role_code = role_code;
    }

    if (is_active && is_active !== 'all') {
      whereConditions.push('u.is_active = :is_active');
      queryParams.is_active = parseInt(is_active);
    }

    if (search) {
      whereConditions.push('(u.name LIKE :search OR u.username LIKE :search OR u.email LIKE :search)');
      queryParams.search = `%${search}%`;
    }

    const [users] = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.username,
        u.email,
        u.tel,
        u.branch_name,
        u.profile_image,
        u.address,
        u.is_active,
        u.is_online,
        u.last_activity,
        u.online_status,
        u.create_at,
        u.role_id,
        r.name AS role_name,
        r.code AS role_code,
        (SELECT COUNT(*) FROM user WHERE branch_name = u.branch_name AND id != u.id) AS managed_users_count,
        (SELECT MAX(login_time) FROM login_history WHERE user_id = u.id AND status = 'success') AS last_login_time
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY u.create_at DESC
    `, queryParams);

    const [stats] = await db.query(`
      SELECT 
        COUNT(*) AS total_users,
        SUM(CASE WHEN u.is_active = 1 THEN 1 ELSE 0 END) AS active_users,
        COUNT(DISTINCT u.branch_name) AS total_branches
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
    `);

    const [branches] = await db.query(`
      SELECT DISTINCT branch_name 
      FROM user 
      WHERE branch_name IS NOT NULL 
      ORDER BY branch_name
    `);

    const [roles] = await db.query(`
      SELECT id, name, code 
      FROM role 
      ORDER BY name
    `);

    res.json({
      success: true,
      users: users,
      stats: stats[0] || {},
      branches: branches.map(b => b.branch_name),
      roles: roles,
      filters_applied: {
        branch_name: branch_name || 'all',
        role_code: role_code || 'all',
        is_active: is_active || 'all',
        search: search || ''
      }
    });

  } catch (error) {
    console.error("❌ Error getting users:", error);
    res.status(500).json({
      error: true,
      message: "Failed to get users",
      message_kh: "មិនអាចទាញបញ្ជីអ្នកប្រើប្រាស់បានទេ",
      debug: error.message
    });
  }
};

// ================================
// 🔧 UPDATED: Update User with Better Group ID Handling
// ================================
exports.updateUserBySuperAdmin = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { user_id } = req.params;
    const {
      name,
      username,
      password,
      email,
      tel,
      address,
      branch_name,
      role_id,
      is_active
    } = req.body;


    // ✅ Verify Super Admin
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code, u.name AS user_name FROM user u 
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

    // ✅ CRITICAL: Get existing user data FIRST
    const [existingUser] = await db.query(
      `SELECT u.id, u.branch_id, u.role_id, u.branch_name, r.code AS role_code
       FROM user u
       INNER JOIN role r ON u.role_id = r.id
       WHERE u.id = :user_id`,
      { user_id: user_id }
    );

    if (!existingUser || existingUser.length === 0) {
      return res.status(404).json({
        error: true,
        message: "User not found",
        message_kh: "មិនមានអ្នកប្រើប្រាស់នេះ"
      });
    }

    const oldUser = existingUser[0];

    // ✅ Build dynamic UPDATE query
    let updateFields = [];
    const params = { user_id: user_id };

    if (name !== undefined) {
      updateFields.push('name = :name');
      params.name = name;
    }
    if (username !== undefined) {
      updateFields.push('username = :username');
      params.username = username;
    }
    if (email !== undefined) {
      updateFields.push('email = :email');
      params.email = email;
    }
    if (tel !== undefined) {
      updateFields.push('tel = :tel');
      params.tel = tel;
    }
    if (address !== undefined) {
      updateFields.push('address = :address');
      params.address = address;
    }
    if (branch_name !== undefined) {
      updateFields.push('branch_name = :branch_name');
      params.branch_name = branch_name;
    }
    if (is_active !== undefined) {
      updateFields.push('is_active = :is_active');
      params.is_active = is_active;
    }

    // ✅ Handle password (only if provided and not empty)
    if (password && password.trim() !== '') {
      const hashedPassword = bcrypt.hashSync(password, 10);
      updateFields.push('password = :password');
      params.password = hashedPassword;
    }

    // ✅ Handle role_id changes with smart branch_id assignment
    if (role_id !== undefined && parseInt(role_id) !== parseInt(oldUser.role_id)) {

      updateFields.push('role_id = :role_id');
      params.role_id = role_id;

      // Get the new role code
      const [newRole] = await db.query(
        `SELECT code FROM role WHERE id = :role_id`,
        { role_id: role_id }
      );

      if (newRole && newRole.length > 0) {
        // No longer need to change group_id based on role, 
        // keep user in their branch.

        // Update user_roles table
        await db.query(
          `DELETE FROM user_roles WHERE user_id = :user_id`,
          { user_id: user_id }
        );
        await db.query(
          `INSERT INTO user_roles (user_id, role_id) VALUES (:user_id, :role_id)`,
          { user_id: user_id, role_id: role_id }
        );
      }
    } else if (role_id === undefined || parseInt(role_id) === parseInt(oldUser.role_id)) {
      // ✅ No role change - check if branch changed
      if (branch_name && branch_name !== oldUser.branch_name) {
        const newBranchId = await getBranchIdByName(branch_name);
        if (newBranchId) {
          updateFields.push('branch_id = :new_branch_id');
          params.new_branch_id = newBranchId;
        }
      }
    }

    if (req.file) {
      updateFields.push('profile_image = :profile_image');
      params.profile_image = req.file.path;
    }

    // ✅ Add metadata
    updateFields.push('updated_at = NOW()');
    updateFields.push('updated_by = :updated_by');
    params.updated_by = currentUser[0]?.user_name || 'Super Admin';

    // ✅ Execute update
    if (updateFields.length === 0) {
      return res.status(400).json({
        error: true,
        message: "No fields to update",
        message_kh: "មិនមានទិន្នន័យត្រូវកែប្រែ"
      });
    }

    const sql = `UPDATE user SET ${updateFields.join(', ')} WHERE id = :user_id`;

    await db.query(sql, params);

    // ✅ Get updated user data for response
    const [updatedUser] = await db.query(
      `SELECT 
        u.id, u.name, u.username, u.email, u.tel, u.branch_name,
        u.is_active, u.role_id,
        r.name as role_name, r.code as role_code
       FROM user u
       INNER JOIN role r ON u.role_id = r.id
       WHERE u.id = :user_id`,
      { user_id: user_id }
    );


    // ✅ Log activity
    try {
      await db.query(`
        INSERT INTO user_activity_log (
          user_id,
          action_type,
          action_description,
          ip_address,
          user_agent,
          created_at,
          created_by
        ) VALUES (
          :user_id,
          'USER_UPDATED',
          :description,
          :ip_address,
          :user_agent,
          NOW(),
          :created_by
        )
      `, {
        user_id: user_id,
        description: `User updated by Super Admin`,
        ip_address: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'Unknown',
        user_agent: req.get('User-Agent') || 'Unknown',
        created_by: currentUserId
      });
    } catch (logError) {
      console.error("Failed to log user update:", logError);
    }

    return res.json({
      success: true,
      message: "User updated successfully",
      message_kh: "កែប្រែអ្នកប្រើប្រាស់បានជោគជ័យ",
      data: updatedUser[0]
    });

  } catch (error) {
    console.error("❌ Error updating user:", error);
    logError("superadmin.updateUserBySuperAdmin", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to update user",
      message_kh: "មិនអាចកែប្រែអ្នកប្រើប្រាស់បានទេ",
      details: error.message
    });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { user_id } = req.body;

    const [currentUser] = await db.query(
      `SELECT r.code AS role_code FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Only Super Admin can delete users"
      });
    }

    if (parseInt(user_id) === parseInt(currentUserId)) {
      return res.status(400).json({
        error: true,
        message: "You cannot delete your own account"
      });
    }

    const [userInfo] = await db.query(
      "SELECT name, username FROM user WHERE id = :user_id",
      { user_id }
    );

    if (userInfo.length === 0) {
      return res.status(404).json({
        error: true,
        message: "User not found"
      });
    }

    await db.query("DELETE FROM user WHERE id = :user_id", { user_id });

    try {
      await db.query(`
        INSERT INTO user_activity_log (
          user_id,
          action_type,
          action_description,
          ip_address,
          user_agent,
          created_at,
          created_by
        ) VALUES (
          :user_id,
          'USER_DELETED',
          :description,
          :ip_address,
          :user_agent,
          NOW(),
          :created_by
        )
      `, {
        user_id: user_id,
        description: `User deleted: ${userInfo[0].name} (${userInfo[0].username})`,
        ip_address: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'Unknown',
        user_agent: req.get('User-Agent') || 'Unknown',
        created_by: currentUserId
      });
    } catch (logError) {
      console.error("Failed to log user deletion:", logError);
    }

    return res.json({
      success: true,
      message: "User deleted successfully",
      message_kh: "លុបអ្នកប្រើប្រាស់បានជោគជ័យ"
    });

  } catch (error) {
    logError("superadmin.deleteUser", error, res);
  }
};

exports.getSystemStatistics = async (req, res) => {
  try {
    const currentUserId = req.current_id;

    const [currentUser] = await db.query(
      `SELECT r.code AS role_code FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Access denied. Super Admin only."
      });
    }

    const [userStats] = await db.query(`
      SELECT 
        COUNT(*) AS total_users,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_users,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) AS inactive_users,
        COUNT(DISTINCT branch_name) AS total_branches
      FROM user
    `);

    const [roleDistribution] = await db.query(`
      SELECT 
        r.name AS role_name,
        r.code AS role_code,
        COUNT(u.id) AS user_count
      FROM role r
      LEFT JOIN user u ON r.id = u.role_id
      GROUP BY r.id, r.name, r.code
      ORDER BY user_count DESC
    `);

    const [branchDistribution] = await db.query(`
      SELECT 
        branch_name,
        COUNT(*) AS user_count,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) AS active_count
      FROM user
      WHERE branch_name IS NOT NULL
      GROUP BY branch_name
      ORDER BY user_count DESC
    `);

    const [loginStats] = await db.query(`
      SELECT 
        COUNT(DISTINCT user_id) AS users_logged_in_today,
        COUNT(*) AS total_logins_today
      FROM login_history
      WHERE DATE(login_time) = CURDATE()
    `);

    return res.json({
      success: true,
      stats: {
        users: userStats[0],
        roles: roleDistribution,
        branches: branchDistribution,
        logins: loginStats[0]
      }
    });

  } catch (error) {
    logError("superadmin.getSystemStatistics", error, res);
  }
};

exports.getAutoLogoutConfig = async (req, res) => {
  try {
    const [config] = await db.query(`
      SELECT config_value
      FROM system_config
      WHERE config_key = 'auto_logout_minutes'
      LIMIT 1
    `);

    return res.json({
      success: true,
      timeout_minutes: parseInt(config?.[0]?.config_value || 3, 10),
    });
  } catch (error) {
    console.error("Error getting auto-logout config:", error);

    return res.status(500).json({
      error: true,
      message: "Failed to get configuration",
    });
  }
};

exports.updateAutoLogoutConfig = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { timeout_minutes } = req.body;

    const [currentUser] = await db.query(
      `SELECT r.code AS role_code
        FROM user u
        INNER JOIN role r ON u.role_id = r.id
        WHERE u.id = :user_id
        LIMIT 1`,
      { user_id: currentUserId }
    );

    if (currentUser?.[0]?.role_code !== "SUPER_ADMIN") {
      return res.status(403).json({
        error: true,
        message: "Only Super Admin can update this setting",
      });
    }

    await db.query(
      `UPDATE system_config
        SET config_value = :value,
            updated_at = NOW(),
            updated_by = :user_id
        WHERE config_key = 'auto_logout_minutes'`,
      {
        value: timeout_minutes,
        user_id: currentUserId,
      }
    );

    return res.json({
      success: true,
      message: "Auto-logout timeout updated successfully",
      message_kh: "បានកែប្រែពេលវេលា auto-logout ដោយជោគជ័យ",
    });
  } catch (error) {
    console.error("Error updating auto-logout config:", error);

    return res.status(500).json({
      error: true,
      message: "Failed to update configuration",
    });
  }
};