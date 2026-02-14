// ==================== SALARY & DEDUCTION MANAGEMENT ====================

const { db, isEmpty, logError } = require("../util/helper");
const moment = require("moment");

/**
 * Get Salary Report with Deductions
 * GET /api/attendance/salary-report?from_date=YYYY-MM-DD&to_date=YYYY-MM-DD&user_id=X
 */
exports.getSalaryReport = async (req, res) => {
  try {
    const { from_date, to_date, user_id } = req.query;
    const currentUserId = req.current_id;

    // Default date range (current month)
    const fromDate = from_date || moment().startOf('month').format('YYYY-MM-DD');
    const toDate = to_date || moment().endOf('month').format('YYYY-MM-DD');

    // Get current user role
    const [currentUser] = await db.query(
      `SELECT role_id, branch_name FROM user WHERE id = ?`,
      [currentUserId]
    );

    // ✅ Build WHERE conditions for employee filtering only
    let whereConditions = ['e.is_active = 1'];
    let params = [];

    // Role-based filtering
    if (currentUser[0] && currentUser[0].role_id !== 1) {
      if (currentUser[0].branch_name) {
        whereConditions.push(`u.branch_name = ?`);
        params.push(currentUser[0].branch_name);
      } else {
        whereConditions.push(`u.id = ?`);
        params.push(currentUserId);
      }
    }

    if (!isEmpty(user_id) && user_id !== 'all') {
      whereConditions.push(`u.id = ?`);
      params.push(user_id);
    }

    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}` 
      : '';

    // Add date range parameters for attendance filtering in LEFT JOIN
    params.push(fromDate, toDate);

    // ✅ Fixed: Show ALL employees, filter attendance in JOIN condition
    const [report] = await db.query(
      `SELECT 
        u.id as user_id,
        u.name as employee_name,
        u.email,
        e.position,
        COALESCE(e.monthly_salary, 0) as monthly_salary,
        
        -- Working Days
        COUNT(DISTINCT CASE WHEN a.date IS NOT NULL THEN DATE(a.date) END) as days_worked,
        
        -- Attendance Status
        SUM(CASE WHEN a.status = 'on-time' THEN 1 ELSE 0 END) as days_on_time,
        SUM(CASE WHEN a.status = 'late-grace' THEN 1 ELSE 0 END) as days_late_grace,
        SUM(CASE WHEN a.status = 'late-penalty' THEN 1 ELSE 0 END) as days_late_penalty,
        SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) as days_absent,
        
        -- Late Minutes
        COALESCE(SUM(CASE WHEN a.late_minutes > e.grace_period_minutes THEN a.late_minutes ELSE 0 END), 0) as total_penalty_late_minutes,
        
        -- Working Hours
        COALESCE(SUM(a.working_hours), 0) as total_working_hours,
        COALESCE(AVG(a.working_hours), 0) as avg_working_hours,
        
        -- Deduction Settings
        COALESCE(e.late_deduction_per_minute, 0) as late_deduction_per_minute,
        COALESCE(e.absent_deduction_per_day, 0) as absent_deduction_per_day,
        COALESCE(e.expected_working_days, 26) as expected_working_days,
        
        -- Calculate Deductions
        ROUND(
          (COALESCE(SUM(CASE WHEN a.late_minutes > e.grace_period_minutes THEN a.late_minutes ELSE 0 END), 0) * 
          COALESCE(e.late_deduction_per_minute, 0))
        , 2) as late_deduction_amount,
        
        ROUND(
          (SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) * 
          COALESCE(e.absent_deduction_per_day, 0))
        , 2) as absent_deduction_amount
        
      FROM user u
      INNER JOIN employee e ON u.id = e.user_id
      LEFT JOIN attendance a ON u.id = a.user_id 
        AND DATE(a.date) BETWEEN ? AND ?
      ${whereClause}
      GROUP BY u.id, u.name, u.email, e.position, e.monthly_salary,
               e.late_deduction_per_minute, e.absent_deduction_per_day, e.expected_working_days
      ORDER BY u.name`,
      params
    );

    // Calculate final salary for each employee
    report.forEach(emp => {
      const monthlySalary = parseFloat(emp.monthly_salary) || 0;
      const lateDeduction = parseFloat(emp.late_deduction_amount) || 0;
      const absentDeduction = parseFloat(emp.absent_deduction_amount) || 0;
      
      emp.total_deductions = (lateDeduction + absentDeduction).toFixed(2);
      emp.net_salary = (monthlySalary - lateDeduction - absentDeduction).toFixed(2);
      emp.deduction_percentage = monthlySalary > 0 ? 
        ((lateDeduction + absentDeduction) / monthlySalary * 100).toFixed(2) : 0;
    });

    // Calculate summary
    const summary = {
      total_employees: report.length,
      total_base_salary: report.reduce((sum, emp) => sum + parseFloat(emp.monthly_salary || 0), 0).toFixed(2),
      total_late_deductions: report.reduce((sum, emp) => sum + parseFloat(emp.late_deduction_amount || 0), 0).toFixed(2),
      total_absent_deductions: report.reduce((sum, emp) => sum + parseFloat(emp.absent_deduction_amount || 0), 0).toFixed(2),
      total_deductions: report.reduce((sum, emp) => sum + parseFloat(emp.total_deductions || 0), 0).toFixed(2),
      total_net_salary: report.reduce((sum, emp) => sum + parseFloat(emp.net_salary || 0), 0).toFixed(2)
    };

    res.json({
      error: false,
      report,
      summary,
      period: {
        from_date: fromDate,
        to_date: toDate,
        month: moment(fromDate).format('MMMM YYYY')
      }
    });

  } catch (error) {
    logError("Attendance.getSalaryReport", error, res);
  }
};

/**
 * Get Individual Employee Salary Detail
 * GET /api/attendance/salary-detail?user_id=X&from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
 */
exports.getSalaryDetail = async (req, res) => {
  try {
    const { user_id, from_date, to_date } = req.query;

    if (isEmpty(user_id)) {
      return res.json({
        error: true,
        message: "User ID is required"
      });
    }

    const fromDate = from_date || moment().startOf('month').format('YYYY-MM-DD');
    const toDate = to_date || moment().endOf('month').format('YYYY-MM-DD');

    // ✅ Get employee info without department
    const [employee] = await db.query(
      `SELECT 
        u.id, u.name, u.email,
        e.position, e.monthly_salary, e.expected_working_days,
        e.late_deduction_per_minute, e.absent_deduction_per_day,
        e.grace_period_minutes
      FROM user u
      INNER JOIN employee e ON u.id = e.user_id
      WHERE u.id = ? AND e.is_active = 1`,
      [user_id]
    );

    if (employee.length === 0) {
      return res.json({
        error: true,
        message: "Employee not found"
      });
    }

    // Get detailed attendance records
    const [attendance] = await db.query(
      `SELECT 
        a.*,
        CASE 
          WHEN a.status = 'late-penalty' AND a.late_minutes > ? THEN 
            ROUND(a.late_minutes * ?, 2)
          ELSE 0
        END as daily_late_deduction,
        CASE 
          WHEN a.status = 'absent' THEN ?
          ELSE 0
        END as daily_absent_deduction
      FROM attendance a
      WHERE a.user_id = ? AND DATE(a.date) BETWEEN ? AND ?
      ORDER BY a.date DESC`,
      [
        employee[0].grace_period_minutes,
        employee[0].late_deduction_per_minute,
        employee[0].absent_deduction_per_day,
        user_id,
        fromDate,
        toDate
      ]
    );

    // Calculate totals
    const totals = {
      days_worked: attendance.filter(a => a.status !== 'absent').length,
      days_on_time: attendance.filter(a => a.status === 'on-time').length,
      days_late_grace: attendance.filter(a => a.status === 'late-grace').length,
      days_late_penalty: attendance.filter(a => a.status === 'late-penalty').length,
      days_absent: attendance.filter(a => a.status === 'absent').length,
      total_late_minutes: attendance.reduce((sum, a) => sum + (a.late_minutes > employee[0].grace_period_minutes ? a.late_minutes : 0), 0),
      total_late_deduction: attendance.reduce((sum, a) => sum + parseFloat(a.daily_late_deduction || 0), 0).toFixed(2),
      total_absent_deduction: attendance.reduce((sum, a) => sum + parseFloat(a.daily_absent_deduction || 0), 0).toFixed(2)
    };

    totals.total_deductions = (parseFloat(totals.total_late_deduction) + parseFloat(totals.total_absent_deduction)).toFixed(2);
    totals.net_salary = (parseFloat(employee[0].monthly_salary) - parseFloat(totals.total_deductions)).toFixed(2);

    res.json({
      error: false,
      employee: employee[0],
      attendance,
      totals,
      period: {
        from_date: fromDate,
        to_date: toDate,
        month: moment(fromDate).format('MMMM YYYY')
      }
    });

  } catch (error) {
    logError("Attendance.getSalaryDetail", error, res);
  }
};

module.exports = exports;
