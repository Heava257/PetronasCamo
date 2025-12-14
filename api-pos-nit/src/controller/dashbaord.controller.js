// const { db, isArray, isEmpty, logError } = require("../util/helper");

// exports.getList = async (req, res) => {
//   try {
//     let { from_date, to_date } = req.query;

//     if (!from_date || !to_date) {
//       const currentDate = new Date();
//       to_date = currentDate.toISOString().split('T')[0]; 

//       from_date = `${currentDate.getFullYear()}-01-01`;
//     }
//     const dateFilter = from_date && to_date ?
//       `AND DATE(r.create_at) BETWEEN '${from_date}' AND '${to_date}'` :
//       '';
//     const expenseDateFilter = from_date && to_date ?
//       `AND DATE(r.expense_date) BETWEEN '${from_date}' AND '${to_date}'` :
//       '';
//    const topSaleQuery = `
//       SELECT 
//         c.name AS category_name,
//         SUM(od.qty) AS total_qty,
//         SUM(od.total) AS total_sale_amount
//       FROM order_detail od
//       JOIN product p ON od.product_id = p.id
//       LEFT JOIN category c ON p.category_id = c.id
//       JOIN \`order\` o ON od.order_id = o.id
//       WHERE od.total > 0
//       AND (p.category_id IS NULL OR p.category_id != 0)
//       ${from_date && to_date ? `AND DATE(o.create_at) BETWEEN '${from_date}' AND '${to_date}'` : ''}
//       GROUP BY c.id, c.name
//       ORDER BY total_sale_amount DESC
//       LIMIT 5
//     `;
//     const [Top_Sale] = await db.query(topSaleQuery);
//     const customerQuery = `
//       SELECT 
//         COUNT(id) AS total,
//         SUM(CASE WHEN gender = 'male' THEN 1 ELSE 0 END) AS male,
//         SUM(CASE WHEN gender = 'female' THEN 1 ELSE 0 END) AS female
//       FROM customer
//       ${from_date && to_date ? `WHERE DATE(create_at) BETWEEN '${from_date}' AND '${to_date}'` : ''}
//     `;
//     const [customer] = await db.query(customerQuery);
//     const newCustomerDetailQuery = `
//       SELECT 
//         id,
//         name,
//         tel,
//         email,
//         address,
//         type,
//         gender,
//         spouse_name,
//         guarantor_name,
//         id_card_number,
//         id_card_expiry,
//         status,
//         DATE(create_at) as registration_date,
//         DATE(updated_at) as last_updated
//       FROM customer
//       WHERE 1=1
//       ${from_date && to_date ? `AND DATE(create_at) BETWEEN '${from_date}' AND '${to_date}'` : ''}
//       ORDER BY create_at DESC
//     `;
//     const [New_Customer_Details] = await db.query(newCustomerDetailQuery);
//     const customerTrendQuery = `
//       SELECT 
//         DATE_FORMAT(create_at, '%Y-%m') AS month,
//         DATE_FORMAT(create_at, '%M %Y') AS month_name,
//         COUNT(*) AS new_customers,
//         SUM(CASE WHEN gender = 'male' THEN 1 ELSE 0 END) AS male_count,
//         SUM(CASE WHEN gender = 'female' THEN 1 ELSE 0 END) AS female_count
//       FROM customer
//       WHERE 1=1
//       ${from_date && to_date ? `AND DATE(create_at) BETWEEN '${from_date}' AND '${to_date}'` : ''}
//       GROUP BY DATE_FORMAT(create_at, '%Y-%m'), DATE_FORMAT(create_at, '%M %Y')
//       ORDER BY month DESC
//     `;
//     const [Customer_Registration_Trend] = await db.query(customerTrendQuery);
//     const customerTypeQuery = `
//       SELECT 
//         type,
//         COUNT(*) AS count,
//         ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM customer 
//           WHERE 1=1 ${from_date && to_date ? `AND DATE(create_at) BETWEEN '${from_date}' AND '${to_date}'` : ''})), 2) AS percentage
//       FROM customer
//       WHERE 1=1
//       ${from_date && to_date ? `AND DATE(create_at) BETWEEN '${from_date}' AND '${to_date}'` : ''}
//       GROUP BY type
//       ORDER BY count DESC
//     `;
//     const [Customer_Type_Breakdown] = await db.query(customerTypeQuery);
//     const customerActivityQuery = `
//       SELECT 
//         c.id,
//         c.name,
//         c.tel,
//         c.email,
//         c.gender,
//         DATE(c.create_at) as registration_date,
//         COUNT(o.id) AS total_orders,
//         COALESCE(SUM(o.total_amount), 0) AS total_spent,
//         MAX(o.create_at) AS last_order_date,
//         DATEDIFF(NOW(), MAX(o.create_at)) AS days_since_last_order
//       FROM customer c
//       LEFT JOIN \`order\` o ON c.id = o.customer_id
//       WHERE 1=1
//       ${from_date && to_date ? `AND DATE(c.create_at) BETWEEN '${from_date}' AND '${to_date}'` : ''}
//       GROUP BY c.id, c.name, c.tel, c.email, c.gender, c.create_at
//       ORDER BY total_spent DESC
//     `;
//     const [Customer_Activity_Report] = await db.query(customerActivityQuery);
//     const recentCustomerQuery = `
//       SELECT 
//         'Last 7 Days' AS period,
//         COUNT(*) AS new_customers
//       FROM customer 
//       WHERE create_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      
//       UNION ALL
      
//       SELECT 
//         'Last 30 Days' AS period,
//         COUNT(*) AS new_customers
//       FROM customer 
//       WHERE create_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      
//       UNION ALL
      
//       SELECT 
//         'This Month' AS period,
//         COUNT(*) AS new_customers
//       FROM customer 
//       WHERE MONTH(create_at) = MONTH(NOW()) AND YEAR(create_at) = YEAR(NOW())
      
//       UNION ALL
      
//       SELECT 
//         'Previous Month' AS period,
//         COUNT(*) AS new_customers
//       FROM customer 
//       WHERE MONTH(create_at) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH)) 
//       AND YEAR(create_at) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
//     `;
//     const [Recent_Customer_Stats] = await db.query(recentCustomerQuery);
//     const [employee] = await db.query(`
//       SELECT 
//         COUNT(id) AS total, 
//         SUM(CASE WHEN gender = 1 THEN 1 ELSE 0 END) AS male, 
//         SUM(CASE WHEN gender = 0 THEN 1 ELSE 0 END) AS female
//       FROM employee;
//     `);
//     const expenseQuery = `
//       SELECT 
//         COALESCE(SUM(amount), 0) AS total, 
//         COUNT(id) AS total_expense 
//       FROM expense 
//       WHERE 1=1
//       ${from_date && to_date ? `AND DATE(expense_date) BETWEEN '${from_date}' AND '${to_date}'` : ''}
//     `;
//     const [expanse] = await db.query(expenseQuery);
//     const saleQuery = `
//       SELECT 
//         CONCAT(COALESCE(SUM(r.total_amount), 0), '$') AS total, 
//         COUNT(r.id) AS total_order 
//       FROM \`order\` r 
//       WHERE 1=1
//       ${from_date && to_date ? `AND DATE(r.create_at) BETWEEN '${from_date}' AND '${to_date}'` : ''}
//     `;
//     const [sale] = await db.query(saleQuery);
//     const saleSummaryQuery = `
//       SELECT 
//         DATE_FORMAT(r.create_at, '%M') AS title, 
//         SUM(r.total_amount) AS total 
//       FROM \`order\` r 
//       WHERE 1=1
//       ${dateFilter}
//       GROUP BY DATE_FORMAT(r.create_at, '%M')
//     `;
//     const [Sale_Summary_By_Month] = await db.query(saleSummaryQuery);
//     const expenseSummaryQuery = `
//       SELECT 
//         DATE_FORMAT(r.expense_date, '%M') AS title, 
//         SUM(r.amount) AS total 
//       FROM expense r 
//       WHERE 1=1
//       ${expenseDateFilter}
//       GROUP BY DATE_FORMAT(r.expense_date, '%M')
//     `;
//     const [Expense_Summary_By_Month] = await db.query(expenseSummaryQuery);
//     const [User_Summary] = await db.query(`
//   SELECT 
//     r.name, 
//     COUNT(u.id) AS total_users
//   FROM user u
//   JOIN role r ON u.role_id = r.id
//   GROUP BY r.name, r.id
//   ORDER BY r.id
// `);
//     let dashboard = [
//       {
//         title: "អ្នកប្រើប្រាស់",
//         Summary: {
//           "សរុប": User_Summary.reduce((sum, row) => sum + row.total_users, 0) + " នាក់",
//           ...User_Summary.reduce((acc, role) => {
//             acc[`${role.name}`] = role.total_users + " នាក់";
//             return acc;
//           }, {})
//         }
//       },
//       {
//         title: "អតិថិជន",
//         Summary: {
//           "សរុប": customer[0].total + " នាក់",
//           "បុរស": customer[0].male + " នាក់",
//           "ស្ត្រី": customer[0].female + " នាក់"
//         }
//       },
//       {
//         title: "ប្រព័ន្ធចំណាយ",
//         Summary: {
//           "ចំណាយ": from_date && to_date ? `${from_date} - ${to_date}` : "ខែនេះ",
//           "សរុប": expanse[0].total + "$",
//           "ចំនួនសរុប": expanse[0].total_expense
//         }
//       },
//       {
//         title: "ការលក់",
//         Summary: {
//           "លក់": from_date && to_date ? `${from_date} - ${to_date}` : "ខែនេះ",
//           "សរុប": sale[0].total,
//           "ការបញ្ជាទិញសរុប": sale[0].total_order
//         }
//       }
//     ];
//     res.json({
//       dashboard,
//       Sale_Summary_By_Month,
//       Expense_Summary_By_Month,
//       Top_Sale,
//       Customer_Reports: {
//         New_Customer_Details,
//         Customer_Registration_Trend,
//         Customer_Type_Breakdown,
//         Customer_Activity_Report,
//         Recent_Customer_Stats
//       },
//       Customer_Summary: {
//         total_new_customers: customer[0].total,
//         active_customers: Customer_Activity_Report.filter(c => c.total_orders > 0).length,
//         inactive_customers: Customer_Activity_Report.filter(c => c.total_orders === 0).length,
//         average_spent_per_customer: Customer_Activity_Report.length > 0
//           ? (Customer_Activity_Report.reduce((sum, c) => sum + parseFloat(c.total_spent), 0) / Customer_Activity_Report.length).toFixed(2)
//           : 0,
//         top_spending_customer: Customer_Activity_Report.length > 0 ? Customer_Activity_Report[0] : null
//       },
//       filter_info: {
//         from_date,
//         to_date,
//         date_range_applied: !!(from_date && to_date)
//       }
//     });

//   } catch (error) {
//     logError("Dashboard.getList", error, res);
//   }
// };
// exports.getCustomerReport = async (req, res) => {
//   try {
//     let { from_date, to_date, customer_type, gender, limit = 50 } = req.query;

//     // Set default date range if not provided
//     if (!from_date || !to_date) {
//       const currentDate = new Date();
//       to_date = currentDate.toISOString().split('T')[0];
//       from_date = `${currentDate.getFullYear()}-01-01`;
//     }

//     // Build dynamic filters
//     let whereConditions = [];
//     let params = [];

//     if (from_date && to_date) {
//       whereConditions.push(`DATE(c.create_at) BETWEEN ? AND ?`);
//       params.push(from_date, to_date);
//     }

//     if (customer_type) {
//       whereConditions.push(`c.type = ?`);
//       params.push(customer_type);
//     }

//     if (gender) {
//       whereConditions.push(`c.gender = ?`);
//       params.push(gender);
//     }

//     const whereClause = whereConditions.length > 0
//       ? `WHERE ${whereConditions.join(' AND ')}`
//       : '';

//     // Detailed customer report with orders
//     const detailedCustomerQuery = `
//       SELECT 
//         c.id,
//         c.name,
//         c.tel,
//         c.email,
//         c.address,
//         c.type,
//         c.gender,
//         c.spouse_name,
//         c.guarantor_name,
//         c.id_card_number,
//         c.id_card_expiry,
//         c.status,
//         DATE(c.create_at) as registration_date,
//         DATE(c.updated_at) as last_updated,
//         COUNT(o.id) AS total_orders,
//         COALESCE(SUM(o.total_amount), 0) AS total_spent,
//         AVG(o.total_amount) AS avg_order_value,
//         MAX(o.create_at) AS last_order_date,
//         MIN(o.create_at) AS first_order_date,
//         DATEDIFF(NOW(), c.create_at) AS days_since_registration
//       FROM customer c
//       LEFT JOIN \`order\` o ON c.id = o.customer_id
//       ${whereClause}
//       GROUP BY c.id
//       ORDER BY c.create_at DESC
//       LIMIT ?
//     `;

//     const [customers] = await db.query(detailedCustomerQuery, [...params, parseInt(limit)]);

//     res.json({
//       customers,
//       total_records: customers.length,
//       filters_applied: {
//         date_range: from_date && to_date ? `${from_date} to ${to_date}` : null,
//         customer_type,
//         gender,
//         limit
//       },
//       summary: {
//         total_customers: customers.length,
//         active_customers: customers.filter(c => c.total_orders > 0).length,
//         total_revenue_from_customers: customers.reduce((sum, c) => sum + parseFloat(c.total_spent), 0),
//         average_customer_value: customers.length > 0
//           ? (customers.reduce((sum, c) => sum + parseFloat(c.total_spent), 0) / customers.length).toFixed(2)
//           : 0
//       }
//     });

//   } catch (error) {
//     logError("Dashboard.getCustomerReport", error, res);
//   }
// };
const { db, isArray, isEmpty, logError } = require("../util/helper");

exports.getList = async (req, res) => {
  try {
    let { from_date, to_date } = req.query;

    if (!from_date || !to_date) {
      const currentDate = new Date();
      to_date = currentDate.toISOString().split('T')[0]; 

      from_date = `${currentDate.getFullYear()}-01-01`;
    }
    const dateFilter = from_date && to_date ?
      `AND DATE(r.create_at) BETWEEN '${from_date}' AND '${to_date}'` :
      '';
    const expenseDateFilter = from_date && to_date ?
      `AND DATE(r.expense_date) BETWEEN '${from_date}' AND '${to_date}'` :
      '';
    
    // Product Date Filter
    const productDateFilter = from_date && to_date ?
      `AND DATE(p.receive_date) BETWEEN '${from_date}' AND '${to_date}'` :
      '';
   
   const topSaleQuery = `
      SELECT 
        c.name AS category_name,
        SUM(od.qty) AS total_qty,
        SUM(od.total) AS total_sale_amount
      FROM order_detail od
      JOIN product p ON od.product_id = p.id
      LEFT JOIN category c ON p.category_id = c.id
      JOIN \`order\` o ON od.order_id = o.id
      WHERE od.total > 0
      AND (p.category_id IS NULL OR p.category_id != 0)
      ${from_date && to_date ? `AND DATE(o.create_at) BETWEEN '${from_date}' AND '${to_date}'` : ''}
      GROUP BY c.id, c.name
      ORDER BY total_sale_amount DESC
      LIMIT 5
    `;
    const [Top_Sale] = await db.query(topSaleQuery);
    
    const customerQuery = `
      SELECT 
        COUNT(id) AS total,
        SUM(CASE WHEN gender = 'male' THEN 1 ELSE 0 END) AS male,
        SUM(CASE WHEN gender = 'female' THEN 1 ELSE 0 END) AS female
      FROM customer
      ${from_date && to_date ? `WHERE DATE(create_at) BETWEEN '${from_date}' AND '${to_date}'` : ''}
    `;
    const [customer] = await db.query(customerQuery);
    
    const newCustomerDetailQuery = `
      SELECT 
        id,
        name,
        tel,
        email,
        address,
        type,
        gender,
        spouse_name,
        guarantor_name,
        id_card_number,
        id_card_expiry,
        status,
        DATE(create_at) as registration_date,
        DATE(updated_at) as last_updated
      FROM customer
      WHERE 1=1
      ${from_date && to_date ? `AND DATE(create_at) BETWEEN '${from_date}' AND '${to_date}'` : ''}
      ORDER BY create_at DESC
    `;
    const [New_Customer_Details] = await db.query(newCustomerDetailQuery);
    
    const customerTrendQuery = `
      SELECT 
        DATE_FORMAT(create_at, '%Y-%m') AS month,
        DATE_FORMAT(create_at, '%M %Y') AS month_name,
        COUNT(*) AS new_customers,
        SUM(CASE WHEN gender = 'male' THEN 1 ELSE 0 END) AS male_count,
        SUM(CASE WHEN gender = 'female' THEN 1 ELSE 0 END) AS female_count
      FROM customer
      WHERE 1=1
      ${from_date && to_date ? `AND DATE(create_at) BETWEEN '${from_date}' AND '${to_date}'` : ''}
      GROUP BY DATE_FORMAT(create_at, '%Y-%m'), DATE_FORMAT(create_at, '%M %Y')
      ORDER BY month DESC
    `;
    const [Customer_Registration_Trend] = await db.query(customerTrendQuery);
    
    const customerTypeQuery = `
      SELECT 
        type,
        COUNT(*) AS count,
        ROUND((COUNT(*) * 100.0 / (SELECT COUNT(*) FROM customer 
          WHERE 1=1 ${from_date && to_date ? `AND DATE(create_at) BETWEEN '${from_date}' AND '${to_date}'` : ''})), 2) AS percentage
      FROM customer
      WHERE 1=1
      ${from_date && to_date ? `AND DATE(create_at) BETWEEN '${from_date}' AND '${to_date}'` : ''}
      GROUP BY type
      ORDER BY count DESC
    `;
    const [Customer_Type_Breakdown] = await db.query(customerTypeQuery);
    
    const customerActivityQuery = `
      SELECT 
        c.id,
        c.name,
        c.tel,
        c.email,
        c.gender,
        DATE(c.create_at) as registration_date,
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_spent,
        MAX(o.create_at) AS last_order_date,
        DATEDIFF(NOW(), MAX(o.create_at)) AS days_since_last_order
      FROM customer c
      LEFT JOIN \`order\` o ON c.id = o.customer_id
      WHERE 1=1
      ${from_date && to_date ? `AND DATE(c.create_at) BETWEEN '${from_date}' AND '${to_date}'` : ''}
      GROUP BY c.id, c.name, c.tel, c.email, c.gender, c.create_at
      ORDER BY total_spent DESC
    `;
    const [Customer_Activity_Report] = await db.query(customerActivityQuery);
    
    const recentCustomerQuery = `
      SELECT 
        'Last 7 Days' AS period,
        COUNT(*) AS new_customers
      FROM customer 
      WHERE create_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      
      UNION ALL
      
      SELECT 
        'Last 30 Days' AS period,
        COUNT(*) AS new_customers
      FROM customer 
      WHERE create_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      
      UNION ALL
      
      SELECT 
        'This Month' AS period,
        COUNT(*) AS new_customers
      FROM customer 
      WHERE MONTH(create_at) = MONTH(NOW()) AND YEAR(create_at) = YEAR(NOW())
      
      UNION ALL
      
      SELECT 
        'Previous Month' AS period,
        COUNT(*) AS new_customers
      FROM customer 
      WHERE MONTH(create_at) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH)) 
      AND YEAR(create_at) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
    `;
    const [Recent_Customer_Stats] = await db.query(recentCustomerQuery);
    
    const [employee] = await db.query(`
      SELECT 
        COUNT(id) AS total, 
        SUM(CASE WHEN gender = 1 THEN 1 ELSE 0 END) AS male, 
        SUM(CASE WHEN gender = 0 THEN 1 ELSE 0 END) AS female
      FROM employee;
    `);
    
    const expenseQuery = `
      SELECT 
        COALESCE(SUM(amount), 0) AS total, 
        COUNT(id) AS total_expense 
      FROM expense 
      WHERE 1=1
      ${from_date && to_date ? `AND DATE(expense_date) BETWEEN '${from_date}' AND '${to_date}'` : ''}
    `;
    const [expanse] = await db.query(expenseQuery);
    
    // Product Query - បង្កើតថ្មី
    const productQuery = `
      SELECT 
        COALESCE(SUM(actual_price), 0) AS total, 
        COUNT(id) AS total_product 
      FROM product 
      WHERE 1=1
      ${from_date && to_date ? `AND DATE(receive_date) BETWEEN '${from_date}' AND '${to_date}'` : ''}
    `;
    const [product] = await db.query(productQuery);
    
    const saleQuery = `
      SELECT 
        CONCAT(COALESCE(SUM(r.total_amount), 0), '$') AS total, 
        COUNT(r.id) AS total_order 
      FROM \`order\` r 
      WHERE 1=1
      ${from_date && to_date ? `AND DATE(r.create_at) BETWEEN '${from_date}' AND '${to_date}'` : ''}
    `;
    const [sale] = await db.query(saleQuery);
    
    const saleSummaryQuery = `
      SELECT 
        DATE_FORMAT(r.create_at, '%M') AS title, 
        SUM(r.total_amount) AS total 
      FROM \`order\` r 
      WHERE 1=1
      ${dateFilter}
      GROUP BY DATE_FORMAT(r.create_at, '%M')
    `;
    const [Sale_Summary_By_Month] = await db.query(saleSummaryQuery);
    
    const expenseSummaryQuery = `
      SELECT 
        DATE_FORMAT(r.expense_date, '%M') AS title, 
        SUM(r.amount) AS total 
      FROM expense r 
      WHERE 1=1
      ${expenseDateFilter}
      GROUP BY DATE_FORMAT(r.expense_date, '%M')
    `;
    const [Expense_Summary_By_Month] = await db.query(expenseSummaryQuery);
    
    // Product Summary By Month - បង្កើតថ្មី
    const productSummaryQuery = `
      SELECT 
        DATE_FORMAT(p.receive_date, '%M') AS title, 
        SUM(p.actual_price) AS total 
      FROM product p 
      WHERE 1=1
      ${productDateFilter}
      GROUP BY DATE_FORMAT(p.receive_date, '%M')
    `;
    const [Product_Summary_By_Month] = await db.query(productSummaryQuery);
    
    const [User_Summary] = await db.query(`
      SELECT 
        r.name, 
        COUNT(u.id) AS total_users
      FROM user u
      JOIN role r ON u.role_id = r.id
      GROUP BY r.name, r.id
      ORDER BY r.id
    `);
    
    let dashboard = [
      {
        title: "អ្នកប្រើប្រាស់",
        Summary: {
          "សរុប": User_Summary.reduce((sum, row) => sum + row.total_users, 0) + " នាក់",
          ...User_Summary.reduce((acc, role) => {
            acc[`${role.name}`] = role.total_users + " នាក់";
            return acc;
          }, {})
        }
      },
      {
        title: "អតិថិជន",
        Summary: {
          "សរុប": customer[0].total + " នាក់",
          "បុរស": customer[0].male + " នាក់",
          "ស្ត្រី": customer[0].female + " នាក់"
        }
      },
      {
        title: "ប្រព័ន្ធចំណាយទូទៅ",
        Summary: {
          "ចំណាយ": from_date && to_date ? `${from_date} - ${to_date}` : "ខែនេះ",
          "សរុប": expanse[0].total + "$",
          "ចំនួនសរុប": expanse[0].total_expense
        }
      },
      {
        title: "ផលិតផល",
        Summary: {
          "ផលិតផល": from_date && to_date ? `${from_date} - ${to_date}` : "ខែនេះ",
          "សរុប": product[0].total + "$",
          "ចំនួនសរុប": product[0].total_product
        }
      },
      {
        title: "ការលក់",
        Summary: {
          "លក់": from_date && to_date ? `${from_date} - ${to_date}` : "ខែនេះ",
          "សរុប": sale[0].total,
          "ការបញ្ជាទិញសរុប": sale[0].total_order
        }
      }
    ];
    
    res.json({
      dashboard,
      Sale_Summary_By_Month,
      Expense_Summary_By_Month,
      Product_Summary_By_Month,  // បន្ថែមថ្មី
      Top_Sale,
      Customer_Reports: {
        New_Customer_Details,
        Customer_Registration_Trend,
        Customer_Type_Breakdown,
        Customer_Activity_Report,
        Recent_Customer_Stats
      },
      Customer_Summary: {
        total_new_customers: customer[0].total,
        active_customers: Customer_Activity_Report.filter(c => c.total_orders > 0).length,
        inactive_customers: Customer_Activity_Report.filter(c => c.total_orders === 0).length,
        average_spent_per_customer: Customer_Activity_Report.length > 0
          ? (Customer_Activity_Report.reduce((sum, c) => sum + parseFloat(c.total_spent), 0) / Customer_Activity_Report.length).toFixed(2)
          : 0,
        top_spending_customer: Customer_Activity_Report.length > 0 ? Customer_Activity_Report[0] : null
      },
      filter_info: {
        from_date,
        to_date,
        date_range_applied: !!(from_date && to_date)
      }
    });

  } catch (error) {
    logError("Dashboard.getList", error, res);
  }
};

exports.getCustomerReport = async (req, res) => {
  try {
    let { from_date, to_date, customer_type, gender, limit = 50 } = req.query;

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
        c.spouse_name,
        c.guarantor_name,
        c.id_card_number,
        c.id_card_expiry,
        c.status,
        DATE(c.create_at) as registration_date,
        DATE(c.updated_at) as last_updated,
        COUNT(o.id) AS total_orders,
        COALESCE(SUM(o.total_amount), 0) AS total_spent,
        AVG(o.total_amount) AS avg_order_value,
        MAX(o.create_at) AS last_order_date,
        MIN(o.create_at) AS first_order_date,
        DATEDIFF(NOW(), c.create_at) AS days_since_registration
      FROM customer c
      LEFT JOIN \`order\` o ON c.id = o.customer_id
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
        limit
      },
      summary: {
        total_customers: customers.length,
        active_customers: customers.filter(c => c.total_orders > 0).length,
        total_revenue_from_customers: customers.reduce((sum, c) => sum + parseFloat(c.total_spent), 0),
        average_customer_value: customers.length > 0
          ? (customers.reduce((sum, c) => sum + parseFloat(c.total_spent), 0) / customers.length).toFixed(2)
          : 0
      }
    });

  } catch (error) {
    logError("Dashboard.getCustomerReport", error, res);
  }
};