const { db } = require("../util/helper");

/**
 * Middleware: Track User Activity
 * ត្រួតពិនិត្យសកម្មភាពអ្នកប្រើប្រាស់លើគ្រប់ request
 */
exports.trackUserActivity = async (req, res, next) => {
  try {
    // ✅ Check if user is authenticated
    if (req.current_id) {
      const userId = req.current_id;
      const sessionId = req.sessionID || req.headers['x-session-id'] || 'default';
      const ipAddress = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'Unknown';
      const userAgent = req.get('User-Agent') || 'Unknown';

      // ✅ Update user activity asynchronously (don't block request)
      updateUserActivity(userId, sessionId, ipAddress, userAgent).catch(err => {
        console.error('Failed to update user activity:', err);
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in trackUserActivity middleware:', error);
    next(); // Continue even if tracking fails
  }
};

/**
 * Update User Activity in Database
 * អាប់ដេតសកម្មភាពអ្នកប្រើប្រាស់ក្នុង Database
 */
async function updateUserActivity(userId, sessionId, ipAddress, userAgent) {
  try {
    // ✅ Method 1: Using Stored Procedure (Faster)
    await db.query('CALL update_user_activity(?, ?, ?, ?)', [
      userId,
      sessionId,
      ipAddress,
      userAgent
    ]);

  } catch (error) {
    // ✅ Fallback: Manual update if stored procedure fails
    try {
      // Update user_online_status
      await db.query(`
        INSERT INTO user_online_status (
          user_id, last_activity, is_online, session_id, ip_address, user_agent, updated_at
        ) VALUES (?, NOW(), 1, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          last_activity = NOW(),
          is_online = 1,
          ip_address = ?,
          user_agent = ?,
          updated_at = NOW()
      `, [userId, sessionId, ipAddress, userAgent, ipAddress, userAgent]);

      // Update user table
      await db.query(`
        UPDATE user 
        SET is_online = 1, last_activity = NOW(), online_status = 'online'
        WHERE id = ?
      `, [userId]);

    } catch (fallbackError) {
      console.error('Failed to track activity (fallback):', fallbackError);
    }
  }
}

/**
 * Get Online Users
 * ទទួលបញ្ជីអ្នកប្រើប្រាស់ដែល Online
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
    res.status(500).json({
      error: true,
      message: 'Failed to get online users'
    });
  }
};

/**
 * Get User Online Status
 * ទទួលស្ថានភាពរបស់អ្នកប្រើប្រាស់ម្នាក់
 */
exports.getUserStatus = async (req, res) => {
  try {
    const { user_id } = req.params;

    const [userStatus] = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.username,
        u.is_online,
        u.last_activity,
        u.online_status,
        TIMESTAMPDIFF(MINUTE, u.last_activity, NOW()) AS minutes_inactive,
        CASE
          WHEN TIMESTAMPDIFF(MINUTE, u.last_activity, NOW()) < 3 THEN 'online'
          WHEN TIMESTAMPDIFF(MINUTE, u.last_activity, NOW()) < 5 THEN 'away'
          ELSE 'offline'
        END AS computed_status
      FROM user u
      WHERE u.id = ?
    `, [user_id]);

    if (userStatus.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: userStatus[0]
    });
  } catch (error) {
    console.error('Error getting user status:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to get user status'
    });
  }
};

/**
 * Mark User as Offline (Logout)
 * ចាត់ទុកជា Offline ពេលចាកចេញ
 */
exports.markUserOffline = async (userId) => {
  try {
    await db.query(`
      UPDATE user 
      SET is_online = 0, online_status = 'offline'
      WHERE id = ?
    `, [userId]);

    await db.query(`
      UPDATE user_online_status 
      SET is_online = 0
      WHERE user_id = ?
    `, [userId]);

  } catch (error) {
    console.error('Failed to mark user offline:', error);
  }
};

/**
 * Get Admin Activity Statistics
 * ស្ថិតិសកម្មភាព Admin
 */
exports.getAdminActivityStats = async (req, res) => {
  try {
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

    const [onlineAdmins] = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.username,
        u.profile_image,
        u.online_status,
        u.last_activity,
        r.name AS role_name
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
    res.status(500).json({
      error: true,
      message: 'Failed to get admin activity stats'
    });
  }
};

module.exports = {
  trackUserActivity: exports.trackUserActivity,
  getOnlineUsers: exports.getOnlineUsers,
  getUserStatus: exports.getUserStatus,
  markUserOffline: exports.markUserOffline,
  getAdminActivityStats: exports.getAdminActivityStats,
};