const { db } = require('../util/helper');
const { monitorLogEntry } = require('../controller/Security.controller');

const rateLimitStore = new Map();

exports.checkIPBlacklist = async (req, res, next) => {
  try {
    const clientIP = req.ip ||
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.connection.remoteAddress ||
      'Unknown';

    if (clientIP === '::1' || clientIP === '127.0.0.1' || clientIP.startsWith('::ffff:127.0.0.1')) {
      return next();
    }

    const [blacklistedIP] = await db.query(`
      SELECT id, reason, expires_at
      FROM ip_blacklist
      WHERE ip_address = :ip_address
        AND is_active = 1
        AND (expires_at IS NULL OR expires_at > NOW())
    `, { ip_address: clientIP });

    if (blacklistedIP.length > 0) {
      const reason = blacklistedIP[0].reason || 'IP address is blocked';

      return res.status(403).json({
        error: true,
        message: 'Access denied. Your IP address has been blocked.',
        message_kh: 'ការចូលប្រើត្រូវបានបដិសេធ។ IP របស់អ្នកត្រូវបាន block។',
        reason: reason
      });
    }

    next();
  } catch (error) {
    console.error('❌ Error checking IP blacklist:', error);
    next();
  }
};

// Helper for robust IP resolution
const getSafeIp = (req) => {
  return req.ip ||
    (req.headers['x-forwarded-for'] ? req.headers['x-forwarded-for'].split(',')[0] : '') ||
    req.socket?.remoteAddress ||
    'Unknown';
};

exports.rateLimitMonitoring = (maxRequests = 100, windowMs = 60000) => {
  return async (req, res, next) => {
    try {
      if (req.skipRateLimit || req.path.startsWith('/api/security/')) {
        return next();
      }

      const clientIP = getSafeIp(req);

      const now = Date.now();
      const key = `${clientIP}`;

      if (!rateLimitStore.has(key)) {
        rateLimitStore.set(key, { count: 0, resetTime: now + windowMs });
      }

      const record = rateLimitStore.get(key);

      if (now > record.resetTime) {
        record.count = 0;
        record.resetTime = now + windowMs;
      }

      record.count++;

      if (record.count > maxRequests) {

        try {
          const userId = req.current_id || null;
          const username = req.auth?.username || null;

          const [logResult] = await db.query(`
            INSERT INTO system_logs (
              user_id,
              username,
              ip_address,
              user_agent,
              action,
              description,
              status,
              log_type,
              created_at
            ) VALUES (
              :user_id,
              :username,
              :ip_address,
              :user_agent,
              'RATE_LIMIT_EXCEEDED',
              :description,
              'error',
              'ERROR',
              NOW()
            )
          `, {
            user_id: userId,
            username: username,
            ip_address: clientIP,
            user_agent: req.get('User-Agent') || 'Unknown',
            description: `Rate limit exceeded: ${record.count} requests in ${windowMs}ms`
          });

          const logId = logResult.insertId;

          const [logEntry] = await db.query(
            'SELECT * FROM system_logs WHERE id = :log_id',
            { log_id: logId }
          );

          if (logEntry.length > 0) {
            await monitorLogEntry(logEntry[0]);
          }

        } catch (logError) {
          console.error('❌ Failed to log rate limit:', logError);
        }

        return res.status(429).json({
          error: true,
          message: 'Too many requests. Please slow down.',
          message_kh: 'មានការស្នើសុំច្រើនពេក។ សូមផ្អាក់បន្តិច។',
          retry_after: Math.ceil((record.resetTime - now) / 1000)
        });
      }

      next();

    } catch (error) {
      console.error('❌ Rate limit error:', error);
      next();
    }
  };
};

exports.postResponseAnalyzer = async (req, res, next) => {
  try {
    if (req.skipSecurityLogging || req.path.startsWith('/api/security/')) {
      return next();
    }

    // Safe IP resolution
    const clientIP = getSafeIp(req);

    // Helper to safely serialize objects to simple JSON-compatible structures
    const safeSerialize = (obj) => {
      try {
        if (!obj) return {};
        // Simple Deep Copy to break references
        return JSON.parse(JSON.stringify(obj));
      } catch (e) {
        return {}; // Return empty object on circular reference or error
      }
    };

    // Capture context IMMEDIATELY with safe serialization
    const context = {
      user_id: req.current_id || null,
      username: req.auth?.username || null,
      ip_address: clientIP,
      user_agent: req.get('User-Agent') || 'Unknown',
      method: req.method,
      path: req.path,
      // Deep copy these NOW to avoid mutation issues later
      body: safeSerialize(req.body),
      query: safeSerialize(req.query),
      params: safeSerialize(req.params),
      timestamp: new Date()
    };

    res.on('finish', async () => {
      try {
        // Double-check serialization for DB storage
        const requestDataString = JSON.stringify({
          body: context.body,
          query: context.query,
          params: context.params
        });

        const [logResult] = await db.query(`
          INSERT INTO system_logs (
            user_id,
            username,
            ip_address,
            user_agent,
            action,
            description,
            request_data,
            response_data,
            status,
            log_type,
            created_at
          ) VALUES (
            :user_id,
            :username,
            :ip_address,
            :user_agent,
            :action,
            :description,
            :request_data,
            :response_data,
            :status,
            'INFO',
            NOW()
          )
        `, {
          user_id: context.user_id,
          username: context.username,
          ip_address: context.ip_address,
          user_agent: context.user_agent,
          action: `${context.method} ${context.path}`,
          description: `API Request: ${context.method} ${context.path}`,
          request_data: requestDataString, // Use the pre-calculated string
          response_data: JSON.stringify({
            status_code: res.statusCode
          }),
          status: res.statusCode >= 200 && res.statusCode < 300 ? 'success' : 'error'
        });

        const logId = logResult.insertId;

        const [logEntry] = await db.query(
          'SELECT * FROM system_logs WHERE id = :log_id',
          { log_id: logId }
        );

        if (logEntry.length > 0) {
          monitorLogEntry(logEntry[0]).catch(err => {
            console.error('❌ Failed to analyze log:', err);
          });
        }

      } catch (logError) {
        console.error('❌ Post-response logging error:', logError);
      }
    });

    next();

  } catch (error) {
    console.error('❌ Post-response analyzer error:', error);
    next();
  }
};

// Cleanup old rate limit records periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetTime + 60000) {
      rateLimitStore.delete(key);
    }
  }
}, 60000);

// ✅ FIX: Export all functions properly
module.exports = {
  checkIPBlacklist: exports.checkIPBlacklist,
  rateLimitMonitoring: exports.rateLimitMonitoring,
  postResponseAnalyzer: exports.postResponseAnalyzer
};