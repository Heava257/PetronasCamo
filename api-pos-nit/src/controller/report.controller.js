const { db } = require("../util/helper");
const { logError } = require("../util/logError");

// ✅ report.controller.js - Add this function

// ✅ FIXED: report.controller.js - report_Expense_Category
// ប្រើ code ជំនួស category

exports.report_Expense_Category = async (req, res) => {
  try {
    const { from_date, to_date, expense_type_id, branch_id } = req.query;

    const currentUserId = req.auth?.id || req.current_id;
    const [currentUser] = await db.query("SELECT role_id, branch_name FROM user WHERE id = ?", [currentUserId]);
    const { role_id, branch_name } = currentUser[0] || {};
    const isSuperAdmin = role_id === 29;

    let sql = `
      SELECT 
        et.name AS expense_category,
        et.code AS category_code,  -- ✅ ប្រើ code
        CASE
          WHEN et.code LIKE '%FUEL%' OR et.code LIKE '%FREIGHT%' THEN 'COGS'
          WHEN et.code LIKE '%SALARY%' OR et.code LIKE '%ELECTRIC%' OR et.code LIKE '%RENT%' THEN 'OPEX'
          ELSE 'ADMIN'
        END AS category_type,  -- ✅ បង្កើត category dynamically
        u.branch_name,
        COUNT(e.id) AS transaction_count,
        SUM(e.amount) AS total_amount,
        AVG(e.amount) AS avg_amount,
        MIN(e.amount) AS min_amount,
        MAX(e.amount) AS max_amount
      FROM expense e
      INNER JOIN expense_type et ON e.expense_type_id = et.id
      LEFT JOIN user u ON e.user_id = u.id
      WHERE DATE(e.expense_date) BETWEEN :from_date AND :to_date
    `;

    const params = {
      from_date,
      to_date,
      expense_type_id: expense_type_id || null,
      branch_id: branch_id || null
    };

    if (expense_type_id) sql += ' AND e.expense_type_id = :expense_type_id';

    if (!isSuperAdmin) {
      sql += ' AND u.branch_name = :user_branch_name';
      params.user_branch_name = branch_name;
    } else if (branch_id) {
      sql += ' AND e.user_id = :branch_id';
    }

    sql += `
      GROUP BY et.name, et.code, category_type, u.branch_name
      ORDER BY total_amount DESC
    `;

    const [list] = await db.query(sql, params);

    // Calculate summary by category
    const cogsTotal = list
      .filter(item => item.category_type === 'COGS')
      .reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);

    const opexTotal = list
      .filter(item => item.category_type === 'OPEX')
      .reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);

    const adminTotal = list
      .filter(item => item.category_type === 'ADMIN')
      .reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);

    const totalExpense = cogsTotal + opexTotal + adminTotal;

    res.json({
      list,
      summary: {
        totalExpense,
        cogsTotal,
        opexTotal,
        adminTotal,
        cogsPercentage: totalExpense > 0 ? (cogsTotal / totalExpense) * 100 : 0,
        opexPercentage: totalExpense > 0 ? (opexTotal / totalExpense) * 100 : 0,
        adminPercentage: totalExpense > 0 ? (adminTotal / totalExpense) * 100 : 0,
        totalTransactions: list.reduce((sum, item) => sum + parseInt(item.transaction_count || 0), 0)
      }
    });

  } catch (error) {
    logError("report.report_Expense_Category", error, res);
  }
};

// ✅ COMPLETELY FIXED - report_Income_vs_Expense
// Correct COGS calculation using actual_price conversion

exports.report_Income_vs_Expense = async (req, res) => {
  try {
    const { from_date, to_date, branch_id } = req.query;


    // ========================================
    // 1. GET TOTAL REVENUE (Sales)
    // ========================================
    const currentUserId = req.auth?.id || req.current_id;
    const [currentUser] = await db.query("SELECT role_id, branch_name FROM user WHERE id = ?", [currentUserId]);
    const { role_id, branch_name } = currentUser[0] || {};
    const isSuperAdmin = role_id === 29;

    const params = { from_date, to_date, branch_id: branch_id || null };
    if (!isSuperAdmin) {
      params.user_branch_name = branch_name;
    }

    // ========================================
    // 1. GET TOTAL REVENUE (Sales)
    // ========================================
    let revenueSql = `
      SELECT 
        COALESCE(SUM(cd.total_amount), 0) AS total_revenue,
        COALESCE(SUM(cd.paid_amount), 0) AS collected_revenue,
        COALESCE(SUM(cd.due_amount), 0) AS pending_revenue,
        COUNT(DISTINCT cd.order_id) AS total_orders,
        COUNT(DISTINCT cd.customer_id) AS total_customers
      FROM customer_debt cd
      INNER JOIN \`order\` o ON cd.order_id = o.id
      INNER JOIN user u ON o.user_id = u.id
      WHERE DATE(o.order_date) BETWEEN :from_date AND :to_date
    `;

    if (!isSuperAdmin) {
      revenueSql += ` AND u.branch_name = :user_branch_name`;
    } else if (branch_id) {
      revenueSql += ` AND u.id = :branch_id`;
    }

    const [revenueData] = await db.query(revenueSql, params);


    // ========================================
    // 2. GET COGS (Cost of Goods Sold)
    // ✅ CORRECT: ប្រើ purchase.total_amount ONLY
    // ========================================
    let cogsSql = `
      SELECT 
        COALESCE(SUM(p.total_amount), 0) AS total_cogs,
        COUNT(p.id) AS total_purchases,
        AVG(p.total_amount) AS avg_purchase_amount,
        MIN(p.order_date) AS first_purchase,
        MAX(p.order_date) AS last_purchase
      FROM purchase p
      LEFT JOIN user u ON p.user_id = u.id
      WHERE DATE(p.order_date) BETWEEN :from_date AND :to_date
        AND p.status IN ('confirmed', 'shipped', 'delivered')
    `;

    if (!isSuperAdmin) {
      cogsSql += ` AND u.branch_name = :user_branch_name`;
    }

    const [cogsData] = await db.query(cogsSql, params);


    // ========================================
    // 3. GET OPERATING EXPENSES
    // ========================================
    let expenseSql = `
      SELECT 
        et.code AS expense_code,
        et.name AS expense_name,
        COALESCE(SUM(e.amount), 0) AS total_amount,
        COUNT(e.id) AS transaction_count,
        CASE
          WHEN et.code LIKE '%FUEL%' OR et.code LIKE '%FREIGHT%' OR et.code LIKE '%PURCHASE%' THEN 'COGS'
          WHEN et.code LIKE '%SALARY%' OR et.code LIKE '%ELECTRIC%' OR et.code LIKE '%RENT%' OR et.code LIKE '%MAINTENANCE%' THEN 'OPEX'
          ELSE 'ADMIN'
        END AS category
      FROM expense e
      INNER JOIN expense_type et ON e.expense_type_id = et.id
      LEFT JOIN user u ON e.user_id = u.id
      WHERE DATE(e.expense_date) BETWEEN :from_date AND :to_date
    `;

    if (!isSuperAdmin) {
      expenseSql += ` AND u.branch_name = :user_branch_name`;
    } else if (branch_id) {
      expenseSql += ` AND (e.user_id = :branch_id OR u.id = :branch_id)`;
    }

    expenseSql += `
      GROUP BY et.code, et.name, category
      ORDER BY total_amount DESC
    `;

    const [expenseData] = await db.query(expenseSql, params);


    // ========================================
    // 4. CALCULATE PROFIT & LOSS
    // ========================================
    const totalRevenue = parseFloat(revenueData[0]?.total_revenue || 0);
    const collectedRevenue = parseFloat(revenueData[0]?.collected_revenue || 0);
    const pendingRevenue = parseFloat(revenueData[0]?.pending_revenue || 0);

    // ✅ COGS from purchase table ONLY (correct source)
    const totalCOGS_Purchase = parseFloat(cogsData[0]?.total_cogs || 0);

    // Additional COGS from expense table (fuel, freight)
    const cogsFromExpense = expenseData
      .filter(item => item.category === 'COGS')
      .reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);

    // ✅ Final COGS = Purchase + Additional Expenses
    const totalCOGS = totalCOGS_Purchase + cogsFromExpense;

    // Operating Expenses
    const opexTotal = expenseData
      .filter(item => item.category === 'OPEX')
      .reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);

    const adminTotal = expenseData
      .filter(item => item.category === 'ADMIN')
      .reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);

    // ✅ Calculations
    const grossProfit = totalRevenue - totalCOGS;
    const grossProfitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const totalOperatingExpense = opexTotal + adminTotal;
    const netProfit = grossProfit - totalOperatingExpense;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;


    // ========================================
    // 5. EXPENSE BREAKDOWN BY CATEGORY
    // ========================================
    const expenseBreakdown = {
      cogs: expenseData
        .filter(item => item.category === 'COGS')
        .map(item => ({
          name: item.expense_name,
          amount: parseFloat(item.total_amount),
          transactions: parseInt(item.transaction_count)
        })),
      opex: expenseData
        .filter(item => item.category === 'OPEX')
        .map(item => ({
          name: item.expense_name,
          amount: parseFloat(item.total_amount),
          transactions: parseInt(item.transaction_count)
        })),
      admin: expenseData
        .filter(item => item.category === 'ADMIN')
        .map(item => ({
          name: item.expense_name,
          amount: parseFloat(item.total_amount),
          transactions: parseInt(item.transaction_count)
        }))
    };

    // ========================================
    // 6. SANITY CHECK (Validation)
    // ========================================
    const sanityCheck = {
      isReasonable: true,
      warnings: []
    };

    // Check if COGS > Revenue (unusual but possible)
    if (totalCOGS > totalRevenue * 1.5) {
      sanityCheck.warnings.push({
        type: 'HIGH_COGS',
        message: 'COGS is unusually high compared to revenue',
        cogsToRevenueRatio: (totalCOGS / totalRevenue * 100).toFixed(2) + '%'
      });
    }

    // Check if Net Profit margin is extremely negative
    if (profitMargin < -100) {
      sanityCheck.warnings.push({
        type: 'EXTREME_LOSS',
        message: 'Net profit margin is extremely negative',
        margin: profitMargin.toFixed(2) + '%'
      });
      sanityCheck.isReasonable = false;
    }

    if (sanityCheck.warnings.length > 0) {
    }

    // ========================================
    // 7. RETURN RESPONSE
    // ========================================
    res.json({
      success: true,
      summary: {
        // Revenue
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        collectedRevenue: parseFloat(collectedRevenue.toFixed(2)),
        pendingRevenue: parseFloat(pendingRevenue.toFixed(2)),
        totalOrders: parseInt(revenueData[0]?.total_orders || 0),
        totalCustomers: parseInt(revenueData[0]?.total_customers || 0),
        collectionRate: totalRevenue > 0 ? parseFloat((collectedRevenue / totalRevenue * 100).toFixed(2)) : 0,

        // COGS
        totalCOGS: parseFloat(totalCOGS.toFixed(2)),
        cogsFromPurchase: parseFloat(totalCOGS_Purchase.toFixed(2)),
        cogsFromExpense: parseFloat(cogsFromExpense.toFixed(2)),
        totalPurchases: parseInt(cogsData[0]?.total_purchases || 0),

        // Gross Profit
        grossProfit: parseFloat(grossProfit.toFixed(2)),
        grossProfitMargin: parseFloat(grossProfitMargin.toFixed(2)),

        // Operating Expenses
        opexTotal: parseFloat(opexTotal.toFixed(2)),
        adminTotal: parseFloat(adminTotal.toFixed(2)),
        totalOperatingExpense: parseFloat(totalOperatingExpense.toFixed(2)),

        // Net Profit
        netProfit: parseFloat(netProfit.toFixed(2)),
        profitMargin: parseFloat(profitMargin.toFixed(2)),

        // Status
        profitStatus: netProfit > 0 ? 'Profit' : netProfit === 0 ? 'Break Even' : 'Loss',

        // Percentages
        cogsPercentage: totalRevenue > 0 ? parseFloat((totalCOGS / totalRevenue * 100).toFixed(2)) : 0,
        opexPercentage: totalRevenue > 0 ? parseFloat((totalOperatingExpense / totalRevenue * 100).toFixed(2)) : 0
      },
      breakdown: {
        revenue: {
          total: parseFloat(totalRevenue.toFixed(2)),
          collected: parseFloat(collectedRevenue.toFixed(2)),
          pending: parseFloat(pendingRevenue.toFixed(2)),
          collectionRate: totalRevenue > 0 ? parseFloat((collectedRevenue / totalRevenue * 100).toFixed(2)) : 0
        },
        expenses: {
          cogs: parseFloat(totalCOGS.toFixed(2)),
          cogsPurchase: parseFloat(totalCOGS_Purchase.toFixed(2)),
          cogsExpense: parseFloat(cogsFromExpense.toFixed(2)),
          opex: parseFloat(opexTotal.toFixed(2)),
          admin: parseFloat(adminTotal.toFixed(2)),
          total: parseFloat((totalCOGS + opexTotal + adminTotal).toFixed(2))
        },
        profit: {
          gross: parseFloat(grossProfit.toFixed(2)),
          net: parseFloat(netProfit.toFixed(2)),
          grossMargin: parseFloat(grossProfitMargin.toFixed(2)),
          netMargin: parseFloat(profitMargin.toFixed(2))
        },
        expenseDetails: expenseBreakdown
      },
      sanityCheck,
      metadata: {
        dateRange: {
          from: from_date,
          to: to_date
        },
        branchId: branch_id || 'All Branches',
        purchasePeriod: {
          first: cogsData[0]?.first_purchase || null,
          last: cogsData[0]?.last_purchase || null
        },
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("❌ Error in report_Income_vs_Expense:", error);
    logError("report.report_Income_vs_Expense", error, res);

    res.status(500).json({
      success: false,
      error: "Failed to generate Income vs Expense report",
      message: error.message
    });
  }
};

exports.report_Expense_Details = async (req, res) => {
  try {
    const { from_date, to_date, expense_type_id, branch_id, status } = req.query;

    const currentUserId = req.auth?.id || req.current_id;
    const [currentUser] = await db.query("SELECT role_id, branch_name FROM user WHERE id = ?", [currentUserId]);
    const { role_id, branch_name } = currentUser[0] || {};
    const isSuperAdmin = role_id === 29;

    let sql = `
      SELECT 
        e.id,
        e.expense_date,
        DATE_FORMAT(e.expense_date, '%d/%m/%Y') AS formatted_date,
        et.name AS expense_type,
        et.category,
        e.amount,
        e.description,
        e.receipt_no,
        e.payment_method,
        e.status,
        u_branch.branch_name,
        u_created.username AS created_by_name,
        u_approved.username AS approved_by_name,
        e.created_at
      FROM expense e
      INNER JOIN expense_type et ON e.expense_type_id = et.id
      LEFT JOIN user u_branch ON e.branch_id = u_branch.id
      LEFT JOIN user u_created ON e.created_by = u_created.id
      LEFT JOIN user u_approved ON e.approved_by = u_approved.id
      WHERE DATE(e.expense_date) BETWEEN :from_date AND :to_date
    `;

    const params = {
      from_date,
      to_date,
      expense_type_id: expense_type_id || null,
      branch_id: branch_id || null,
      status: status || null
    };

    if (expense_type_id) sql += ' AND e.expense_type_id = :expense_type_id';

    if (status) sql += ' AND e.status = :status';

    if (!isSuperAdmin) {
      // Enforce branch filter on the branch user or creator
      // Prioritize u_branch (from branch_id column) if used, else u_created
      sql += ` AND (u_branch.branch_name = :user_branch_name OR u_created.branch_name = :user_branch_name)`;
      params.user_branch_name = branch_name;
    } else if (branch_id) {
      sql += ' AND e.branch_id = :branch_id';
    }

    sql += ` ORDER BY e.expense_date DESC, e.created_at DESC`;

    const [list] = await db.query(sql, params);

    const totalExpense = list.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    const totalTransactions = list.length;

    const statusBreakdown = {
      pending: list.filter(item => item.status === 'Pending').length,
      approved: list.filter(item => item.status === 'Approved').length,
      rejected: list.filter(item => item.status === 'Rejected').length
    };

    res.json({
      list,
      summary: {
        totalExpense,
        totalTransactions,
        avgExpense: totalTransactions > 0 ? totalExpense / totalTransactions : 0,
        statusBreakdown
      }
    });

  } catch (error) {
    logError("report.report_Expense_Details", error, res);
  }
};
exports.report_Sale_Summary = async (req, res) => {
  try {
    let { from_date, to_date, category_id, branch_id } = req.query;


    // ✅ CORRECT CALCULATION with actual_price
    const currentUserId = req.auth?.id || req.current_id;
    const [currentUser] = await db.query("SELECT role_id, branch_name FROM user WHERE id = ?", [currentUserId]);
    const { role_id, branch_name } = currentUser[0] || {};
    const isSuperAdmin = role_id === 29;

    let sql = `
      SELECT 
        DATE_FORMAT(o.order_date, '%d/%m/%Y') AS order_date,
        u.branch_name,
        u.id AS user_id,
        SUM(od.qty) AS total_qty,
        -- ✅ CORRECT: (qty × price) ÷ actual_price
        SUM(
          (od.qty * od.price) / NULLIF(
            COALESCE(p.actual_price, c.actual_price, 1), 
            0
          )
        ) AS total_amount
      FROM \`order\` o
      INNER JOIN user u ON o.user_id = u.id
      INNER JOIN order_detail od ON o.id = od.order_id
      INNER JOIN product p ON od.product_id = p.id
      LEFT JOIN category c ON p.category_id = c.id
      WHERE DATE(o.order_date) BETWEEN :from_date AND :to_date
    `;

    const params = {
      from_date,
      to_date,
      category_id: category_id || null,
      branch_id: branch_id || null
    };

    if (category_id) sql += ' AND p.category_id = :category_id';

    if (!isSuperAdmin) {
      sql += ' AND u.branch_name = :user_branch_name';
      params.user_branch_name = branch_name;
    } else if (branch_id) {
      sql += ' AND u.id = :branch_id';
    }

    sql += `
      GROUP BY DATE_FORMAT(o.order_date, '%d/%m/%Y'), u.branch_name, u.id
      ORDER BY MIN(o.order_date) ASC
    `;

    const [list] = await db.query(sql, params);


    // Get branch list for dropdown
    const branchSql = `
      SELECT DISTINCT 
        u.id AS value,
        u.branch_name AS label
      FROM user u
      WHERE u.branch_name IS NOT NULL
      ORDER BY u.branch_name ASC
    `;
    const [branches] = await db.query(branchSql);

    // Calculate summary
    const summary = {
      total_revenue: list.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0),
      total_qty: list.reduce((sum, item) => sum + parseFloat(item.total_qty || 0), 0),
      total_days: list.length,
      avg_daily: list.length > 0
        ? list.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0) / list.length
        : 0
    };


    res.json({
      list,
      branches,
      summary
    });

  } catch (error) {
    console.error("❌ Error in report_Sale_Summary:", error);
    logError("report.report_Sale_Summary", error, res);
  }
};


// ✅ FIXED: report_Purchase_History

exports.report_Purchase_History = async (req, res) => {
  try {
    let { from_date, to_date, supplier_id } = req.query;

    const currentUserId = req.auth?.id || req.current_id;
    const [currentUser] = await db.query("SELECT role_id, branch_name FROM user WHERE id = ?", [currentUserId]);
    const { role_id, branch_name } = currentUser[0] || {};
    const isSuperAdmin = role_id === 29;

    let sql = `
      SELECT 
        p.id AS purchase_id,
        p.order_no AS reference_no,        -- ✅ FIXED: order_no instead of ref
        s.name AS supplier_name,
        s.tel AS supplier_tel,
        s.code AS supplier_code,
        p.total_amount AS total_amount,    -- ✅ FIXED: total_amount instead of paid_amount
        p.order_date AS purchase_date,     -- ✅ FIXED: order_date instead of create_at
        p.expected_delivery_date,
        p.status,
        p.payment_terms,
        u.username AS created_by,
        DATE_FORMAT(p.order_date, '%d/%m/%Y') AS formatted_date
      FROM purchase p
      LEFT JOIN supplier s ON p.supplier_id = s.id
      LEFT JOIN user u ON p.user_id = u.id
      WHERE DATE(p.order_date) BETWEEN :from_date AND :to_date
    `;

    const params = {
      from_date,
      to_date,
      supplier_id: supplier_id || null
    };

    if (supplier_id) sql += ' AND p.supplier_id = :supplier_id';

    if (!isSuperAdmin) {
      sql += ' AND u.branch_name = :user_branch_name';
      params.user_branch_name = branch_name;
    }

    sql += ' ORDER BY p.order_date DESC';

    const [list] = await db.query(sql, params);

    // Calculate summary
    const totalPurchases = list.length;
    const totalAmount = list.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);
    const avgPurchaseAmount = totalPurchases > 0 ? totalAmount / totalPurchases : 0;

    // Status breakdown
    const statusBreakdown = {
      pending: list.filter(item => item.status === 'pending').length,
      confirmed: list.filter(item => item.status === 'confirmed').length,
      shipped: list.filter(item => item.status === 'shipped').length,
      delivered: list.filter(item => item.status === 'delivered').length,
      cancelled: list.filter(item => item.status === 'cancelled').length
    };

    // Supplier breakdown
    const supplierBreakdown = {};
    list.forEach(item => {
      const supplierName = item.supplier_name || 'Unknown';
      if (!supplierBreakdown[supplierName]) {
        supplierBreakdown[supplierName] = {
          count: 0,
          totalAmount: 0
        };
      }
      supplierBreakdown[supplierName].count++;
      supplierBreakdown[supplierName].totalAmount += parseFloat(item.total_amount || 0);
    });

    res.json({
      list,
      summary: {
        totalPurchases,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        avgPurchaseAmount: parseFloat(avgPurchaseAmount.toFixed(2)),
        statusBreakdown,
        supplierBreakdown
      }
    });
  } catch (error) {
    console.error("❌ Error in report_Purchase_History:", error);
    logError("report.report_Purchase_History", error, res);
  }
};

exports.report_Outstanding_Debt = async (req, res) => {
  try {
    let { customer_id, branch_id } = req.query;


    const currentUserId = req.auth?.id || req.current_id;
    const [currentUser] = await db.query("SELECT role_id, branch_name FROM user WHERE id = ?", [currentUserId]);
    const { role_id, branch_name } = currentUser[0] || {};
    const isSuperAdmin = role_id === 29;

    let sql = `
    SELECT
    cd.id AS debt_id,
      cd.order_id,
      c.id AS customer_id,
        c.name AS customer_name,
          c.tel AS customer_tel,
            u.branch_name,
            cd.total_amount,
            cd.paid_amount,
            cd.due_amount AS outstanding_amount,
              cd.payment_status,
              cd.created_at AS due_date,
                cd.last_payment_date,
                DATEDIFF(CURDATE(), cd.created_at) AS days_overdue,
                  CASE 
          WHEN DATEDIFF(CURDATE(), cd.created_at) <= 0 THEN 'Current'
          WHEN DATEDIFF(CURDATE(), cd.created_at) <= 30 THEN '1-30 Days'
          WHEN DATEDIFF(CURDATE(), cd.created_at) <= 60 THEN '31-60 Days'
          WHEN DATEDIFF(CURDATE(), cd.created_at) <= 90 THEN '61-90 Days'
          ELSE '90+ Days'
        END AS aging_category,
      cd.notes,
      DATE_FORMAT(cd.created_at, '%d/%m/%Y') AS formatted_date
      FROM customer_debt cd
      INNER JOIN customer c ON cd.customer_id = c.id
      INNER JOIN \`order\` o ON cd.order_id = o.id
      INNER JOIN user u ON o.user_id = u.id
      WHERE cd.due_amount > 0
      AND cd.payment_status != 'Paid'
    `;

    const params = {
      customer_id: customer_id || null,
      branch_id: branch_id || null
    };

    if (customer_id) sql += ' AND c.id = :customer_id';

    if (!isSuperAdmin) {
      sql += ' AND u.branch_name = :user_branch_name';
      params.user_branch_name = branch_name;
    } else if (branch_id) {
      sql += ' AND u.id = :branch_id';
    }

    sql += ' ORDER BY days_overdue DESC, cd.due_amount DESC';

    const [list] = await db.query(sql, params);

    const totalOutstanding = list.reduce((sum, item) => sum + parseFloat(item.outstanding_amount || 0), 0);
    const totalDebts = list.length;
    const current = list.filter(item => item.aging_category === 'Current').length;
    const days1_30 = list.filter(item => item.aging_category === '1-30 Days').length;
    const days31_60 = list.filter(item => item.aging_category === '31-60 Days').length;
    const days61_90 = list.filter(item => item.aging_category === '61-90 Days').length;
    const days90Plus = list.filter(item => item.aging_category === '90+ Days').length;

    res.json({
      list,
      summary: {
        totalOutstanding,
        totalDebts,
        agingBreakdown: {
          current,
          days1_30,
          days31_60,
          days61_90,
          days90Plus
        }
      }
    });
  } catch (error) {
    logError("report.report_Outstanding_Debt", error, res);
  }
};


// ═══════════════════════════════════════════════════════════════
//  💳 PAYMENT HISTORY REPORT
//     របាយការណ៍ប្រវត្តិការទូទាត់
// ═══════════════════════════════════════════════════════════════

exports.report_Payment_History = async (req, res) => {
  try {
    let { from_date, to_date, customer_id, branch_id } = req.query;


    const currentUserId = req.auth?.id || req.current_id;
    const [currentUser] = await db.query("SELECT role_id, branch_name FROM user WHERE id = ?", [currentUserId]);
    const { role_id, branch_name } = currentUser[0] || {};
    const isSuperAdmin = role_id === 29;

    let sql = `
    SELECT
    pay.id AS payment_id,
      pay.order_id,
      c.id AS customer_id,
        c.name AS customer_name,
          c.tel AS customer_tel,
            u.branch_name,
            pay.amount AS payment_amount,
              pay.payment_method,
              pay.bank,
              pay.description,
              pay.payment_date,
              cd.total_amount AS debt_total,
                cd.paid_amount AS total_paid,
                  cd.due_amount AS remaining_balance,
                    DATE_FORMAT(pay.payment_date, '%d/%m/%Y') AS formatted_date
      FROM payments pay
      LEFT JOIN customer_debt cd ON pay.order_id = cd.order_id 
        AND pay.customer_id = cd.customer_id
      INNER JOIN customer c ON pay.customer_id = c.id
      INNER JOIN \`order\` o ON pay.order_id = o.id
      INNER JOIN user u ON o.user_id = u.id
      WHERE DATE(pay.payment_date) BETWEEN :from_date AND :to_date
    `;

    const params = {
      from_date,
      to_date,
      customer_id: customer_id || null,
      branch_id: branch_id || null
    };

    if (customer_id) sql += ' AND c.id = :customer_id';

    if (!isSuperAdmin) {
      sql += ' AND u.branch_name = :user_branch_name';
      params.user_branch_name = branch_name;
    } else if (branch_id) {
      sql += ' AND u.id = :branch_id';
    }

    sql += ' ORDER BY pay.payment_date DESC';

    const [list] = await db.query(sql, params);

    const totalPayments = list.length;
    const totalCollected = list.reduce((sum, item) => sum + parseFloat(item.payment_amount || 0), 0);
    const totalRemaining = list.reduce((sum, item) => sum + parseFloat(item.remaining_balance || 0), 0);

    const paymentMethods = {};
    list.forEach(item => {
      const method = item.payment_method || 'Unknown';
      paymentMethods[method] = (paymentMethods[method] || 0) + parseFloat(item.payment_amount || 0);
    });

    res.json({
      list,
      summary: {
        totalPayments,
        totalCollected,
        totalRemaining,
        paymentMethods
      }
    });
  } catch (error) {
    logError("report.report_Payment_History", error, res);
  }
};


// ═══════════════════════════════════════════════════════════════
//  📈 PROFIT & LOSS REPORT - WITH CORRECT CALCULATION
//     របាយការណ៍ប្រាក់ចំណេញ - គណនាត្រឹមត្រូវ
// ═══════════════════════════════════════════════════════════════

exports.report_Profit_Loss = async (req, res) => {
  try {
    let { from_date, to_date, category_id, branch_id } = req.query;


    const currentUserId = req.auth?.id || req.current_id;
    const [currentUser] = await db.query("SELECT role_id, branch_name FROM user WHERE id = ?", [currentUserId]);
    const { role_id, branch_name } = currentUser[0] || {};
    const isSuperAdmin = role_id === 29;

    let sql = `
    SELECT
    DATE_FORMAT(o.order_date, '%d/%m/%Y') AS sale_date,
      DATE_FORMAT(o.order_date, '%Y-%m') AS month,
        u.branch_name,
        cat.name AS category_name,
          p.name AS product_name,
            od.qty AS quantity_sold,
              od.price AS selling_price,
                p.actual_price AS cost_price,
                  cat.actual_price AS category_actual_price,
                    -- ✅ CORRECT revenue calculation
                      (od.qty * od.price / NULLIF(cat.actual_price, 0)) AS total_revenue,
                        (od.qty * p.actual_price) AS total_cost,
                          -- ✅ CORRECT profit calculation
                            ((od.qty * od.price / NULLIF(cat.actual_price, 0)) - (od.qty * p.actual_price)) AS gross_profit,
                              CASE
    WHEN((od.qty * od.price / NULLIF(cat.actual_price, 0)) - (od.qty * p.actual_price)) > 0 
          THEN 'Profit'
    WHEN((od.qty * od.price / NULLIF(cat.actual_price, 0)) - (od.qty * p.actual_price)) = 0 
          THEN 'Break Even'
          ELSE 'Loss'
        END AS profit_status
      FROM \`order\` o
      INNER JOIN user u ON o.user_id = u.id
      INNER JOIN order_detail od ON o.id = od.order_id
      INNER JOIN product p ON od.product_id = p.id
      LEFT JOIN category cat ON p.category_id = cat.id
      WHERE DATE(o.order_date) BETWEEN :from_date AND :to_date
    `;

    const params = {
      from_date,
      to_date,
      category_id: category_id || null,
      branch_id: branch_id || null
    };

    if (category_id) sql += ' AND p.category_id = :category_id';

    if (!isSuperAdmin) {
      sql += ' AND u.branch_name = :user_branch_name';
      params.user_branch_name = branch_name;
    } else if (branch_id) {
      sql += ' AND u.id = :branch_id';
    }

    sql += ' ORDER BY o.order_date DESC';

    const [list] = await db.query(sql, params);

    const totalRevenue = list.reduce((sum, item) => sum + parseFloat(item.total_revenue || 0), 0);
    const totalCost = list.reduce((sum, item) => sum + parseFloat(item.total_cost || 0), 0);
    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // Monthly breakdown
    const monthlyData = {};
    list.forEach(item => {
      const month = item.month;
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, cost: 0, profit: 0 };
      }
      monthlyData[month].revenue += parseFloat(item.total_revenue || 0);
      monthlyData[month].cost += parseFloat(item.total_cost || 0);
      monthlyData[month].profit += parseFloat(item.gross_profit || 0);
    });

    // Category breakdown
    const categoryData = {};
    list.forEach(item => {
      const category = item.category_name || 'Unknown';
      if (!categoryData[category]) {
        categoryData[category] = { revenue: 0, cost: 0, profit: 0, quantity: 0 };
      }
      categoryData[category].revenue += parseFloat(item.total_revenue || 0);
      categoryData[category].cost += parseFloat(item.total_cost || 0);
      categoryData[category].profit += parseFloat(item.gross_profit || 0);
      categoryData[category].quantity += parseFloat(item.quantity_sold || 0);
    });

    // Branch breakdown (if not filtered)
    const branchData = {};
    list.forEach(item => {
      const branch = item.branch_name || 'Unknown';
      if (!branchData[branch]) {
        branchData[branch] = { revenue: 0, cost: 0, profit: 0 };
      }
      branchData[branch].revenue += parseFloat(item.total_revenue || 0);
      branchData[branch].cost += parseFloat(item.total_cost || 0);
      branchData[branch].profit += parseFloat(item.gross_profit || 0);
    });

    res.json({
      list,
      summary: {
        totalRevenue,
        totalCost,
        grossProfit,
        profitMargin,
        totalTransactions: list.length,
        monthlyData,
        categoryData,
        branchData
      }
    });
  } catch (error) {
    logError("report.report_Profit_Loss", error, res);
  }
};


// ═══════════════════════════════════════════════════════════════
//  📊 BRANCH COMPARISON REPORT - UPDATED
//     របាយការណ៍ប្រៀបធៀបសាខា
// ═══════════════════════════════════════════════════════════════

exports.getBranchComparison = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { from_date, to_date } = req.query;

    if (!from_date || !to_date) {
      return res.status(400).json({
        error: true,
        message: "from_date and to_date parameters are required"
      });
    }

    // Verify user is super admin
    const [currentUser] = await db.query(
      `SELECT u.id, u.username, r.code AS role_code, r.id as role_id, u.branch_name
       FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (!currentUser || currentUser.length === 0) {
      return res.status(404).json({
        error: true,
        message: "User not found"
      });
    }

    const { role_code, role_id, branch_name } = currentUser[0];
    const isSuperAdmin = role_id === 29;

    let sql = `
      SELECT 
        COALESCE(u.branch_name, 'Unknown') AS branch_name,
        COUNT(DISTINCT cd.order_id) AS total_orders,
        COALESCE(SUM(cd.total_amount), 0) AS total_revenue,
        COALESCE(SUM(cd.paid_amount), 0) AS total_paid,
        COALESCE(SUM(cd.due_amount), 0) AS total_due,
        COUNT(DISTINCT cd.customer_id) AS unique_customers,
        COALESCE(AVG(cd.total_amount), 0) AS avg_order_value,
        CASE 
          WHEN SUM(cd.total_amount) > 0 
          THEN (SUM(cd.paid_amount) / SUM(cd.total_amount)) * 100
          ELSE 0
        END AS collection_rate
      FROM customer_debt cd
      INNER JOIN \`order\` o ON cd.order_id = o.id
      INNER JOIN user u ON o.user_id = u.id
      WHERE o.order_date BETWEEN :from_date AND :to_date
    `;

    const params = { from_date, to_date };

    if (!isSuperAdmin) {
      // If not super admin, only show their own branch (comparison effectively becomes single branch view)
      sql += ` AND u.branch_name = :user_branch_name`;
      params.user_branch_name = branch_name;
    }

    sql += `
      GROUP BY u.branch_name
      ORDER BY total_revenue DESC
    `;

    // ✅ Get data from customer_debt with correct calculation
    const [branchComparison] = await db.query(sql, params);

    // ✅ Get summary from customer_debt
    let summarySql = `
      SELECT 
        COUNT(DISTINCT cd.order_id) AS total_orders,
        COALESCE(SUM(cd.total_amount), 0) AS total_revenue,
        COALESCE(SUM(cd.paid_amount), 0) AS total_paid,
        COALESCE(SUM(cd.due_amount), 0) AS total_due,
        COUNT(DISTINCT cd.customer_id) AS total_customers
      FROM customer_debt cd
      INNER JOIN \`order\` o ON cd.order_id = o.id
      INNER JOIN user u ON o.user_id = u.id
      WHERE o.order_date BETWEEN :from_date AND :to_date
    `;

    if (!isSuperAdmin) {
      summarySql += ` AND u.branch_name = :user_branch_name`;
    }

    const [summary] = await db.query(summarySql, params);

    res.json({
      success: true,
      branchComparison: branchComparison || [],
      summary: summary[0] || {
        total_orders: 0,
        total_revenue: 0,
        total_paid: 0,
        total_due: 0,
        total_customers: 0
      },
      metadata: {
        date_range: { from: from_date, to: to_date },
        requested_by: {
          user_id: currentUserId,
          username: currentUser[0]?.username,
          role: role_code
        },
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error in getBranchComparison:', error);
    logError("supperadmin.getBranchComparison", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to generate branch comparison report",
      details: error.message
    });
  }
};
// ✅ FIXED: report_Expense_Summary - អ្នកមានស្រាប់
// គ្រាន់តែ update logic បន្តិច

exports.report_Expense_Summary = async (req, res) => {
  try {
    let { from_date, to_date, expense_type_id, branch_id } = req.query;

    // ✅ ប្រើ structure ដែលមានស្រាប់
    const sql = `
      SELECT 
        DATE_FORMAT(e.expense_date, '%d/%m/%Y') AS title,
        SUM(e.amount) AS total_amount,
        et.name AS expense_type_name,
        et.code AS expense_type_code,
        u.branch_name,
        COUNT(e.id) AS transaction_count
      FROM expense e
      INNER JOIN expense_type et ON e.expense_type_id = et.id
      LEFT JOIN user u ON e.user_id = u.id
      WHERE DATE_FORMAT(e.expense_date, '%Y-%m-%d') BETWEEN :from_date AND :to_date
      ${expense_type_id ? 'AND e.expense_type_id = :expense_type_id' : ''}
      ${branch_id ? 'AND e.user_id = :branch_id' : ''}
      GROUP BY DATE_FORMAT(e.expense_date, '%d/%m/%Y'), et.name, et.code, u.branch_name
      ORDER BY e.expense_date ASC
    `;

    const [list] = await db.query(sql, {
      from_date,
      to_date,
      expense_type_id: expense_type_id || null,
      branch_id: branch_id || null
    });

    // ✅ Calculate totals
    const totalExpense = list.reduce((sum, item) => sum + parseFloat(item.total_amount || 0), 0);
    const totalTransactions = list.reduce((sum, item) => sum + parseInt(item.transaction_count || 0), 0);
    const avgDaily = list.length > 0 ? totalExpense / list.length : 0;

    res.json({
      list,
      summary: {
        totalExpense,
        totalTransactions,
        avgDaily,
        totalDays: list.length
      }
    });

  } catch (error) {
    logError("report.report_Expense_Summary", error, res);
  }
};

exports.report_Customer = async (req, res) => {
  try {
    let { from_date, to_date } = req.query;

    // ✅ Auth & Branch Info
    const currentUserId = req.auth?.id;
    const userRole = req.auth?.role_id;
    const branch_name = req.auth?.branch_name;
    const isSuperAdmin = userRole === 29;

    to_date = new Date(to_date);
    to_date.setHours(23, 59, 59, 999);

    let sql = `
      SELECT 
        DATE_FORMAT(cu.create_at, '%d-%m-%Y') AS title,
        COUNT(cu.id) AS total_amount
      FROM customer cu
      WHERE cu.create_at BETWEEN :from_date AND :to_date
    `;

    const params = { from_date, to_date };

    if (!isSuperAdmin) {
      // ✅ Filter by branch for non-admins
      sql += ` AND cu.branch_name = :branch_name`;
      params.branch_name = branch_name;
    }

    sql += `
      GROUP BY DATE(cu.create_at)
      ORDER BY cu.create_at ASC;
    `;

    const [list] = await db.query(sql, params);
    res.json({ list });
  } catch (error) {
    logError("report.Customer", error, res);
  }
};
exports.top_sale = async (req, res) => {
  try {
    let { from_date, to_date, branch_id } = req.query;

    // ✅ Auth & Branch Info
    const currentUserId = req.auth?.id;
    const userRole = req.auth?.role_id;
    const branch_name = req.auth?.branch_name;
    const isSuperAdmin = userRole === 29;

    // Default date range if not provided
    if (!from_date || !to_date) {
      const currentDate = new Date();
      to_date = currentDate.toISOString().split('T')[0];
      from_date = `${currentDate.getFullYear()}-01-01`;
    }

    // ✅ CORRECT FORMULA: (qty × price) ÷ actual_price
    let sql = `
      SELECT 
        p.id AS product_id,
        p.name AS product_name,
        p.barcode,
        c.name AS category_name,
        c.actual_price,
        SUM(od.qty) AS total_qty,
        -- ✅ CORRECT: (qty × price) ÷ actual_price
        SUM(
          (od.qty * od.price) / NULLIF(
            COALESCE(p.actual_price, c.actual_price, 1), 
            0
          )
        ) AS total_sale_amount,
        COUNT(DISTINCT o.id) AS order_count,
        AVG(
          (od.qty * od.price) / NULLIF(
            COALESCE(p.actual_price, c.actual_price, 1), 
            0
          )
        ) AS avg_sale
      FROM product p
      INNER JOIN order_detail od ON p.id = od.product_id
      INNER JOIN \`order\` o ON od.order_id = o.id
      LEFT JOIN category c ON p.category_id = c.id
      LEFT JOIN user u ON o.user_id = u.id
      WHERE DATE(o.order_date) BETWEEN :from_date AND :to_date
    `;

    const params = {
      from_date,
      to_date
    };

    if (isSuperAdmin) {
      if (branch_id) {
        sql += ` AND u.id = :branch_id`;
        params.branch_id = branch_id;
      }
    } else {
      // ✅ Filter by branch for non-admins
      sql += ` AND u.branch_name = :user_branch_name`;
      params.user_branch_name = branch_name;
    }

    sql += `
      GROUP BY p.id, p.name, p.barcode, c.name, c.actual_price
      ORDER BY total_sale_amount DESC
      LIMIT 10
    `;

    const [list] = await db.query(sql, params);

    // Calculate summary
    const summary = {
      total_products: list.length,
      total_revenue: list.reduce((sum, item) => sum + parseFloat(item.total_sale_amount || 0), 0),
      total_qty: list.reduce((sum, item) => sum + parseFloat(item.total_qty || 0), 0),
      total_orders: list.reduce((sum, item) => sum + parseInt(item.order_count || 0), 0)
    };

    res.json({
      list,
      summary
    });

  } catch (error) {
    console.error('❌ Error in top_sale:', error);
    logError("top_sale.getlist", error, res);
  }
};


exports.report_Purchase_Summary = async (req, res) => {
  try {
    let { from_date, to_date, supplier_id } = req.query;
    to_date = new Date(to_date);
    to_date.setHours(23, 59, 59, 999);

    const sql = `
      SELECT 
        DATE_FORMAT(pu.create_at, '%d-%m-%Y') AS title,
        SUM(pu.paid_amount) AS total_amount
      FROM purchase pu
      WHERE DATE_FORMAT(pu.create_at, '%Y-%m-%d') BETWEEN :from_date AND :to_date
      AND (:supplier_id IS NULL OR pu.supplier_id = :supplier_id)
      GROUP BY pu.create_at;
    `;

    const [list] = await db.query(sql, { from_date, to_date, supplier_id });
    res.json({ list });
  } catch (error) {
    logError("report.report_Purchase_Summary", error, res);
  }
};

// ✅✅✅ SIMPLIFIED & WORKING: report_Stock_Status ✅✅✅
// Uses product table + order table (no inventory_transaction needed)

exports.report_Stock_Status = async (req, res) => {
  try {
    const { from_date, to_date, category_id, status_filter } = req.query;

    // ✅ Auth & Branch Info
    const currentUserId = req.auth?.id;
    const userRole = req.auth?.role_id;
    const branch_name = req.auth?.branch_name;
    const isSuperAdmin = userRole === 29;

    // ✅ Prepare filter condition for subqueries
    let branchFilter = '';
    const queryParams = {
      from_date: from_date || null,
      to_date: to_date || null
    };

    if (!isSuperAdmin) {
      branchFilter = `AND u_it.branch_name = :branch_name`;
      queryParams.branch_name = branch_name;
    }

    const sql = `
      SELECT 
        p.id AS product_id,
        p.name AS product_name,
        p.barcode,
        c.name AS category_name,
        COALESCE(stock.total_qty, 0) AS current_stock,
        p.unit,
        
        -- ✅ Get prices
        p.unit_price AS cost_price,
        -- Get selling_price from most recent inventory_transaction
        COALESCE(
          (SELECT it.selling_price
           FROM inventory_transaction it
           ${isSuperAdmin ? '' : 'LEFT JOIN user u_it ON it.user_id = u_it.id'}
           WHERE it.product_id = p.id
           ${branchFilter}
           ORDER BY it.created_at DESC
           LIMIT 1
          ), 0
        ) AS selling_price,
        COALESCE(p.actual_price, c.actual_price, 1) AS actual_price,
        
        -- ✅ Calculate Stock Value: (qty × unit_price) ÷ actual_price
        ROUND(
          COALESCE(stock.total_qty, 0) * p.unit_price / NULLIF(p.actual_price, 0),
          2
        ) AS stock_value,
        
        -- ✅ Get total sold from inventory_transaction (SALE_OUT)
        COALESCE(
          (SELECT SUM(ABS(it.quantity))
           FROM inventory_transaction it
           ${isSuperAdmin ? '' : 'LEFT JOIN user u_it ON it.user_id = u_it.id'}
           WHERE it.product_id = p.id
           AND it.transaction_type = 'SALE_OUT'
           ${branchFilter}
           ${from_date && to_date ? `AND DATE(it.created_at) BETWEEN :from_date AND :to_date` : ''}
          ), 0
        ) AS total_sold,
        
        -- ✅ Get total revenue from inventory_transaction (SALE_OUT)
        COALESCE(
          (SELECT SUM(
            ROUND(
              (ABS(it.quantity) * it.selling_price) / NULLIF(it.actual_price, 0),
              2
            )
          )
           FROM inventory_transaction it
           ${isSuperAdmin ? '' : 'LEFT JOIN user u_it ON it.user_id = u_it.id'}
           WHERE it.product_id = p.id
           AND it.transaction_type = 'SALE_OUT'
           ${branchFilter}
           ${from_date && to_date ? `AND DATE(it.created_at) BETWEEN :from_date AND :to_date` : ''}
          ), 0
        ) AS total_revenue,
        
        -- ✅ Stock Status (Global)
        CASE 
          WHEN COALESCE(stock.total_qty, 0) = 0 THEN 'Out of Stock'
          WHEN COALESCE(stock.total_qty, 0) < 100 THEN 'Low Stock'
          WHEN COALESCE(stock.total_qty, 0) < 500 THEN 'Medium Stock'
          ELSE 'In Stock'
        END AS stock_status,
        
        -- ✅ Last sale date from inventory_transaction
        (SELECT MAX(it.created_at)
         FROM inventory_transaction it
         ${isSuperAdmin ? '' : 'LEFT JOIN user u_it ON it.user_id = u_it.id'}
         WHERE it.product_id = p.id
         AND it.transaction_type = 'SALE_OUT'
         ${branchFilter}
        ) AS last_sale_date,
        
        p.receive_date AS last_receive_date
        
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
      ${isSuperAdmin ? '' : 'LEFT JOIN user u_prod ON p.user_id = u_prod.id'}
      LEFT JOIN (
        SELECT 
           it.product_id, 
           SUM(it.quantity) as total_qty
        FROM inventory_transaction it
        ${isSuperAdmin ? '' : 'LEFT JOIN user u_it ON it.user_id = u_it.id'}
        WHERE 1=1 ${branchFilter}
        GROUP BY it.product_id
      ) stock ON stock.product_id = p.id
      WHERE p.status = 1
      ${isSuperAdmin ? '' : 'AND u_prod.branch_name = :branch_name'}
      ${category_id ? `AND p.category_id = ${category_id}` : ''}
      ORDER BY COALESCE(stock.total_qty, 0) ASC
    `;

    const [list] = await db.query(sql, queryParams);

    // ✅ Apply status filter
    let filteredList = list;
    if (status_filter) {
      filteredList = list.filter(item => item.stock_status === status_filter);
    }

    // ✅ Calculate summary
    const totalProducts = filteredList.length;
    const totalQuantity = filteredList.reduce((sum, item) =>
      sum + parseFloat(item.current_stock || 0), 0
    );
    const totalStockValue = filteredList.reduce((sum, item) =>
      sum + parseFloat(item.stock_value || 0), 0
    );
    const totalRevenue = filteredList.reduce((sum, item) =>
      sum + parseFloat(item.total_revenue || 0), 0
    );
    const totalSold = filteredList.reduce((sum, item) =>
      sum + parseFloat(item.total_sold || 0), 0
    );

    const outOfStock = filteredList.filter(item => item.stock_status === 'Out of Stock').length;
    const lowStock = filteredList.filter(item => item.stock_status === 'Low Stock').length;
    const mediumStock = filteredList.filter(item => item.stock_status === 'Medium Stock').length;
    const inStock = filteredList.filter(item => item.stock_status === 'In Stock').length;

    // ✅ Category breakdown
    const categoryBreakdown = {};
    filteredList.forEach(item => {
      const category = item.category_name || 'Unknown';
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = {
          products: 0,
          current_stock: 0,
          stock_value: 0,
          total_sold: 0,
          revenue: 0
        };
      }
      categoryBreakdown[category].products++;
      categoryBreakdown[category].current_stock += parseFloat(item.current_stock || 0);
      categoryBreakdown[category].stock_value += parseFloat(item.stock_value || 0);
      categoryBreakdown[category].total_sold += parseFloat(item.total_sold || 0);
      categoryBreakdown[category].revenue += parseFloat(item.total_revenue || 0);
    });

    res.json({
      success: true,
      list: filteredList,
      summary: {
        totalProducts,
        totalQuantity: parseFloat(totalQuantity.toFixed(2)),
        totalStockValue: parseFloat(totalStockValue.toFixed(2)),
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        totalSold: parseFloat(totalSold.toFixed(2)),

        // Status breakdown
        outOfStock,
        lowStock,
        mediumStock,
        inStock,

        // Percentages
        outOfStockPercentage: totalProducts > 0
          ? parseFloat((outOfStock / totalProducts * 100).toFixed(2))
          : 0,
        lowStockPercentage: totalProducts > 0
          ? parseFloat((lowStock / totalProducts * 100).toFixed(2))
          : 0,

        categoryBreakdown
      },
      filters: {
        from_date: from_date || null,
        to_date: to_date || null,
        category_id: category_id || null,
        status_filter: status_filter || null
      }
    });

  } catch (error) {
    console.error("❌ Error in report_Stock_Status:", error);
    logError("report.report_Stock_Status", error, res);

    res.status(500).json({
      success: false,
      error: "Failed to generate stock status report",
      message: error.message
    });
  }
};

exports.report_Stock_Movement = async (req, res) => {
  try {
    let { from_date, to_date, product_id, category_id } = req.query;

    // ✅ Auth & Branch Info
    const currentUserId = req.auth?.id;
    const userRole = req.auth?.role_id;
    const branch_name = req.auth?.branch_name;
    const isSuperAdmin = userRole === 29;

    // ✅ Prepare Branch Filter
    let branchFilterJoin = '';
    let branchFilterWhere = '';
    const params = {
      from_date,
      to_date,
      product_id: product_id || null,
      category_id: category_id || null
    };

    if (!isSuperAdmin) {
      branchFilterJoin = `LEFT JOIN user u ON TABLE_ALIAS.user_id = u.id`;
      branchFilterWhere = `AND u.branch_name = : branch_name`;
      params.branch_name = branch_name;
    }

    // Helper to inject filter
    const getFilter = (alias) => {
      if (!isSuperAdmin) {
        return `
          LEFT JOIN user u ON ${alias}.user_id = u.id
          AND u.branch_name = : branch_name
  `;
      }
      return '';
    };

    // Note: For UNION, we need simpler injection
    // 1. Purchase: p.user_id
    // 2. Sale: o.user_id
    // 3. Inventory: it.user_id

    const sql = `
SELECT
'Purchase' AS movement_type,
  p.order_no AS reference_no,
    JSON_UNQUOTE(JSON_EXTRACT(p.items, '$[0].product_name')) AS product_name,
      JSON_UNQUOTE(JSON_EXTRACT(p.items, '$[0].barcode')) AS barcode,
        c.name AS category_name,
          NULL AS quantity_in,
            NULL AS quantity_out,
              p.total_amount AS amount,
                s.name AS related_party,
                  p.order_date AS movement_date,
                    DATE_FORMAT(p.order_date, '%d/%m/%Y') AS formatted_date,
                      p.status,
                      p.payment_terms
      FROM purchase p
      LEFT JOIN supplier s ON p.supplier_id = s.id
      LEFT JOIN category c ON JSON_UNQUOTE(JSON_EXTRACT(p.items, '$[0].category_id')) = c.id
      ${isSuperAdmin ? '' : 'LEFT JOIN user u_p ON p.user_id = u_p.id'}
      WHERE DATE(p.order_date) BETWEEN :from_date AND :to_date
        AND p.status IN('confirmed', 'shipped', 'delivered')
        ${isSuperAdmin ? '' : 'AND u_p.branch_name = :branch_name'}
      
      UNION ALL

SELECT
'Sale' AS movement_type,
  o.order_no AS reference_no,
    prod.name AS product_name,
      prod.barcode,
      c.name AS category_name,
        NULL AS quantity_in,
          od.qty AS quantity_out,
            (od.qty * od.price / NULLIF(COALESCE(prod.actual_price, c.actual_price, 1), 0)) AS amount,
              cust.name AS related_party,
                o.order_date AS movement_date,
                  DATE_FORMAT(o.order_date, '%d/%m/%Y') AS formatted_date,
                    NULL AS status,
                      NULL AS payment_terms
      FROM \`order\` o
      INNER JOIN order_detail od ON o.id = od.order_id
      INNER JOIN product prod ON od.product_id = prod.id
      LEFT JOIN category c ON prod.category_id = c.id
      LEFT JOIN customer cust ON o.customer_id = cust.id
      ${isSuperAdmin ? '' : 'LEFT JOIN user u_o ON o.user_id = u_o.id'}
      WHERE DATE(o.order_date) BETWEEN :from_date AND :to_date
      ${product_id ? 'AND prod.id = :product_id' : ''}
      ${category_id ? 'AND c.id = :category_id' : ''}
      ${isSuperAdmin ? '' : 'AND u_o.branch_name = :branch_name'}
      
      UNION ALL
      
      SELECT 
        CASE 
          WHEN it.transaction_type = 'PURCHASE_IN' THEN 'Inventory In'
          WHEN it.transaction_type = 'SALE_OUT' THEN 'Inventory Out'
          WHEN it.transaction_type = 'ADJUSTMENT' THEN 'Adjustment'
          ELSE it.transaction_type
        END AS movement_type,
        it.reference_no,
        prod.name AS product_name,
        prod.barcode,
        c.name AS category_name,
        CASE WHEN it.quantity > 0 THEN it.quantity ELSE NULL END AS quantity_in,
        CASE WHEN it.quantity < 0 THEN ABS(it.quantity) ELSE NULL END AS quantity_out,
        (ABS(it.quantity) * it.selling_price / NULLIF(it.actual_price, 0)) AS amount,
        COALESCE(cust.name, it.supplier_name) AS related_party,
        it.created_at AS movement_date,
        DATE_FORMAT(it.created_at, '%d/%m/%Y') AS formatted_date,
        NULL AS status,
        NULL AS payment_terms
      FROM inventory_transaction it
      INNER JOIN product prod ON it.product_id = prod.id
      LEFT JOIN category c ON prod.category_id = c.id
      LEFT JOIN \`order\` o ON it.reference_no = o.order_no
      LEFT JOIN customer cust ON o.customer_id = cust.id
      ${isSuperAdmin ? '' : 'LEFT JOIN user u_it ON it.user_id = u_it.id'}
      WHERE DATE(it.created_at) BETWEEN :from_date AND :to_date
      ${product_id ? 'AND prod.id = :product_id' : ''}
      ${category_id ? 'AND c.id = :category_id' : ''}
      ${isSuperAdmin ? '' : 'AND u_it.branch_name = :branch_name'}
      
      ORDER BY movement_date DESC
    `;

    const [list] = await db.query(sql, params);

    // Calculate summary
    const totalPurchases = list.filter(item => item.movement_type === 'Purchase').length;
    const totalSales = list.filter(item => item.movement_type === 'Sale').length;
    const totalInventoryIn = list.filter(item => item.movement_type === 'Inventory In').length;
    const totalInventoryOut = list.filter(item => item.movement_type === 'Inventory Out').length;
    const totalAdjustments = list.filter(item => item.movement_type === 'Adjustment').length;

    const totalPurchaseAmount = list
      .filter(item => item.movement_type === 'Purchase')
      .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    const totalSaleAmount = list
      .filter(item => item.movement_type === 'Sale')
      .reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);

    const totalQuantityIn = list
      .reduce((sum, item) => sum + parseFloat(item.quantity_in || 0), 0);

    const totalQuantityOut = list
      .reduce((sum, item) => sum + parseFloat(item.quantity_out || 0), 0);

    // Movement type breakdown
    const movementTypeBreakdown = {
      purchases: {
        count: totalPurchases,
        amount: parseFloat(totalPurchaseAmount.toFixed(2))
      },
      sales: {
        count: totalSales,
        amount: parseFloat(totalSaleAmount.toFixed(2))
      },
      inventoryIn: {
        count: totalInventoryIn,
        quantity: list
          .filter(item => item.movement_type === 'Inventory In')
          .reduce((sum, item) => sum + parseFloat(item.quantity_in || 0), 0)
      },
      inventoryOut: {
        count: totalInventoryOut,
        quantity: list
          .filter(item => item.movement_type === 'Inventory Out')
          .reduce((sum, item) => sum + parseFloat(item.quantity_out || 0), 0)
      },
      adjustments: {
        count: totalAdjustments
      }
    };

    res.json({
      list,
      summary: {
        totalMovements: list.length,
        totalPurchases,
        totalSales,
        totalInventoryIn,
        totalInventoryOut,
        totalAdjustments,
        totalPurchaseAmount: parseFloat(totalPurchaseAmount.toFixed(2)),
        totalSaleAmount: parseFloat(totalSaleAmount.toFixed(2)),
        totalQuantityIn: parseFloat(totalQuantityIn.toFixed(2)),
        totalQuantityOut: parseFloat(totalQuantityOut.toFixed(2)),
        netQuantity: parseFloat((totalQuantityIn - totalQuantityOut).toFixed(2)),
        netAmount: parseFloat((totalSaleAmount - totalPurchaseAmount).toFixed(2)),
        movementTypeBreakdown
      }
    });
  } catch (error) {
    console.error("❌ Error in report_Stock_Movement:", error);
    logError("report.report_Stock_Movement", error, res);
  }
};
// ✅ CORRECT - ជំនួសចុងបញ្ចប់ file


exports.branchComparison = async (req, res) => {
  try {
    const { from_date, to_date } = req.query;

    const currentUserId = req.auth?.id || req.current_id;
    const [currentUser] = await db.query("SELECT role_id, branch_name FROM user WHERE id = ?", [currentUserId]);
    const { role_id } = currentUser[0] || {};
    const isSuperAdmin = role_id === 29; // Assuming 29 is SuperAdmin

    if (!isSuperAdmin) {
      return res.status(403).json({
        error: true,
        message: "Access Denied. Super Admin only."
      });
    }

    // 1. Get Revenue & Orders per Branch
    const sql = `
        SELECT 
            u.branch_name,
            COUNT(DISTINCT o.id) as total_orders,
            COUNT(DISTINCT c.id) as unique_customers,
            COALESCE(SUM(o.total_amount), 0) as total_revenue,
            COALESCE(SUM(o.paid_amount), 0) as total_paid,
            COALESCE(SUM(o.total_amount - o.paid_amount), 0) as total_due
        FROM \`order\` o
        INNER JOIN user u ON o.user_id = u.id
        LEFT JOIN customer c ON o.customer_id = c.id
        WHERE DATE(o.order_date) BETWEEN :from_date AND :to_date
        AND u.branch_name IS NOT NULL
        GROUP BY u.branch_name
        ORDER BY total_revenue DESC
    `;

    const [branchComparison] = await db.query(sql, { from_date, to_date });

    const summary = {
      total_revenue: branchComparison.reduce((acc, curr) => acc + parseFloat(curr.total_revenue), 0),
      total_paid: branchComparison.reduce((acc, curr) => acc + parseFloat(curr.total_paid), 0),
      total_due: branchComparison.reduce((acc, curr) => acc + parseFloat(curr.total_due), 0),
      total_orders: branchComparison.reduce((acc, curr) => acc + parseInt(curr.total_orders), 0),
      total_customers: branchComparison.reduce((acc, curr) => acc + parseInt(curr.unique_customers), 0)
    };

    res.json({
      branchComparison,
      summary,
      metadata: {
        generated_at: new Date(),
        requested_by: {
          username: req.auth?.name,
          role: 'Super Admin'
        }
      }
    });

  } catch (error) {
    logError("report.branchComparison", error, res);
  }
};

module.exports = {
  report_Sale_Summary: exports.report_Sale_Summary,
  report_Expense_Summary: exports.report_Expense_Summary,
  report_Customer: exports.report_Customer,
  report_Purchase_Summary: exports.report_Purchase_Summary,
  top_sale: exports.top_sale,
  report_Stock_Status: exports.report_Stock_Status,
  report_Stock_Movement: exports.report_Stock_Movement,
  report_Purchase_History: exports.report_Purchase_History,
  report_Outstanding_Debt: exports.report_Outstanding_Debt,
  report_Payment_History: exports.report_Payment_History,
  report_Profit_Loss: exports.report_Profit_Loss,
  report_Expense_Category: exports.report_Expense_Category,
  report_Income_vs_Expense: exports.report_Income_vs_Expense,
  report_Expense_Details: exports.report_Expense_Details,
  getBranchComparison: exports.getBranchComparison,
  branchComparison: exports.branchComparison
};
