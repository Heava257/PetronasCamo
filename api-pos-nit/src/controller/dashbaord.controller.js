const { db, logError } = require("../util/helper");

const formatCurrency = (value) => {
  const num = parseFloat(value || 0);
  if (isNaN(num)) return "0.00$";

  // ✅ Format with 2 decimal places, thousands separator, and $ at end
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + "$";
};

const formatNumber = (value) => {
  const num = parseInt(value || 0);
  return isNaN(num) ? 0 : num;
};

exports.getList = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    let { from_date, to_date } = req.query;

    // ✅ Default date range
    if (!from_date || !to_date) {
      const currentDate = new Date();
      to_date = currentDate.toISOString().split('T')[0];
      from_date = `${currentDate.getFullYear()}-01-01`;
    }

    // ✅ Get current user info
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

    // ✅ Branch filter
    let branchFilter = '';
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
    }

    // ✅✅✅ TOP SALES QUERY ✅✅✅
    const topSaleQuery = `
      SELECT 
        p.name AS category_name,
        SUM(od.qty) AS total_qty,
        SUM(
          (od.qty * od.price) / NULLIF(COALESCE(p.actual_price, c.actual_price, 1), 0)
        ) AS total_sale_amount
      FROM order_detail od
      JOIN \`order\` o ON od.order_id = o.id
      JOIN product p ON od.product_id = p.id
      LEFT JOIN category c ON p.category_id = c.id
      JOIN user u ON o.user_id = u.id
      WHERE 1=1
      ${branchFilter}
      ${from_date && to_date ? `AND DATE(o.order_date) BETWEEN '${from_date}' AND '${to_date}'` : ''}
      GROUP BY p.name
      HAVING total_sale_amount > 0
      ORDER BY total_sale_amount DESC
      LIMIT 5
    `;
    const [Top_Sale] = await db.query(topSaleQuery);

    // ✅✅✅ CUSTOMER QUERY ✅✅✅
    const customerQuery = `
      SELECT 
        COUNT(c.id) AS total,
        SUM(CASE WHEN c.gender = 'male' THEN 1 ELSE 0 END) AS male,
        SUM(CASE WHEN c.gender = 'female' THEN 1 ELSE 0 END) AS female
      FROM customer c
      JOIN user u ON c.user_id = u.id
      WHERE 1=1
      ${branchFilter}
      ${from_date && to_date ? `AND DATE(c.create_at) BETWEEN '${from_date}' AND '${to_date}'` : ''}
    `;
    const [customer] = await db.query(customerQuery);

    // ✅✅✅ REVENUE QUERY ✅✅✅
    const revenueQuery = `
      SELECT 
        COALESCE(SUM(
          (od.qty * od.price) / NULLIF(COALESCE(p.actual_price, c.actual_price, 1), 0)
        ), 0) AS total_revenue,
        COUNT(DISTINCT o.id) AS total_orders
      FROM \`order\` o
      JOIN order_detail od ON o.id = od.order_id
      JOIN product p ON od.product_id = p.id
      LEFT JOIN category c ON p.category_id = c.id
      JOIN user u ON o.user_id = u.id
      WHERE 1=1
      ${branchFilter}
      ${from_date && to_date ? `AND DATE(o.order_date) BETWEEN '${from_date}' AND '${to_date}'` : ''}
    `;
    const [revenue] = await db.query(revenueQuery);

    // ✅✅✅ GET OPERATING EXPENSES (OPEX) ✅✅✅
    const opexQuery = `
      SELECT 
        COALESCE(SUM(e.amount), 0) AS total, 
        COUNT(e.id) AS total_expense 
      FROM expense e
      INNER JOIN expense_type et ON e.expense_type_id = et.id
      LEFT JOIN user u ON e.user_id = u.id
      WHERE 1=1
      ${branchFilter}
      ${from_date && to_date ? `AND DATE(e.expense_date) BETWEEN '${from_date}' AND '${to_date}'` : ''}
    `;
    const [opexResult] = await db.query(opexQuery);

    // ✅✅✅ GET COST OF GOODS SOLD (COGS) - FIXED ✅✅✅
    const cogsQuery = `
      SELECT 
        COALESCE(SUM(p.total_amount), 0) AS total_cogs
      FROM purchase p
      JOIN user u ON p.user_id = u.id
      WHERE p.status IN ('confirmed', 'shipped', 'delivered')
      ${branchFilter}
      ${from_date && to_date ? `AND DATE(p.order_date) BETWEEN '${from_date}' AND '${to_date}'` : ''}
    `;
    const [cogsResult] = await db.query(cogsQuery);

    // ✅ Calculate Profit
    const totalRevenue = parseFloat(revenue[0]?.total_revenue || 0);
    const totalOpex = parseFloat(opexResult[0]?.total || 0);
    const totalCogs = parseFloat(cogsResult[0]?.total_cogs || 0);
    const totalExpense = totalOpex + totalCogs;
    const totalProfit = totalRevenue - totalExpense;
    const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

    // ✅ Expense object for dashboard card
    const expanse = [{
      total: totalExpense,
      total_expense: parseInt(opexResult[0]?.total_expense || 0)
    }];

    // ✅✅✅ PRODUCT QUERY - Value & Qty from inventory_transaction ✅✅✅
    const productQuery = `
      SELECT 
        -- ✅ Stock Value = (IT.total_qty × p.unit_price) ÷ p.actual_price
        COALESCE(
          SUM(
            ROUND(
              COALESCE(stock.total_qty, 0) * p.unit_price / NULLIF(p.actual_price, 0), 2
            )
          ), 0
        ) AS total_stock_value,
        
        -- Total Active Products (with stock > 0)
        COUNT(CASE WHEN COALESCE(stock.total_qty, 0) > 0 THEN 1 END) AS total_products,
        
        -- Low Stock Alert (< 100 units)
        COUNT(CASE WHEN COALESCE(stock.total_qty, 0) > 0 AND COALESCE(stock.total_qty, 0) < 100 THEN 1 END) AS low_stock_count
        
      FROM product p
      LEFT JOIN (
        SELECT 
          it.product_id, 
          SUM(it.quantity) as total_qty
        FROM inventory_transaction it
        LEFT JOIN user u ON it.user_id = u.id
        WHERE 1=1 ${branchFilter}
        GROUP BY it.product_id
      ) stock ON stock.product_id = p.id
      WHERE p.status = 1
    `;
    const [product] = await db.query(productQuery);

    // ✅✅✅ Get Total Quantity from inventory_transaction (Simplified) ✅✅✅
    const inventoryQtyQuery = `
      SELECT 
        COALESCE(SUM(it.quantity), 0) AS total_quantity
      FROM inventory_transaction it
      LEFT JOIN user u ON it.user_id = u.id
      WHERE 1=1
        ${branchFilter}
    `;
    const [inventoryQty] = await db.query(inventoryQtyQuery);

    // ✅✅✅ SALE QUERY (for backward compatibility) ✅✅✅
    const saleQuery = `
      SELECT 
        CONCAT(
          COALESCE(
            SUM(
              (od.qty * od.price) / NULLIF(COALESCE(p.actual_price, c.actual_price, 1), 0)
            ), 0
          ), 
        '$') AS total, 
        COUNT(DISTINCT o.id) AS total_order 
      FROM \`order\` o
      JOIN order_detail od ON o.id = od.order_id
      JOIN product p ON od.product_id = p.id
      LEFT JOIN category c ON p.category_id = c.id
      JOIN user u ON o.user_id = u.id
      WHERE 1=1
      ${branchFilter}
      ${from_date && to_date ? `AND DATE(o.order_date) BETWEEN '${from_date}' AND '${to_date}'` : ''}
    `;
    const [sale] = await db.query(saleQuery);

    // ✅✅✅ SALE SUMMARY BY MONTH ✅✅✅
    const saleSummaryQuery = `
      SELECT 
        DATE_FORMAT(o.order_date, '%M') AS title, 
        MONTH(o.order_date) as month_num,
        SUM(
          (od.qty * od.price) / NULLIF(COALESCE(p.actual_price, c.actual_price, 1), 0)
        ) AS total 
      FROM \`order\` o
      JOIN order_detail od ON o.id = od.order_id
      JOIN product p ON od.product_id = p.id
      LEFT JOIN category c ON p.category_id = c.id
      JOIN user u ON o.user_id = u.id
      WHERE 1=1
      ${branchFilter}
      ${from_date && to_date ? `AND DATE(o.order_date) BETWEEN '${from_date}' AND '${to_date}'` : ''}
      GROUP BY DATE_FORMAT(o.order_date, '%M'), MONTH(o.order_date)
      ORDER BY MONTH(o.order_date)
    `;
    const [Sale_Summary_By_Month] = await db.query(saleSummaryQuery);

    // ✅✅✅ EXPENSE SUMMARY BY MONTH (OPEX + COGS) - FIXED ✅✅✅
    const opexByMonthQuery = `
      SELECT 
        DATE_FORMAT(e.expense_date, '%M') AS title, 
        SUM(e.amount) AS total,
        MONTH(e.expense_date) as month_num
      FROM expense e
      INNER JOIN expense_type et ON e.expense_type_id = et.id
      LEFT JOIN user u ON e.user_id = u.id
      WHERE 1=1
      ${branchFilter}
      ${from_date && to_date ? `AND DATE(e.expense_date) BETWEEN '${from_date}' AND '${to_date}'` : ''}
      GROUP BY DATE_FORMAT(e.expense_date, '%M'), MONTH(e.expense_date)
    `;
    const [opexByMonth] = await db.query(opexByMonthQuery);

    const cogsByMonthQuery = `
      SELECT 
        DATE_FORMAT(p.order_date, '%M') AS title, 
        SUM(p.total_amount) AS total,
        MONTH(p.order_date) as month_num
      FROM purchase p
      JOIN user u ON p.user_id = u.id
      WHERE p.status IN ('confirmed', 'shipped', 'delivered')
      ${branchFilter}
      ${from_date && to_date ? `AND DATE(p.order_date) BETWEEN '${from_date}' AND '${to_date}'` : ''}
      GROUP BY DATE_FORMAT(p.order_date, '%M'), MONTH(p.order_date)
    `;
    const [cogsByMonth] = await db.query(cogsByMonthQuery);

    // ✅ Merge monthly expense data
    const monthlyExpenseMap = {};

    opexByMonth.forEach(item => {
      if (!monthlyExpenseMap[item.title]) {
        monthlyExpenseMap[item.title] = { total: 0, month_num: item.month_num };
      }
      monthlyExpenseMap[item.title].total += parseFloat(item.total);
    });

    cogsByMonth.forEach(item => {
      if (!monthlyExpenseMap[item.title]) {
        monthlyExpenseMap[item.title] = { total: 0, month_num: item.month_num };
      }
      monthlyExpenseMap[item.title].total += parseFloat(item.total);
    });

    const Expense_Summary_By_Month = Object.keys(monthlyExpenseMap).map(key => ({
      title: key,
      total: monthlyExpenseMap[key].total
    })).sort((a, b) => {
      const monthA = monthlyExpenseMap[a.title].month_num;
      const monthB = monthlyExpenseMap[b.title].month_num;
      return monthA - monthB;
    });

    // ✅✅✅ CALCULATE PROFIT BY MONTH ✅✅✅
    const Profit_Summary_By_Month = Sale_Summary_By_Month.map(saleMonth => {
      const expenseMonth = Expense_Summary_By_Month.find(e => e.title === saleMonth.title);
      const revenue = parseFloat(saleMonth.total || 0);
      const expense = parseFloat(expenseMonth?.total || 0);
      const profit = revenue - expense;

      return {
        title: saleMonth.title,
        total: profit,
        month_num: saleMonth.month_num
      };
    }).sort((a, b) => a.month_num - b.month_num);

    // ✅✅✅ PRODUCT SUMMARY BY MONTH ✅✅✅
    const productSummaryQuery = `
      SELECT 
        DATE_FORMAT(p.create_at, '%M') AS title,
        SUM(p.qty * p.unit_price) AS total
      FROM product p
      JOIN user u ON p.user_id = u.id
      WHERE p.status = 1
      ${branchFilter}
      ${from_date && to_date ? `AND DATE(p.create_at) BETWEEN '${from_date}' AND '${to_date}'` : ''}
      GROUP BY MONTH(p.create_at), DATE_FORMAT(p.create_at, '%M')
      ORDER BY MONTH(p.create_at)
    `;
    const [Product_Summary_By_Month] = await db.query(productSummaryQuery);

    // ✅✅✅ USER SUMMARY - COMPLETELY FIXED TO SHOW ALL ROLES ✅✅✅
    const userSummaryQuery = `
      SELECT 
        r.id AS role_id,
        r.name AS role_name,
        r.code AS role_code,
        COUNT(u.id) AS total_users,
        GROUP_CONCAT(u.name SEPARATOR ', ') as user_names
      FROM role r
      LEFT JOIN user u ON u.role_id = r.id 
        AND u.is_active = 1
        ${userRoleId !== 29 && userBranch ? `AND u.branch_name = '${userBranch}'` : ''}
      GROUP BY r.id, r.name, r.code
      HAVING total_users > 0
      ORDER BY total_users DESC, r.name ASC
    `;
    const [User_Summary] = await db.query(userSummaryQuery);

    // ✅ Calculate total users correctly
    const totalUsers = User_Summary.reduce((sum, row) => sum + row.total_users, 0);

    // ✅ Also get count by status for verification
    const userStatusQuery = `
      SELECT 
        COUNT(CASE WHEN is_active = 1 THEN 1 END) AS active_users,
        COUNT(CASE WHEN is_active = 0 THEN 1 END) AS inactive_users,
        COUNT(*) AS total_all_users
      FROM user
      WHERE 1=1
      ${userRoleId !== 29 && userBranch ? `AND branch_name = '${userBranch}'` : ''}
    `;
    const [userStatus] = await db.query(userStatusQuery);

    // ✅✅✅ EMPLOYEE QUERY ✅✅✅
    const employeeQuery = `
      SELECT 
        COUNT(e.id) AS total,
        SUM(CASE WHEN e.gender = 'male' THEN 1 ELSE 0 END) AS male,
        SUM(CASE WHEN e.gender = 'female' THEN 1 ELSE 0 END) AS female,
        SUM(CASE WHEN e.is_active = 1 THEN 1 ELSE 0 END) AS active
      FROM employee e
      ${userRoleId !== 29 && userBranch ? 'LEFT JOIN user u ON e.creator_id = u.id' : ''}
      WHERE 1=1
      ${userRoleId !== 29 && userBranch ? `AND u.branch_name = '${userBranch}'` : ''}
    `;
    const [employee] = await db.query(employeeQuery);

    // ✅✅✅ BUILD DASHBOARD with all roles and PROFIT CARD ✅✅✅
    const [onlineUsers] = await db.query("SELECT COUNT(*) as count FROM user WHERE is_online = 1");
    const [totalRoles] = await db.query("SELECT COUNT(*) as count FROM role");

    const userSummaryObject = {
      "សរុប": formatNumber(totalUsers) + " នាក់",
      "កំពុងប្រើប្រាស់": formatNumber(onlineUsers[0]?.count) + " នាក់", // Online Users
      "ចំនួនតួនាទី": formatNumber(totalRoles[0]?.count) + "", // Total Roles
    };

    // Add each role to the summary
    User_Summary.forEach(role => {
      userSummaryObject[role.role_name] = role.total_users + " នាក់";
    });

    let dashboardData = [];
    const isSuperAdmin = userRoleId === 29;

    const [totalBranches] = await db.query('SELECT COUNT(DISTINCT branch_name) as count FROM user WHERE branch_name IS NOT NULL AND branch_name != ""');

    const [totalAdmins] = await db.query("SELECT COUNT(*) as count FROM user u JOIN role r ON u.role_id = r.id WHERE r.code IN ('ADMIN', 'SUPER_ADMIN')");

    dashboardData = [
      {
        title: "អ្នកប្រើប្រាស់",
        Summary: userSummaryObject
      },
      {
        title: "អតិថិជន",
        Summary: {
          "សរុប": formatNumber(customer[0]?.total) + " នាក់",
          "បុរស": formatNumber(customer[0]?.male) + " នាក់",
          "ស្ត្រី": formatNumber(customer[0]?.female) + " នាក់"
        }
      },
      {
        title: "ចំណាយលើប្រេង",
        Summary: {
          "ចំណាយ": from_date && to_date ? `${from_date} - ${to_date}` : "ខែនេះ",
          "សរុប": formatCurrency(totalExpense),
        }
      },
      {
        title: "ផលិតផលក្នុងស្តុក",
        Summary: {
          "ស្តុក": "Current Stock",
          "តម្លៃ": formatCurrency(product[0]?.total_stock_value),
          "ចំនួនផលិតផល": formatNumber(product[0]?.total_products) + " items",
          "ចំនួនស្តុកសរុប": formatNumber(inventoryQty[0]?.total_quantity) + " L"
        }
      },
      {
        title: "ការលក់",
        Summary: {
          "លក់": from_date && to_date ? `${from_date} - ${to_date}` : "ខែនេះ",
          "សរុប": formatCurrency(totalRevenue),
          "ការបញ្ជាទិញសរុប": formatNumber(sale[0]?.total_order)
        }
      },
      {
        title: "ចំណេញ",
        Summary: {
          "រយៈពេល": from_date && to_date ? `${from_date} - ${to_date}` : "ខែនេះ",
          "ចំណូលសរុប": formatCurrency(totalRevenue),
          "ចំណាយសរុប": formatCurrency(totalExpense),
          "ចំណេញសុទ្ធ": formatCurrency(totalProfit),
          "អត្រាចំណេញ": profitMargin.toFixed(2) + "%",
          "ស្ថានភាព": totalProfit > 0 ? "📈 Profit" : totalProfit < 0 ? "📉 Loss" : "➖ Break Even"
        }
      }
    ];

    // If super admin, we can optionally add management cards at the end or keep it unified
    if (isSuperAdmin) {
      dashboardData.unshift({
        title: "ព័ត៌មានគ្រប់គ្រង", // Management Info
        Summary: {
          "សាខាសរុប": formatNumber(totalBranches[0]?.count) + " សាខា",
          "ក្នុងប្រព័ន្ធ": formatNumber(totalAdmins[0]?.count) + " Admins",
          "បុគ្គលិក": formatNumber(employee[0]?.total) + " នាក់"
        }
      });
    }

    // ✅ Send response
    res.json({
      dashboard: dashboardData,
      Sale_Summary_By_Month: isSuperAdmin ? [] : Sale_Summary_By_Month,
      Expense_Summary_By_Month: isSuperAdmin ? [] : Expense_Summary_By_Month,
      Profit_Summary_By_Month: isSuperAdmin ? [] : Profit_Summary_By_Month,
      Product_Summary_By_Month: isSuperAdmin ? [] : Product_Summary_By_Month,
      Top_Sale: isSuperAdmin ? [] : Top_Sale,
      financial_summary: isSuperAdmin ? {} : {
        total_revenue: parseFloat(totalRevenue.toFixed(2)),
        total_expense: parseFloat(totalExpense.toFixed(2)),
        total_profit: parseFloat(totalProfit.toFixed(2)),
        profit_margin: parseFloat(profitMargin.toFixed(2)),
        opex: parseFloat(totalOpex.toFixed(2)),
        cogs: parseFloat(totalCogs.toFixed(2))
      },
      user_details: {
        active_users: userStatus[0]?.active_users || 0,
        inactive_users: userStatus[0]?.inactive_users || 0,
        total_all_users: userStatus[0]?.total_all_users || 0,
        roles_breakdown: User_Summary
      },
      filter_info: {
        from_date,
        to_date,
        branch: userRoleId === 29 ? 'All Branches' : userBranch,
        is_super_admin: userRoleId === 29,
        role_id: userRoleId,
        group_id: userGroupId,
        date_range_applied: !!(from_date && to_date)
      }
    });

  } catch (error) {
    console.error('❌ Dashboard error:', error);
    logError("Dashboard.getList", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to load dashboard",
      message_kh: "មិនអាចផ្ទុក Dashboard បានទេ",
      details: error.message
    });
  }
};

// ✅✅✅ GET CUSTOMER REPORT ✅✅✅
exports.getCustomerReport = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    let { from_date, to_date, customer_type, gender, limit = 50 } = req.query;

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
      return res.status(404).json({
        error: true,
        message: "User not found"
      });
    }

    const userRoleId = currentUser[0].role_id;
    const userBranch = currentUser[0].branch_name;

    if (!from_date || !to_date) {
      const currentDate = new Date();
      to_date = currentDate.toISOString().split('T')[0];
      from_date = `${currentDate.getFullYear()}-01-01`;
    }

    let whereConditions = [];
    let params = [];

    if (from_date && to_date) {
      whereConditions.push(`DATE(c.create_at) BETWEEN ? AND ?`);
      params.push(from_date, to_date);
    }

    if (customer_type) {
      whereConditions.push(`c.type = ?`);
      params.push(customer_type);
    }

    if (gender) {
      whereConditions.push(`c.gender = ?`);
      params.push(gender);
    }

    if (userRoleId !== 29 && userBranch) {
      whereConditions.push(`u.branch_name = ?`);
      params.push(userBranch);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const detailedCustomerQuery = `
      SELECT 
        c.id,
        c.name,
        c.tel,
        c.email,
        c.address,
        c.type,
        c.gender,
        DATE(c.create_at) as registration_date,
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_spent
      FROM customer c
      LEFT JOIN \`order\` o ON c.id = o.customer_id
      ${userRoleId !== 29 ? 'LEFT JOIN user u ON o.user_id = u.id' : ''}
      ${whereClause}
      GROUP BY c.id
      ORDER BY c.create_at DESC
      LIMIT ?
    `;

    const [customers] = await db.query(detailedCustomerQuery, [...params, parseInt(limit)]);

    res.json({
      customers,
      total_records: customers.length,
      filters_applied: {
        date_range: from_date && to_date ? `${from_date} to ${to_date}` : null,
        customer_type,
        gender,
        branch: userRoleId === 29 ? 'All Branches' : userBranch,
        limit
      }
    });

  } catch (error) {
    console.error('❌ Customer Report error:', error);
    logError("Dashboard.getCustomerReport", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to load customer report",
      details: error.message
    });
  }
};