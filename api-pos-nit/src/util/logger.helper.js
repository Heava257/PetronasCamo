
exports.log = async (logType, action, req, additionalData = {}) => {
  try {
    const userAgent = req?.get('User-Agent') || 'Unknown';
    const clientIP = req?.ip ||
      req?.headers['x-forwarded-for']?.split(',')[0] ||
      'Unknown';

    const deviceInfo = parseUserAgent(userAgent);
    const locationInfo = await getLocationFromIP(clientIP);

    const sql = `
      INSERT INTO system_logs (
        log_type, user_id, username, action, description,
        ip_address, user_agent, device_info, location_info,
        severity, status, created_at
      ) VALUES (
        :log_type, :user_id, :username, :action, :description,
        :ip_address, :user_agent, :device_info, :location_info,
        :severity, :status, NOW()
      )
    `;

    await db.query(sql, {
      log_type: logType,
      user_id: additionalData.user_id || req?.current_id || null,
      username: additionalData.username || req?.auth?.username || null,
      action: action,
      description: additionalData.description || null,
      ip_address: clientIP,
      user_agent: userAgent,
      device_info: JSON.stringify(deviceInfo),
      location_info: JSON.stringify(locationInfo),
      severity: additionalData.severity || 'info',
      status: additionalData.status || 'success'
    });

    return true;
  } catch (error) {
    console.error('❌ Error creating log:', error);
    return false;
  }
};

/**
 * ✅ Log user login
 */
exports.logLogin = async (req, user, status = 'success') => {
  try {
    const userAgent = req.get('User-Agent') || 'Unknown';
    const clientIP = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'Unknown';
    const deviceInfo = parseUserAgent(userAgent);
    const locationInfo = await getLocationFromIP(clientIP);

    // Log to login_history
    await db.query(`
      INSERT INTO login_history (
        user_id, username, ip_address, user_agent,
        device_info, location_info, login_time, status
      ) VALUES (
        :user_id, :username, :ip_address, :user_agent,
        :device_info, :location_info, NOW(), :status
      )
    `, {
      user_id: user.id,
      username: user.username,
      ip_address: clientIP,
      user_agent: userAgent,
      device_info: JSON.stringify(deviceInfo),
      location_info: JSON.stringify(locationInfo),
      status: status
    });

    // Also log to system_logs
    await exports.log('LOGIN', `User ${user.username} logged in`, req, {
      user_id: user.id,
      username: user.username,
      status: status,
      severity: status === 'success' ? 'info' : 'warning'
    });

    return true;
  } catch (error) {
    console.error('❌ Error logging login:', error);
    return false;
  }
};

/**
 * ✅ Log user logout
 */
exports.logLogout = async (req) => {
  try {
    await exports.log('LOGOUT', `User logged out`, req, {
      user_id: req.current_id,
      username: req.auth?.username,
      status: 'success'
    });

    // Update logout_time in login_history
    await db.query(`
      UPDATE login_history 
      SET logout_time = NOW()
      WHERE user_id = :user_id 
        AND logout_time IS NULL
      ORDER BY login_time DESC
      LIMIT 1
    `, {
      user_id: req.current_id
    });

    return true;
  } catch (error) {
    console.error('❌ Error logging logout:', error);
    return false;
  }
};

/**
 * ✅ Log user creation
 */
exports.logUserCreate = async (req, newUser) => {
  try {
    await exports.log('CREATE', `Created new user: ${newUser.username}`, req, {
      user_id: req.current_id,
      username: req.auth?.username,
      description: `New user ${newUser.name} (${newUser.username}) created with role ${newUser.role_name}`,
      status: 'success'
    });

    return true;
  } catch (error) {
    console.error('❌ Error logging user creation:', error);
    return false;
  }
};

/**
 * ✅ Log user update
 */
exports.logUserUpdate = async (req, userId, changes) => {
  try {
    await exports.log('UPDATE', `Updated user ID: ${userId}`, req, {
      user_id: req.current_id,
      username: req.auth?.username,
      description: `User updated. Changes: ${JSON.stringify(changes)}`,
      status: 'success'
    });

    return true;
  } catch (error) {
    console.error('❌ Error logging user update:', error);
    return false;
  }
};

/**
 * ✅ Log user deletion
 */
exports.logUserDelete = async (req, userId, username) => {
  try {
    await exports.log('DELETE', `Deleted user: ${username}`, req, {
      user_id: req.current_id,
      username: req.auth?.username,
      description: `User ${username} (ID: ${userId}) was deleted`,
      status: 'success',
      severity: 'warning'
    });

    return true;
  } catch (error) {
    console.error('❌ Error logging user deletion:', error);
    return false;
  }
};
exports.logError = async (functionName, error, res = null) => {
  try {
    // Extract request details
    const req = res?.req || {};
    const userId = req.current_id || null;
    const username = req.current_username || null;
    const ipAddress = req.ip ||
      req.headers?.['x-forwarded-for']?.split(',')[0] ||
      req.connection?.remoteAddress ||
      'Unknown';
    const userAgent = req.get?.('User-Agent') || req.headers?.['user-agent'] || 'Unknown';

    // Parse user agent for device info
    const deviceInfo = parseUserAgent(userAgent);

    // Prepare log data
    const logData = {
      log_type: 'ERROR',
      user_id: userId,
      username: username,
      action: functionName,
      description: error.message || 'Unknown error',
      ip_address: ipAddress,
      user_agent: userAgent,
      device_info: JSON.stringify(deviceInfo),
      location_info: null,
      severity: determineSeverity(error),
      status: 'error',
      error_message: error.message || null,
      request_data: JSON.stringify({
        method: req.method,
        path: req.path || req.url,
        query: req.query || {},
        body: sanitizeBody(req.body),
        headers: {
          referer: req.headers?.referer,
          origin: req.headers?.origin
        }
      }),
      response_data: JSON.stringify({
        error: true,
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    };

    // Insert log into database
    const [result] = await db.query(`
      INSERT INTO system_logs (
        log_type, user_id, username, action, description,
        ip_address, user_agent, device_info, location_info,
        severity, status, error_message,
        request_data, response_data, created_at
      ) VALUES (
        :log_type, :user_id, :username, :action, :description,
        :ip_address, :user_agent, :device_info, :location_info,
        :severity, :status, :error_message,
        :request_data, :response_data, NOW()
      )
    `, logData);

    const logId = result.insertId;

    let monitorLogEntry = null;

    // Load security monitoring asynchronously
    setTimeout(() => {
      try {
        const SecurityController = require("../controller/Security.controller");
        monitorLogEntry = SecurityController.monitorLogEntry;
      } catch (error) {
        console.warn('⚠️ Security monitoring not available:', error.message);
      }
    }, 1000);


    // Send error response if res is provided
    if (res && typeof res.status === 'function') {
      res.status(500).json({
        error: true,
        message: error.message || 'Internal server error',
        message_kh: 'កំហុសម៉ាស៊ីនមេខាងក្នុង',
        function: functionName,
        log_id: logId
      });
    }

    return logId;

  } catch (logError) {
    console.error('❌ Failed to log error:', logError);

    // Fallback error response
    if (res && typeof res.status === 'function') {
      res.status(500).json({
        error: true,
        message: 'Internal server error',
        message_kh: 'កំហុសម៉ាស៊ីនមេខាងក្នុង'
      });
    }
  }
};
exports.logSecurity = async (action, description, req, severity = 'warning') => {
  try {
    await exports.log('SECURITY', action, req, {
      description: description,
      severity: severity,
      status: 'detected'
    });

    return true;
  } catch (error) {
    console.error('❌ Error logging security event:', error);
    return false;
  }
};

/**
 * ✅ Log notification events
 */
exports.logNotification = async (req, recipientCount, message) => {
  try {
    await exports.log('NOTIFICATION', 'Notification sent', req, {
      user_id: req.current_id,
      username: req.auth?.username,
      description: `Sent notification to ${recipientCount} users: "${message.substring(0, 50)}..."`,
      status: 'success'
    });

    return true;
  } catch (error) {
    console.error('❌ Error logging notification:', error);
    return false;
  }
};
exports.createSystemLog = async (logData) => {
  try {
    // Ensure required fields
    const completeLogData = {
      log_type: logData.log_type || 'INFO',
      user_id: logData.user_id || null,
      username: logData.username || null,
      action: logData.action || 'SYSTEM_ACTION',
      description: logData.description || '',
      ip_address: logData.ip_address || 'Unknown',
      user_agent: logData.user_agent || 'System',
      device_info: logData.device_info || null,
      location_info: logData.location_info || null,
      severity: logData.severity || 'info',
      status: logData.status || 'success',
      error_message: logData.error_message || null,
      request_data: logData.request_data || null,
      response_data: logData.response_data || null
    };

    // Insert log
    const [result] = await db.query(`
      INSERT INTO system_logs (
        log_type, user_id, username, action, description,
        ip_address, user_agent, device_info, location_info,
        severity, status, error_message,
        request_data, response_data, created_at
      ) VALUES (
        :log_type, :user_id, :username, :action, :description,
        :ip_address, :user_agent, :device_info, :location_info,
        :severity, :status, :error_message,
        :request_data, :response_data, NOW()
      )
    `, completeLogData);

    const logId = result.insertId;

    // 🔥 AUTOMATIC SECURITY MONITORING
    if (monitorLogEntry && logId) {
      setImmediate(async () => {
        try {
          const [createdLog] = await db.query(
            'SELECT * FROM system_logs WHERE id = ?',
            [logId]
          );
          
          if (createdLog[0]) {
            await monitorLogEntry(createdLog[0]);
          }
        } catch (monitorError) {
          console.error('Security monitoring error:', monitorError.message);
        }
      });
    }

    return logId;

  } catch (error) {
    console.error('❌ Failed to create system log:', error);
    throw error;
  }
};

/**
 * Helper: Determine severity from error
 */
function determineSeverity(error) {
  const message = (error.message || '').toLowerCase();
  
  if (message.includes('unauthorized') || 
      message.includes('permission') || 
      message.includes('forbidden')) {
    return 'high';
  }
  
  if (message.includes('not found')) {
    return 'low';
  }
  
  if (message.includes('validation') || 
      message.includes('invalid')) {
    return 'medium';
  }
  
  return 'error';
}

/**
 * Helper: Sanitize request body (remove sensitive data)
 */
function sanitizeBody(body) {
  if (!body) return {};
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = [
    'password', 
    'token', 
    'secret', 
    'api_key', 
    'apiKey',
    'creditCard',
    'ssn'
  ];
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });
  
  return sanitized;
}

function parseUserAgent(userAgent) {
  const ua = (userAgent || '').toLowerCase();
  
  let browser = 'Unknown';
  if (ua.includes('firefox')) browser = 'Firefox';
  else if (ua.includes('chrome')) browser = 'Chrome';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('edge')) browser = 'Edge';
  
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('mac')) os = 'MacOS';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';
  
  let device = 'Desktop';
  if (ua.includes('mobile')) device = 'Mobile';
  else if (ua.includes('tablet')) device = 'Tablet';
  
  return { browser, os, device };
}
