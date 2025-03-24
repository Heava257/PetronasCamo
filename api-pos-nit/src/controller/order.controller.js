const { db, isArray, isEmpty, logError } = require("../util/helper");



// exports.getList = async (req, res) => {
//   try {

//     var from_date = req.query.from_date;
//     var to_date = req.query.to_date;
//     var txtSearch = req.query.txtSearch;
//     var sqlSelect = "SELECT o.*, c.name AS customer_name, c.tel AS customer_tel, c.address AS customer_address ";
//     var sqlJoin = " FROM `order` o LEFT JOIN customer c ON o.customer_id = c.id ";
//     var sqlWhere = " WHERE true "; // Ensure spacing

//     if (!isEmpty(from_date) && isEmpty(to_date)) {
//       sqlWhere += ` AND DATE_FORMAT(o.create_at, '%Y-%m-%d') >= :from_date `;
//     } else if (!isEmpty(from_date) && !isEmpty(to_date)) {
//       sqlWhere += ` AND DATE_FORMAT(o.create_at, '%Y-%m-%d') BETWEEN :from_date AND :to_date `;
//     } else if (isEmpty(from_date) && !isEmpty(to_date)) {
//       sqlWhere += ` AND DATE_FORMAT(o.create_at, '%Y-%m-%d') <= :to_date `;
//     }


//     const sqlParams = {
//       txtSearch: "%" + txtSearch + "%",
//       from_date: from_date,
//       to_date: to_date
//     };
//     if (!isEmpty(txtSearch)) {
//       sqlWhere += " AND o.order_no LIKE :txtSearch "; // Use `?` for parameterized queries


//     }

//     var sqlList = sqlSelect + sqlJoin + sqlWhere;
//     var sqlSummary = "SELECT COUNT(o.id) AS total_order, COALESCE(SUM(o.total_amount), 0) AS total_amount " + sqlJoin + sqlWhere;

//     // Execute queries
//     const [list] = await db.query(sqlList, sqlParams);
//     const [summaryArray] = await db.query(sqlSummary, sqlParams);

//     // Extract first item from summary array
//     const summary = summaryArray?.[0] || { total_order: 0, total_amount: 0 };

//     // Return JSON response
//     res.json({
//       list: list,
//       summary: summary, // Ensure summary is an object, not an array
//     });
//   } catch (error) {
//     logError("order.getList", error, res);
//   }
// };
// exports.getList = async (req, res) => {
//   try {
//     var from_date = req.query.from_date;
//     var to_date = req.query.to_date;
//     var txtSearch = req.query.txtSearch;

//     var sqlSelect = "SELECT o.*, c.name AS customer_name, c.tel AS customer_tel, c.address AS customer_address ";
//     var sqlJoin = " FROM `order` o LEFT JOIN customer c ON o.customer_id = c.id ";
//     var sqlWhere = " WHERE true "; // Ensure spacing

//     if (!isEmpty(from_date) && isEmpty(to_date)) {
//       sqlWhere += ` AND DATE_FORMAT(o.create_at, '%Y-%m-%d') >= :from_date `;
//     } else if (!isEmpty(from_date) && !isEmpty(to_date)) {
//       sqlWhere += ` AND DATE_FORMAT(o.create_at, '%Y-%m-%d') BETWEEN :from_date AND :to_date `;
//     } else if (isEmpty(from_date) && !isEmpty(to_date)) {
//       sqlWhere += ` AND DATE_FORMAT(o.create_at, '%Y-%m-%d') <= :to_date `;
//     }

//     const sqlParams = {
//       txtSearch: "%" + txtSearch + "%",
//       from_date: from_date,
//       to_date: to_date
//     };

//     if (!isEmpty(txtSearch)) {
//       sqlWhere += " AND o.order_no LIKE :txtSearch ";
//     }

//     // Append ORDER BY to sort by create_at in descending order
//     var sqlList = sqlSelect + sqlJoin + sqlWhere + " ORDER BY o.create_at DESC";
//     var sqlSummary = "SELECT COUNT(o.id) AS total_order, COALESCE(SUM(o.total_amount), 0) AS total_amount " 
//       + sqlJoin + sqlWhere; // No need for ORDER BY in summary queries

//     // Execute queries
//     const [list] = await db.query(sqlList, sqlParams);
//     const [summaryArray] = await db.query(sqlSummary, sqlParams);

//     // Extract first item from summary array
//     const summary = summaryArray?.[0] || { total_order: 0, total_amount: 0 };

//     // Return JSON response
//     res.json({
//       list: list,
//       summary: summary, // Ensure summary is an object, not an array
//     });
//   } catch (error) {
//     logError("order.getList", error, res);
//   }
// };
// exports.getList = async (req, res) => {
//   try {
//     var from_date = req.query.from_date;
//     var to_date = req.query.to_date;
//     var txtSearch = req.query.txtSearch;
//     var user_id = req.query.user_id;

//     var sqlSelect = `
//       SELECT o.*, c.name AS customer_name, c.tel AS customer_tel, c.address AS customer_address 
//     `;
//     var sqlJoin = `
//       FROM \`order\` o 
//       LEFT JOIN customer c ON o.customer_id = c.id 
//     `;
//     var sqlWhere = " WHERE true "; // Ensure spacing

//     if (!isEmpty(from_date) && isEmpty(to_date)) {
//       sqlWhere += ` AND DATE_FORMAT(o.create_at, '%Y-%m-%d') >= :from_date `;
//     } else if (!isEmpty(from_date) && !isEmpty(to_date)) {
//       sqlWhere += ` AND DATE_FORMAT(o.create_at, '%Y-%m-%d') BETWEEN :from_date AND :to_date `;
//     } else if (isEmpty(from_date) && !isEmpty(to_date)) {
//       sqlWhere += ` AND DATE_FORMAT(o.create_at, '%Y-%m-%d') <= :to_date `;
//     }

//     if (!isEmpty(txtSearch)) {
//       sqlWhere += " AND o.order_no LIKE :txtSearch ";
//     }

//     if (!isEmpty(user_id)) {
//       sqlWhere += " AND o.user_id = :user_id ";
//     }

//     const sqlParams = {
//       txtSearch: "%" + txtSearch + "%",
//       from_date: from_date,
//       to_date: to_date,
//       user_id: user_id,
//     };

//     var sqlList = sqlSelect + sqlJoin + sqlWhere + " ORDER BY o.create_at DESC";
//     var sqlSummary = `
//       SELECT COUNT(o.id) AS total_order, COALESCE(SUM(o.total_amount), 0) AS total_amount 
//       ${sqlJoin} ${sqlWhere}
//     `;

//     const [list] = await db.query(sqlList, sqlParams);
//     const [summaryArray] = await db.query(sqlSummary, sqlParams);

//     const summary = summaryArray?.[0] || { total_order: 0, total_amount: 0 };

//     res.json({
//       list: list,
//       summary: summary,
//     });
//   } catch (error) {
//     logError("order.getList", error, res);
//   }
// };


exports.getList = async (req, res) => {
  try {
    var from_date = req.query.from_date;
    var to_date = req.query.to_date;
    var txtSearch = req.query.txtSearch;
    var user_id = req.params.user_id; // Get user_id from params

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    var sqlSelect = `
      SELECT o.*, c.name AS customer_name, c.tel AS customer_tel, c.address AS customer_address 
    `;
    var sqlJoin = `
      FROM \`order\` o 
      LEFT JOIN customer c ON o.customer_id = c.id 
    `;
    var sqlWhere = " WHERE o.user_id = :user_id "; // Always filter by user_id

    // Date filtering
    if (!isEmpty(from_date) && isEmpty(to_date)) {
      sqlWhere += ` AND DATE_FORMAT(o.create_at, '%Y-%m-%d') >= :from_date `;
    } else if (!isEmpty(from_date) && !isEmpty(to_date)) {
      sqlWhere += ` AND DATE_FORMAT(o.create_at, '%Y-%m-%d') BETWEEN :from_date AND :to_date `;
    } else if (isEmpty(from_date) && !isEmpty(to_date)) {
      sqlWhere += ` AND DATE_FORMAT(o.create_at, '%Y-%m-%d') <= :to_date `;
    }

    // Search by order_no
    if (!isEmpty(txtSearch)) {
      sqlWhere += " AND o.order_no LIKE :txtSearch ";
    }

    const sqlParams = {
      user_id: user_id,
      txtSearch: "%" + txtSearch + "%",
      from_date: from_date,
      to_date: to_date,
    };

    var sqlList = sqlSelect + sqlJoin + sqlWhere + " ORDER BY o.create_at DESC";
    var sqlSummary = `
      SELECT COUNT(o.id) AS total_order, COALESCE(SUM(o.total_amount), 0) AS total_amount 
      ${sqlJoin} ${sqlWhere}
    `;

    const [list] = await db.query(sqlList, sqlParams);
    const [summaryArray] = await db.query(sqlSummary, sqlParams);

    const summary = summaryArray?.[0] || { total_order: 0, total_amount: 0 };

    res.json({
      list: list,
      summary: summary,
    });
  } catch (error) {
    logError("order.getList", error, res);
  }
};



// exports.getList = async (req, res) => {
//   try {
//     const { from_date, to_date, txtSearch } = req.query;
//     const { user_id } = req.params; // Get user_id from route parameter
//     const isAdmin = req.isAdmin;
//     const currentUserId = req.current_id;

//     // Validate user_id
//     if (!user_id) {
//       return res.status(400).json({ error: "User ID is required" });
//     }

//     let sqlSelect = `
//       SELECT o.*, c.name AS customer_name, c.tel AS customer_tel, c.address AS customer_address 
//     `;
//     let sqlJoin = `
//       FROM \`order\` o 
//       LEFT JOIN customer c ON o.customer_id = c.id 
//     `;
//     let sqlWhere = " WHERE true ";

//     // If the user is NOT an admin, they can only see their own orders
//     if (!isAdmin) {
//       sqlWhere += ` AND o.user_id = :currentUserId `; // Non-admin can only see their own orders
//     } else if (user_id) {
//       sqlWhere += ` AND o.user_id = :user_id `; // Admin can filter by user_id
//     }

//     // Date filtering
//     if (!isEmpty(from_date) && isEmpty(to_date)) {
//       sqlWhere += ` AND DATE_FORMAT(o.create_at, '%Y-%m-%d') >= :from_date `;
//     } else if (!isEmpty(from_date) && !isEmpty(to_date)) {
//       sqlWhere += ` AND DATE_FORMAT(o.create_at, '%Y-%m-%d') BETWEEN :from_date AND :to_date `;
//     } else if (isEmpty(from_date) && !isEmpty(to_date)) {
//       sqlWhere += ` AND DATE_FORMAT(o.create_at, '%Y-%m-%d') <= :to_date `;
//     }

//     // Search by order_no
//     if (!isEmpty(txtSearch)) {
//       sqlWhere += " AND o.order_no LIKE :txtSearch ";
//     }

//     const sqlParams = {
//       txtSearch: `%${txtSearch}%`,
//       from_date: from_date,
//       to_date: to_date,
//       user_id: isAdmin ? user_id : currentUserId, // Use user_id from params if admin
//       currentUserId: isAdmin ? user_id : currentUserId, // Ensure currentUserId is set correctly
//     };

//     // Debugging: Log the SQL query and parameters
//     console.log("SQL Query:", sqlSelect + sqlJoin + sqlWhere + " ORDER BY o.create_at DESC");
//     console.log("SQL Parameters:", sqlParams);

//     const sqlList = sqlSelect + sqlJoin + sqlWhere + " ORDER BY o.create_at DESC";
//     const sqlSummary = `
//       SELECT COUNT(o.id) AS total_order, COALESCE(SUM(o.total_amount), 0) AS total_amount 
//       ${sqlJoin} ${sqlWhere}
//     `;

//     const [list] = await db.query(sqlList, sqlParams);
//     const [summaryArray] = await db.query(sqlSummary, sqlParams);

//     const summary = summaryArray?.[0] || { total_order: 0, total_amount: 0 };

//     res.json({
//       list: list,
//       summary: summary,
//     });
//   } catch (error) {
//     logError("order.getList", error, res);
//   }
// };
exports.getone = async (req, res) => {
  try {
    var sql = `
   SELECT 
    od.order_id,
    p.name AS product_name,
    c.name AS category_name,
    p.unit_price,
    p.discount,
    p.unit,
    SUM(od.qty) AS total_quantity,
    SUM(od.qty * p.unit_price * (1 - COALESCE(p.discount, 0)/100) / NULLIF(p.actual_price, 0)) AS grand_total
FROM order_detail od
INNER JOIN product p ON od.product_id = p.id
INNER JOIN category c ON p.category_id = c.id
WHERE od.order_id = ?
GROUP BY od.order_id, p.name, c.name, p.unit_price, p.discount, p.unit`;

    const [list] = await db.query(sql, [req.params.id]); // Fixed parameter handling
    res.json({ list });
  } catch (error) {
    logError("order.getone", error, res);
  }
};


// exports.getone = async (req, res) => {
//   try {
//     const { id, user_id } = req.params; // Assuming 'id' is order_id and 'user_id' is optional

//     var sql = `
//       SELECT 
//         od.*, 
//         p.name AS p_name, 
//         p.description AS p_des, 
//         c.name AS p_category_name 
//       FROM order_detail od
//       INNER JOIN product p ON od.product_id = p.id  
//       INNER JOIN category c ON p.category_id = c.id  
//       INNER JOIN orders o ON od.order_id = o.id  
//       WHERE od.order_id = ?`;

//     let params = [id];

//     if (user_id) {
//       sql += ` AND o.user_id = ?`; // Ensure the order belongs to the user
//       params.push(user_id);
//     }

//     const [list] = await db.query(sql, params);
//     res.json({ list });

//   } catch (error) {
//     logError("order.getone", error, res);
//   }
// };


// exports.create = async (req, res) => {
//   try {
//     const { order, order_details = [] } = req.body;

//     if (!order.customer_id || !order.total_amount || !order.paid_amount || !order.payment_method) {
//       return res.status(400).json({ error: "Missing required fields in order" });
//     }

//     if (!order_details.length) {
//       return res.status(400).json({ error: "Order details cannot be empty" });
//     }

//     const order_no = await newOrderNo();

//     const sqlOrder = `
//       INSERT INTO \`order\` 
//         (order_no, customer_id, total_amount, paid_amount, payment_method, remark, user_id, create_by) 
//       VALUES 
//         (:order_no, :customer_id, :total_amount, :paid_amount, :payment_method, :remark, :user_id, :create_by)
//     `;
//     const [orderResult] = await db.query(sqlOrder, {
//       ...order,
//       order_no: order_no,
//       user_id: req.auth?.id || null,
//       create_by: req.auth?.name || "System",
//     });

//     const sqlOrderDetails = `
//       INSERT INTO order_detail 
//         (order_id, product_id, qty, price, discount, total) 
//       VALUES 
//         (:order_id, :product_id, :qty, :price, :discount, :total)
//     `;

//     await Promise.all(
//       order_details.map(async (item) => {
//         // Insert order detail
//         await db.query(sqlOrderDetails, {
//           ...item,
//           order_id: orderResult.insertId,
//         });

//         const [productData] = await db.query(
//           "SELECT * FROM product WHERE id = :product_id",
//           { product_id: item.product_id }
//         );

//         if (productData.length === 0) {
//           throw new Error(`Product with id ${item.product_id} not found`);
//         }

//         const product = productData[0];

//         const sqlUpdateStock = `
//           UPDATE product 
//           SET qty = qty - :qty 
//           WHERE id = :product_id
//         `;
//         await db.query(sqlUpdateStock, {
//           qty: item.qty,
//           product_id: item.product_id
//         });


//       })
//     );

//     // Fetch the newly created order
//     const [currentOrder] = await db.query(
//       "SELECT * FROM `order` WHERE id = :id",
//       { id: orderResult.insertId }
//     );

//     // Return success response
//     res.json({
//       order: currentOrder.length > 0 ? currentOrder[0] : null,
//       order_details: order_details,
//       message: "Order created successfully",
//     });
//   } catch (error) {
//     logError("order.create", error, res);
//   }
// };


exports.create = async (req, res) => {
  try {
    const { order, order_details = [] } = req.body;

    // Validate required fields in the order
    if (!order.customer_id || !order.total_amount || !order.payment_method) {
      return res.status(400).json({ error: "Missing required fields in order" });
    }

    // Validate order details
    if (!order_details.length) {
      return res.status(400).json({ error: "Order details cannot be empty" });
    }

    // Generate a new order number
    const order_no = await newOrderNo();

    // Insert the order into the database
    var sqlOrder = `
      INSERT INTO \`order\` 
        (order_no, customer_id, total_amount, paid_amount, payment_method, remark, user_id, create_by) 
      VALUES 
        (:order_no, :customer_id, :total_amount, :paid_amount, :payment_method, :remark, :user_id, :create_by)
    `;
    const [orderResult] = await db.query(sqlOrder, {
      ...order,
      order_no: order_no,
      user_id: req.auth?.id || null,
      create_by: req.auth?.name || "System",
    });



    // Insert order details into the database
    var sqlOrderDetails = `
      INSERT INTO order_detail 
        (order_id, product_id, qty, price, discount, total) 
      VALUES 
        (:order_id, :product_id, :qty, :price, :discount, :total)
    `;

    console.log("Order Details SQL:", sqlOrderDetails);

    await Promise.all(
      order_details.map(async (item) => {
        await db.query(sqlOrderDetails, {
          ...item,
          order_id: orderResult.insertId,
        });

        // Update product stock if product_id is not zero
        if (item.product_id !== 0) {
          const sqlUpdateStock = `
            UPDATE product 
            SET qty = qty - :qty 
            WHERE id = :product_id
          `;
          await db.query(sqlUpdateStock, {
            qty: item.qty,
            product_id: item.product_id
          });
        }
      })
    );

    // Fetch the newly created order
    const [currentOrder] = await db.query(
      "SELECT * FROM `order` WHERE id = :id",
      { id: orderResult.insertId }
    );

    // Return success response
    res.json({
      order: currentOrder.length > 0 ? currentOrder[0] : null,
      order_details: order_details,
      message: "Order created successfully",
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to create order", details: error.message });
  }
};

const newOrderNo = async (req, res) => {
  try {
    var sql =
      "SELECT " +
      "CONCAT('INV',LPAD((SELECT COALESCE(MAX(id),0) + 1 FROM `order`), 3, '0')) " +
      "as order_no";
    var [data] = await db.query(sql);
    return data[0].order_no;
  } catch (error) {
    logError("newOrderNo.create", error, res);
  }
};

exports.update = async (req, res) => {
  try {
    var sql =
      "UPDATE  order set name=:name, code=:code, tel=:tel, email=:email, address=:address, website=:website, note=:note WHERE id=:id ";
    var [data] = await db.query(sql, {
      ...req.body,
    });
    res.json({
      data: data,
      message: "Update success!",
    });
  } catch (error) {
    logError("order.update", error, res);
  }
};

exports.remove = async (req, res) => {
  try {
    var [data] = await db.query("DELETE FROM order WHERE id = :id", {
      ...req.body,
    });
    res.json({
      data: data,
      message: "Data delete success!",
    });
  } catch (error) {
    logError("order.remove", error, res);
  }
};
