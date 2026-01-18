const { db, isArray, isEmpty, logError } = require("../util/helper");
const moment = require('moment'); // ✅ ADDED: Missing import

exports.getList = async (req, res) => {
  try {
    // ✅ Get current user info
    const { txtSearch } = req.query; // ✅ Restored missing variable
    const currentUserId = req.auth?.id || req.current_id;
    const [currentUser] = await db.query("SELECT role_id, branch_name FROM user WHERE id = ?", [currentUserId]);

    if (!currentUser.length) return res.status(401).json({ error: "User not found" });
    const { role_id, branch_name } = currentUser[0];
    const isSuperAdmin = role_id === 29;

    let sql = `
      SELECT 
        e.id,
        e.code,
        e.name,
        CASE 
          WHEN e.gender = 1 THEN 'Male'
          WHEN e.gender = 0 THEN 'Female'
        END AS gender,
        e.position,
        e.salary,
        e.tel,
        e.email,
        e.address,
        e.website,
        e.note,
        e.is_active as status,
        -- Work schedule fields
        e.work_type,
        e.work_start_time,
        e.work_end_time,
        e.grace_period_minutes,
        e.working_days,
        e.schedule_notes,
        TIME_FORMAT(e.work_start_time, '%h:%i %p') as work_start_display,
        TIME_FORMAT(e.work_end_time, '%h:%i %p') as work_end_display,
        TIMESTAMPDIFF(HOUR, e.work_start_time, e.work_end_time) as daily_hours,
        e.create_at,
        u.name as created_by_name
      FROM employee e
      LEFT JOIN user u ON e.creator_id = u.id
      WHERE 1=1
    `;

    const params = {
      txtSearch: `%${txtSearch}%`
    };

    if (!isEmpty(txtSearch)) {
      sql += " AND (e.name LIKE :txtSearch OR e.tel LIKE :txtSearch OR e.email LIKE :txtSearch OR e.code LIKE :txtSearch)";
    }

    // ✅ Filter by branch for non-Super Admins
    if (!isSuperAdmin) {
      // Show employees created by branch OR where creator is NULL (Legacy data transparency)
      sql += ` AND (u.branch_name = :branch_name OR e.creator_id IS NULL)`;
      params.branch_name = branch_name;
    }

    sql += " ORDER BY e.create_at DESC";

    const [list] = await db.query(sql, params);

    // Parse working_days JSON for each employee
    list.forEach(emp => {
      if (emp.working_days) {
        try {
          emp.working_days = JSON.parse(emp.working_days);
        } catch (e) {
          emp.working_days = [];
        }
      }
    });

    res.json({
      list,
    });
  } catch (error) {
    logError("employee.getList", error, res);
  }
};

exports.create = async (req, res) => {
  try {
    const {
      code, name, gender, position,
      salary, tel, email, address,
      website, note, is_active,
      // Work Schedule Fields
      work_type, work_start_time, work_end_time, grace_period_minutes,
      working_days, schedule_notes
    } = req.body;

    // Validate required fields
    if (!name || !position) {
      return res.json({
        error: true,
        message: "Name and position are required",
        message_kh: "ត្រូវការឈ្មោះ និងមុខតំណែង"
      });
    }

    // Check if code already exists
    if (code) {
      const [existing] = await db.query(
        "SELECT id FROM employee WHERE code = ?",
        [code]
      );

      if (existing.length > 0) {
        return res.json({
          error: true,
          message: "Employee code already exists",
          message_kh: "លេខកូដនេះមានរួចហើយ"
        });
      }
    }

    // ✅ FIXED: Corrected parameter count (17 placeholders, 17 values)
    const [result] = await db.query(
      `INSERT INTO employee (
        code, name, gender, position, salary, tel, email, address, 
        website, note, is_active,
        work_type, work_start_time, work_end_time, grace_period_minutes,
        working_days, schedule_notes,
        create_at, creator_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)`,
      [
        code || null,
        name,
        gender === 'Male' ? 1 : 0, // Convert to int
        position,
        salary || 0,
        tel || null,
        email || null,
        address || null,
        website || null,
        note || null,
        is_active !== undefined ? is_active : 1,
        work_type || 'full-time',
        work_start_time || '07:00:00',
        work_end_time || '17:00:00',
        grace_period_minutes || 30,
        working_days ? JSON.stringify(working_days) : JSON.stringify(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]),
        schedule_notes || null,
        req.current_id // ✅ Added creator_id
      ]
    );

    res.json({
      error: false,
      message: "Employee created successfully",
      message_kh: "បង្កើតបុគ្គលិកបានជោគជ័យ",
      employee_id: result.insertId
    });

  } catch (error) {
    logError("Employee.create", error, res);
  }
};

exports.update = async (req, res) => {
  try {
    const {
      id, code, name, gender, position, salary, tel, email, address,
      website, note, is_active,
      work_type, work_start_time, work_end_time, grace_period_minutes,
      working_days, schedule_notes
    } = req.body;

    if (!id) {
      return res.json({
        error: true,
        message: "Employee ID is required"
      });
    }

    // Check if code exists (excluding current employee)
    if (code) {
      const [existing] = await db.query(
        "SELECT id FROM employee WHERE code = ? AND id != ?",
        [code, id]
      );

      if (existing.length > 0) {
        return res.json({
          error: true,
          message: "Employee code already exists"
        });
      }
    }

    // Get old salary for history tracking
    const [oldEmployee] = await db.query(
      "SELECT salary FROM employee WHERE id = ?",
      [id]
    );

    await db.query(
      `UPDATE employee SET
        code = ?, name = ?, gender = ?,
        position = ?, salary = ?,
        tel = ?, email = ?, address = ?, website = ?, note = ?,
        is_active = ?,
        work_type = ?, work_start_time = ?, work_end_time = ?,
        grace_period_minutes = ?, working_days = ?, schedule_notes = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [
        code || null,
        name,
        gender === 'Male' ? 1 : 0,
        position,
        salary || 0,
        tel || null,
        email || null,
        address || null,
        website || null,
        note || null,
        is_active !== undefined ? is_active : 1,
        work_type || 'full-time',
        work_start_time || '07:00:00',
        work_end_time || '17:00:00',
        grace_period_minutes || 30,
        working_days ? JSON.stringify(working_days) : null,
        schedule_notes || null,
        id
      ]
    );

    // Log salary change if changed
    if (oldEmployee.length > 0 && oldEmployee[0].salary !== salary) {
      await db.query(
        `INSERT INTO salary_history (
          employee_id, old_salary, new_salary, effective_date,
          reason, created_at
        ) VALUES (?, ?, ?, NOW(), 'Manual update', NOW())`,
        [id, oldEmployee[0].salary, salary]
      );
    }

    res.json({
      error: false,
      message: "Employee updated successfully",
      message_kh: "កែប្រែបុគ្គលិកបានជោគជ័យ"
    });

  } catch (error) {
    logError("Employee.update", error, res);
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.body;

    const [data] = await db.query("DELETE FROM employee WHERE id = :id", {
      id,
    });

    res.json({
      data,
      message: "Data delete success!",
    });
  } catch (error) {
    logError("employee.remove", error, res);
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ FIXED: Corrected JOIN syntax and added WHERE clause
    const [employee] = await db.query(
      `SELECT 
        e.*,
        e.is_active as status,
        TIME_FORMAT(e.work_start_time, '%h:%i %p') as work_start_display,
        TIME_FORMAT(e.work_end_time, '%h:%i %p') as work_end_display,
        TIMESTAMPDIFF(HOUR, e.work_start_time, e.work_end_time) as daily_hours,
        CASE 
          WHEN e.gender = 1 THEN 'Male'
          WHEN e.gender = 0 THEN 'Female'
        END AS gender
      FROM employee e
      WHERE e.id = ?`,
      [id]
    );

    if (employee.length === 0) {
      return res.json({
        error: true,
        message: "Employee not found"
      });
    }

    // Parse working_days JSON
    if (employee[0].working_days) {
      try {
        employee[0].working_days = JSON.parse(employee[0].working_days);
      } catch (e) {
        employee[0].working_days = [];
      }
    }

    // Get attendance summary
    const [attendanceSummary] = await db.query(
      `SELECT 
        COUNT(*) as total_days,
        SUM(CASE WHEN status = 'on-time' THEN 1 ELSE 0 END) as on_time_days,
        SUM(CASE WHEN status LIKE 'late%' THEN 1 ELSE 0 END) as late_days,
        AVG(late_minutes) as avg_late_minutes,
        MAX(late_minutes) as max_late_minutes
      FROM attendance
      WHERE user_id = ? AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`,
      [id]
    );

    res.json({
      error: false,
      employee: employee[0],
      attendance_summary: attendanceSummary[0]
    });

  } catch (error) {
    logError("Employee.getById", error, res);
  }
};

exports.getSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const date = req.query.date || moment().format('YYYY-MM-DD');
    const dayOfWeek = moment(date).format('dddd');

    const [employee] = await db.query(
      `SELECT 
        id, name, work_type, work_start_time, work_end_time,
        grace_period_minutes, working_days, schedule_notes
      FROM employee
      WHERE id = ? AND is_active = 1`,
      [id]
    );

    if (employee.length === 0) {
      return res.json({
        error: true,
        message: "Employee not found or inactive"
      });
    }

    // Parse working_days
    let workingDays = [];
    try {
      workingDays = JSON.parse(employee[0].working_days || '[]');
    } catch (e) {
      workingDays = [];
    }

    // Check if today is a working day
    const isWorkingDay = workingDays.includes(dayOfWeek);

    res.json({
      error: false,
      employee_id: employee[0].id,
      name: employee[0].name,
      work_type: employee[0].work_type,
      work_start_time: employee[0].work_start_time,
      work_end_time: employee[0].work_end_time,
      grace_period_minutes: employee[0].grace_period_minutes,
      working_days: workingDays,
      is_working_day: isWorkingDay,
      today: dayOfWeek,
      schedule_notes: employee[0].schedule_notes
    });

  } catch (error) {
    logError("Employee.getSchedule", error, res);
  }
};

exports.getLateStatistics = async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const [statistics] = await db.query(
      `SELECT 
        e.id, e.name, e.position, e.work_type,
        TIME_FORMAT(e.work_start_time, '%h:%i %p') as scheduled_start,
        COUNT(a.id) as total_days,
        SUM(CASE WHEN a.status = 'on-time' THEN 1 ELSE 0 END) as on_time_days,
        SUM(CASE WHEN a.status = 'late-grace' THEN 1 ELSE 0 END) as late_grace_days,
        SUM(CASE WHEN a.status = 'late-penalty' THEN 1 ELSE 0 END) as late_penalty_days,
        ROUND(AVG(a.late_minutes), 1) as avg_late_minutes,
        MAX(a.late_minutes) as max_late_minutes,
        SUM(a.late_minutes) as total_late_minutes,
        ROUND((SUM(CASE WHEN a.status = 'on-time' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100, 1) as on_time_percentage
      FROM employee e
      LEFT JOIN attendance a ON e.id = a.user_id 
        AND a.date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      WHERE e.is_active = 1
      GROUP BY e.id
      HAVING total_days > 0
      ORDER BY late_penalty_days DESC, avg_late_minutes DESC`,
      [parseInt(days)]
    );

    res.json({
      error: false,
      statistics,
      period_days: parseInt(days)
    });

  } catch (error) {
    logError("Employee.getLateStatistics", error, res);
  }
};

exports.createLoginAccount = async (req, res) => {
  try {
    const { employee_id, username, password, role_id } = req.body;
    const currentUserId = req.current_id;

    if (!employee_id || !username || !password || !role_id) {
      return res.json({
        error: true,
        message: "Employee ID, username, password and role are required",
        message_kh: "ត្រូវការ Employee ID, username, password និង role"
      });
    }

    const [employee] = await db.query(
      `SELECT * FROM employee WHERE id = ?`,
      [employee_id]
    );

    if (employee.length === 0) {
      return res.json({
        error: true,
        message: "Employee not found",
        message_kh: "រកមិនឃើញបុគ្គលិក"
      });
    }

    if (employee[0].has_account === 1) {
      return res.json({
        error: true,
        message: "This employee already has a login account",
        message_kh: "បុគ្គលិកនេះមានគណនីរួចហើយ"
      });
    }

    const [existingUser] = await db.query(
      `SELECT id FROM user WHERE username = ?`,
      [username]
    );

    if (existingUser.length > 0) {
      return res.json({
        error: true,
        message: "Username already exists",
        message_kh: "Username នេះមានរួចហើយ"
      });
    }

    const [creator] = await db.query(
      `SELECT branch_name, group_id, role_id FROM user WHERE id = ?`,
      [currentUserId]
    );

    const bcrypt = require("bcrypt");
    const hashedPassword = bcrypt.hashSync(password, 10);

    const [userResult] = await db.query(
      `INSERT INTO user (
        username, password, role_id, name, tel, address,
        branch_name, group_id, is_active, employee_id,
        create_by, create_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NOW())`,
      [
        username,
        hashedPassword,
        role_id,
        employee[0].name,
        employee[0].tel || null,
        employee[0].address || null,
        creator[0].branch_name,
        creator[0].role_id === 29 ? userResult.insertId : creator[0].group_id,
        employee_id,
        req.auth?.name || 'System'
      ]
    );

    const userId = userResult.insertId;

    await db.query(
      `INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`,
      [userId, role_id]
    );

    await db.query(
      `UPDATE employee SET has_account = 1, user_id = ? WHERE id = ?`,
      [userId, employee_id]
    );

    try {
      const clientIP = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'Unknown';
      const userAgent = req.get('User-Agent') || 'Unknown';

      await db.query(`
        INSERT INTO user_activity_log (
          user_id, action_type, action_description,
          ip_address, user_agent, created_at, created_by
        ) VALUES (?, 'ACCOUNT_CREATED', ?, ?, ?, NOW(), ?)
      `, [
        userId,
        `Login account created for employee: ${employee[0].name} (${username})`,
        clientIP,
        userAgent,
        currentUserId
      ]);
    } catch (logError) {
      console.error("Failed to log activity:", logError);
    }

    res.json({
      error: false,
      message: "Login account created successfully",
      message_kh: "បង្កើតគណនី Login បានជោគជ័យ",
      user_id: userId,
      username: username
    });

  } catch (error) {
    console.error("Error creating login account:", error);
    logError("Employee.createLoginAccount", error, res);

    return res.json({
      error: true,
      message: "Failed to create login account",
      message_kh: "មិនអាចបង្កើតគណនី Login បានទេ"
    });
  }
};

exports.checkHasAccount = async (req, res) => {
  try {
    const { id } = req.params;

    const [employee] = await db.query(
      `SELECT 
        e.id, e.name, e.has_account, e.user_id,
        u.username, u.is_active as account_active,
        r.name as role_name
       FROM employee e
       LEFT JOIN user u ON e.user_id = u.id
       LEFT JOIN role r ON u.role_id = r.id
       WHERE e.id = ?`,
      [id]
    );

    if (employee.length === 0) {
      return res.json({
        error: true,
        message: "Employee not found"
      });
    }

    res.json({
      error: false,
      has_account: employee[0].has_account === 1,
      account_info: employee[0].has_account === 1 ? {
        user_id: employee[0].user_id,
        username: employee[0].username,
        role_name: employee[0].role_name,
        is_active: employee[0].account_active === 1
      } : null
    });

  } catch (error) {
    logError("Employee.checkHasAccount", error, res);
  }
};




exports.getAllowedIPs = async (req, res) => {
  try {
    const [ips] = await db.query(
      `SELECT * FROM allowed_ips ORDER BY created_at DESC`
    );

    res.json({
      error: false,
      ips: ips
    });
  } catch (error) {
    logError("Attendance.getAllowedIPs", error, res);
  }
};

// Get current user IP
exports.getMyIP = async (req, res) => {
  try {
    const clientIP = req.ip ||
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.connection.remoteAddress;

    res.json({
      error: false,
      ip: clientIP
    });
  } catch (error) {
    logError("Attendance.getMyIP", error, res);
  }
};

// Add new IP
exports.addAllowedIP = async (req, res) => {
  try {
    const { ip_address, description, is_active } = req.body;
    const currentUserId = req.current_id;

    if (!ip_address || !description) {
      return res.json({
        error: true,
        message: "IP address and description are required"
      });
    }

    // Check if IP already exists
    const [existing] = await db.query(
      `SELECT * FROM allowed_ips WHERE ip_address = ?`,
      [ip_address]
    );

    if (existing.length > 0) {
      return res.json({
        error: true,
        message: "IP address already exists in the list"
      });
    }

    await db.query(
      `INSERT INTO allowed_ips 
       (ip_address, description, is_active, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [ip_address, description, is_active || 1, currentUserId]
    );

    res.json({
      error: false,
      message: "IP address added successfully"
    });
  } catch (error) {
    logError("Attendance.addAllowedIP", error, res);
  }
};

// Update IP
exports.updateAllowedIP = async (req, res) => {
  try {
    const { id, ip_address, description, is_active } = req.body;

    await db.query(
      `UPDATE allowed_ips 
       SET ip_address = ?, description = ?, is_active = ?, updated_at = NOW()
       WHERE id = ?`,
      [ip_address, description, is_active, id]
    );

    res.json({
      error: false,
      message: "IP address updated successfully"
    });
  } catch (error) {
    logError("Attendance.updateAllowedIP", error, res);
  }
};

/**
 * Diagnostic API for IP issues
 * GET /api/attendance/diagnose-ip?ip=xxx.xxx.xxx.xxx
 */
exports.diagnoseIP = async (req, res) => {
  try {
    const { ip } = req.query;



    if (!ip) {
      return res.json({
        error: true,
        message: "IP address is required",
        message_kh: "ត្រូវការអាសយដ្ឋាន IP"
      });
    }

    // 1. Check exact match
    const [exactMatch] = await db.query(
      `SELECT * FROM allowed_ips WHERE ip_address = ?`,
      [ip]
    );

    // 2. Check active match
    const [activeMatch] = await db.query(
      `SELECT * FROM allowed_ips WHERE ip_address = ? AND is_active = 1`,
      [ip]
    );

    // 3. Check with TRIM (remove spaces)
    const trimmedIP = ip.trim();
    const [trimmedMatch] = await db.query(
      `SELECT * FROM allowed_ips WHERE TRIM(ip_address) = ?`,
      [trimmedIP]
    );

    // 4. Get all IPs for comparison
    const [allIPs] = await db.query(
      `SELECT id, ip_address, LENGTH(ip_address) as length, is_active FROM allowed_ips ORDER BY id`
    );

    // 5. Find similar IPs
    const [similarIPs] = await db.query(
      `SELECT * FROM allowed_ips WHERE ip_address LIKE ?`,
      [`%${ip}%`]
    );

    res.json({
      error: false,
      diagnosis: {
        ip_provided: ip,
        ip_length: ip.length,
        trimmed_ip: trimmedIP,
        trimmed_length: trimmedIP.length,

        exact_match: exactMatch.length > 0 ? exactMatch[0] : null,
        exact_match_count: exactMatch.length,

        active_match: activeMatch.length > 0 ? activeMatch[0] : null,
        active_match_count: activeMatch.length,

        trimmed_match: trimmedMatch.length > 0 ? trimmedMatch[0] : null,
        trimmed_match_count: trimmedMatch.length,

        all_ips_in_db: allIPs,
        similar_ips: similarIPs,

        summary: {
          is_exact_match: exactMatch.length > 0,
          is_active_match: activeMatch.length > 0,
          is_trimmed_match: trimmedMatch.length > 0,
          total_ips_in_db: allIPs.length
        },

        recommendations: [
          !exactMatch.length > 0 && "IP not found in database",
          exactMatch.length > 0 && activeMatch.length === 0 && "IP found but is inactive",
          exactMatch.length === 0 && trimmedMatch.length > 0 && "IP found after trimming spaces",
          similarIPs.length > 0 && `Found ${similarIPs.length} similar IPs`
        ].filter(Boolean)
      }
    });

  } catch (error) {
    console.error("Diagnose IP error:", error);
    res.json({
      error: true,
      message: "Diagnosis failed",
      details: error.message
    });
  }
};
// Delete IP
exports.deleteAllowedIP = async (req, res) => {
  try {
    const { id } = req.body;

    await db.query(
      `DELETE FROM allowed_ips WHERE id = ?`,
      [id]
    );

    res.json({
      error: false,
      message: "IP address deleted successfully"
    });
  } catch (error) {
    logError("Attendance.deleteAllowedIP", error, res);
  }
};