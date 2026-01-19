const { db, logError } = require("../util/helper");
const dayjs = require('dayjs');

// ═══════════════════════════════════════════════════════════════
// CHECK IF USER IS SUPER ADMIN (role_id = 1)
// ═══════════════════════════════════════════════════════════════
const isSuperAdmin = async (userId) => {
  try {
    const [user] = await db.query(`
      SELECT role_id
      FROM user 
      WHERE id = ?
    `, [userId]);

    if (!user.length) return false;

    // ✅ Super Admin has role_id = 29 (from role table)
    return user[0].role_id === 29;

  } catch (error) {
    console.error('Error checking Super Admin status:', error);
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════
// CREATE SYSTEM NOTIFICATION
// ═══════════════════════════════════════════════════════════════


exports.createSystemNotification = async (notificationData) => {
  try {
    const {
      notification_type = 'info',
      title,
      message,
      data = null,
      order_id = null,
      order_no = null,
      customer_id = null,
      customer_name = null,
      customer_address = null,
      customer_tel = null,
      total_amount = null,
      total_liters = null,
      card_number = null,
      user_id = null,
      created_by = null,
      branch_name = null,
      group_id = null,
      priority = 'normal',
      severity = 'info',
      icon = '🔔',
      color = 'blue',
      action_url = null,
      expires_at = null
    } = notificationData;

    const sql = `
      INSERT INTO system_notifications (
        notification_type, title, message, data,
        order_id, order_no, customer_id, customer_name, customer_address, customer_tel,
        total_amount, total_liters, card_number,
        user_id, created_by, branch_name, group_id,
        priority, severity, icon, color, action_url, expires_at
      ) VALUES (
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )
    `;

    const [result] = await db.query(sql, [
      notification_type,
      title,
      message,
      data ? JSON.stringify(data) : null,
      order_id,
      order_no,
      customer_id,
      customer_name,
      customer_address,
      customer_tel,
      total_amount,
      total_liters,
      card_number,
      user_id,
      created_by,
      branch_name,
      group_id,
      priority,
      severity,
      icon,
      color,
      action_url,
      expires_at
    ]);

    return result.insertId;

  } catch (error) {
    console.error('❌ Failed to create system notification:', error);
    throw error;
  }
};
exports.getNotifications = async (req, res) => {
  try {
    const {
      limit = 100,
      offset = 0,
      branch_name,
      notification_type,
      priority,
      is_read,
      search,
      date_from,  // ✅ NEW
      date_to     // ✅ NEW
    } = req.query;

    // Check Super Admin
    const user = req.auth;
    const isSuperAdmin = user?.role_id === 29;

    // ✅ ALLOW ACCESS BUT FILTER BY BRANCH IF NOT SUPER ADMIN
    if (!isSuperAdmin) {
      // If not super admin, force branch filter
      if (user.branch_name) {
        branch_name = user.branch_name;
      } else {
        // Fallback checks or error if user has no branch
        // For now, if no branch, technically they see nothing or we error.
        // Let's assume they might be a regular user with no branch capability? 
        // But usually users have branches.
      }
    }



    let whereConditions = [];
    let params = [];

    if (date_from) {
      whereConditions.push('DATE(n.created_at) >= ?');
      params.push(date_from);
    }

    if (date_to) {
      whereConditions.push('DATE(n.created_at) <= ?');
      params.push(date_to);
    }

    // Branch filter
    if (branch_name && branch_name !== 'all') {
      whereConditions.push('n.branch_name = ?');
      params.push(branch_name);
    }

    // Type filter
    if (notification_type && notification_type !== 'all') {
      whereConditions.push('n.notification_type = ?');
      params.push(notification_type);
    }

    // Priority filter
    if (priority && priority !== 'all') {
      whereConditions.push('n.priority = ?');
      params.push(priority);
    }

    // Read status filter
    if (is_read === '0' || is_read === '1') {
      whereConditions.push('n.is_read = ?');
      params.push(parseInt(is_read));
    }

    // Search filter
    if (search) {
      whereConditions.push(`(
        n.title LIKE ? OR 
        n.message LIKE ? OR 
        n.customer_name LIKE ? OR 
        n.order_no LIKE ?
      )`);
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    // Main query
    const sql = `
      SELECT 
        n.*,
        DATE_FORMAT(n.created_at, '%Y-%m-%d %H:%i:%s') as formatted_date,
        CASE 
          WHEN TIMESTAMPDIFF(MINUTE, n.created_at, NOW()) < 1 THEN 'Just now'
          WHEN TIMESTAMPDIFF(MINUTE, n.created_at, NOW()) < 60 THEN CONCAT(TIMESTAMPDIFF(MINUTE, n.created_at, NOW()), ' min ago')
          WHEN TIMESTAMPDIFF(HOUR, n.created_at, NOW()) < 24 THEN CONCAT(TIMESTAMPDIFF(HOUR, n.created_at, NOW()), ' hours ago')
          WHEN TIMESTAMPDIFF(DAY, n.created_at, NOW()) < 7 THEN CONCAT(TIMESTAMPDIFF(DAY, n.created_at, NOW()), ' days ago')
          ELSE DATE_FORMAT(n.created_at, '%d/%m/%Y')
        END as time_ago
      FROM system_notifications n
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `;

    params.push(parseInt(limit), parseInt(offset));


    const [rows] = await db.query(sql, params);

    // Parse data field
    const notifications = rows.map(row => ({
      ...row,
      data: row.data ? JSON.parse(row.data) : null
    }));

    // Get available branches
    const [branchRows] = await db.query(`
      SELECT DISTINCT branch_name 
      FROM system_notifications 
      WHERE branch_name IS NOT NULL 
      ${date_from ? 'AND DATE(created_at) >= ?' : ''}
      ${date_to ? 'AND DATE(created_at) <= ?' : ''}
      ORDER BY branch_name
    `, date_from && date_to ? [date_from, date_to] : date_from ? [date_from] : date_to ? [date_to] : []);

    const available_branches = branchRows.map(row => row.branch_name);


    if (date_from || date_to) {

    }

    res.json({
      success: true,
      data: notifications,
      available_branches: available_branches,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: notifications.length
      },
      filters_applied: {
        branch_name: branch_name || 'all',
        notification_type: notification_type || 'all',
        priority: priority || 'all',
        is_read: is_read || 'all',
        search: search || null,
        date_from: date_from || null,  // ✅ NEW
        date_to: date_to || null        // ✅ NEW
      }
    });

  } catch (error) {
    console.error('❌ Error in getNotifications:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch notifications'
    });
  }
};

exports.getRecentNotifications = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const current_user_id = req.current_id;

    // ✅ CHECK USER ROLE & BRANCH
    const [currentUser] = await db.query("SELECT role_id, branch_name FROM user WHERE id = ?", [current_user_id]);

    if (!currentUser.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const { role_id, branch_name } = currentUser[0];
    const isSuper = role_id === 29;

    let sql = `
      SELECT 
        n.*,
        DATE_FORMAT(n.created_at, '%Y-%m-%d %H:%i:%s') as formatted_date,
        CASE
          WHEN TIMESTAMPDIFF(MINUTE, n.created_at, NOW()) < 1 THEN 'Just now'
          WHEN TIMESTAMPDIFF(MINUTE, n.created_at, NOW()) < 60 THEN CONCAT(TIMESTAMPDIFF(MINUTE, n.created_at, NOW()), ' min ago')
          WHEN TIMESTAMPDIFF(HOUR, n.created_at, NOW()) < 24 THEN CONCAT(TIMESTAMPDIFF(HOUR, n.created_at, NOW()), ' hours ago')
          ELSE DATE_FORMAT(n.created_at, '%d-%m-%Y')
        END as time_ago
      FROM system_notifications n
      WHERE 1=1
    `;

    const params = [];

    // ✅ FILTER FOR NON-SUPER ADMIN
    if (!isSuper) {
      sql += ` AND (n.branch_name = ? OR n.branch_name IS NULL OR n.user_id = ?)`;
      // Logic: Show branch notifications, global ones (null branch - valid?), or personal ones
      // Actually simpler: just branch match if it exists
      // Let's stick to branch_name match for now based on auth controller logic
      // AND n.branch_name = ? 
      params.push(branch_name);
      // We might want to include notifications specifically for them (user_id) too?
      params.push(current_user_id);
    }

    sql += ` ORDER BY n.created_at DESC LIMIT ? `;
    params.push(parseInt(limit));

    const [notifications] = await db.query(sql, isSuper ? [parseInt(limit)] : [branch_name, current_user_id, parseInt(limit)]);

    const parsedNotifications = notifications.map(notif => ({
      ...notif,
      data: notif.data ? JSON.parse(notif.data) : null
    }));

    res.json({
      success: true,
      data: parsedNotifications,
      is_super_admin: true
    });

  } catch (error) {
    console.error('❌ Error getting recent notifications:', error);
    logError("notification.getRecentNotifications", error, res);
  }
};

// ═══════════════════════════════════════════════════════════════
// GET NOTIFICATION ANALYTICS (Super Admin sees ALL)
// ═══════════════════════════════════════════════════════════════
exports.getNotificationAnalytics = async (req, res) => {
  try {
    const {
      from_date = dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
      to_date = dayjs().format('YYYY-MM-DD'),
      branch_name = null
    } = req.query;

    const current_user_id = req.current_id;

    if (!current_user_id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    // ✅ CHECK IF SUPER ADMIN
    const isSuper = await isSuperAdmin(current_user_id);

    if (!isSuper) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super Admin only."
      });
    }

    // ✅✅✅ NO GROUP FILTER - Super Admin sees ALL ✅✅✅
    let branchFilter = '';
    const baseParams = [from_date, to_date];

    if (branch_name && branch_name !== 'all') {
      branchFilter = ' AND n.branch_name = ?';
    }

    // Branch Statistics
    let branchStatsSql = `
      SELECT 
        COALESCE(n.branch_name, 'No Branch') as branch_name,
        COUNT(*) as total_notifications,
        SUM(CASE WHEN n.is_read = 0 THEN 1 ELSE 0 END) as unread_count,
        SUM(CASE WHEN n.notification_type = 'order_created' THEN 1 ELSE 0 END) as order_count,
        SUM(CASE WHEN n.notification_type = 'payment_received' THEN 1 ELSE 0 END) as payment_count,
        SUM(COALESCE(n.total_amount, 0)) as total_amount,
        MAX(n.created_at) as last_notification
      FROM system_notifications n
      WHERE DATE(n.created_at) BETWEEN DATE(?) AND DATE(?)
    `;

    branchStatsSql += branchFilter;
    branchStatsSql += ` GROUP BY n.branch_name ORDER BY total_notifications DESC`;

    const branchStatsParams = branch_name && branch_name !== 'all'
      ? [...baseParams, branch_name]
      : baseParams;

    const [branchStats] = await db.query(branchStatsSql, branchStatsParams);

    // Creator Statistics
    let creatorStatsSql = `
      SELECT 
        COALESCE(n.created_by, 'System') as created_by,
        n.branch_name,
        COUNT(*) as notification_count,
        MAX(n.created_at) as last_created,
        SUM(CASE WHEN n.is_read = 0 THEN 1 ELSE 0 END) as unread_count
      FROM system_notifications n
      WHERE DATE(n.created_at) BETWEEN DATE(?) AND DATE(?)
    `;

    creatorStatsSql += branchFilter;
    creatorStatsSql += ` GROUP BY n.created_by, n.branch_name ORDER BY notification_count DESC LIMIT 20`;

    const [creatorStats] = await db.query(creatorStatsSql, branchStatsParams);

    // Type Statistics
    let typeStatsSql = `
      SELECT 
        notification_type,
        COUNT(*) as count,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_count
      FROM system_notifications
      WHERE DATE(created_at) BETWEEN DATE(?) AND DATE(?)
    `;

    typeStatsSql += branchFilter.replace('n.', '');
    typeStatsSql += ` GROUP BY notification_type ORDER BY count DESC`;

    const [typeStats] = await db.query(typeStatsSql, branchStatsParams);

    // Timeline
    let timelineSql = `
      SELECT 
        id, title, notification_type, branch_name, created_by, is_read, created_at
      FROM system_notifications
      WHERE DATE(created_at) BETWEEN DATE(?) AND DATE(?)
    `;

    timelineSql += branchFilter;
    timelineSql += ` ORDER BY created_at DESC LIMIT 50`;

    const [timeline] = await db.query(timelineSql, branchStatsParams);

    // Get available branches (ALL branches)
    let branchListSql = `
      SELECT DISTINCT branch_name 
      FROM system_notifications 
      WHERE branch_name IS NOT NULL AND branch_name != ''
      ORDER BY branch_name ASC
    `;

    const [branches] = await db.query(branchListSql);
    const availableBranches = branches.map(b => b.branch_name);

    res.json({
      success: true,
      branch_stats: branchStats,
      creator_stats: creatorStats,
      type_stats: typeStats,
      timeline: timeline,
      date_range: {
        from: from_date,
        to: to_date
      },
      is_super_admin: true,
      available_branches: availableBranches,
      current_branch_filter: branch_name || 'all'
    });

  } catch (error) {
    console.error('❌ Error getting analytics:', error);
    logError("notification.getNotificationAnalytics", error, res);
  }
};

// ═══════════════════════════════════════════════════════════════
// GET NOTIFICATION STATISTICS (Super Admin sees ALL)
// ═══════════════════════════════════════════════════════════════
exports.getNotificationStats = async (req, res) => {
  try {
    const {
      date_from,  // ✅ NEW
      date_to     // ✅ NEW
    } = req.query;

    // Check Super Admin
    const user = req.auth;
    const isSuperAdmin = user?.role_id === 1;

    if (!isSuperAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied. Super Admin only.'
      });
    }



    // Build WHERE clause for date range
    let whereConditions = [];
    let params = [];

    if (date_from) {
      whereConditions.push('DATE(created_at) >= ?');
      params.push(date_from);
    }

    if (date_to) {
      whereConditions.push('DATE(created_at) <= ?');
      params.push(date_to);
    }

    const whereClause = whereConditions.length > 0
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread,
        SUM(CASE WHEN notification_type = 'order_created' THEN 1 ELSE 0 END) as orders,
        SUM(CASE WHEN notification_type = 'payment_received' THEN 1 ELSE 0 END) as payments,
        SUM(CASE WHEN notification_type = 'login_alert' THEN 1 ELSE 0 END) as logins,
        SUM(CASE WHEN notification_type = 'customer_created' THEN 1 ELSE 0 END) as customers,
        SUM(CASE WHEN notification_type = 'stock_update' THEN 1 ELSE 0 END) as stock_updates
      FROM system_notifications
      ${whereClause}
    `, params);


    if (date_from || date_to) {
    }

    res.json({
      success: true,
      stats: stats[0],
      date_range: {
        from: date_from || null,
        to: date_to || null
      }
    });

  } catch (error) {
    console.error('❌ Error in getStats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch stats'
    });
  }
};
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const current_user_id = req.current_id;

    const isSuper = await isSuperAdmin(current_user_id);

    if (!isSuper) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super Admin only."
      });
    }

    const [notification] = await db.query(`
      SELECT id, read_by, group_id
      FROM system_notifications
      WHERE id = ?
    `, [id]);

    if (!notification.length) {
      return res.status(404).json({
        success: false,
        message: "Notification not found"
      });
    }

    let readBy = notification[0].read_by ? JSON.parse(notification[0].read_by) : [];
    if (!readBy.includes(current_user_id)) {
      readBy.push(current_user_id);
    }

    await db.query(`
      UPDATE system_notifications
      SET is_read = 1,
          read_by = ?,
          read_at = NOW()
      WHERE id = ?
    `, [JSON.stringify(readBy), id]);

    res.json({
      success: true,
      message: "Notification marked as read"
    });

  } catch (error) {
    console.error('❌ Error marking notification as read:', error);
    logError("notification.markAsRead", error, res);
  }
};

// ═══════════════════════════════════════════════════════════════
// MARK ALL AS READ (Super Admin Only!)
// ═══════════════════════════════════════════════════════════════
exports.markAllAsRead = async (req, res) => {
  try {
    const current_user_id = req.current_id;

    const isSuper = await isSuperAdmin(current_user_id);

    if (!isSuper) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super Admin only."
      });
    }

    const [currentUser] = await db.query(`
      SELECT group_id FROM user WHERE id = ?
    `, [current_user_id]);

    let sql = `
      UPDATE system_notifications
      SET is_read = 1, read_at = NOW()
      WHERE is_read = 0
    `;

    const params = [];

    if (currentUser[0].group_id) {
      sql += ` AND group_id = ?`;
      params.push(currentUser[0].group_id);
    }

    await db.query(sql, params);

    res.json({
      success: true,
      message: "All notifications marked as read"
    });

  } catch (error) {
    console.error('❌ Error marking all as read:', error);
    logError("notification.markAllAsRead", error, res);
  }
};

// ═══════════════════════════════════════════════════════════════
// DELETE NOTIFICATION (Super Admin Only!)
// ═══════════════════════════════════════════════════════════════
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const current_user_id = req.current_id;

    const isSuper = await isSuperAdmin(current_user_id);

    if (!isSuper) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Super Admin only."
      });
    }

    await db.query(`DELETE FROM system_notifications WHERE id = ?`, [id]);

    res.json({
      success: true,
      message: "Notification deleted successfully"
    });

  } catch (error) {
    console.error('❌ Error deleting notification:', error);
    logError("notification.deleteNotification", error, res);
  }
};

// // ═══════════════════════════════════════════════════════════════
// // GET NOTIFICATION STATISTICS (Super Admin Only!)
// // ═══════════════════════════════════════════════════════════════
// exports.getNotificationStats = async (req, res) => {
//   try {
//     const current_user_id = req.current_id;
//     const { branch_name = null } = req.query;

//     const isSuper = await isSuperAdmin(current_user_id);

//     if (!isSuper) {
//       return res.status(403).json({
//         success: false,
//         message: "Access denied. Super Admin only."
//       });
//     }

//     const [currentUser] = await db.query(`
//       SELECT group_id FROM user WHERE id = ?
//     `, [current_user_id]);

//     let sql = `
//       SELECT 
//         COUNT(*) as total,
//         SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread,
//         SUM(CASE WHEN is_read = 1 THEN 1 ELSE 0 END) as \`read\`,
//         SUM(CASE WHEN priority = 'critical' THEN 1 ELSE 0 END) as critical,
//         SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high,
//         SUM(CASE WHEN notification_type = 'order_created' THEN 1 ELSE 0 END) as orders,
//         SUM(CASE WHEN notification_type = 'payment_received' THEN 1 ELSE 0 END) as payments
//       FROM system_notifications
//       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
//     `;

//     const params = [];

//     if (currentUser[0].group_id) {
//       sql += ` AND group_id = ?`;
//       params.push(currentUser[0].group_id);
//     }

//     if (branch_name && branch_name !== 'all') {
//       sql += ` AND branch_name = ?`;
//       params.push(branch_name);
//     }

//     const [stats] = await db.query(sql, params);

//     res.json({
//       success: true,
//       stats: stats[0],
//       is_super_admin: true,
//       current_branch_filter: branch_name || 'all'
//     });

//   } catch (error) {
//     console.error('❌ Error getting notification stats:', error);
//     logError("notification.getNotificationStats", error, res);
//   }
// };
exports.getBranchComparison = async (req, res) => {
  try {
    const {
      branch1,
      branch2,
      from_date = dayjs().subtract(30, 'days').format('YYYY-MM-DD'),
      to_date = dayjs().format('YYYY-MM-DD')
    } = req.query;

    const current_user_id = req.current_id;

    const [currentUser] = await db.query(`
      SELECT group_id FROM user WHERE id = ?
    `, [current_user_id]);

    const userGroupId = currentUser[0].group_id;

    const [comparison] = await db.query(`
      SELECT 
        branch_name,
        COUNT(*) as total_notifications,
        SUM(CASE WHEN is_read = 0 THEN 1 ELSE 0 END) as unread_count,
        SUM(CASE WHEN notification_type = 'order_created' THEN 1 ELSE 0 END) as order_count,
        SUM(CASE WHEN notification_type = 'payment_received' THEN 1 ELSE 0 END) as payment_count,
        SUM(COALESCE(total_amount, 0)) as total_amount,
        SUM(COALESCE(total_liters, 0)) as total_liters,
        AVG(COALESCE(total_amount, 0)) as avg_amount
      FROM system_notifications
      WHERE group_id = ?
        AND branch_name IN (?, ?)
        AND DATE(created_at) BETWEEN DATE(?) AND DATE(?)
      GROUP BY branch_name
    `, [userGroupId, branch1, branch2, from_date, to_date]);

    res.json({
      success: true,
      comparison: comparison,
      date_range: {
        from: from_date,
        to: to_date
      }
    });

  } catch (error) {
    console.error('❌ Error getting branch comparison:', error);
    logError("notification.getBranchComparison", error, res);
  }
};
exports.getTopPerformers = async (req, res) => {
  try {
    const {
      metric = 'total_amount',
      period = 'month',
      limit = 10
    } = req.query;

    const current_user_id = req.current_id;

    const [currentUser] = await db.query(`
      SELECT group_id FROM user WHERE id = ?
    `, [current_user_id]);

    const userGroupId = currentUser[0].group_id;

    let dateFrom;
    switch (period) {
      case 'week':
        dateFrom = dayjs().subtract(7, 'days').format('YYYY-MM-DD');
        break;
      case 'month':
        dateFrom = dayjs().subtract(30, 'days').format('YYYY-MM-DD');
        break;
      case 'year':
        dateFrom = dayjs().subtract(365, 'days').format('YYYY-MM-DD');
        break;
      default:
        dateFrom = dayjs().subtract(30, 'days').format('YYYY-MM-DD');
    }

    // Determine ORDER BY clause based on metric
    let orderByClause;
    if (metric === 'notification_count') {
      orderByClause = 'notification_count DESC';
    } else if (metric === 'order_count') {
      orderByClause = 'order_count DESC';
    } else {
      orderByClause = 'total_amount DESC';
    }

    // Top Branches
    const [topBranches] = await db.query(`
      SELECT 
        branch_name,
        COUNT(*) as notification_count,
        SUM(CASE WHEN notification_type = 'order_created' THEN 1 ELSE 0 END) as order_count,
        SUM(COALESCE(total_amount, 0)) as total_amount
      FROM system_notifications
      WHERE group_id = ?
        AND DATE(created_at) >= DATE(?)
        AND branch_name IS NOT NULL
      GROUP BY branch_name
      ORDER BY ${orderByClause}
      LIMIT ?
    `, [userGroupId, dateFrom, parseInt(limit)]);

    // Top Creators
    const [topCreators] = await db.query(`
      SELECT 
        created_by,
        branch_name,
        COUNT(*) as notification_count,
        SUM(CASE WHEN notification_type = 'order_created' THEN 1 ELSE 0 END) as order_count,
        SUM(COALESCE(total_amount, 0)) as total_amount
      FROM system_notifications
      WHERE group_id = ?
        AND DATE(created_at) >= DATE(?)
        AND created_by IS NOT NULL
      GROUP BY created_by, branch_name
      ORDER BY ${orderByClause}
      LIMIT ?
    `, [userGroupId, dateFrom, parseInt(limit)]);

    res.json({
      success: true,
      top_branches: topBranches,
      top_creators: topCreators,
      metric: metric,
      period: period,
      date_from: dateFrom
    });

  } catch (error) {
    console.error('❌ Error getting top performers:', error);
    logError("notification.getTopPerformers", error, res);
  }
};