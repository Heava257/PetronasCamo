const { db, getLocationFromIP } = require("../util/helper");
const { logError } = require("../util/logError");
/**
 * ✅ Helper Function: Log any system activity
 */
exports.createLog = async (logData) => {
  try {
    const sql = `
      INSERT INTO system_logs (
        log_type, user_id, username, action, description,
        ip_address, user_agent, device_info, location_info,
        severity, status, error_message, request_data, response_data,
        created_at
      ) VALUES (
        :log_type, :user_id, :username, :action, :description,
        :ip_address, :user_agent, :device_info, :location_info,
        :severity, :status, :error_message, :request_data, :response_data,
        NOW()
      )
    `;

    await db.query(sql, {
      log_type: logData.log_type || 'INFO',
      user_id: logData.user_id || null,
      username: logData.username || null,
      action: logData.action,
      description: logData.description || null,
      ip_address: logData.ip_address || null,
      user_agent: logData.user_agent || null,
      device_info: logData.device_info ? JSON.stringify(logData.device_info) : null,
      location_info: logData.location_info ? JSON.stringify(logData.location_info) : null,
      severity: logData.severity || 'info',
      status: logData.status || 'success',
      error_message: logData.error_message || null,
      request_data: logData.request_data ? JSON.stringify(logData.request_data) : null,
      response_data: logData.response_data ? JSON.stringify(logData.response_data) : null
    });

    return true;
  } catch (error) {
    console.error('❌ Error creating system log:', error);
    return false;
  }
};

/**
 * ✅ Get all system logs with filters and pagination
 */
exports.getSystemLogs = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    
    // Check if user is admin
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code 
       FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (!['ADMIN', 'SUPER_ADMIN'].includes(currentUser[0]?.role_code)) {
      return res.status(403).json({
        error: true,
        message: "Access denied. Admin only.",
        message_kh: "បដិសេធការចូលប្រើ។ សម្រាប់ Admin តែប៉ុណ្ណោះ"
      });
    }

    const {
      log_type,
      severity,
      user_id,
      start_date,
      end_date,
      search,
      page = 1,
      limit = 50,
      sort = 'created_at',
      order = 'DESC'
    } = req.query;

    let whereConditions = [];
    let params = {};

    // Filters
    if (log_type) {
      whereConditions.push('sl.log_type = :log_type');
      params.log_type = log_type;
    }

    if (severity) {
      whereConditions.push('sl.severity = :severity');
      params.severity = severity;
    }

    if (user_id) {
      whereConditions.push('sl.user_id = :user_id');
      params.user_id = user_id;
    }

    if (start_date) {
      whereConditions.push('sl.created_at >= :start_date');
      params.start_date = start_date;
    }

    if (end_date) {
      whereConditions.push('sl.created_at <= :end_date');
      params.end_date = end_date;
    }

    if (search) {
      whereConditions.push(`(
        sl.action LIKE :search OR 
        sl.description LIKE :search OR 
        sl.username LIKE :search OR
        sl.ip_address LIKE :search
      )`);
      params.search = `%${search}%`;
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Count total
    const countSql = `SELECT COUNT(*) as total FROM system_logs sl ${whereClause}`;
    const [countResult] = await db.query(countSql, params);
    const total = countResult[0]?.total || 0;

    // Get logs with pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.limit = parseInt(limit);
    params.offset = offset;

    const sql = `
      SELECT 
        sl.*,
        u.name as user_name,
        u.profile_image
      FROM system_logs sl
      LEFT JOIN user u ON sl.user_id = u.id
      ${whereClause}
      ORDER BY sl.${sort} ${order}
      LIMIT :limit OFFSET :offset
    `;

    const [logs] = await db.query(sql, params);

    // Parse JSON fields
    const parsedLogs = logs.map(log => ({
      ...log,
      device_info: log.device_info ? JSON.parse(log.device_info) : null,
      location_info: log.location_info ? JSON.parse(log.location_info) : null,
      request_data: log.request_data ? JSON.parse(log.request_data) : null,
      response_data: log.response_data ? JSON.parse(log.response_data) : null
    }));

    res.json({
      success: true,
      logs: parsedLogs,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: total,
        total_pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Error fetching system logs:', error);
    logError("systemLog.getSystemLogs", error, res);
  }
};

/**
 * ✅ Get login history
 */
exports.getLoginHistory = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code 
       FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    const {
      user_id,
      start_date,
      end_date,
      status,
      page = 1,
      limit = 50
    } = req.query;

    let whereConditions = [];
    let params = {};

    // If not admin, only show own history
    if (!['ADMIN', 'SUPER_ADMIN'].includes(currentUser[0]?.role_code)) {
      whereConditions.push('lh.user_id = :current_user_id');
      params.current_user_id = currentUserId;
    } else if (user_id) {
      whereConditions.push('lh.user_id = :user_id');
      params.user_id = user_id;
    }

    if (start_date) {
      whereConditions.push('lh.login_time >= :start_date');
      params.start_date = start_date;
    }

    if (end_date) {
      whereConditions.push('lh.login_time <= :end_date');
      params.end_date = end_date;
    }

    if (status) {
      whereConditions.push('lh.status = :status');
      params.status = status;
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const countSql = `SELECT COUNT(*) as total FROM login_history lh ${whereClause}`;
    const [countResult] = await db.query(countSql, params);
    const total = countResult[0]?.total || 0;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.limit = parseInt(limit);
    params.offset = offset;

    const sql = `
      SELECT 
        lh.*,
        u.name as user_name,
        u.profile_image,
        r.name as role_name
      FROM login_history lh
      INNER JOIN user u ON lh.user_id = u.id
      LEFT JOIN role r ON u.role_id = r.id
      ${whereClause}
      ORDER BY lh.login_time DESC
      LIMIT :limit OFFSET :offset
    `;

    const [history] = await db.query(sql, params);

    const parsedHistory = history.map(record => ({
      ...record,
      device_info: record.device_info ? JSON.parse(record.device_info) : null,
      location_info: record.location_info ? JSON.parse(record.location_info) : null
    }));

    res.json({
      success: true,
      history: parsedHistory,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: total,
        total_pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Error fetching login history:', error);
    logError("systemLog.getLoginHistory", error, res);
  }
};

/**
 * ✅ Get user activity logs
 */
exports.getUserActivity = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code 
       FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    const {
      user_id,
      action_type,
      start_date,
      end_date,
      page = 1,
      limit = 50
    } = req.query;

    let whereConditions = [];
    let params = {};

    if (!['ADMIN', 'SUPER_ADMIN'].includes(currentUser[0]?.role_code)) {
      whereConditions.push('ual.user_id = :current_user_id');
      params.current_user_id = currentUserId;
    } else if (user_id) {
      whereConditions.push('ual.user_id = :user_id');
      params.user_id = user_id;
    }

    if (action_type) {
      whereConditions.push('ual.action_type = :action_type');
      params.action_type = action_type;
    }

    if (start_date) {
      whereConditions.push('ual.created_at >= :start_date');
      params.start_date = start_date;
    }

    if (end_date) {
      whereConditions.push('ual.created_at <= :end_date');
      params.end_date = end_date;
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const countSql = `SELECT COUNT(*) as total FROM user_activity_log ual ${whereClause}`;
    const [countResult] = await db.query(countSql, params);
    const total = countResult[0]?.total || 0;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.limit = parseInt(limit);
    params.offset = offset;

    const sql = `
      SELECT 
        ual.*,
        u.name as user_name,
        u.username,
        u.profile_image,
        creator.name as created_by_name
      FROM user_activity_log ual
      INNER JOIN user u ON ual.user_id = u.id
      LEFT JOIN user creator ON ual.created_by = creator.id
      ${whereClause}
      ORDER BY ual.created_at DESC
      LIMIT :limit OFFSET :offset
    `;

    const [activities] = await db.query(sql, params);

    res.json({
      success: true,
      activities: activities,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total: total,
        total_pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Error fetching user activity:', error);
    logError("systemLog.getUserActivity", error, res);
  }
};

/**
 * ✅ Get log statistics
 */
exports.getLogStats = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code 
       FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (!['ADMIN', 'SUPER_ADMIN'].includes(currentUser[0]?.role_code)) {
      return res.status(403).json({
        error: true,
        message: "Access denied. Admin only."
      });
    }

    const { days = 7 } = req.query;

    // Total logs by type
    const [logsByType] = await db.query(`
      SELECT 
        log_type,
        COUNT(*) as count
      FROM system_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
      GROUP BY log_type
      ORDER BY count DESC
    `, { days: parseInt(days) });

    // Logs by severity
    const [logsBySeverity] = await db.query(`
      SELECT 
        severity,
        COUNT(*) as count
      FROM system_logs
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
      GROUP BY severity
      ORDER BY 
        FIELD(severity, 'critical', 'error', 'warning', 'info')
    `, { days: parseInt(days) });

    // Recent errors
    const [recentErrors] = await db.query(`
      SELECT 
        sl.*,
        u.name as user_name
      FROM system_logs sl
      LEFT JOIN user u ON sl.user_id = u.id
      WHERE sl.severity IN ('error', 'critical')
        AND sl.created_at >= DATE_SUB(NOW(), INTERVAL :days DAY)
      ORDER BY sl.created_at DESC
      LIMIT 10
    `, { days: parseInt(days) });

    // Login statistics
    const [loginStats] = await db.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM login_history
      WHERE login_time >= DATE_SUB(NOW(), INTERVAL :days DAY)
      GROUP BY status
    `, { days: parseInt(days) });

    // Active users
    const [activeUsers] = await db.query(`
      SELECT COUNT(DISTINCT user_id) as count
      FROM login_history
      WHERE login_time >= DATE_SUB(NOW(), INTERVAL :days DAY)
        AND status = 'success'
    `, { days: parseInt(days) });

    res.json({
      success: true,
      stats: {
        logs_by_type: logsByType,
        logs_by_severity: logsBySeverity,
        recent_errors: recentErrors,
        login_stats: loginStats,
        active_users: activeUsers[0]?.count || 0,
        period_days: parseInt(days)
      }
    });

  } catch (error) {
    console.error('❌ Error fetching log stats:', error);
    logError("systemLog.getLogStats", error, res);
  }
};

/**
 * ✅ Delete old logs (cleanup)
 */
exports.cleanupOldLogs = async (req, res) => {
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

    const { days = 90 } = req.body;

    // Delete old system logs
    const [systemLogsResult] = await db.query(`
      DELETE FROM system_logs
      WHERE created_at < DATE_SUB(NOW(), INTERVAL :days DAY)
    `, { days: parseInt(days) });

    // Delete old login history
    const [loginHistoryResult] = await db.query(`
      DELETE FROM login_history
      WHERE login_time < DATE_SUB(NOW(), INTERVAL :days DAY)
    `, { days: parseInt(days) });

    // Delete old activity logs
    const [activityLogsResult] = await db.query(`
      DELETE FROM user_activity_log
      WHERE created_at < DATE_SUB(NOW(), INTERVAL :days DAY)
    `, { days: parseInt(days) });

    const totalDeleted = 
      (systemLogsResult.affectedRows || 0) +
      (loginHistoryResult.affectedRows || 0) +
      (activityLogsResult.affectedRows || 0);

    console.log(`🧹 Cleaned up ${totalDeleted} old log records`);

    res.json({
      success: true,
      message: `Deleted logs older than ${days} days`,
      deleted: {
        system_logs: systemLogsResult.affectedRows || 0,
        login_history: loginHistoryResult.affectedRows || 0,
        activity_logs: activityLogsResult.affectedRows || 0,
        total: totalDeleted
      }
    });

  } catch (error) {
    console.error('❌ Error cleaning up logs:', error);
    logError("systemLog.cleanupOldLogs", error, res);
  }
};