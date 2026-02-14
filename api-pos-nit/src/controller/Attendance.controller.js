const { db, isEmpty, logError } = require("../util/helper");
const moment = require("moment");

// ==================== HELPER FUNCTION ====================

/**
 * Format minutes into readable format
 * Example: 108 → "1h 48min" or "1 ម៉ោង 48 នាទី"
 */
const formatLateTime = (minutes) => {
  if (!minutes || minutes <= 0) return null;

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0 && mins > 0) {
    return {
      en: `${hours}h ${mins}min`,
      kh: `${hours} ម៉ោង ${mins} នាទី`,
      hours: hours,
      minutes: mins,
      total_minutes: minutes
    };
  } else if (hours > 0) {
    return {
      en: `${hours}h`,
      kh: `${hours} ម៉ោង`,
      hours: hours,
      minutes: 0,
      total_minutes: minutes
    };
  } else {
    return {
      en: `${mins}min`,
      kh: `${mins} នាទី`,
      hours: 0,
      minutes: mins,
      total_minutes: minutes
    };
  }
};

// ==================== IP MANAGEMENT ====================

/**
 * Check if IP address is allowed
 * GET /api/attendance/check-ip?ip=xxx.xxx.xxx.xxx
 */
exports.checkIP = async (req, res) => {
  try {
    const { ip } = req.query;
    // Strip everything except numbers, dots, and colons (for IPv6)
    const sanitizedIp = ip ? ip.replace(/[^0-9a-fA-F.:]/g, '').trim() : "";

    if (isEmpty(sanitizedIp)) {
      return res.json({
        error: false,
        allowed: false,
        message: "No IP provided"
      });
    }

    const [result] = await db.query(
      "SELECT * FROM allowed_ips WHERE (TRIM(ip_address) = ? OR ip_address LIKE ?) AND is_active = 1",
      [sanitizedIp, sanitizedIp]
    );

    // Logging to a temp file for debugging
    try {
      const logMsg = `${new Date().toISOString()} - IP Check: [${sanitizedIp}] - Found: ${result.length > 0}\n`;
      fsSync.appendFileSync(path.join(__dirname, "../../ip_debug.log"), logMsg);
    } catch (e) { }



    res.json({
      error: false,
      allowed: result.length > 0,
      ip: sanitizedIp,
      ip_info: result.length > 0 ? result[0] : null
    });
  } catch (error) {
    logError("Attendance.checkIP", error, res);
  }
};

// ==================== TODAY'S ATTENDANCE ====================

/**
 * Get today's attendance for current user
 * GET /api/attendance/today
 */
exports.getTodayAttendance = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const today = moment().format('YYYY-MM-DD');

    const [attendance] = await db.query(
      `SELECT 
        a.*,
        u.name as user_name,
        u.email as user_email,
        TIME_FORMAT(a.scheduled_start_time, '%h:%i %p') as scheduled_start_display,
        TIME_FORMAT(a.check_in_time, '%h:%i %p') as check_in_display
      FROM attendance a
      LEFT JOIN user u ON a.user_id = u.id
      WHERE a.user_id = ? AND DATE(a.date) = ?`,
      [currentUserId, today]
    );

    if (attendance.length > 0) {
      // Add formatted late time
      const record = attendance[0];
      if (record.late_minutes && record.late_minutes > 0) {
        record.late_time_formatted = formatLateTime(record.late_minutes);
      }
    }

    res.json({
      error: false,
      attendance: attendance.length > 0 ? attendance[0] : null
    });
  } catch (error) {
    logError("Attendance.getTodayAttendance", error, res);
  }
};

// ==================== CHECK IN ====================

exports.checkIn = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { ip_address, location, check_in_time } = req.body;
    const sanitizedIp = ip_address ? ip_address.replace(/[^0-9a-fA-F.:]/g, '').trim() : "";
    const today = moment().format('YYYY-MM-DD');
    const checkInTime = check_in_time || moment().format('YYYY-MM-DD HH:mm:ss');

    // 1. Check IP validation
    const [allowedIP] = await db.query(
      "SELECT * FROM allowed_ips WHERE TRIM(ip_address) = ? AND is_active = 1",
      [sanitizedIp]
    );

    if (allowedIP.length === 0) {
      const [allIPs] = await db.query(
        "SELECT ip_address, description FROM allowed_ips WHERE is_active = 1"
      );

      return res.json({
        error: true,
        message: `IP address (${sanitizedIp}) is not allowed`,
        message_kh: `អាសយដ្ឋាន IP (${sanitizedIp}) មិនត្រូវបានអនុញ្ញាត`,
        allowed_ips: allIPs,
        your_ip: sanitizedIp
      });
    }

    // 2. Check duplicate check-in
    const [existing] = await db.query(
      `SELECT * FROM attendance WHERE user_id = ? AND DATE(date) = ?`,
      [currentUserId, today]
    );

    if (existing.length > 0) {
      return res.json({
        error: true,
        message: "Already checked in today",
        message_kh: "អ្នកបានចូលរួចហើយថ្ងៃនេះ",
        attendance: existing[0]
      });
    }

    // 3. GET EMPLOYEE WORK SCHEDULE
    const [employee] = await db.query(
      `SELECT 
        e.id, e.name, e.work_type, 
        e.work_start_time, e.work_end_time,
        e.grace_period_minutes, e.working_days
      FROM employee e
      WHERE e.user_id = ? AND e.is_active = 1`,
      [currentUserId]
    );

    let scheduledStartTime = '07:00:00';
    let scheduledEndTime = '17:00:00';
    let gracePeriodMinutes = 30;
    let workType = 'full-time';

    if (employee.length > 0) {
      scheduledStartTime = employee[0].work_start_time || '07:00:00';
      scheduledEndTime = employee[0].work_end_time || '17:00:00';
      gracePeriodMinutes = employee[0].grace_period_minutes || 30;
      workType = employee[0].work_type || 'full-time';

      // Check if today is working day
      const dayOfWeek = moment().format('dddd');
      let workingDays = [];
      try {
        workingDays = JSON.parse(employee[0].working_days || '[]');
      } catch (e) {
        workingDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      }

      if (!workingDays.includes(dayOfWeek)) {
        return res.json({
          error: true,
          message: `Today (${dayOfWeek}) is not your working day`,
          message_kh: `ថ្ងៃនេះ (${dayOfWeek}) មិនមែនជាថ្ងៃធ្វើការរបស់អ្នកទេ`
        });
      }
    }

    // 4. CALCULATE LATE MINUTES
    const checkInMoment = moment(checkInTime);
    const scheduledStartMoment = moment(`${today} ${scheduledStartTime}`);
    const lateMinutes = checkInMoment.diff(scheduledStartMoment, 'minutes');

    // 5. DETERMINE STATUS
    let status;
    let statusMessage;
    let statusMessageKh;

    if (lateMinutes <= 0) {
      status = 'on-time';
      statusMessage = `Checked in on time (${Math.abs(lateMinutes)} minutes early)`;
      statusMessageKh = `ចូលត្រឹមពេល (មុន ${Math.abs(lateMinutes)} នាទី)`;
    } else if (lateMinutes > 0 && lateMinutes <= gracePeriodMinutes) {
      const formatted = formatLateTime(lateMinutes);
      status = 'late-grace';
      statusMessage = `Late ${formatted.en} (within grace period)`;
      statusMessageKh = `យឺត ${formatted.kh} (នៅក្នុងកំរិតអត់អោនបាន)`;
    } else {
      const formatted = formatLateTime(lateMinutes);
      status = 'late-penalty';
      statusMessage = `Late ${formatted.en} (PENALTY)`;
      statusMessageKh = `យឺត ${formatted.kh} (មានការពិន័យ)`;
    }

    // 6. Insert attendance record
    const [result] = await db.query(
      `INSERT INTO attendance (
        user_id, date, check_in_time, status, ip_address, location,
        scheduled_start_time, scheduled_end_time, late_minutes, work_type,
        create_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        currentUserId, today, checkInTime, status, ip_address, location,
        scheduledStartTime, scheduledEndTime, lateMinutes, workType
      ]
    );

    // 7. Get inserted record with formatted data
    const [newAttendance] = await db.query(
      `SELECT 
        a.*,
        u.name as user_name,
        u.email as user_email,
        TIME_FORMAT(a.scheduled_start_time, '%h:%i %p') as scheduled_start_display,
        TIME_FORMAT(a.check_in_time, '%h:%i %p') as check_in_display
      FROM attendance a
      LEFT JOIN user u ON a.user_id = u.id
      WHERE a.id = ?`,
      [result.insertId]
    );

    // Add formatted late time
    const lateTimeFormatted = lateMinutes > 0 ? formatLateTime(lateMinutes) : null;

    res.json({
      error: false,
      message: statusMessage,
      message_kh: statusMessageKh,
      attendance: newAttendance[0],
      attendance_id: result.insertId,
      status: status,
      late_info: {
        late_minutes: lateMinutes,
        late_time_formatted: lateTimeFormatted, // ✅ NEW: Formatted time
        scheduled_start: scheduledStartTime,
        actual_check_in: moment(checkInTime).format('HH:mm:ss'),
        grace_period: gracePeriodMinutes,
        is_late: lateMinutes > 0,
        has_penalty: lateMinutes > gracePeriodMinutes
      }
    });

  } catch (error) {
    logError("Attendance.checkIn", error, res);
  }
};

// ✅ FIXED CHECK OUT FUNCTION - Prevents NaN errors

exports.checkOut = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { attendance_id, check_out_time } = req.body;
    const checkOutTime = check_out_time || moment().format('YYYY-MM-DD HH:mm:ss');

    // 1. Verify attendance
    const [attendance] = await db.query(
      `SELECT * FROM attendance WHERE id = ? AND user_id = ?`,
      [attendance_id, currentUserId]
    );

    if (attendance.length === 0) {
      return res.json({
        error: true,
        message: "Attendance record not found"
      });
    }

    if (attendance[0].check_out_time) {
      return res.json({
        error: true,
        message: "Already checked out",
        attendance: attendance[0]
      });
    }

    // 2. Calculate working hours
    const checkIn = moment(attendance[0].check_in_time);
    const checkOut = moment(checkOutTime);
    const workingHours = checkOut.diff(checkIn, 'hours', true);

    // ✅ Validate working hours
    if (isNaN(workingHours) || workingHours < 0) {
      return res.json({
        error: true,
        message: "Invalid working hours calculation"
      });
    }

    // 3. ✅ Calculate early departure minutes WITH VALIDATION
    let earlyDepartureMinutes = 0;
    let scheduledEndTime = attendance[0].scheduled_end_time;

    // Check if scheduled_end_time exists and is valid
    if (scheduledEndTime && scheduledEndTime !== '00:00:00' && scheduledEndTime !== null) {
      try {
        const scheduledEnd = moment(`${attendance[0].date} ${scheduledEndTime}`);

        // Validate that scheduledEnd is a valid moment
        if (scheduledEnd.isValid()) {
          earlyDepartureMinutes = scheduledEnd.diff(checkOut, 'minutes');

          // Double check for NaN
          if (isNaN(earlyDepartureMinutes)) {
            console.warn('earlyDepartureMinutes is NaN after calculation, setting to 0');
            earlyDepartureMinutes = 0;
          }
        } else {
          console.warn('Invalid scheduled_end_time:', scheduledEndTime);
          earlyDepartureMinutes = 0;
        }
      } catch (err) {
        console.error('Error calculating early departure:', err);
        earlyDepartureMinutes = 0;
      }
    } else {
      earlyDepartureMinutes = 0;
    }

    // 4. Update attendance
    await db.query(
      `UPDATE attendance 
       SET check_out_time = ?, 
           working_hours = ?,
           early_departure_minutes = ?,
           update_at = NOW()
       WHERE id = ?`,
      [checkOutTime, workingHours.toFixed(2), earlyDepartureMinutes, attendance_id]
    );

    // 5. Get updated record
    const [updatedAttendance] = await db.query(
      `SELECT 
        a.*,
        u.name as user_name,
        u.email as user_email,
        TIME_FORMAT(a.scheduled_end_time, '%h:%i %p') as scheduled_end_display,
        TIME_FORMAT(a.check_out_time, '%h:%i %p') as check_out_display
      FROM attendance a
      LEFT JOIN user u ON a.user_id = u.id
      WHERE a.id = ?`,
      [attendance_id]
    );

    // Format early departure or overtime
    let earlyTimeFormatted = null;
    if (earlyDepartureMinutes !== 0 && !isNaN(earlyDepartureMinutes)) {
      earlyTimeFormatted = formatLateTime(Math.abs(earlyDepartureMinutes));
    }

    let earlyMessage = '';
    let earlyMessageKh = '';

    if (earlyDepartureMinutes > 0 && earlyTimeFormatted) {
      earlyMessage = ` (Left ${earlyTimeFormatted.en} early)`;
      earlyMessageKh = ` (ចេញមុនម៉ោង ${earlyTimeFormatted.kh})`;
    } else if (earlyDepartureMinutes < 0 && earlyTimeFormatted) {
      earlyMessage = ` (Worked ${earlyTimeFormatted.en} overtime)`;
      earlyMessageKh = ` (ធ្វើការលើសម៉ោង ${earlyTimeFormatted.kh})`;
    }

    res.json({
      error: false,
      message: `Checked out successfully${earlyMessage}`,
      message_kh: `ចេញបានជោគជ័យ${earlyMessageKh}`,
      attendance: updatedAttendance[0],
      working_hours: workingHours.toFixed(2),
      early_departure_info: {
        early_departure_minutes: earlyDepartureMinutes,
        early_time_formatted: earlyTimeFormatted,
        scheduled_end: scheduledEndTime || null,
        actual_check_out: moment(checkOutTime).format('HH:mm:ss'),
        left_early: earlyDepartureMinutes > 0,
        worked_overtime: earlyDepartureMinutes < 0
      }
    });

  } catch (error) {
    logError("Attendance.checkOut", error, res);
  }
};

// ==================== ATTENDANCE LIST ====================

exports.getAttendanceList = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    let { from_date, to_date, user_id, status_filter } = req.query;

    // Default date range
    if (isEmpty(from_date) || isEmpty(to_date)) {
      to_date = moment().format('YYYY-MM-DD');
      from_date = moment().startOf('month').format('YYYY-MM-DD');
    }

    // Get current user role
    const [currentUser] = await db.query(
      `SELECT role_id, branch_name FROM user WHERE id = ?`,
      [currentUserId]
    );

    let whereConditions = [`DATE(a.date) BETWEEN ? AND ?`];
    let params = [from_date, to_date];

    // Role-based filtering
    if (currentUser[0] && currentUser[0].role_id !== 29) {
      if (currentUser[0].branch_name) {
        whereConditions.push(`u.branch_name = ?`);
        params.push(currentUser[0].branch_name);
      } else {
        whereConditions.push(`a.user_id = ?`);
        params.push(currentUserId);
      }
    }

    if (!isEmpty(user_id) && user_id !== 'all') {
      whereConditions.push(`a.user_id = ?`);
      params.push(user_id);
    }

    if (status_filter && status_filter !== 'all') {
      whereConditions.push(`a.status = ?`);
      params.push(status_filter);
    }

    const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

    // Get attendance with formatted times
    const [attendance] = await db.query(
      `SELECT 
        a.*,
        u.name as user_name,
        u.email as user_email,
        u.branch_name,
        e.work_type,
        e.position,
        TIME_FORMAT(a.scheduled_start_time, '%h:%i %p') as scheduled_start_display,
        TIME_FORMAT(a.scheduled_end_time, '%h:%i %p') as scheduled_end_display,
        TIME_FORMAT(a.check_in_time, '%h:%i %p') as check_in_display,
        TIME_FORMAT(a.check_out_time, '%h:%i %p') as check_out_display,
        CASE 
          WHEN a.late_minutes <= 0 THEN 'On Time'
          WHEN a.late_minutes > 0 AND a.late_minutes <= e.grace_period_minutes THEN CONCAT('Late ', a.late_minutes, ' min (Grace)')
          WHEN a.late_minutes > e.grace_period_minutes THEN CONCAT('Late ', a.late_minutes, ' min (PENALTY)')
          ELSE 'Unknown'
        END as late_status_display
      FROM attendance a
      INNER JOIN user u ON a.user_id = u.id
      LEFT JOIN employee e ON u.id = e.user_id
      ${whereClause}
      ORDER BY a.date DESC, a.check_in_time DESC`,
      params
    );

    // ✅ Add formatted late time to each record
    attendance.forEach(record => {
      if (record.late_minutes && record.late_minutes > 0) {
        record.late_time_formatted = formatLateTime(record.late_minutes);
      }
      if (record.early_departure_minutes && record.early_departure_minutes !== 0) {
        record.early_time_formatted = formatLateTime(Math.abs(record.early_departure_minutes));
      }
    });

    // Calculate statistics
    const statistics = {
      total: attendance.length,
      on_time: attendance.filter(a => a.status === 'on-time').length,
      late_grace: attendance.filter(a => a.status === 'late-grace').length,
      late_penalty: attendance.filter(a => a.status === 'late-penalty').length,
      absent: attendance.filter(a => a.status === 'absent').length,
      avg_late_minutes: attendance.length > 0
        ? (attendance.reduce((sum, a) => sum + (a.late_minutes || 0), 0) / attendance.length).toFixed(1)
        : 0,
      total_late_minutes: attendance.reduce((sum, a) => sum + (a.late_minutes > 0 ? a.late_minutes : 0), 0)
    };

    res.json({
      error: false,
      attendance,
      statistics,
      filter_info: {
        from_date,
        to_date,
        user_id: user_id || 'all',
        status_filter: status_filter || 'all',
        is_super_admin: currentUser[0]?.role_id === 29
      }
    });

  } catch (error) {
    logError("Attendance.getAttendanceList", error, res);
  }
};

// ==================== LATE REPORT ====================

exports.getLateReport = async (req, res) => {
  try {
    const { from_date, to_date, department_id } = req.query;

    let whereConditions = [];
    let params = [];

    if (from_date && to_date) {
      whereConditions.push(`a.date BETWEEN ? AND ?`);
      params.push(from_date, to_date);
    }

    if (department_id) {
      whereConditions.push(`e.department_id = ?`);
      params.push(department_id);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const [report] = await db.query(
      `SELECT 
        u.id as user_id,
        u.name,
        e.position,
        e.department_id,
        d.name as department_name,
        e.work_type,
        TIME_FORMAT(e.work_start_time, '%h:%i %p') as scheduled_start,
        COUNT(a.id) as total_days,
        SUM(CASE WHEN a.status = 'on-time' THEN 1 ELSE 0 END) as on_time_days,
        SUM(CASE WHEN a.status = 'late-grace' THEN 1 ELSE 0 END) as late_grace_days,
        SUM(CASE WHEN a.status = 'late-penalty' THEN 1 ELSE 0 END) as late_penalty_days,
        ROUND(AVG(CASE WHEN a.late_minutes > 0 THEN a.late_minutes END), 1) as avg_late_minutes,
        MAX(a.late_minutes) as max_late_minutes,
        SUM(CASE WHEN a.late_minutes > 0 THEN a.late_minutes ELSE 0 END) as total_late_minutes,
        ROUND((SUM(CASE WHEN a.status = 'on-time' THEN 1 ELSE 0 END) / COUNT(a.id)) * 100, 1) as punctuality_rate
      FROM user u
      INNER JOIN employee e ON u.id = e.user_id
      LEFT JOIN department d ON e.department_id = d.id
      LEFT JOIN attendance a ON u.id = a.user_id ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
      WHERE e.is_active = 1
      GROUP BY u.id
      HAVING total_days > 0
      ORDER BY late_penalty_days DESC, avg_late_minutes DESC`,
      params
    );

    // ✅ Add formatted times
    report.forEach(record => {
      if (record.avg_late_minutes && record.avg_late_minutes > 0) {
        record.avg_late_time_formatted = formatLateTime(Math.round(record.avg_late_minutes));
      }
      if (record.max_late_minutes && record.max_late_minutes > 0) {
        record.max_late_time_formatted = formatLateTime(record.max_late_minutes);
      }
      if (record.total_late_minutes && record.total_late_minutes > 0) {
        record.total_late_time_formatted = formatLateTime(record.total_late_minutes);
      }
    });

    res.json({
      error: false,
      report,
      summary: {
        total_employees: report.length,
        avg_punctuality_rate: report.length > 0
          ? (report.reduce((sum, r) => sum + parseFloat(r.punctuality_rate), 0) / report.length).toFixed(1)
          : 0
      }
    });

  } catch (error) {
    logError("Attendance.getLateReport", error, res);
  }
};

// ==================== DASHBOARD STATISTICS ====================

/**
 * Get attendance statistics for dashboard
 * GET /api/attendance/dashboard-stats?date=YYYY-MM-DD
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || moment().format('YYYY-MM-DD');
    const yesterday = moment(targetDate).subtract(1, 'days').format('YYYY-MM-DD');
    const currentUserId = req.current_id;

    // Get current user branch to filter
    const [currentUser] = await db.query(
      `SELECT branch_name, role_id FROM user WHERE id = ?`,
      [currentUserId]
    );

    const isSuperAdmin = currentUser[0]?.role_id === 29;
    const branchName = currentUser[0]?.branch_name;

    // Helper to get stats for a specific date
    const getStatsForDate = async (dt) => {
      let branchFilter = "";
      let params = [dt];

      if (!isSuperAdmin && branchName) {
        branchFilter = " AND u.branch_name = ?";
        params.push(branchName);
      }

      const sql = `
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN a.status = 'on-time' THEN 1 ELSE 0 END) as on_time,
          SUM(CASE WHEN a.status LIKE 'late%' THEN 1 ELSE 0 END) as late,
          SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as absent,
          SUM(CASE WHEN a.check_in_time IS NOT NULL AND a.check_in_time < a.scheduled_start_time THEN 1 ELSE 0 END) as early_clock_in,
          SUM(CASE WHEN a.check_out_time IS NULL AND a.check_in_time IS NOT NULL THEN 1 ELSE 0 END) as no_clock_out
        FROM attendance a
        INNER JOIN user u ON a.user_id = u.id
        WHERE DATE(a.date) = ? ${branchFilter}
      `;
      const [result] = await db.query(sql, params);
      return result[0];
    };

    const todayStats = await getStatsForDate(targetDate);
    const yesterdayStats = await getStatsForDate(yesterday);

    // Get Total Employees for "No clock-in" calculation
    let totalEmpSql = "SELECT COUNT(*) as count FROM employee e INNER JOIN user u ON e.user_id = u.id WHERE e.is_active = 1";
    let totalEmpParams = [];
    if (!isSuperAdmin && branchName) {
      totalEmpSql += " AND u.branch_name = ?";
      totalEmpParams.push(branchName);
    }
    const [totalEmpResult] = await db.query(totalEmpSql, totalEmpParams);
    const totalEmployees = totalEmpResult[0].count;

    res.json({
      error: false,
      date: targetDate,
      summary: {
        present: {
          total: todayStats.on_time + todayStats.late,
          on_time: todayStats.on_time || 0,
          late: todayStats.late || 0,
          early: todayStats.early_clock_in || 0,
          comparison: {
            on_time: todayStats.on_time - yesterdayStats.on_time,
            late: todayStats.late - yesterdayStats.late,
            early: todayStats.early_clock_in - yesterdayStats.early_clock_in
          }
        },
        not_present: {
          absent: todayStats.absent || 0,
          no_clock_in: Math.max(0, totalEmployees - (todayStats.on_time + todayStats.late + todayStats.absent)),
          no_clock_out: todayStats.no_clock_out || 0,
          comparison: {
            absent: todayStats.absent - yesterdayStats.absent
          }
        },
        away: {
          day_off: 0, // Need leave management table for this
          time_off: 0,
          comparison: {
            day_off: 0,
            time_off: 0
          }
        }
      }
    });

  } catch (error) {
    logError("Attendance.getDashboardStats", error, res);
  }
};

// ==================== OTHER REPORTS ====================

exports.getAttendanceReport = async (req, res) => {
  try {
    const { from_date, to_date, user_id } = req.query;

    let whereConditions = [];
    let params = [];

    if (!isEmpty(from_date) && !isEmpty(to_date)) {
      whereConditions.push(`DATE(a.date) BETWEEN ? AND ?`);
      params.push(from_date, to_date);
    }

    if (!isEmpty(user_id)) {
      whereConditions.push(`a.user_id = ?`);
      params.push(user_id);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const [report] = await db.query(
      `SELECT 
        u.id as user_id,
        u.name as user_name,
        u.email,
        u.branch_name,
        COUNT(DISTINCT DATE(a.date)) as days_present,
        SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) as days_late,
        SUM(CASE WHEN a.status = 'on-time' THEN 1 ELSE 0 END) as days_on_time,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as days_absent,
        AVG(a.working_hours) as avg_working_hours,
        SUM(a.working_hours) as total_working_hours,
        MIN(a.check_in_time) as earliest_check_in,
        MAX(a.check_out_time) as latest_check_out
      FROM user u
      LEFT JOIN attendance a ON u.id = a.user_id ${whereConditions.length > 0 ? 'AND ' + whereConditions.join(' AND ') : ''}
      WHERE u.is_active = 1
      GROUP BY u.id, u.name, u.email, u.branch_name
      HAVING days_present > 0
      ORDER BY days_present DESC`,
      params
    );

    res.json({
      error: false,
      report,
      summary: {
        total_employees: report.length,
        avg_attendance: report.length > 0
          ? (report.reduce((sum, r) => sum + r.days_present, 0) / report.length).toFixed(1)
          : 0
      }
    });
  } catch (error) {
    logError("Attendance.getAttendanceReport", error, res);
  }
};

exports.getMonthlySummary = async (req, res) => {
  try {
    const { year, month } = req.query;

    const targetYear = year || moment().year();
    const targetMonth = month || moment().month() + 1;

    const [summary] = await db.query(
      `SELECT 
        DATE(date) as date,
        COUNT(*) as total_employees,
        SUM(CASE WHEN status = 'on-time' THEN 1 ELSE 0 END) as on_time_count,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late_count,
        AVG(working_hours) as avg_working_hours
      FROM attendance
      WHERE YEAR(date) = ? AND MONTH(date) = ?
      GROUP BY DATE(date)
      ORDER BY date DESC`,
      [targetYear, targetMonth]
    );

    res.json({
      error: false,
      summary,
      month: `${targetYear}-${String(targetMonth).padStart(2, '0')}`
    });
  } catch (error) {
    logError("Attendance.getMonthlySummary", error, res);
  }
};

exports.markAbsent = async (req, res) => {
  try {
    const { user_id, date, reason } = req.body;

    const [existing] = await db.query(
      `SELECT * FROM attendance WHERE user_id = ? AND DATE(date) = ?`,
      [user_id, date]
    );

    if (existing.length > 0) {
      return res.json({
        error: true,
        message: "Attendance record already exists for this date",
        message_kh: "មានកំណត់ត្រាវត្តមានរួចហើយសម្រាប់ថ្ងៃនេះ"
      });
    }

    await db.query(
      `INSERT INTO attendance 
       (user_id, date, status, notes, create_at) 
       VALUES (?, ?, 'absent', ?, NOW())`,
      [user_id, date, reason || 'Marked absent by admin']
    );

    res.json({
      error: false,
      message: "Marked as absent successfully",
      message_kh: "បានសម្គាល់ថាអវត្តមានជោគជ័យ"
    });
  } catch (error) {
    logError("Attendance.markAbsent", error, res);
  }
};

module.exports = exports;
