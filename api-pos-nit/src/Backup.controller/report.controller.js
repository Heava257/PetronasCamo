

const { db, logError } = require("../util/helper");

exports.report_Sale_Summary = async (req, res) => {
  try {
    let { from_date, to_date, category_id } = req.query;

    const sql = `
      SELECT 
        DATE_FORMAT(o.create_at, '%d/%m/%Y') AS order_date, 
        SUM(od.total_qty) AS total_qty, 
        SUM(od.total_amount) AS total_amount
      FROM \`order\` o
      INNER JOIN (
          SELECT 
              odl.order_id,
              SUM(odl.qty) AS total_qty,
              SUM(odl.total) AS total_amount
          FROM order_detail odl
          INNER JOIN product p ON odl.product_id = p.id
          WHERE (:category_id IS NULL OR p.category_id = :category_id)
          GROUP BY odl.order_id
      ) od ON o.id = od.order_id
      WHERE o.create_at BETWEEN :from_date AND :to_date
      GROUP BY DATE_FORMAT(o.create_at, '%d/%m/%Y');
    `;

    const [list] = await db.query(sql, {
      from_date,
      to_date,
      category_id
    });

    res.json({ list });
  } catch (error) {
    logError("report.report_Sale_Summary", error, res);
  }
};


exports.report_Product_Expense = async (req, res) => {
  try {
    let { from_date, to_date, customer_id, company_name } = req.query;

    // Ensure that to_date includes the entire day
    to_date = new Date(to_date);
    to_date.setHours(23, 59, 59, 999);

    const sql = `
    SELECT 
        p.id,
        p.name AS product_name,
        p.barcode,
        p.unit,
        p.actual_price,
        p.discount,
        p.company_name,
        p.create_by,
        p.create_at,
        p.receive_date,
        COUNT(p.id) AS total_items,
        SUM(p.actual_price) AS total_amount
    FROM product p
    WHERE DATE_FORMAT(p.receive_date, '%Y-%m-%d') BETWEEN :from_date AND :to_date
    AND (:customer_id IS NULL OR p.customer_id = :customer_id)
    AND (:company_name IS NULL OR p.company_name = :company_name)
    GROUP BY p.name, p.barcode, p.unit, p.actual_price, p.discount, p.company_name
    ORDER BY p.receive_date DESC;
    `;

    const [list] = await db.query(sql, {
      from_date,
      to_date,
      customer_id,
      company_name
    });

    res.json({ list });
  } catch (error) {
    logError("report.report_Product_Expense", error, res);
  }
};


exports.report_Customer = async (req, res) => {
  try {
    let { from_date, to_date } = req.query;

    // Ensure that to_date includes the entire day
    // console.log(from_date,to_date)
    to_date = new Date(to_date);
    to_date.setHours(23, 59, 59, 999);

    const sql = `
   SELECT 
  DATE_FORMAT(cu.create_at, '%d-%m-%Y') AS title, -- Format date for readability
  COUNT(cu.id) AS total_amount
FROM customer cu
WHERE cu.create_at BETWEEN :from_date AND :to_date
GROUP BY DATE(cu.create_at) -- Group by date only
ORDER BY cu.create_at ASC; -- Sort in chronological order

`;


    const [list] = await db.query(sql, {
      from_date,
      to_date,


    });

    res.json({ list });
  } catch (error) {
    logError("report.Customer", error, res);
  }
};
exports.report_Purchase_Summary = async (req, res) => {
  try {
    let { from_date, to_date, supplier_id } = req.query;

    // Ensure that to_date includes the entire day
    // console.log(from_date,to_date,supplier_id)
    to_date = new Date(to_date);
    to_date.setHours(23, 59, 59, 999);
    const sql = `
    SELECT 
        DATE_FORMAT(pu.create_at, '%d-%m-%Y') AS title,
        SUM(pu.paid_amount) AS total_amount
    FROM purchase pu
    WHERE DATE_FORMAT(pu.create_at, '%Y-%m-%d') BETWEEN :from_date AND :to_date
    AND  (:supplier_id IS NULL OR pu.supplier_id = :supplier_id)
    GROUP BY pu.create_at;
`;


    const [list] = await db.query(sql, {
      from_date,
      to_date,
      supplier_id


    });

    res.json({ list });
  } catch (error) {
    logError("report.report_Purchase_Summary", error, res);
  }
};


exports.top_sale = async (req, res) => {
  try {
    // Get date filter parameters
    let { from_date, to_date } = req.query;
    
    // Set default date range if not provided
    if (!from_date || !to_date) {
      const currentDate = new Date();
      to_date = currentDate.toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
      
      // Default from_date to first day of current year
      from_date = `${currentDate.getFullYear()}-01-01`;
    }

    const sql = `
      SELECT 
        p.id AS product_id,
        p.name AS product_name,
        c.name AS category_name,
        SUM(od.qty * od.price) AS total_sale_amount
      FROM product p
      JOIN order_detail od ON p.id = od.product_id
      JOIN \`order\` o ON od.order_id = o.id  -- Join to filter by order date
      JOIN category c ON p.category_id = c.id
      WHERE 1=1
      ${from_date && to_date ? `AND DATE(o.create_at) BETWEEN '${from_date}' AND '${to_date}'` : ''}
      GROUP BY p.id, p.name, c.name
      ORDER BY total_sale_amount DESC
      LIMIT 10
    `;

    const [list] = await db.query(sql);

    res.json({ list });
  } catch (error) {
    logError("top_sale.getlist", error, res);
  }
};



