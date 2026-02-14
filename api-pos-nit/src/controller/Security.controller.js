// ═══════════════════════════════════════════════════════════════
// COMPLETE SECURITY CONTROLLER
// ═══════════════════════════════════════════════════════════════
// AI-Powered Security Monitoring System
// All functions included and ready to use
// ═══════════════════════════════════════════════════════════════

const { db } = require("../util/helper");
const { sendSmartNotification } = require("../util/Telegram.helpe");
const { logError } = require("../util/logError");

// ═══════════════════════════════════════════════════════════════
// AI DETECTION PATTERNS - Attack Signatures
// ═══════════════════════════════════════════════════════════════

const ATTACK_PATTERNS = {
  // 🚨 SQL Injection Patterns
  SQL_INJECTION: {
    severity: 'critical',
    patterns: [
      /(\bOR\b|\bAND\b)\s+['"]\s*=\s*['"]/i,
      /UNION\s+SELECT/i,
      /DROP\s+TABLE/i,
      /--\s*$/,
      /\/\*.*\*\//,
      /;\s*DROP/i,
      /1\s*=\s*1/,
      /'\s*OR\s*'1'\s*=\s*'1/i,
      /admin'\s*--/i
    ],
    description: 'SQL Injection attempt detected'
  },

  // 🚨 XSS (Cross-Site Scripting) Patterns
  XSS_ATTACK: {
    severity: 'critical',
    patterns: [
      /<script\b[^>]*>(.*?)<\/script>/gi,
      /javascript:/i,
      /onerror\s*=/i,
      /onload\s*=/i,
      /<iframe/i,
      /eval\(/i,
      /document\.cookie/i
    ],
    description: 'XSS attack attempt detected'
  },

  // 🚨 Brute Force Login Patterns
  BRUTE_FORCE: {
    severity: 'high',
    patterns: [
      /failed.*login/i,
      /authentication.*failed/i,
      /invalid.*credentials/i
    ],
    description: 'Brute force attack detected',
    threshold: 5,
    timeWindow: 5 * 60 * 1000
  },

  // 🚨 Privilege Escalation
  PRIVILEGE_ESCALATION: {
    severity: 'critical',
    patterns: [
      /role.*changed.*admin/i,
      /permission.*elevated/i,
      /unauthorized.*access.*admin/i,
      /sudo/i
    ],
    description: 'Privilege escalation attempt detected'
  },

  // 🚨 Data Exfiltration
  DATA_EXFILTRATION: {
    severity: 'critical',
    patterns: [
      /export.*large.*data/i,
      /download.*database/i,
      /SELECT.*FROM.*user.*password/i,
      /mass.*download/i
    ],
    description: 'Possible data exfiltration detected'
  },

  // 🚨 Path Traversal
  PATH_TRAVERSAL: {
    severity: 'high',
    patterns: [
      /\.\.\//g,
      /\.\.%2F/gi,
      /%2e%2e/gi,
      /\/etc\/passwd/i,
      /\/windows\/system32/i
    ],
    description: 'Path traversal attack detected'
  },

  // 🚨 Command Injection
  COMMAND_INJECTION: {
    severity: 'critical',
    patterns: [
      /;\s*rm\s+-rf/i,
      /\|\s*cat\s+\/etc/i,
      /&&\s*whoami/i,
      /`.*`/,
      /\$\(.*\)/
    ],
    description: 'Command injection attempt detected'
  },

  // 🚨 Account Enumeration
  ACCOUNT_ENUMERATION: {
    severity: 'medium',
    patterns: [
      /user.*not.*found/i,
      /account.*does.*not.*exist/i
    ],
    description: 'Account enumeration detected',
    threshold: 10,
    timeWindow: 10 * 60 * 1000
  }
};

// ═══════════════════════════════════════════════════════════════
// BEHAVIORAL ANOMALY DETECTION
// ═══════════════════════════════════════════════════════════════

const BEHAVIORAL_PATTERNS = {
  UNUSUAL_TIME: {
    severity: 'medium',
    check: (timestamp) => {
      const hour = new Date(timestamp).getHours();
      return hour >= 0 && hour <= 5;
    },
    description: 'Access during unusual hours (12 AM - 5 AM)'
  },

  LOCATION_HOPPING: {
    severity: 'high',
    description: 'User logged in from multiple locations rapidly',
    threshold: 2,
    timeWindow: 30 * 60 * 1000
  },

  RATE_LIMIT_ABUSE: {
    severity: 'high',
    description: 'Excessive API calls detected (possible DoS)',
    threshold: 100,
    timeWindow: 60 * 1000
  },

  MASS_DATA_ACCESS: {
    severity: 'high',
    description: 'Abnormally large data access detected',
    threshold: 1000,
    timeWindow: 5 * 60 * 1000
  }
};

// ═══════════════════════════════════════════════════════════════
// INTERNAL ANALYSIS FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function analyzeLogForAttacks(log) {
  const threats = [];
  
  for (const [attackType, config] of Object.entries(ATTACK_PATTERNS)) {
    for (const pattern of config.patterns) {
      const fieldsToCheck = [
        log.action,
        log.description,
        JSON.stringify(log.request_data || {}),
        JSON.stringify(log.response_data || {})
      ].join(' ');

      if (pattern.test(fieldsToCheck)) {
        threats.push({
          type: attackType,
          severity: config.severity,
          description: config.description,
          pattern: pattern.toString(),
          matched_text: fieldsToCheck.match(pattern)?.[0]
        });
      }
    }
  }

  return threats;
}

async function checkBehavioralAnomalies(userId, ipAddress, timestamp) {
  const anomalies = [];

  if (BEHAVIORAL_PATTERNS.UNUSUAL_TIME.check(timestamp)) {
    anomalies.push({
      type: 'UNUSUAL_TIME',
      severity: BEHAVIORAL_PATTERNS.UNUSUAL_TIME.severity,
      description: BEHAVIORAL_PATTERNS.UNUSUAL_TIME.description,
      timestamp: timestamp
    });
  }

  const recentIPs = await db.query(`
    SELECT DISTINCT ip_address, created_at
    FROM system_logs
    WHERE user_id = :user_id
      AND created_at >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
    ORDER BY created_at DESC
  `, { user_id: userId });

  if (recentIPs[0] && recentIPs[0].length >= 2) {
    const uniqueIPs = new Set(recentIPs[0].map(r => r.ip_address));
    if (uniqueIPs.size >= 2) {
      anomalies.push({
        type: 'LOCATION_HOPPING',
        severity: BEHAVIORAL_PATTERNS.LOCATION_HOPPING.severity,
        description: BEHAVIORAL_PATTERNS.LOCATION_HOPPING.description,
        ip_addresses: Array.from(uniqueIPs),
        count: uniqueIPs.size
      });
    }
  }

  const recentRequests = await db.query(`
    SELECT COUNT(*) as request_count
    FROM system_logs
    WHERE user_id = :user_id
      AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MINUTE)
  `, { user_id: userId });

  if (recentRequests[0]?.[0]?.request_count > BEHAVIORAL_PATTERNS.RATE_LIMIT_ABUSE.threshold) {
    anomalies.push({
      type: 'RATE_LIMIT_ABUSE',
      severity: BEHAVIORAL_PATTERNS.RATE_LIMIT_ABUSE.severity,
      description: BEHAVIORAL_PATTERNS.RATE_LIMIT_ABUSE.description,
      request_count: recentRequests[0][0].request_count,
      threshold: BEHAVIORAL_PATTERNS.RATE_LIMIT_ABUSE.threshold
    });
  }

  return anomalies;
}

function calculateRiskScore(threats, anomalies) {
  const severityScores = {
    critical: 100,
    high: 75,
    medium: 50,
    low: 25
  };

  let score = 0;
  threats.forEach(threat => {
    score += severityScores[threat.severity] || 0;
  });
  anomalies.forEach(anomaly => {
    score += severityScores[anomaly.severity] || 0;
  });

  return Math.min(score, 100);
}

async function storeSecurityIncident(incident) {
  try {
    await db.query(`
      INSERT INTO security_incidents (
        log_id,
        user_id,
        ip_address,
        threats,
        anomalies,
        risk_score,
        status,
        created_at
      ) VALUES (
        :log_id,
        :user_id,
        :ip_address,
        :threats,
        :anomalies,
        :risk_score,
        :status,
        NOW()
      )
    `, {
      log_id: incident.log_id,
      user_id: incident.user_id,
      ip_address: incident.ip_address,
      threats: JSON.stringify(incident.threats),
      anomalies: JSON.stringify(incident.anomalies),
      risk_score: incident.risk_score,
      status: incident.status
    });
  } catch (error) {
    console.error('❌ Failed to store security incident:', error);
  }
}

async function sendSecurityAlert(logEntry, threats, anomalies, riskScore) {
  try {
    const [user] = await db.query(
      'SELECT id, name, username, branch_name FROM user WHERE id = :user_id',
      { user_id: logEntry.user_id }
    );

    const userName = user[0]?.name || 'Unknown User';
    const username = user[0]?.username || 'N/A';
    const branchName = user[0]?.branch_name || 'N/A';

    let alertMessage = `🚨🚨🚨 <b>SECURITY ALERT - ${riskScore >= 90 ? 'CRITICAL' : 'HIGH'} RISK</b> 🚨🚨🚨\n`;
    alertMessage += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    alertMessage += `⚠️ <b>Risk Score:</b> ${riskScore}/100 🔥\n\n`;
    alertMessage += `👤 <b>User Information:</b>\n`;
    alertMessage += `   • Name: ${userName}\n`;
    alertMessage += `   • Username: ${username}\n`;
    alertMessage += `   • ID: ${logEntry.user_id}\n`;
    alertMessage += `   • Branch: ${branchName}\n\n`;
    alertMessage += `🌐 <b>Network Information:</b>\n`;
    alertMessage += `   • IP: <code>${logEntry.ip_address}</code>\n`;
    alertMessage += `   • User Agent: ${logEntry.user_agent?.substring(0, 50) || 'N/A'}...\n\n`;
    
    if (threats.length > 0) {
      alertMessage += `🔴 <b>Detected Threats (${threats.length}):</b>\n`;
      threats.forEach((threat, idx) => {
        alertMessage += `   ${idx + 1}. <b>${threat.type}</b>\n`;
        alertMessage += `      • ${threat.description}\n`;
        alertMessage += `      • Severity: ${threat.severity.toUpperCase()}\n`;
        if (threat.matched_text) {
          alertMessage += `      • Pattern: <code>${threat.matched_text.substring(0, 100)}</code>\n`;
        }
      });
      alertMessage += `\n`;
    }
    
    if (anomalies.length > 0) {
      alertMessage += `⚠️ <b>Behavioral Anomalies (${anomalies.length}):</b>\n`;
      anomalies.forEach((anomaly, idx) => {
        alertMessage += `   ${idx + 1}. <b>${anomaly.type}</b>\n`;
        alertMessage += `      • ${anomaly.description}\n`;
        alertMessage += `      • Severity: ${anomaly.severity.toUpperCase()}\n`;
      });
      alertMessage += `\n`;
    }
    
    alertMessage += `📋 <b>Action Details:</b>\n`;
    alertMessage += `   • Action: ${logEntry.action}\n`;
    alertMessage += `   • Description: ${logEntry.description?.substring(0, 100) || 'N/A'}\n\n`;
    alertMessage += `⏰ <b>Time:</b> ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' })}\n`;
    alertMessage += `🆔 <b>Log ID:</b> ${logEntry.id}\n\n`;
    alertMessage += `━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    alertMessage += `⚡ <b>IMMEDIATE ACTION REQUIRED</b> ⚡\n`;
    alertMessage += `This incident requires immediate investigation!`;

    await sendSmartNotification({
      event_type: 'security_alert',
      branch_name: branchName,
      message: alertMessage,
      severity: 'critical'
    });

  } catch (error) {
    console.error('❌ Failed to send security alert:', error);
  }
}


exports.monitorLogEntry = async (logEntry) => {
  try {

    const threats = analyzeLogForAttacks(logEntry);
    const anomalies = await checkBehavioralAnomalies(
      logEntry.user_id,
      logEntry.ip_address,
      logEntry.created_at
    );
    const riskScore = calculateRiskScore(threats, anomalies);

    if (threats.length > 0 || anomalies.length > 0) {
      

      await storeSecurityIncident({
        log_id: logEntry.id,
        user_id: logEntry.user_id,
        ip_address: logEntry.ip_address,
        threats: threats,
        anomalies: anomalies,
        risk_score: riskScore,
        status: riskScore >= 75 ? 'critical' : riskScore >= 50 ? 'high' : 'medium'
      });

      if (riskScore >= 75) {
        await sendSecurityAlert(logEntry, threats, anomalies, riskScore);
      }
    }

    return {
      safe: threats.length === 0 && anomalies.length === 0,
      threats: threats,
      anomalies: anomalies,
      risk_score: riskScore
    };
  } catch (error) {
    console.error('❌ Error in monitorLogEntry:', error);
    return {
      safe: true,
      error: error.message
    };
  }
};


exports.getSecurityDashboard = async (req, res) => {
  try {
    const { timeRange = '24h' } = req.query;

    let timeFilter = 'DATE_SUB(NOW(), INTERVAL 24 HOUR)';
    if (timeRange === '7d') timeFilter = 'DATE_SUB(NOW(), INTERVAL 7 DAY)';
    if (timeRange === '30d') timeFilter = 'DATE_SUB(NOW(), INTERVAL 30 DAY)';

    const [incidents] = await db.query(`
      SELECT 
        COUNT(*) as total_incidents,
        SUM(CASE WHEN status = 'critical' THEN 1 ELSE 0 END) as critical_incidents,
        SUM(CASE WHEN status = 'high' THEN 1 ELSE 0 END) as high_incidents,
        AVG(risk_score) as avg_risk_score
      FROM security_incidents
      WHERE created_at >= ${timeFilter}
    `);

    const [recentIncidents] = await db.query(`
      SELECT 
        si.*,
        u.name as user_name,
        u.username,
        sl.action,
        sl.description
      FROM security_incidents si
      LEFT JOIN user u ON si.user_id = u.id
      LEFT JOIN system_logs sl ON si.log_id = sl.id
      WHERE si.created_at >= ${timeFilter}
      ORDER BY si.created_at DESC
      LIMIT 20
    `);

    const [topAttackers] = await db.query(`
      SELECT 
        ip_address,
        COUNT(*) as incident_count,
        MAX(risk_score) as max_risk_score,
        MAX(created_at) as last_incident
      FROM security_incidents
      WHERE created_at >= ${timeFilter}
      GROUP BY ip_address
      ORDER BY incident_count DESC
      LIMIT 10
    `);

    const [attackTypes] = await db.query(`
      SELECT 
        JSON_EXTRACT(threats, '$[*].type') as threat_types,
        COUNT(*) as count
      FROM security_incidents
      WHERE created_at >= ${timeFilter}
        AND threats IS NOT NULL
      GROUP BY threat_types
    `);

    res.json({
      success: true,
      dashboard: {
        summary: incidents[0] || {},
        recent_incidents: recentIncidents.map(inc => ({
          ...inc,
          threats: JSON.parse(inc.threats || '[]'),
          anomalies: JSON.parse(inc.anomalies || '[]')
        })),
        top_attackers: topAttackers,
        attack_types: attackTypes,
        time_range: timeRange
      }
    });
  } catch (error) {
    console.error('❌ Error in getSecurityDashboard:', error);
    logError('security.getSecurityDashboard', error, res);
  }
};

exports.getIncidentsList = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      start_date,
      end_date,
      ip_address,
      user_id
    } = req.query;

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = {};

    if (status) {
      whereConditions.push('si.status = :status');
      params.status = status;
    }
    if (start_date && end_date) {
      whereConditions.push('si.created_at BETWEEN :start_date AND :end_date');
      params.start_date = start_date;
      params.end_date = end_date;
    }
    if (ip_address) {
      whereConditions.push('si.ip_address = :ip_address');
      params.ip_address = ip_address;
    }
    if (user_id) {
      whereConditions.push('si.user_id = :user_id');
      params.user_id = user_id;
    }

    const whereClause = whereConditions.length > 0 
      ? 'WHERE ' + whereConditions.join(' AND ')
      : '';

    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM security_incidents si
      ${whereClause}
    `, params);

    const total = countResult[0].total;

    const [incidents] = await db.query(`
      SELECT 
        si.*,
        u.name as user_name,
        u.username,
        u.branch_name,
        sl.action,
        sl.description as log_description
      FROM security_incidents si
      LEFT JOIN user u ON si.user_id = u.id
      LEFT JOIN system_logs sl ON si.log_id = sl.id
      ${whereClause}
      ORDER BY si.created_at DESC
      LIMIT :limit OFFSET :offset
    `, {
      ...params,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: incidents.map(inc => ({
        ...inc,
        threats: JSON.parse(inc.threats || '[]'),
        anomalies: JSON.parse(inc.anomalies || '[]')
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        total_pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error in getIncidentsList:', error);
    logError('security.getIncidentsList', error, res);
  }
};

exports.getThreatReport = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const [report] = await db.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as total_incidents,
        SUM(CASE WHEN status = 'critical' THEN 1 ELSE 0 END) as critical_count,
        AVG(risk_score) as avg_risk_score
      FROM security_incidents
      WHERE created_at BETWEEN :start_date AND :end_date
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `, { start_date, end_date });

    res.json({
      success: true,
      report: report
    });
  } catch (error) {
    logError('security.getThreatReport', error, res);
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Log Analysis
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exports.analyzeLog = async (req, res) => {
  try {
    const { log_id } = req.params;

    const [logs] = await db.query(
      'SELECT * FROM system_logs WHERE id = :log_id',
      { log_id }
    );

    if (logs.length === 0) {
      return res.status(404).json({
        error: true,
        message: 'Log entry not found'
      });
    }

    const log = logs[0];
    const result = await exports.monitorLogEntry(log);

    res.json({
      success: true,
      analysis: result,
      log: log
    });
  } catch (error) {
    console.error('❌ Error in analyzeLog:', error);
    logError('security.analyzeLog', error, res);
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IP Management
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exports.getBlacklistedIPs = async (req, res) => {
  try {
    const { active_only = 'true' } = req.query;
    const whereClause = active_only === 'true' ? 'WHERE is_active = 1' : '';

    const [ips] = await db.query(`
      SELECT 
        ib.*,
        u.name as blocked_by_name,
        u.username as blocked_by_username
      FROM ip_blacklist ib
      LEFT JOIN user u ON ib.blocked_by = u.id
      ${whereClause}
      ORDER BY ib.blocked_at DESC
    `);

    res.json({
      success: true,
      data: ips
    });
  } catch (error) {
    console.error('❌ Error in getBlacklistedIPs:', error);
    logError('security.getBlacklistedIPs', error, res);
  }
};

exports.blockIP = async (req, res) => {
  try {
    const { ip_address, reason, duration_days } = req.body;

    if (!ip_address) {
      return res.status(400).json({
        error: true,
        message: 'IP address is required',
        message_kh: 'ត្រូវការ IP address'
      });
    }

    const [existing] = await db.query(
      'SELECT id FROM ip_blacklist WHERE ip_address = :ip_address AND is_active = 1',
      { ip_address }
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: true,
        message: 'IP address is already blocked',
        message_kh: 'IP address នេះត្រូវបាន block រួចហើយ'
      });
    }

    let expires_at = null;
    if (duration_days) {
      expires_at = new Date();
      expires_at.setDate(expires_at.getDate() + parseInt(duration_days));
    }

    await db.query(`
      INSERT INTO ip_blacklist (
        ip_address,
        reason,
        blocked_by,
        expires_at,
        is_active
      ) VALUES (
        :ip_address,
        :reason,
        :blocked_by,
        :expires_at,
        1
      )
    `, {
      ip_address,
      reason: reason || 'Blocked from security dashboard',
      blocked_by: req.current_id,
      expires_at: expires_at
    });

    res.json({
      success: true,
      message: 'IP address blocked successfully',
      message_kh: 'ទប់ស្កាត់ IP address បានជោគជ័យ',
      data: {
        ip_address,
        expires_at,
        permanent: !expires_at
      }
    });
  } catch (error) {
    console.error('❌ Error in blockIP:', error);
    logError('security.blockIP', error, res);
  }
};

exports.unblockIP = async (req, res) => {
  try {
    const { ip_address } = req.body;

    if (!ip_address) {
      return res.status(400).json({
        error: true,
        message: 'IP address is required'
      });
    }

    const [result] = await db.query(`
      UPDATE ip_blacklist
      SET is_active = 0
      WHERE ip_address = :ip_address
    `, { ip_address });

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: true,
        message: 'IP address not found in blacklist'
      });
    }

    res.json({
      success: true,
      message: 'IP address unblocked successfully',
      message_kh: 'លុបការទប់ស្កាត់ IP address បានជោគជ័យ'
    });
  } catch (error) {
    console.error('❌ Error in unblockIP:', error);
    logError('security.unblockIP', error, res);
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Incident Management
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exports.investigateIncident = async (req, res) => {
  try {
    const { incident_id } = req.params;
    const { notes } = req.body;

    await db.query(`
      UPDATE security_incidents
      SET 
        investigated = 1,
        investigated_by = :investigated_by,
        investigation_notes = :notes
      WHERE id = :incident_id
    `, {
      incident_id,
      investigated_by: req.current_id,
      notes: notes || null
    });

    res.json({
      success: true,
      message: 'Incident marked as investigated',
      message_kh: 'សម្គាល់ជាបានស៊ើបអង្កេតរួច'
    });
  } catch (error) {
    console.error('❌ Error in investigateIncident:', error);
    logError('security.investigateIncident', error, res);
  }
};

exports.resolveIncident = async (req, res) => {
  try {
    const { incident_id } = req.params;
    const { resolution_notes } = req.body;

    await db.query(`
      UPDATE security_incidents
      SET 
        resolved = 1,
        resolved_at = NOW(),
        investigation_notes = CONCAT(
          COALESCE(investigation_notes, ''),
          '\n\n--- RESOLUTION ---\n',
          :resolution_notes
        )
      WHERE id = :incident_id
    `, {
      incident_id,
      resolution_notes: resolution_notes || 'Resolved'
    });

    res.json({
      success: true,
      message: 'Incident resolved successfully',
      message_kh: 'ដោះស្រាយបញ្ហាបានជោគជ័យ'
    });
  } catch (error) {
    console.error('❌ Error in resolveIncident:', error);
    logError('security.resolveIncident', error, res);
  }
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Threat Pattern Management
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

exports.getThreatPatterns = async (req, res) => {
  try {
    const { active_only = 'true' } = req.query;
    const whereClause = active_only === 'true' ? 'WHERE is_active = 1' : '';

    const [patterns] = await db.query(`
      SELECT *
      FROM threat_intelligence
      ${whereClause}
      ORDER BY severity DESC, threat_type ASC
    `);

    res.json({
      success: true,
      data: patterns
    });
  } catch (error) {
    console.error('❌ Error in getThreatPatterns:', error);
    logError('security.getThreatPatterns', error, res);
  }
};

exports.addThreatPattern = async (req, res) => {
  try {
    const { threat_type, pattern, severity, description } = req.body;

    if (!threat_type || !pattern || !severity) {
      return res.status(400).json({
        error: true,
        message: 'threat_type, pattern, and severity are required'
      });
    }

    await db.query(`
      INSERT INTO threat_intelligence (
        threat_type,
        pattern,
        severity,
        description,
        is_active
      ) VALUES (
        :threat_type,
        :pattern,
        :severity,
        :description,
        1
      )
    `, {
      threat_type,
      pattern,
      severity,
      description: description || null
    });

    res.json({
      success: true,
      message: 'Threat pattern added successfully',
      message_kh: 'បន្ថែម threat pattern បានជោគជ័យ'
    });
  } catch (error) {
    console.error('❌ Error in addThreatPattern:', error);
    logError('security.addThreatPattern', error, res);
  }
};

exports.updateThreatPattern = async (req, res) => {
  try {
    const { pattern_id } = req.params;
    const { threat_type, pattern, severity, description, is_active } = req.body;

    const updates = [];
    const params = { pattern_id };

    if (threat_type !== undefined) {
      updates.push('threat_type = :threat_type');
      params.threat_type = threat_type;
    }
    if (pattern !== undefined) {
      updates.push('pattern = :pattern');
      params.pattern = pattern;
    }
    if (severity !== undefined) {
      updates.push('severity = :severity');
      params.severity = severity;
    }
    if (description !== undefined) {
      updates.push('description = :description');
      params.description = description;
    }
    if (is_active !== undefined) {
      updates.push('is_active = :is_active');
      params.is_active = is_active ? 1 : 0;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: true,
        message: 'No fields to update'
      });
    }

    await db.query(`
      UPDATE threat_intelligence
      SET ${updates.join(', ')}
      WHERE id = :pattern_id
    `, params);

    res.json({
      success: true,
      message: 'Threat pattern updated successfully',
      message_kh: 'ធ្វើបច្ចុប្បន្នភាព threat pattern បានជោគជ័យ'
    });
  } catch (error) {
    console.error('❌ Error in updateThreatPattern:', error);
    logError('security.updateThreatPattern', error, res);
  }
};

exports.deleteThreatPattern = async (req, res) => {
  try {
    const { pattern_id } = req.params;

    await db.query(`
      UPDATE threat_intelligence
      SET is_active = 0
      WHERE id = :pattern_id
    `, { pattern_id });

    res.json({
      success: true,
      message: 'Threat pattern deleted successfully',
      message_kh: 'លុប threat pattern បានជោគជ័យ'
    });
  } catch (error) {
    console.error('❌ Error in deleteThreatPattern:', error);
    logError('security.deleteThreatPattern', error, res);
  }
};

// ═══════════════════════════════════════════════════════════════
// EXPORT ALL FUNCTIONS
// ═══════════════════════════════════════════════════════════════

module.exports = exports;
