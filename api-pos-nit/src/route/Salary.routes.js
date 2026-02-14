const { validate_token } = require("../controller/auth.controller");
const {
  getSalaryReport,
  getSalaryDetail
} = require("../controller/Salaryreport.controller");

module.exports = (app) => {

  /**
   * Get Salary Report with Deductions
   * GET /api/attendance/salary-report
   * Query params:
   *  - from_date: YYYY-MM-DD (default: start of current month)
   *  - to_date: YYYY-MM-DD (default: end of current month)
   *  - user_id: filter by specific user (optional)
   *  - department_id: filter by department (optional)
   * 
   * Returns:
   *  - report: array of employees with salary and deduction details
   *  - summary: total calculations
   *  - period: date range information
   * 
   * Access: Managers, HR, Super Admin
   */
  app.get("/api/attendance/salary-report",
    validate_token("employee.view"),
    getSalaryReport
  );

  /**
   * Get Individual Employee Salary Detail
   * GET /api/attendance/salary-detail
   * Query params:
   *  - user_id: required
   *  - from_date: YYYY-MM-DD (optional)
   *  - to_date: YYYY-MM-DD (optional)
   * 
   * Returns:
   *  - employee: employee information
   *  - attendance: detailed daily attendance records
   *  - totals: calculated deductions and net salary
   *  - period: date range information
   * 
   * Access: Employee (own data), Managers, HR, Super Admin
   */
  app.get("/api/attendance/salary-detail",
    validate_token(),
    getSalaryDetail
  );

};
