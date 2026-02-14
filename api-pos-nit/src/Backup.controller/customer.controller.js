
const { db, isArray, isEmpty, logError ,sendTelegramMessagenewcustomer} = require("../util/helper");


exports.getListByCurrentUserGroup = async (req, res) => {
  try {
    const { txtSearch } = req.query;

    let sql = `
      SELECT 
        c.id, 
        c.name, 
        c.gender, 
        c.tel, 
        c.email, 
        c.address, 
        c.type, 
        c.create_by, 
        c.create_at, 
        c.user_id,
        c.id_card_number, 
        c.id_card_expiry, 
        c.spouse_name, 
        c.guarantor_name,
        u.group_id,
        u.name as created_by_name,
        u.username as created_by_username
      FROM customer c
      INNER JOIN user u ON c.user_id = u.id
      INNER JOIN user cu ON cu.group_id = u.group_id
      WHERE cu.id = :current_user_id
    `;

    const params = { current_user_id: req.current_id };

    if (txtSearch) {
      sql += " AND (c.name LIKE :txtSearch OR c.tel LIKE :txtSearch OR c.email LIKE :txtSearch)";
      params.txtSearch = `%${txtSearch}%`;
    }

    const [list] = await db.query(sql, params);

    res.json({
      success: true,
      list,
      message: "Success!"
    });
  } catch (error) {
    logError("customer.getListByCurrentUserGroup", error, res);
  }
};

exports.getDetailById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required"
      });
    }

    // Main customer information with detailed relationships
    const customerSql = `
      SELECT 
        c.id, 
        c.name, 
        c.gender, 
        c.tel, 
        c.email, 
        c.address, 
        c.type, 
        c.status,
        c.create_by, 
        c.create_at,
        c.update_by,
        c.updated_at,
        c.user_id,
        c.id_card_number, 
        c.id_card_expiry, 
        c.spouse_name, 
        c.spouse_tel,
        c.guarantor_name,
        c.guarantor_tel,
        c.note,
        c.occupation,
        c.monthly_income,
        c.emergency_contact_name,
        c.emergency_contact_tel,
        u.group_id,
        u.name as created_by_name,
        u.username as created_by_username,
        u.tel as created_by_tel,
        uu.name as updated_by_name,
        uu.username as updated_by_username,
        uu.tel as updated_by_tel,
        assigned_user.name as assigned_user_name,
        assigned_user.username as assigned_user_username,
        assigned_user.tel as assigned_user_tel
      FROM customer c
      INNER JOIN user u ON c.user_id = u.id
      INNER JOIN user cu ON cu.group_id = u.group_id
      LEFT JOIN user uu ON c.update_by = uu.id
      LEFT JOIN user assigned_user ON c.user_id = assigned_user.id
      WHERE cu.id = :current_user_id AND c.id = :customer_id
    `;

    const [customerResult] = await db.query(customerSql, {
      current_user_id: req.current_id,
      customer_id: id
    });

    if (!customerResult || customerResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found or access denied"
      });
    }

    const customer = customerResult[0];

    // Get loans information
    const loansSql = `
      SELECT 
        l.id,
        l.amount,
        l.interest_rate,
        l.duration_months,
        l.status,
        l.purpose,
        l.start_date,
        l.end_date,
        l.monthly_payment,
        l.create_at as loan_create_at,
        lt.name as loan_type_name,
        COALESCE(SUM(p.amount), 0) as paid_amount,
        (l.amount - COALESCE(SUM(p.amount), 0)) as outstanding_balance
      FROM loan l
      LEFT JOIN loan_type lt ON l.loan_type_id = lt.id
      LEFT JOIN payment p ON l.id = p.loan_id
      WHERE l.customer_id = :customer_id
      GROUP BY l.id, l.amount, l.interest_rate, l.duration_months, l.status, 
               l.purpose, l.start_date, l.end_date, l.monthly_payment, l.create_at, lt.name
      ORDER BY l.create_at DESC
    `;

    const [loans] = await db.query(loansSql, { customer_id: id });

    // Get recent payments
    const recentPaymentsSql = `
      SELECT 
        p.id,
        p.amount,
        p.payment_date,
        p.payment_method,
        p.note as payment_note,
        p.create_at as payment_create_at,
        l.id as loan_id,
        l.amount as loan_amount,
        u.name as received_by_name
      FROM payment p
      INNER JOIN loan l ON p.loan_id = l.id
      LEFT JOIN user u ON p.create_by = u.id
      WHERE l.customer_id = :customer_id
      ORDER BY p.payment_date DESC, p.create_at DESC
      LIMIT 10
    `;

    const [recentPayments] = await db.query(recentPaymentsSql, { customer_id: id });

    // Get customer activity log (if you have audit table)
    const activitySql = `
      SELECT 
        'loan_created' as activity_type,
        l.create_at as activity_date,
        CONCAT('បានបង្កើតប្រាក់កម្ចី $', l.amount) as activity_description,
        u.name as performed_by
      FROM loan l
      LEFT JOIN user u ON l.create_by = u.id
      WHERE l.customer_id = :customer_id
      
      UNION ALL
      
      SELECT 
        'payment_received' as activity_type,
        p.payment_date as activity_date,
        CONCAT('បានទទួលការបង់ប្រាក់ $', p.amount) as activity_description,
        u.name as performed_by
      FROM payment p
      INNER JOIN loan l ON p.loan_id = l.id
      LEFT JOIN user u ON p.create_by = u.id
      WHERE l.customer_id = :customer_id
      
      ORDER BY activity_date DESC
      LIMIT 20
    `;

    const [activities] = await db.query(activitySql, { customer_id: id });

    // Calculate financial summary
    const totalLoanAmount = loans.reduce((sum, loan) => sum + parseFloat(loan.amount || 0), 0);
    const totalPaidAmount = loans.reduce((sum, loan) => sum + parseFloat(loan.paid_amount || 0), 0);
    const totalOutstandingBalance = loans.reduce((sum, loan) => sum + parseFloat(loan.outstanding_balance || 0), 0);
    const activeLoansCount = loans.filter(loan => loan.status === 'active').length;

    // Format response
    const response = {
      success: true,
      data: {
        // Basic customer information
        ...customer,
        create_by_info: {
          id: customer.create_by,
          name: customer.created_by_name,
          username: customer.created_by_username,
          tel: customer.created_by_tel
        },
        update_by_info: customer.update_by ? {
          id: customer.update_by,
          name: customer.updated_by_name,
          username: customer.updated_by_username,
          tel: customer.updated_by_tel
        } : null,
        assigned_user_info: {
          id: customer.user_id,
          name: customer.assigned_user_name,
          username: customer.assigned_user_username,
          tel: customer.assigned_user_tel
        },

        // Financial summary
        financial_summary: {
          total_loans: loans.length,
          active_loans: activeLoansCount,
          total_loan_amount: totalLoanAmount,
          total_paid_amount: totalPaidAmount,
          total_outstanding_balance: totalOutstandingBalance,
          average_loan_amount: loans.length > 0 ? totalLoanAmount / loans.length : 0,
          payment_history_count: recentPayments.length
        },

        // Detailed relationships
        loans: loans.map(loan => ({
          ...loan,
          paid_amount: parseFloat(loan.paid_amount || 0),
          outstanding_balance: parseFloat(loan.outstanding_balance || 0),
          amount: parseFloat(loan.amount || 0),
          monthly_payment: parseFloat(loan.monthly_payment || 0),
          interest_rate: parseFloat(loan.interest_rate || 0)
        })),

        recent_payments: recentPayments.map(payment => ({
          ...payment,
          amount: parseFloat(payment.amount || 0),
          loan_amount: parseFloat(payment.loan_amount || 0)
        })),

        activities: activities,

        // Additional computed fields
        customer_score: calculateCustomerScore({
          totalLoans: loans.length,
          activeLoans: activeLoansCount,
          totalPaidAmount,
          totalOutstandingBalance,
          customerAge: customer.create_at
        }),

        risk_assessment: assessCustomerRisk({
          outstandingBalance: totalOutstandingBalance,
          monthlyIncome: customer.monthly_income,
          activeLoans: activeLoansCount,
          paymentHistory: recentPayments
        })
      },
      message: "Customer details retrieved successfully"
    };

    res.json(response);

  } catch (error) {
    logError("customer.getDetailById", error, res);
  }
};

exports.getCustomerStatistics = async (req, res) => {
  try {
    const { period = '30' } = req.query; // days

    const statsSql = `
      SELECT 
        COUNT(DISTINCT c.id) as total_customers,
        COUNT(DISTINCT CASE WHEN c.status = 1 THEN c.id END) as active_customers,
        COUNT(DISTINCT CASE WHEN c.type = 'special' THEN c.id END) as special_customers,
        COUNT(DISTINCT CASE WHEN c.create_at >= DATE_SUB(NOW(), INTERVAL :period DAY) THEN c.id END) as new_customers,
        COUNT(DISTINCT l.id) as total_loans,
        COUNT(DISTINCT CASE WHEN l.status = 'active' THEN l.id END) as active_loans,
        COALESCE(SUM(CASE WHEN l.status = 'active' THEN l.amount END), 0) as total_active_loan_amount,
        COALESCE(SUM(p.amount), 0) as total_payments_amount,
        COUNT(DISTINCT p.id) as total_payments_count
      FROM customer c
      INNER JOIN user u ON c.user_id = u.id
      INNER JOIN user cu ON cu.group_id = u.group_id
      LEFT JOIN loan l ON c.id = l.customer_id
      LEFT JOIN payment p ON l.id = p.loan_id
      WHERE cu.id = :current_user_id
    `;

    const [statsResult] = await db.query(statsSql, {
      current_user_id: req.current_id,
      period: parseInt(period)
    });

    const stats = statsResult[0] || {};

    // Get monthly trend data
    const trendSql = `
      SELECT 
        DATE_FORMAT(c.create_at, '%Y-%m') as month,
        COUNT(c.id) as customers_created,
        COUNT(DISTINCT l.id) as loans_created,
        COALESCE(SUM(l.amount), 0) as loans_amount
      FROM customer c
      INNER JOIN user u ON c.user_id = u.id
      INNER JOIN user cu ON cu.group_id = u.group_id
      LEFT JOIN loan l ON c.id = l.customer_id AND DATE_FORMAT(l.create_at, '%Y-%m') = DATE_FORMAT(c.create_at, '%Y-%m')
      WHERE cu.id = :current_user_id 
        AND c.create_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(c.create_at, '%Y-%m')
      ORDER BY month DESC
      LIMIT 12
    `;

    const [trendResult] = await db.query(trendSql, {
      current_user_id: req.current_id
    });

    res.json({
      success: true,
      data: {
        summary: {
          total_customers: parseInt(stats.total_customers) || 0,
          active_customers: parseInt(stats.active_customers) || 0,
          inactive_customers: (parseInt(stats.total_customers) || 0) - (parseInt(stats.active_customers) || 0),
          special_customers: parseInt(stats.special_customers) || 0,
          regular_customers: (parseInt(stats.total_customers) || 0) - (parseInt(stats.special_customers) || 0),
          new_customers_period: parseInt(stats.new_customers) || 0,
          total_loans: parseInt(stats.total_loans) || 0,
          active_loans: parseInt(stats.active_loans) || 0,
          total_active_loan_amount: parseFloat(stats.total_active_loan_amount) || 0,
          total_payments_amount: parseFloat(stats.total_payments_amount) || 0,
          total_payments_count: parseInt(stats.total_payments_count) || 0,
          average_loan_amount: stats.total_loans > 0 ? (parseFloat(stats.total_active_loan_amount) || 0) / parseInt(stats.total_loans) : 0
        },
        trends: trendResult.map(item => ({
          ...item,
          loans_amount: parseFloat(item.loans_amount) || 0
        }))
      },
      message: "Statistics retrieved successfully"
    });

  } catch (error) {
    logError("customer.getCustomerStatistics", error, res);
  }
};

// Helper functions
function calculateCustomerScore({ totalLoans, activeLoans, totalPaidAmount, totalOutstandingBalance, customerAge }) {
  let score = 50; // Base score

  // Positive factors
  if (totalPaidAmount > 0) score += 20;
  if (totalLoans > 0 && activeLoans === 0) score += 15; // All loans completed
  if (totalOutstandingBalance === 0) score += 10;

  // Negative factors
  if (activeLoans > 2) score -= 15;
  if (totalOutstandingBalance > totalPaidAmount) score -= 10;

  // Customer age factor (longer relationship = better score)
  const monthsSinceCreation = new Date().getMonth() - new Date(customerAge).getMonth();
  if (monthsSinceCreation > 12) score += 10;
  if (monthsSinceCreation > 24) score += 5;

  return Math.max(0, Math.min(100, score));
}

function assessCustomerRisk({ outstandingBalance, monthlyIncome, activeLoans, paymentHistory }) {
  let riskLevel = 'low';
  let riskFactors = [];

  // High outstanding balance
  if (outstandingBalance > (monthlyIncome * 3)) {
    riskLevel = 'high';
    riskFactors.push('High outstanding balance relative to income');
  }

  // Too many active loans
  if (activeLoans > 2) {
    riskLevel = riskLevel === 'high' ? 'high' : 'medium';
    riskFactors.push('Multiple active loans');
  }

  // Recent payment issues (if payment dates are overdue)
  const recentPayments = paymentHistory.slice(0, 3);
  if (recentPayments.length > 0) {
    const hasRecentPayments = recentPayments.some(p => {
      const paymentDate = new Date(p.payment_date);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return paymentDate >= thirtyDaysAgo;
    });

    if (!hasRecentPayments && outstandingBalance > 0) {
      riskLevel = 'high';
      riskFactors.push('No recent payments with outstanding balance');
    }
  }

  return {
    level: riskLevel,
    factors: riskFactors,
    score: riskLevel === 'low' ? 85 : riskLevel === 'medium' ? 60 : 30
  };
}



// Updated create function with better debugging
exports.create = async (req, res) => {
  try {


    const { 
      name, 
      tel, 
      email, 
      address, 
      type, 
      gender, 
      id_card_number, 
      id_card_expiry, 
      spouse_name, 
      spouse_tel,
      guarantor_name,
      guarantor_tel,
      status = 1
    } = req.body;

    // Validation
    if (!name || !tel || !email || !type) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Missing required fields: name, tel, email, type",
      });
    }

    // Check duplicate phone
    const [existing] = await db.query(`SELECT id FROM customer WHERE tel = ?`, [tel]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: true, message: "លេខទូរស័ព្ទនេះមានរួចហើយ។ សូមប្រើលេខផ្សេង។" });
    }

    // Check duplicate email
    const [existingEmail] = await db.query(`SELECT id FROM customer WHERE email = ?`, [email]);
    if (existingEmail.length > 0) {
      return res.status(400).json({ success: false, error: true, message: "អ៊ីមែលនេះមានរួចហើយ។ សូមប្រើអ៊ីមែលផ្សេង។" });
    }

    // Insert customer
    const sql = `
      INSERT INTO customer 
      (name, tel, email, address, type, gender, create_by, user_id,
       id_card_number, id_card_expiry, spouse_name, spouse_tel, 
       guarantor_name, guarantor_tel, status)
      VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?,
       ?, ?, ?, ?, 
       ?, ?, ?)
    `;

    const params = [
      name, tel, email, address || null, type, gender || null, req.auth?.name || "system", req.auth?.id || null,
      id_card_number || null, id_card_expiry || null, spouse_name || null, spouse_tel || null, 
      guarantor_name || null, guarantor_tel || null, status
    ];

    const [data] = await db.query(sql, params);

    // Fetch full customer info for Telegram
// After successful insert
const [customerInfo] = await db.query(`SELECT * FROM customer WHERE id = ?`, [data.insertId]);

if (customerInfo.length > 0) {
  const customer = customerInfo[0];
  const telegramMessage = `
🆕 អតិថិជនថ្មីត្រូវបានបង្កើត!

👤 អតិថិជន: ${customer.name}
📞 លេខទូរស័ព្ទ: ${customer.tel}
📧 អ៊ីមែល: ${customer.email}
🏠 អាសយដ្ឋាន: ${customer.address || "-"}
🎫 អត្តសញ្ញាណ: ${customer.id_card_number || "-"}
📅 ផុតកំណត់: ${customer.id_card_expiry || "-"}
👩‍❤️‍👨 ឈ្មោះប្តី/ប្រពន្ធ: ${customer.spouse_name || "-"}
📞 លេខទូរស័ព្ទប្តី/ប្រពន្ធ: ${customer.spouse_tel || "-"}
👥 ឈ្មោះអ្នកធានា: ${customer.guarantor_name || "-"}
📞 លេខទូរស័ព្ទអ្នកធានា: ${customer.guarantor_tel || "-"}
📌 ប្រភេទ: ${customer.type}
⚙️ ស្ថានភាព: ${customer.status}
`;

  await sendTelegramMessagenewcustomer(telegramMessage); // 💬 Call helper here

}


    res.status(201).json({
      success: true,
      error: false,
      data: {
        id: data.insertId,
        affectedRows: data.affectedRows,
      },
      message: "អតិថិជនត្រូវបានបង្កើតដោយជោគជ័យ!",
    });

  } catch (error) {
    logError("customer.create", error, res);
  }
};
// Updated update function with better debugging
// Updated update function with better debugging
exports.update = async (req, res) => {
  try {

    
    const { id } = req.params;
    const { 
      name, 
      tel, 
      email, 
      address, 
      type, 
      gender, 
      id_card_number, 
      id_card_expiry, 
      spouse_name, 
      spouse_tel,
      guarantor_name,
      guarantor_tel,
      status = 1
    } = req.body;

    if (!name || !tel || !email || !type) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Missing required fields: name, tel, email, type",
      });
    }

    // Check if customer exists
    const existsCheckSql = `SELECT id FROM customer WHERE id = ?`;
    const [customerExists] = await db.query(existsCheckSql, [id]);
    
    if (!customerExists || customerExists.length === 0) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "រកមិនឃើញអតិថិជននេះទេ។",
      });
    }

    // Check if phone number already exists for other customers
    const checkSql = `SELECT id, name FROM customer WHERE tel = ? AND id != ?`;
    const [existing] = await db.query(checkSql, [tel, id]);
    
    
    if (existing && existing.length > 0) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "លេខទូរស័ព្ទនេះមានរួចហើយ។ សូមប្រើលេខផ្សេង។",
      });
    }

    // Check email uniqueness for other customers
    const checkEmailSql = `SELECT id, name FROM customer WHERE email = ? AND id != ?`;
    const [existingEmail] = await db.query(checkEmailSql, [email, id]);
    
    if (existingEmail && existingEmail.length > 0) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "អ៊ីមែលនេះមានរួចហើយ។ សូមប្រើអ៊ីមែលផ្សេង។",
      });
    }

    const sql = `
      UPDATE customer 
      SET name = ?, tel = ?, email = ?, address = ?, type = ?,
          gender = ?, id_card_number = ?, id_card_expiry = ?,
          spouse_name = ?, spouse_tel = ?,
          guarantor_name = ?, guarantor_tel = ?,
          status = ?
      WHERE id = ?
    `;

    const params = [
      name, tel, email, address, type,
      gender, id_card_number, id_card_expiry,
      spouse_name, spouse_tel,
      guarantor_name, guarantor_tel,
      status, id
    ];

    const [data] = await db.query(sql, params);

    if (data.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "រកមិនឃើញអតិថិជននេះទេ។",
      });
    }

    res.json({
      success: true,
      error: false,
      data: data,
      message: "អតិថិជនត្រូវបានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ!",
    });

  } catch (error) {
    console.error("=== Customer Update Error ===");
    console.error("Error details:", error);
    
    if (error.code === 'ER_DUP_ENTRY') {
      if (error.message.includes('tel')) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "លេខទូរស័ព្ទនេះមានរួចហើយ។ សូមប្រើលេខផ្សេង។",
        });
      }
      if (error.message.includes('email')) {
        return res.status(400).json({
          success: false,
          error: true,
          message: "អ៊ីមែលនេះមានរួចហើយ។ សូមប្រើអ៊ីមែលផ្សេង។",
        });
      }
    }
    
    res.status(500).json({
      success: false,
      error: true,
      message: "បរាជ័យក្នុងការធ្វើបច្ចុប្បន្នភាពអតិថិជន។",
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
exports.assignCustomerToUser = async (req, res) => {
  try {
    const { customer_id, assigned_user_id } = req.body;

    // Validate required fields
    if (!customer_id || !assigned_user_id) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: customer_id, assigned_user_id",
      });
    }

    // Update customer's assigned user
    const sql = `UPDATE customer SET user_id = :assigned_user_id WHERE id = :customer_id`;
    await db.query(sql, { assigned_user_id, customer_id });

    res.status(200).json({
      success: true,
      message: "Customer assigned successfully!",
    });
   } catch (error) {
    logError("customer.assigned", error, res);
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params; // Extract `id` from URL parameters

    // Validate `id`
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Customer ID is required!",
      });
    }

    const sql = "DELETE FROM customer WHERE id = :id";
    const [data] = await db.query(sql, { id });

    // Check if any rows were affected
    if (data.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Customer not found!",
      });
    }

    res.json({
      success: true,
      data: data,
      message: "Customer deleted successfully!",
    });
  } catch (error) {
    logError("customer.remove", error, res);
  }
};


// ក្នុង customer.controller.js បន្ថែម function នេះ
exports.getCustomerOrderStats = async (req, res) => {
  try {
    const { customer_ids } = req.query;

    if (!customer_ids) {
      return res.json({ success: true, data: [] });
    }

    const ids = customer_ids.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
    
    if (ids.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const sql = `
      SELECT 
        o.customer_id,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_amount,
        MAX(o.create_at) as last_order_date
      FROM \`order\` o
      WHERE o.customer_id IN (${ids.map(() => '?').join(',')})
      GROUP BY o.customer_id
    `;

    const [stats] = await db.query(sql, ids);

    res.json({
      success: true,
      data: stats.map(stat => ({
        customer_id: stat.customer_id,
        total_orders: parseInt(stat.total_orders) || 0,
        total_amount: parseFloat(stat.total_amount) || 0,
        last_order_date: stat.last_order_date
      }))
    });

  } catch (error) {
    logError("customer.getCustomerOrderStats", error, res);
  }
};
