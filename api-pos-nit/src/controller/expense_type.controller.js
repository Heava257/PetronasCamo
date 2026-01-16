const { db, logError } = require("../util/helper");

// ✅ Get all expense types with dashboard-style branch filtering
exports.getExpenseTypes = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    let { from_date, to_date } = req.query;

    // ✅ Set default date range
    if (!from_date || !to_date) {
      const currentDate = new Date();
      to_date = currentDate.toISOString().split('T')[0];
      from_date = `${currentDate.getFullYear()}-01-01`;
    }


    // ✅✅✅ GET CURRENT USER WITH ROLE AND BRANCH INFO (ដូច Dashboard) ✅✅✅
    const [currentUser] = await db.query(`
      SELECT 
        u.id,
        u.branch_name,
        u.group_id,
        u.role_id,
        r.code AS role_code,
        r.name AS role_name
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
      WHERE u.id = :user_id
    `, { user_id: currentUserId });

    if (!currentUser || currentUser.length === 0) {
      console.error('❌ User not found:', currentUserId);
      return res.status(404).json({
        error: true,
        message: "User not found",
        message_kh: "រកមិនឃើញអ្នកប្រើប្រាស់"
      });
    }

    const userRoleId = currentUser[0].role_id;
    const userBranch = currentUser[0].branch_name;
    const userGroupId = currentUser[0].group_id; 



    // ✅✅✅ BUILD BRANCH FILTER (ដូច Dashboard) ✅✅✅
    let branchFilter = '';

    // If NOT Super Admin (role_id != 29), filter by branch
    if (userRoleId !== 29) {
      if (!userBranch) {
        console.error('❌ Branch Admin has no branch_name');
        return res.status(403).json({
          error: true,
          message: "Your account is not assigned to a branch",
          message_kh: "គណនីរបស់អ្នកមិនបានកំណត់សាខា"
        });
      }

      branchFilter = `AND u.branch_name = '${userBranch}'`;
    } else {
    }

    let expenseTypeQuery;
    
    if (userRoleId === 29) {
      expenseTypeQuery = "SELECT * FROM expense_type ORDER BY id DESC";
    } else {
      expenseTypeQuery = `
        SELECT et.* 
        FROM expense_type et
        INNER JOIN user creator ON et.user_id = creator.id
        WHERE creator.branch_name = '${userBranch}'
        ORDER BY et.id DESC
      `;
    }
    
    const [data] = await db.query(expenseTypeQuery);

    const usageQuery = `
      SELECT 
        et.id,
        et.name,
        et.code,
        COUNT(e.id) AS total_usage,
        COALESCE(SUM(e.amount), 0) AS total_amount,
        DATE_FORMAT(MAX(e.expense_date), '%Y-%m-%d') AS last_used
      FROM expense_type et
      LEFT JOIN expense e ON et.id = e.expense_type_id
      LEFT JOIN user u ON e.user_id = u.id
      WHERE 1=1
      ${branchFilter}
      ${from_date && to_date ? `AND DATE(e.expense_date) BETWEEN '${from_date}' AND '${to_date}'` : ''}
      GROUP BY et.id, et.name, et.code
      ORDER BY total_amount DESC
    `;

    const [usageStats] = await db.query(usageQuery);

    const monthlySummaryQuery = `
      SELECT 
        et.name AS expense_type_name,
        DATE_FORMAT(e.expense_date, '%M') AS title,
        SUM(e.amount) AS total
      FROM expense e
      JOIN expense_type et ON e.expense_type_id = et.id
      JOIN user u ON e.user_id = u.id
      WHERE 1=1
      ${branchFilter}
      ${from_date && to_date ? `AND DATE(e.expense_date) BETWEEN '${from_date}' AND '${to_date}'` : ''}
      GROUP BY et.id, et.name, DATE_FORMAT(e.expense_date, '%M')
      ORDER BY MONTH(e.expense_date)
    `;

    const [monthlySummary] = await db.query(monthlySummaryQuery);

    const totalStatsQuery = `
      SELECT 
        COUNT(DISTINCT et.id) AS total_types,
        COUNT(e.id) AS total_expenses,
        COALESCE(SUM(e.amount), 0) AS total_amount
      FROM expense_type et
      LEFT JOIN expense e ON et.id = e.expense_type_id
      LEFT JOIN user u ON e.user_id = u.id
      WHERE 1=1
      ${branchFilter}
      ${from_date && to_date ? `AND DATE(e.expense_date) BETWEEN '${from_date}' AND '${to_date}'` : ''}
    `;

    const [totalStats] = await db.query(totalStatsQuery);

    const totalAmount = parseFloat(totalStats[0]?.total_amount || 0);
    const totalExpenses = parseInt(totalStats[0]?.total_expenses || 0);

    const dashboard = [
      {
        title: "ប្រភេទចំណាយ",
        Summary: {
          "សរុប": data.length + " ប្រភេទ",
          "កំពុងប្រើ": usageStats.filter(s => s.total_usage > 0).length + " ប្រភេទ",
          "មិនប្រើ": usageStats.filter(s => s.total_usage === 0).length + " ប្រភេទ"
        }
      },
      {
        title: "សរុបចំណាយតាមប្រភេទ",
        Summary: {
          "កាលបរិច្ឆេទ": from_date && to_date ? `${from_date} - ${to_date}` : "ទាំងអស់",
          "ចំនួនសរុប": totalExpenses,
          "ទឹកប្រាក់សរុប": totalAmount.toFixed(2) + "$"
        }
      }
    ];

    const topExpenseTypes = usageStats
      .filter(s => s.total_usage > 0)
      .slice(0, 5);


    res.json({
      success: true,
      data: data,
      usage_statistics: usageStats,
      dashboard: dashboard,
      top_expense_types: topExpenseTypes,
      monthly_summary: monthlySummary,
      total: data.length,
      filter_info: {
        from_date,
        to_date,
        branch: userRoleId === 29 ? 'All Branches' : userBranch,
        is_super_admin: userRoleId === 29,
        role_id: userRoleId,
        date_range_applied: !!(from_date && to_date)
      },
      message: "Expense types fetched successfully!",
    });
  } catch (error) {
    console.error('❌ Expense Type error:', error);
    logError("expense_type.getExpenseTypes", error, res);
    return res.status(500).json({
      error: true,
      message: "Failed to fetch expense types",
      message_kh: "មិនអាចទាញយកប្រភេទចំណាយបានទេ",
      details: error.message
    });
  }
};

exports.createExpenseType = async (req, res) => {
  try {
    const { name, code } = req.body;
    const user_id = req.current_id; 

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, code",
      });
    }

    const sql = `
      INSERT INTO expense_type 
      (name, code, user_id) 
      VALUES (:name, :code, :user_id)
    `;

    const [data] = await db.query(sql, { name, code, user_id });



    res.json({
      success: true,
      data: data,
      message: "Expense type created successfully!",
    });
  } catch (error) {
    console.error("Error creating expense type:", error);
    logError("expense_type.createExpenseType", error, res);
  }
};

exports.updateExpenseType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, code",
      });
    }

    const sql = `
      UPDATE expense_type 
      SET 
        name = :name, 
        code = :code 
      WHERE id = :id
    `;

    const [data] = await db.query(sql, { name, code, id });


    res.json({
      success: true,
      data: data,
      message: "Expense type updated successfully!",
    });
  } catch (error) {
    console.error("Error updating expense type:", error);
    logError("expense_type.updateExpenseType", error, res);
  }
};

exports.deleteExpenseType = async (req, res) => {
  try {
    const { id } = req.params;

    const checkSql = "SELECT id FROM expense WHERE expense_type_id = :id";
    const [checkResult] = await db.query(checkSql, { id });

    if (checkResult.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete expense type. It is being used in the expense table.",
      });
    }

    const sql = "DELETE FROM expense_type WHERE id = :id";
    const [data] = await db.query(sql, { id });


    res.json({
      success: true,
      data: data,
      message: "Expense type deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting expense type:", error);
    logError("expense_type.deleteExpenseType", error, res);
  }
};

exports.getOilExpenseTotal = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { user_id } = req.params;
    let { from_date, to_date } = req.query;

    if (!from_date || !to_date) {
      const currentDate = new Date();
      to_date = currentDate.toISOString().split('T')[0];
      from_date = `${currentDate.getFullYear()}-01-01`;
    }

    const [currentUser] = await db.query(`
      SELECT 
        u.id,
        u.branch_name,
        u.role_id,
        r.code AS role_code
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
      WHERE u.id = :user_id
    `, { user_id: currentUserId });

    if (!currentUser || currentUser.length === 0) {
      return res.status(404).json({
        error: true,
        message: "User not found"
      });
    }

    const userRoleId = currentUser[0].role_id;
    const userBranch = currentUser[0].branch_name;

    let branchFilter = '';
    if (userRoleId !== 29) {
      if (!userBranch) {
        return res.status(403).json({
          error: true,
          message: "Your account is not assigned to a branch"
        });
      }
      branchFilter = `AND u.branch_name = '${userBranch}'`;
    } else {
    }

    let sql = `
      SELECT COALESCE(SUM(e.amount), 0) AS oil_expense_total
      FROM expense e
      JOIN user u ON e.user_id = u.id
      WHERE e.expense_type_id = 11 
        AND e.user_id = :user_id
        ${branchFilter}
    `;

    const params = { user_id };

    if (from_date && !to_date) {
      sql += ` AND DATE(e.expense_date) >= :from_date `;
      params.from_date = from_date;
    } else if (!from_date && to_date) {
      sql += ` AND DATE(e.expense_date) <= :to_date `;
      params.to_date = to_date;
    } else if (from_date && to_date) {
      sql += ` AND DATE(e.expense_date) BETWEEN :from_date AND :to_date `;
      params.from_date = from_date;
      params.to_date = to_date;
    }


    const [result] = await db.query(sql, params);
    const total = parseFloat(result[0]?.oil_expense_total || 0);


    res.json({
      success: true,
      oil_expense_total: total,
      filter_info: {
        from_date,
        to_date,
        branch: userRoleId === 29 ? 'All Branches' : userBranch,
        is_super_admin: userRoleId === 29
      }
    });
  } catch (error) {
    console.error("Error fetching oil expense total:", error);
    logError("expense_type.getOilExpenseTotal", error, res);
    res.status(500).json({
      success: false,
      message: "Failed to fetch oil expense total",
      error: error.message
    });
  }
};