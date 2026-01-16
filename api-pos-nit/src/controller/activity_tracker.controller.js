const { db } = require("../util/helper");
const { logError } = require("../util/logError");

/**
 * ទទួលបញ្ជីអ្នកប្រើប្រាស់ដែល Online
 * Get Online Users (Real-time)
 */
exports.getOnlineUsers = async (req, res) => {
  try {
    const [onlineUsers] = await db.query(`
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
        TIMESTAMPDIFF(MINUTE, u.last_activity, NOW()) AS minutes_since_activity
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
      WHERE u.is_active = 1
        AND u.is_online = 1
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
    logError("admin.getOnlineUsers", error, res);
  }
};

/**
 * ទទួលស្ថិតិសកម្មភាព Admin (Real-time)
 * Get Admin Activity Stats with Online Status
 */
exports.getAdminActivityStatsRealtime = async (req, res) => {
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

    // ស្ថិតិតាម role
    const [stats] = await db.query(`
      SELECT 
        r.name AS role_name,
        COUNT(*) AS total_users,
        SUM(CASE WHEN u.is_online = 1 THEN 1 ELSE 0 END) AS online_count,
        SUM(CASE WHEN u.online_status = 'away' THEN 1 ELSE 0 END) AS away_count,
        SUM(CASE WHEN u.is_online = 0 THEN 1 ELSE 0 END) AS offline_count
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
      WHERE u.is_active = 1
        AND r.code IN ('ADMIN', 'SUPER_ADMIN')
      GROUP BY r.name
    `);

    // Admin ដែល online
    const [onlineAdmins] = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.username,
        u.profile_image,
        u.online_status,
        u.last_activity,
        u.is_online,
        r.name AS role_name,
        TIMESTAMPDIFF(MINUTE, u.last_activity, NOW()) AS minutes_since_activity
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
      WHERE u.is_online = 1
        AND r.code IN ('ADMIN', 'SUPER_ADMIN')
      ORDER BY u.last_activity DESC
    `);

    res.json({
      success: true,
      stats: stats,
      online_admins: onlineAdmins,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error getting admin activity stats:', error);
    logError("admin.getAdminActivityStatsRealtime", error, res);
  }
};

/**
 * ទទួលបញ្ជី Admin ដែល Active តែមិនបានចូល System
 * Get Active Admins Who Haven't Logged In For Days
 * Super Admin Only
 */
exports.getInactiveAdmins = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { days = 30, include_never_logged = true } = req.query;

    // ពិនិត្យថាជា Super Admin ទេ
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

    // ទាញបញ្ជី Admin ដែលមិនសកម្ម
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
        u.create_at AS created_date,
        r.name AS role_name,
        r.code AS role_code,
        COALESCE(MAX(lh.login_time), u.create_at) AS last_activity,
        DATEDIFF(NOW(), COALESCE(MAX(lh.login_time), u.create_at)) AS days_inactive,
        COUNT(DISTINCT lh.id) AS total_logins,
        CASE 
          WHEN MAX(lh.login_time) IS NULL THEN 'Never Logged In'
          WHEN DATEDIFF(NOW(), MAX(lh.login_time)) >= 90 THEN 'Inactive 90+ Days'
          WHEN DATEDIFF(NOW(), MAX(lh.login_time)) >= 60 THEN 'Inactive 60-89 Days'
          WHEN DATEDIFF(NOW(), MAX(lh.login_time)) >= 30 THEN 'Inactive 30-59 Days'
          WHEN DATEDIFF(NOW(), MAX(lh.login_time)) >= 14 THEN 'Inactive 14-29 Days'
          WHEN DATEDIFF(NOW(), MAX(lh.login_time)) >= 7 THEN 'Inactive 7-13 Days'
          ELSE 'Active (< 7 days)'
        END AS activity_status,
        (SELECT COUNT(*) FROM user WHERE group_id = u.group_id AND id != u.id) AS managed_users_count
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
      LEFT JOIN login_history lh ON u.id = lh.user_id AND lh.status = 'success'
      WHERE r.code IN ('ADMIN', 'SUPER_ADMIN')
        AND u.is_active = 1
      GROUP BY u.id, u.name, u.username, u.email, u.tel, u.branch_name, u.profile_image, 
               u.is_active, u.create_at, r.name, r.code
      HAVING days_inactive >= :min_days
      ORDER BY days_inactive DESC
    `, { min_days: parseInt(days) });

    // បែងចែកតាមប្រភេទ
    const neverLoggedIn = inactiveAdmins.filter(a => a.total_logins === 0);
    const inactive90Plus = inactiveAdmins.filter(a => a.total_logins > 0 && a.days_inactive >= 90);
    const inactive60to89 = inactiveAdmins.filter(a => a.total_logins > 0 && a.days_inactive >= 60 && a.days_inactive < 90);
    const inactive30to59 = inactiveAdmins.filter(a => a.total_logins > 0 && a.days_inactive >= 30 && a.days_inactive < 60);
    const inactive14to29 = inactiveAdmins.filter(a => a.total_logins > 0 && a.days_inactive >= 14 && a.days_inactive < 30);
    const inactive7to13 = inactiveAdmins.filter(a => a.total_logins > 0 && a.days_inactive >= 7 && a.days_inactive < 14);

    // ស្ថិតិ
    const stats = {
      total_inactive: inactiveAdmins.length,
      never_logged_in: neverLoggedIn.length,
      inactive_90_plus: inactive90Plus.length,
      inactive_60_to_89: inactive60to89.length,
      inactive_30_to_59: inactive30to59.length,
      inactive_14_to_29: inactive14to29.length,
      inactive_7_to_13: inactive7to13.length,
      total_managed_users: inactiveAdmins.reduce((sum, a) => sum + (a.managed_users_count || 0), 0)
    };

    res.json({
      success: true,
      inactive_admins: inactiveAdmins,
      categories: {
        never_logged_in: neverLoggedIn,
        inactive_90_plus: inactive90Plus,
        inactive_60_to_89: inactive60to89,
        inactive_30_to_59: inactive30to59,
        inactive_14_to_29: inactive14to29,
        inactive_7_to_13: inactive7to13
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
      message_kh: "មិនអាចទាញបញ្ជីអ្នកគ្រប់គ្រងមិនសកម្មបានទេ"
    });
  }
};

/**
 * ទទួលស្ថិតិសង្ខេបនៃសកម្មភាព Admin
 * Get Summary Statistics of Admin Activity
 */
exports.getAdminActivityStats = async (req, res) => {
  try {
    const currentUserId = req.current_id;

    // ពិនិត្យថាជា Super Admin ទេ
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

    // ស្ថិតិសង្ខេប
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
          DATEDIFF(NOW(), MAX(lh.login_time)) AS days_inactive
        FROM user u
        INNER JOIN role r ON u.role_id = r.id
        LEFT JOIN login_history lh ON u.id = lh.user_id AND lh.status = 'success'
        WHERE r.code IN ('ADMIN', 'SUPER_ADMIN')
          AND u.is_active = 1
        GROUP BY u.id
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

    // ស្ថិតិទូទៅ
    const [overallStats] = await db.query(`
      SELECT 
        COUNT(*) AS total_active_admins,
        SUM(CASE WHEN MAX(lh.login_time) IS NULL THEN 1 ELSE 0 END) AS never_logged_in,
        SUM(CASE WHEN DATEDIFF(NOW(), MAX(lh.login_time)) >= 30 THEN 1 ELSE 0 END) AS inactive_30_plus,
        SUM(CASE WHEN DATEDIFF(NOW(), MAX(lh.login_time)) < 7 THEN 1 ELSE 0 END) AS active_last_week
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
      LEFT JOIN login_history lh ON u.id = lh.user_id AND lh.status = 'success'
      WHERE r.code IN ('ADMIN', 'SUPER_ADMIN')
        AND u.is_active = 1
      GROUP BY u.id
    `);

    res.json({
      success: true,
      activity_breakdown: activityStats,
      overall: overallStats[0] || {},
      generated_at: new Date()
    });

  } catch (error) {
    logError("admin.getAdminActivityStats", error, res);
  }
};

/**
 * ផ្ញើការជូនដំណឹងទៅ Admin ដែលមិនសកម្ម
 * Send notification to inactive admins (placeholder)
 */
exports.notifyInactiveAdmins = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { admin_ids, message_text } = req.body;

    // ពិនិត្យថាជា Super Admin ទេ
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code, u.name 
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

    // TODO: Implement email/SMS notification
    // For now, just log the action

    res.json({
      success: true,
      message: "Notifications sent successfully",
      message_kh: "ផ្ញើការជូនដំណឹងបានជោគជ័យ",
      notified_count: admin_ids.length
    });

  } catch (error) {
    logError("admin.notifyInactiveAdmins", error, res);
  }
};

