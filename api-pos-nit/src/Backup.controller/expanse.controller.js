const { db, isArray, isEmpty, logError } = require("../util/helper");

exports.getListExpanseType = async (req, res) => {
  try {
    const { txtSearch, page = 1, limit = 10, expense_type_id } = req.query;

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Construct SQL query with filters and pagination
    const sql = `
      SELECT 
        e.id,
        e.name,
        e.ref_no,
        e.amount,
        e.remark,
        e.expense_date,
        et.name AS expense_type_name,
        e.expense_type_id
      FROM 
        expense e
      JOIN 
        expense_type et ON e.expense_type_id = et.id
      WHERE 
        (e.name LIKE :txtSearch OR e.ref_no LIKE :txtSearch)
        ${expense_type_id ? 'AND e.expense_type_id = :expense_type_id' : ''}
      LIMIT :limit OFFSET :offset
    `;

    // Execute the query with parameters
    const [data] = await db.query(sql, {
      txtSearch: `%${txtSearch || ''}%`, // Add wildcards for partial matching
      limit: parseInt(limit),
      offset: parseInt(offset),
      expense_type_id: expense_type_id ? parseInt(expense_type_id) : undefined,
    });

    // Fetch total count for pagination
    const countSql = `
      SELECT COUNT(*) AS total
      FROM expense e
      JOIN expense_type et ON e.expense_type_id = et.id
      WHERE (e.name LIKE :txtSearch OR e.ref_no LIKE :txtSearch)
        ${expense_type_id ? 'AND e.expense_type_id = :expense_type_id' : ''}
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
      message: "Expense list fetched successfully!",
    });
  } catch (error) {
    console.error("Error fetching expense list:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch expense list.",
    });
  }
};

exports.getList = async (req, res) => {
  try {
    var txtSearch = req.query.txtSearch;
    
    // SQL query with JOIN to get expense type name
    var sql = `
      SELECT 
        e.*,
        et.name AS expense_type_name, 
        et.code AS expense_type_code
      FROM 
        expense e
      LEFT JOIN 
        expense_type et ON e.expense_type_id = et.id
    `;
    
    // Add search condition if provided
    if (!isEmpty(txtSearch)) {
      sql += " WHERE e.ref_no LIKE :txtSearch OR e.name LIKE :txtSearch OR et.name LIKE :txtSearch";
    }

    // Add ordering for consistency
    sql += " ORDER BY e.create_at DESC";
    
    const [list] = await db.query(sql, {
      txtSearch: "%" + txtSearch + "%",
    });
    
    res.json({
      success: true,
      list: list,
      message: "Expense list fetched successfully!"
    });
  } catch (error) {
    logError("expense.getList", error, res);
    res.status(500).json({
      success: false,
      message: "Failed to fetch expense list",
      error: error.message
    });
  }
};
// id,name,code,tel,email,address,website,note,create_by,create_at
// id,:name,:code,:tel,:email,:address,:website,:note,:create_by,:create_at
exports.create = async (req, res) => {
  try {
    const { expense_type_id, ref_no, name, amount, remark, expense_date } = req.body;

    const user_id = req.auth?.id || req.body.user_id || null; // Use authenticated user or fallback

    // Validate required fields
    if (!expense_type_id || !ref_no || !name || !amount || !expense_date || !user_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: expense_type_id, ref_no, name, amount, expense_date, user_id",
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
    logError("expense.create", error, res);
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params; // Extract `id` from URL parameters
    const {   name, amount, remark } = req.body;

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
    logError("expense.update", error, res);
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params; // Extract `id` from URL parameters

    // Validate `id`
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Expense ID is required!",
      });
    }

    const sql = "DELETE FROM expense WHERE id = :id";
    const [data] = await db.query(sql, { id });

    // Check if any rows were affected
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
    logError("expense.remove", error, res);
  }
};


