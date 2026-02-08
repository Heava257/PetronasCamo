const { db, sendTelegramMessagenewLogin, sendTelegramMessage } = require("../util/helper");
const { logError } = require("../util/logError");

exports.notifyInactiveAdmins = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { admin_ids, message_text } = req.body;

    // Validation
    if (!admin_ids || !Array.isArray(admin_ids) || admin_ids.length === 0) {
      return res.status(400).json({
        error: true,
        message: "Admin IDs are required",
        message_kh: "ត្រូវការ Admin IDs"
      });
    }

    if (!message_text || message_text.trim() === "") {
      return res.status(400).json({
        error: true,
        message: "Message text is required",
        message_kh: "ត្រូវការសារជូនដំណឹង"
      });
    }

    // ពិនិត្យថាជា Super Admin ទេ
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code, u.name, u.username, u.branch_name, u.role_id
       FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    const userRole = currentUser[0]?.role_code;
    const userBranch = currentUser[0]?.branch_name;
    const isSuperAdmin = currentUser[0]?.role_id === 29;

    // Allow Admin (Branch Admin) and Super Admin
    if (!isSuperAdmin && userRole !== 'ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Access denied. Admin only.",
        message_kh: "បដិសេធការចូលប្រើ។ សម្រាប់ Admin តែប៉ុណ្ណោះ"
      });
    }

    // Identify valid recipients based on branch
    let validRecipientIds = admin_ids;

    if (!isSuperAdmin) {
      if (!userBranch) {
        return res.status(403).json({
          error: true,
          message: "Your account is not assigned to a branch"
        });
      }

      // Verify that all recipients belong to the same branch
      const [recipients] = await db.query(`
        SELECT id FROM user 
        WHERE id IN (?) AND branch_name = ?
      `, [admin_ids, userBranch]);

      validRecipientIds = recipients.map(r => r.id);

      if (validRecipientIds.length === 0) {
        return res.status(400).json({
          error: true,
          message: "No valid recipients found in your branch",
          message_kh: "មិនមានអ្នកទទួលនៅក្នុងសាខារបស់អ្នកទេ"
        });
      }
    }

    // បញ្ចូល notifications ក្នុង database
    const notificationPromises = validRecipientIds.map(async (adminId) => {
      return db.query(`
        INSERT INTO notifications (
          sender_id,
          receiver_id,
          message,
          type,
          is_read,
          created_at
        ) VALUES (
          :sender_id,
          :receiver_id,
          :message,
          'admin_notification',
          0,
          NOW()
        )
      `, {
        sender_id: currentUserId,
        receiver_id: adminId,
        message: message_text
      });
    });

    await Promise.all(notificationPromises);

    // Log activity
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
          'NOTIFICATION_SENT',
          :description,
          :ip_address,
          :user_agent,
          NOW(),
          :created_by
        )
      `, {
        user_id: currentUserId,
        description: `Sent notifications to ${admin_ids.length} admins: "${message_text.substring(0, 50)}..."`,
        ip_address: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'Unknown',
        user_agent: req.get('User-Agent') || 'Unknown',
        created_by: currentUserId
      });
    } catch (logErr) {
      console.error("Failed to log notification:", logErr);
    }

    // Telegram notification
    const alertMessage = `
📧 <b>ការជូនដំណឹងត្រូវបានផ្ញើ / Notification Sent</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━

👨‍💼 <b>ផ្ញើដោយ / Sent By:</b>
${currentUser[0]?.name} (${currentUser[0]?.username})

📬 <b>ចំនួនអ្នកទទួល / Recipients:</b> ${admin_ids.length} Admins

💬 <b>សារ / Message:</b>
"${message_text.substring(0, 100)}${message_text.length > 100 ? '...' : ''}"

⏰ <b>Time:</b> ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })}
    `;

    sendTelegramMessagenewLogin(alertMessage).catch(err => {
      console.error("Failed to send Telegram alert:", err.message);
    });
    await logger.logNotification(req, admin_ids.length, message_text);

    res.json({
      success: true,
      message: "Notifications sent successfully",
      message_kh: "ផ្ញើការជូនដំណឹងបានជោគជ័យ",
      notified_count: admin_ids.length
    });

  } catch (error) {
    console.error('❌ Error in notifyInactiveAdmins:', error);
    logError("admin.notifyInactiveAdmins", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to send notifications",
      message_kh: "មិនអាចផ្ញើការជូនដំណឹងបានទេ"
    });
  }
};

exports.getMyNotifications = async (req, res) => {
  try {
    const currentUserId = req.current_id;


    const { unread_only = false, limit = 50 } = req.query;

    let query = `
      SELECT 
        n.id,
        n.message,
        n.type,
        n.is_read,
        n.read_at,
        n.created_at,
        n.reply_to_id,
        n.auto_delete_at,
        u.id AS sender_id,
        u.name AS sender_name,
        u.username AS sender_username,
        u.profile_image AS sender_image,
        CASE 
          WHEN n.auto_delete_at IS NOT NULL 
          THEN TIMESTAMPDIFF(SECOND, NOW(), n.auto_delete_at)
          ELSE NULL
        END AS seconds_until_delete
      FROM notifications n
      INNER JOIN user u ON n.sender_id = u.id
      WHERE n.receiver_id = :user_id
    `;

    if (unread_only === 'true') {
      query += ` AND n.is_read = 0`;
    }

    query += `
      ORDER BY n.created_at DESC
      LIMIT :limit
    `;

    const [notifications] = await db.query(query, {
      user_id: currentUserId,
      limit: parseInt(limit)
    });


    const [unreadCount] = await db.query(`
      SELECT COUNT(*) AS count
      FROM notifications
      WHERE receiver_id = :user_id AND is_read = 0
    `, { user_id: currentUserId });

    res.json({
      success: true,
      notifications: notifications,
      unread_count: unreadCount[0]?.count || 0,
      total_count: notifications.length
    });

  } catch (error) {
    console.error('❌ Error in getMyNotifications:', error);
    logError("notification.getMyNotifications", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to retrieve notifications",
      message_kh: "មិនអាចទាញបញ្ជីការជូនដំណឹងបានទេ"
    });
  }
};

/**
 * ចំនួន notifications ដែលមិនទាន់អាន
 * Get unread notification count
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const currentUserId = req.current_id;

    const [result] = await db.query(`
      SELECT COUNT(*) AS count
      FROM notifications
      WHERE receiver_id = :user_id AND is_read = 0
    `, { user_id: currentUserId });

    res.json({
      success: true,
      unread_count: result[0]?.count || 0
    });

  } catch (error) {
    console.error('❌ Error in getUnreadCount:', error);
    return res.status(500).json({
      error: true,
      message: "Failed to get unread count"
    });
  }
};

/**
 * សម្គាល់ notification ថាបានអាន
 * Mark notification as read
 * ✅ បន្ថែម: Auto-delete after 5 minutes
 */
exports.markAsRead = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { notification_id } = req.body;

    if (!notification_id) {
      return res.status(400).json({
        error: true,
        message: "Notification ID is required"
      });
    }

    // ពិនិត្យថា notification នេះជារបស់អ្នកប្រើប្រាស់នេះ
    const [notification] = await db.query(`
      SELECT id, is_read FROM notifications
      WHERE id = :notification_id AND receiver_id = :user_id
    `, {
      notification_id,
      user_id: currentUserId
    });

    if (notification.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Notification not found"
      });
    }

    // ✅ Update notification & set auto-delete timer (5 minutes)
    await db.query(`
      UPDATE notifications
      SET is_read = 1,
          read_at = NOW(),
          auto_delete_at = DATE_ADD(NOW(), INTERVAL 5 MINUTE)
      WHERE id = :notification_id
    `, { notification_id });


    res.json({
      success: true,
      message: "Notification marked as read",
      auto_delete_in: 300, // 5 minutes in seconds
      auto_delete_at: new Date(Date.now() + 300000).toISOString()
    });

  } catch (error) {
    console.error('❌ Error in markAsRead:', error);
    logError("notification.markAsRead", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to mark notification as read"
    });
  }
};

/**
 * សម្គាល់ទាំងអស់ថាបានអាន
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const currentUserId = req.current_id;

    const [result] = await db.query(`
      UPDATE notifications
      SET is_read = 1,
          read_at = NOW(),
          auto_delete_at = DATE_ADD(NOW(), INTERVAL 5 MINUTE)
      WHERE receiver_id = :user_id AND is_read = 0
    `, { user_id: currentUserId });


    res.json({
      success: true,
      message: "All notifications marked as read",
      updated_count: result.affectedRows,
      auto_delete_in: 300
    });

  } catch (error) {
    console.error('❌ Error in markAllAsRead:', error);
    logError("notification.markAllAsRead", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to mark all as read"
    });
  }
};

/**
 * លុបការជូនដំណឹង
 * Delete notification
 */
exports.deleteNotification = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { notification_id } = req.params;

    // ពិនិត្យថា notification នេះជារបស់អ្នកប្រើប្រាស់នេះ
    const [notification] = await db.query(`
      SELECT id FROM notifications
      WHERE id = :notification_id AND receiver_id = :user_id
    `, {
      notification_id,
      user_id: currentUserId
    });

    if (notification.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Notification not found"
      });
    }

    await db.query(`
      DELETE FROM notifications
      WHERE id = :notification_id
    `, { notification_id });


    res.json({
      success: true,
      message: "Notification deleted successfully"
    });

  } catch (error) {
    console.error('❌ Error in deleteNotification:', error);
    logError("notification.deleteNotification", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to delete notification"
    });
  }
};

/**
 * ✅ ឆ្លើយតបទៅការជូនដំណឹង
 * Reply to notification
 */
exports.replyToNotification = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { notification_id, reply_message } = req.body;

    // Validation
    if (!notification_id) {
      return res.status(400).json({
        error: true,
        message: "Notification ID is required",
        message_kh: "ត្រូវការ Notification ID"
      });
    }

    if (!reply_message || reply_message.trim() === "") {
      return res.status(400).json({
        error: true,
        message: "Reply message is required",
        message_kh: "ត្រូវការសារឆ្លើយតប"
      });
    }

    // ទាញព័ត៌មាន notification ដើម និងពិនិត្យសិទ្ធិ
    const [originalNotif] = await db.query(`
      SELECT 
        n.id,
        n.sender_id,
        n.message,
        n.type,
        u.name AS sender_name,
        u.username AS sender_username
      FROM notifications n
      INNER JOIN user u ON n.sender_id = u.id
      WHERE n.id = :notification_id AND n.receiver_id = :user_id
    `, {
      notification_id,
      user_id: currentUserId
    });

    if (originalNotif.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Notification not found or you don't have permission",
        message_kh: "មិនមានការជូនដំណឹងនេះ ឬអ្នកមិនមានសិទ្ធិ"
      });
    }

    const originalSenderId = originalNotif[0].sender_id;
    const originalMessage = originalNotif[0].message;

    // ទាញព័ត៌មានអ្នកឆ្លើយតប
    const [currentUserInfo] = await db.query(`
      SELECT id, name, username FROM user WHERE id = :user_id
    `, { user_id: currentUserId });

    // ✅ ផ្ញើការឆ្លើយតបទៅអ្នកផ្ញើដើម
    const [insertResult] = await db.query(`
      INSERT INTO notifications (
        sender_id,
        receiver_id,
        message,
        type,
        reply_to_id,
        is_read,
        created_at
      ) VALUES (
        :sender_id,
        :receiver_id,
        :message,
        'reply',
        :reply_to_id,
        0,
        NOW()
      )
    `, {
      sender_id: currentUserId,
      receiver_id: originalSenderId,
      message: reply_message,
      reply_to_id: notification_id
    });

    const newNotificationId = insertResult.insertId;

    // ✅ សម្គាល់ notification ដើមថាបានអាន & set auto-delete
    await db.query(`
      UPDATE notifications
      SET is_read = 1,
          read_at = NOW(),
          auto_delete_at = DATE_ADD(NOW(), INTERVAL 5 MINUTE)
      WHERE id = :notification_id
    `, { notification_id });

    // Log activity
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
          'NOTIFICATION_REPLY',
          :description,
          NOW(),
          :created_by
        )
      `, {
        user_id: currentUserId,
        description: `Replied to notification ${notification_id} from ${originalNotif[0].sender_name}`,
        created_by: currentUserId
      });
    } catch (logErr) {
      console.error("Failed to log reply:", logErr);
    }


    res.json({
      success: true,
      message: "Reply sent successfully",
      message_kh: "ផ្ញើការឆ្លើយតបបានជោគជ័យ",
      data: {
        new_notification_id: newNotificationId,
        original_notification_id: notification_id,
        reply_message: reply_message,
        sent_to: {
          id: originalSenderId,
          name: originalNotif[0].sender_name
        }
      }
    });

  } catch (error) {
    console.error('❌ Error in replyToNotification:', error);
    logError("notification.replyToNotification", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to send reply",
      message_kh: "មិនអាចផ្ញើការឆ្លើយតបបានទេ",
      details: error.message
    });
  }
};

/**
 * ✅ Cron job: លុប notifications ដែលហួសពេល auto-delete
 * Auto-delete expired notifications (Run every minute)
 */
exports.cleanupExpiredNotifications = async () => {
  try {

    // លុប notifications ដែលហួសពេល auto-delete
    const [result] = await db.query(`
      DELETE FROM notifications
      WHERE auto_delete_at IS NOT NULL
        AND auto_delete_at <= NOW()
    `);

    const deletedCount = result.affectedRows || 0;

    if (deletedCount > 0) {

      // Log cleanup activity
      try {
        await db.query(`
          INSERT INTO system_logs (
            action_type,
            description,
            created_at
          ) VALUES (
            'NOTIFICATION_CLEANUP',
            :description,
            NOW()
          )
        `, {
          description: `Auto-deleted ${deletedCount} expired notifications`
        });
      } catch (logErr) {
        console.error("Failed to log cleanup:", logErr);
      }
    } else {
    }

    return {
      success: true,
      deleted_count: deletedCount,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error cleaning up expired notifications:', error);

    // Log error
    try {
      await db.query(`
        INSERT INTO system_logs (
          action_type,
          description,
          error_message,
          created_at
        ) VALUES (
          'NOTIFICATION_CLEANUP_ERROR',
          'Failed to cleanup expired notifications',
          :error,
          NOW()
        )
      `, {
        error: error.message
      });
    } catch (logErr) {
      console.error("Failed to log cleanup error:", logErr);
    }

    return {
      success: false,
      error: error.message,
      deleted_count: 0
    };
  }
};

/**
 * ✅ Endpoint សម្រាប់ manual trigger cleanup (Admin only)
 * Manually trigger notification cleanup
 */
exports.manualCleanup = async (req, res) => {
  try {
    const currentUserId = req.current_id;

    // ពិនិត្យថាជា Admin/Super Admin
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

    // Run cleanup
    const result = await exports.cleanupExpiredNotifications();

    res.json({
      success: result.success,
      message: result.success
        ? `Successfully deleted ${result.deleted_count} expired notifications`
        : "Cleanup failed",
      ...result
    });

  } catch (error) {
    console.error('❌ Error in manualCleanup:', error);
    return res.status(500).json({
      error: true,
      message: "Failed to run cleanup"
    });
  }
};



// notification.controller.js
exports.sendDeliveryNotification = async (orderId, status, driverId) => {
  try {
    // 1. Get order details
    const [order] = await db.query(`
      SELECT o.*, c.name as customer_name, c.tel as customer_phone, 
             u.name as created_by_name, u.branch_id, u.branch_name
      FROM \`order\` o
      LEFT JOIN customer c ON o.customer_id = c.id
      LEFT JOIN user u ON o.user_id = u.id
      WHERE o.id = ?
    `, [orderId]);

    if (!order.length) return;

    const orderData = order[0];
    const order_no = orderData.order_no;
    const customer_name = orderData.customer_name;

    // 2. Create notification message
    const messages = {
      'arrived': `🚚 អ្នកដឹកបានមកដល់ទីតាំង ${customer_name} (${order_no})`,
      'delivered': `✅ បានដឹកជញ្ជូនរួចរាល់ទៅ ${customer_name} (${order_no})`,
      'on_road': `🛵 កំពុងដឹកជញ្ជូនទៅកាន់ ${customer_name} (${order_no})`
    };

    const message = messages[status] || `Status updated: ${status} `;

    // 3. Save to database
    await db.query(`
      INSERT INTO notifications
      (user_id, title, message, type, data, is_read, created_at)
    VALUES(?, ?, ?, ?, ?, 0, NOW())
    `, [
      orderData.user_id, // អ្នកគ្រប់គ្រង
      `Delivery Update - ${order_no} `,
      message,
      'delivery',
      JSON.stringify({ order_id: orderId, status }),
    ]);

    // 4. Send Telegram/SMS (optional)
    if (process.env.TELEGRAM_BOT_TOKEN) {
      const telegramMessage = `
📦 * DELIVERY UPDATE *
      Order: ${order_no}
    Customer: ${customer_name}
    Status: ${status.toUpperCase()}
    Time: ${new Date().toLocaleString()}
    `;

      // Use sendSmartNotification if possible for branch-specific routing
      await sendTelegramMessage(telegramMessage);
    }

    // 5. Send SMS to customer (optional)
    if (orderData.customer_phone && ['arrived', 'delivered'].includes(status)) {
      const smsMessage = `អ្នកដឹកបាន${status === 'arrived' ? 'មកដល់' : 'បញ្ចប់ការដឹក'} លេខកម្មង់ ${order_no} `;
      await sendSMS(orderData.customer_phone, smsMessage);
    }

  } catch (error) {
    console.error('Notification error:', error);
  }
};