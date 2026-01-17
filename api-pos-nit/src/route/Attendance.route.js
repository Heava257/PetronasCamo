const { validate_token } = require("../controller/auth.controller");
const {
  checkIP,
  getTodayAttendance,
  checkIn,
  checkOut,
  getAttendanceList,
  getAttendanceReport,
  getMonthlySummary,
  markAbsent,
  getLateReport  // ✅ Add this
} = require("../controller/Attendance.controller");

module.exports = (app) => {

  // ==================== IP MANAGEMENT ====================

  /**
   * Check if IP is allowed
   * GET /api/attendance/check-ip
   * No permission required - returns current IP status
   */
  app.get("/api/attendance/check-ip",
    validate_token(),
    checkIP
  );

  // ==================== EMPLOYEE ATTENDANCE ====================

  /**
   * Get today's attendance for current user
   * GET /api/attendance/today
   */
  app.get("/api/attendance/today",
    validate_token(),
    getTodayAttendance
  );

  /**
   * Check in
   * POST /api/attendance/check-in
   * Body: { ip_address, location, check_in_time (optional) }
   * Returns: attendance record with late status
   */
  app.post("/api/attendance/check-in",
    validate_token(),
    checkIn
  );

  /**
   * Check out
   * POST /api/attendance/check-out
   * Body: { attendance_id, check_out_time (optional) }
   * Returns: attendance record with working hours
   */
  app.post("/api/attendance/check-out",
    validate_token(),
    checkOut
  );

  /**
   * Get attendance list with filters
   * GET /api/attendance/list?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD&status_filter=all
   * Query params:
   *  - from_date: start date
   *  - to_date: end date
   *  - user_id: filter by user (optional)
   *  - status_filter: all|on-time|late-grace|late-penalty|absent
   * Accessible by all authenticated users
   * Filtering is handled in controller based on role
   */
  app.get("/api/attendance/list",
    validate_token(),
    getAttendanceList
  );

  // ==================== REPORTS ====================

  /**
   * Get attendance report (admin/manager feature)
   * GET /api/attendance/report?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD&user_id=X
   * Returns: aggregated attendance statistics per employee
   */
  app.get("/api/attendance/report",
    validate_token("attendance.report"),
    getAttendanceReport
  );

  /**
   * ✅ NEW: Get late report with statistics
   * GET /api/attendance/report/late?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
   * Query params:
   *  - from_date: start date
   *  - to_date: end date
   *  - department_id: filter by department (optional)
   * Returns: late statistics per employee (on-time, grace, penalty)
   */
  app.get("/api/attendance/report/late",
    validate_token("attendance.report"),
    getLateReport
  );

  /**
   * Get monthly summary
   * GET /api/attendance/monthly-summary?year=2024&month=1
   * Returns: daily statistics for the specified month
   */
  app.get("/api/attendance/monthly-summary",
    validate_token("attendance.report"),
    getMonthlySummary
  );

  // ==================== ADMIN OPERATIONS ====================

  /**
   * Manually mark employee as absent (admin only)
   * POST /api/attendance/mark-absent
   * Body: { user_id, date, reason }
   */
  app.post("/api/attendance/mark-absent",
    validate_token("attendance.manage"),
    markAbsent
  );

};