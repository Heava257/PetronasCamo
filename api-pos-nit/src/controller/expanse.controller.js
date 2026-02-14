const { db, isArray, isEmpty, logError } = require("../util/helper");

// ✅✅✅ HELPER FUNCTION: Get Branch Filter ✅✅✅
const getBranchFilter = async (currentUserId) => {
  const [currentUser] = await db.query(`
    SELECT 
      u.branch_name,
      u.role_id,
      r.code AS role_code
    FROM user u
    INNER JOIN role r ON u.role_id = r.id
    WHERE u.id = :user_id
  `, { user_id: currentUserId });

  if (!currentUser || currentUser.length === 0) {
    return { error: true, message: "User not found" };
  }

  const userRoleId = currentUser[0].role_id;
  const userBranch = currentUser[0].branch_name;


  // If NOT Super Admin (role_id != 29), filter by branch
  let branchFilter = '';
  if (userRoleId !== 29) {
    if (!userBranch) {
      return { error: true, message: "Your account is not assigned to a branch" };
    }
    branchFilter = `AND creator.branch_name = '${userBranch}'`;
  } else {
  }

  return { 
    branchFilter, 
    userRoleId, 
    userBranch,
    isSuperAdmin: userRoleId === 29 
  };
};

exports.getListExpanseType = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { txtSearch, page = 1, limit = 10, expense_type_id } = req.query;

    // ✅ Get branch filter
    const filterResult = await getBranchFilter(currentUserId);
    if (filterResult.error) {
      return res.status(403).json({
        success: false,
        message: filterResult.message
      });
    }

    const { branchFilter } = filterResult;

    const offset = (page - 1) * limit;

    // ✅ Updated SQL with branch filter
    const sql = `
      SELECT 
        e.id,
        e.name,
        e.ref_no,
        e.amount,
        e.remark,
        e.expense_date,
        et.name AS expense_type_name,
        e.expense_type_id,
        creator.branch_name,
        creator.name AS created_by_name
      FROM expense e
      JOIN expense_type et ON e.expense_type_id = et.id
      JOIN user creator ON e.user_id = creator.id
      WHERE 
        (e.name LIKE :txtSearch OR e.ref_no LIKE :txtSearch)
        ${expense_type_id ? 'AND e.expense_type_id = :expense_type_id' : ''}
        ${branchFilter}
      ORDER BY e.expense_date DESC
      LIMIT :limit OFFSET :offset
    `;


    const [data] = await db.query(sql, {
      txtSearch: `%${txtSearch || ''}%`,
      limit: parseInt(limit),
      offset: parseInt(offset),
      expense_type_id: expense_type_id ? parseInt(expense_type_id) : undefined,
    });

    // ✅ Count with branch filter
    const countSql = `
      SELECT COUNT(*) AS total
      FROM expense e
      JOIN expense_type et ON e.expense_type_id = et.id
      JOIN user creator ON e.user_id = creator.id
      WHERE (e.name LIKE :txtSearch OR e.ref_no LIKE :txtSearch)
        ${expense_type_id ? 'AND e.expense_type_id = :expense_type_id' : ''}
        ${branchFilter}
    `;

    const [countResult] = await db.query(countSql, {
      txtSearch: `%${txtSearch || ''}%`,
      expense_type_id: expense_type_id ? parseInt(expense_type_id) : undefined,
    });

    const total = countResult[0].total;


    res.json({
      success: true,
      data: data,
      total: total,
      filter_info: {
        branch: filterResult.isSuperAdmin ? 'All Branches' : filterResult.userBranch,
        is_super_admin: filterResult.isSuperAdmin
      },
      message: "Expense list fetched successfully!",
    });
  } catch (error) {
    console.error("Error fetching expense list:", error);
    logError("expense.getListExpanseType", error, res);
    res.status(500).json({
      success: false,
      message: "Failed to fetch expense list.",
      error: error.message
    });
  }
};

exports.getList = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const txtSearch = req.query.txtSearch;

    const filterResult = await getBranchFilter(currentUserId);
    if (filterResult.error) {
      return res.status(403).json({
        success: false,
        message: filterResult.message
      });
    }

    const { branchFilter } = filterResult;
    
    let sql = `
      SELECT 
        e.*,
        et.name AS expense_type_name, 
        et.code AS expense_type_code,
        creator.branch_name,
        creator.name AS created_by_name
      FROM expense e
      LEFT JOIN expense_type et ON e.expense_type_id = et.id
      JOIN user creator ON e.user_id = creator.id
      WHERE 1=1
      ${branchFilter}
    `;
    
    // Add search condition if provided
    if (!isEmpty(txtSearch)) {
      sql += " AND (e.ref_no LIKE :txtSearch OR e.name LIKE :txtSearch OR et.name LIKE :txtSearch)";
    }

    sql += " ORDER BY e.create_at DESC";
    

    const [list] = await db.query(sql, {
      txtSearch: "%" + txtSearch + "%",
    });

    
    res.json({
      success: true,
      list: list,
      filter_info: {
        branch: filterResult.isSuperAdmin ? 'All Branches' : filterResult.userBranch,
        is_super_admin: filterResult.isSuperAdmin
      },
      message: "Expense list fetched successfully!"
    });
  } catch (error) {
    console.error("Error in getList:", error);
    logError("expense.getList", error, res);
    res.status(500).json({
      success: false,
      message: "Failed to fetch expense list",
      error: error.message
    });
  }
};

exports.create = async (req, res) => {
  try {
    const { expense_type_id, ref_no, name, amount, remark, expense_date } = req.body;

    const user_id = req.current_id; // ✅ Use authenticated user ID

    // Validate required fields
    if (!expense_type_id || !ref_no || !name || !amount || !expense_date) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: expense_type_id, ref_no, name, amount, expense_date",
      });
    }

    const sql = `
      INSERT INTO expense 
      (expense_type_id, ref_no, name, amount, remark, expense_date, create_by, user_id) 
      VALUES (:expense_type_id, :ref_no, :name, :amount, :remark, :expense_date, :create_by, :user_id)
    `;

    const [data] = await db.query(sql, {
      expense_type_id,
      ref_no,
      name,
      amount,
      remark,
      expense_date,
      create_by: req.auth?.name || "system",
      user_id
    });


    res.json({
      success: true,
      data: data,
      message: "Expense created successfully!",
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    logError("expense.create", error, res);
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, amount, remark } = req.body;

    if (!name || !amount || !remark) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: name, amount, remark",
      });
    }
   

    const sql = `
      UPDATE expense 
      SET 
        name = :name, 
        amount = :amount, 
        remark = :remark 
      WHERE id = :id
    `;

    const [data] = await db.query(sql, {
      name,
      amount,
      remark,
      id,
    });

    res.json({
      success: true,
      data: data,
      message: "Expense updated successfully!",
    });
  } catch (error) {
    console.error("Error updating expense:", error);
    logError("expense.update", error, res);
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Expense ID is required!",
      });
    }

    const sql = "DELETE FROM expense WHERE id = :id";
    const [data] = await db.query(sql, { id });

    if (data.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Expense not found!",
      });
    }


    res.json({
      success: true,
      data: data,
      message: "Expense deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting expense:", error);
    logError("expense.remove", error, res);
  }
};
