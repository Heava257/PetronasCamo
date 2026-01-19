const {
  db,
  isArray,
  isEmpty,
  logError,
  removeFile,
  sendTelegramMessagenewstock,
} = require("../util/helper");
const { sendSmartNotification } = require("../util/Telegram.helpe");
const { createSystemNotification } = require("./System_notification.controller");

exports.getList = async (req, res) => {
  try {
    const { txt_search, category_id, page, is_list_all, start_date, end_date } = req.query;
    const { user_id } = req.params;

    const pageSize = 10;
    const currentPage = Number(page) || 1;
    const offset = (currentPage - 1) * pageSize;

    const sqlSelect = `
      SELECT 
        p.id, p.name, p.category_id, p.barcode, p.company_name,
        p.description, 
        -- ✅ Dynamic Qty
        COALESCE((SELECT SUM(quantity) FROM inventory_transaction WHERE product_id = p.id), 0) as qty,
        p.unit_price, p.discount, p.actual_price, p.status,
        p.create_by, p.create_at, p.unit, p.customer_id, p.receive_date,
        c.name AS category_name,
        c.barcode AS category_barcode,
        cu.name AS customer_name,
        cu.address AS customer_address,
        cu.tel AS customer_tel,
        c.actual_price AS category_actual_price,
        (COALESCE((SELECT SUM(quantity) FROM inventory_transaction WHERE product_id = p.id), 0) * p.unit_price) AS original_price,
        CASE
          WHEN p.discount > 0 THEN ((COALESCE((SELECT SUM(quantity) FROM inventory_transaction WHERE product_id = p.id), 0) * p.unit_price) * (1 - p.discount / 100)) / c.actual_price
          ELSE (COALESCE((SELECT SUM(quantity) FROM inventory_transaction WHERE product_id = p.id), 0) * p.unit_price) / c.actual_price
        END AS total_price
    `;

    const sqlJoin = `
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
      LEFT JOIN customer cu ON p.customer_id = cu.id
    `;

    // ✅ Filter by Dynamic Qty
    let sqlWhere = `WHERE p.user_id = :user_id AND (SELECT SUM(quantity) FROM inventory_transaction WHERE product_id = p.id) > 0`;

    if (start_date && end_date) {
      sqlWhere += ` AND DATE(p.create_at) BETWEEN :start_date AND :end_date`;
    }

    if (txt_search) {
      sqlWhere += ` AND (p.name LIKE :txt_search OR p.barcode = :barcode)`;
    }
    if (category_id) {
      sqlWhere += ` AND p.category_id = :category_id`;
    }

    const sqlOrderBy = `ORDER BY p.customer_id, p.id DESC`;

    const sqlParam = {
      user_id,
      txt_search: `%${txt_search || ''}%`,
      barcode: txt_search || '',
      category_id,
      start_date: start_date || null,
      end_date: end_date || null,
    };

    const sqlList = is_list_all === "1"
      ? `${sqlSelect} ${sqlJoin} ${sqlWhere} ${sqlOrderBy}`
      : `${sqlSelect} ${sqlJoin} ${sqlWhere} ${sqlOrderBy} LIMIT ${pageSize} OFFSET ${offset}`;

    const [list] = await db.query(sqlList, sqlParam);

    let total = 0;
    if (currentPage === 1) {
      const sqlTotal = `SELECT COUNT(p.id) AS total ${sqlJoin} ${sqlWhere}`;
      const [count] = await db.query(sqlTotal, sqlParam);
      total = count[0]?.total || 0;
    }
    const sqlGrandTotal = `
      SELECT 
        SUM(
          CASE
            WHEN p.discount > 0 THEN ((COALESCE((SELECT SUM(quantity) FROM inventory_transaction WHERE product_id = p.id), 0) * p.unit_price) * (1 - p.discount / 100)) / c.actual_price
            ELSE (COALESCE((SELECT SUM(quantity) FROM inventory_transaction WHERE product_id = p.id), 0) * p.unit_price) / c.actual_price
          END
        ) AS grand_total
      ${sqlJoin}
      ${sqlWhere}
    `;

    const [grandTotalResult] = await db.query(sqlGrandTotal, sqlParam);
    const grandTotal = grandTotalResult[0]?.grand_total || 0;

    return res.json({
      list,
      total,
      grand_total: Number(grandTotal).toFixed(2),
    });
  } catch (error) {
    console.error("❌ Error in product.getList:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
exports.getCustomerProducts = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const { user_id } = req.query;
    const currentUserId = req.current_id;

    if (!customer_id) {
      return res.status(400).json({
        error: true,
        message: "Customer ID is required"
      });
    }

    // ✅ Get current user info including branch
    const [currentUserInfo] = await db.query(`
      SELECT 
        u.id, 
        u.name, 
        u.branch_name,
        u.role_id,
        r.code as role_code
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
      WHERE u.id = :user_id
    `, { user_id: currentUserId });

    if (!currentUserInfo || currentUserInfo.length === 0) {
      return res.status(401).json({
        error: true,
        message: "User not found"
      });
    }

    const currentUser = currentUserInfo[0];
    const currentBranch = currentUser.branch_name;

    // ✅ Check permission: customer.products.view
    const [userPermissions] = await db.query(`
      SELECT DISTINCT p.name
      FROM permissions p
      INNER JOIN permission_roles pr ON p.id = pr.permission_id
      INNER JOIN user_roles ur ON pr.role_id = ur.role_id
      WHERE ur.user_id = :user_id
      AND p.name = 'customer.products.view'
    `, { user_id: currentUserId });

    // ✅ Check if permission is overridden for this branch
    const [branchOverrides] = await db.query(`
      SELECT 
        bpo.override_type,
        p.name as permission_name
      FROM branch_permission_overrides bpo
      INNER JOIN permissions p ON bpo.permission_id = p.id
      WHERE bpo.branch_name = :branch_name
      AND bpo.role_id = :role_id
      AND p.name = 'customer.products.view'
    `, {
      branch_name: currentBranch,
      role_id: currentUser.role_id
    });

    // ✅ Calculate effective permission
    let hasPermission = userPermissions.length > 0;

    // Apply branch override
    if (branchOverrides.length > 0) {
      const override = branchOverrides[0];
      if (override.override_type === 'add') {
        hasPermission = true; // Grant permission
      } else if (override.override_type === 'remove') {
        hasPermission = false; // Revoke permission
      }
    }

    // ✅ Deny access if no permission
    if (!hasPermission) {
      return res.status(403).json({
        error: true,
        message: "You don't have permission to view customer products",
        message_kh: "អ្នកមិនមានសិទ្ធិមើលផលិតផលអតិថិជនទេ"
      });
    }

    // ✅ Check if customer exists and get customer's branch
    const sqlCustomerCheck = `
      SELECT 
        c.id, 
        c.name, 
        c.tel, 
        c.address, 
        c.email, 
        c.create_at, 
        c.user_id,
        u.branch_name as customer_branch
      FROM customer c
      INNER JOIN user u ON c.user_id = u.id
      WHERE c.id = :customer_id
      LIMIT 1
    `;

    const [customerInfo] = await db.query(sqlCustomerCheck, {
      customer_id
    });

    if (!customerInfo || customerInfo.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Customer not found"
      });
    }

    const customer = customerInfo[0];
    const customerBranch = customer.customer_branch;

    // ✅ Check cross-branch access permission
    let canAccessOtherBranches = false;

    if (currentUser.role_code === 'admin') {
      // Super Admin can access all branches
      canAccessOtherBranches = true;
    } else if (currentBranch !== customerBranch) {
      // Check if user has cross-branch access permission
      const [crossBranchPerm] = await db.query(`
        SELECT DISTINCT p.name
        FROM permissions p
        INNER JOIN permission_roles pr ON p.id = pr.permission_id
        INNER JOIN user_roles ur ON pr.role_id = ur.role_id
        WHERE ur.user_id = :user_id
        AND p.name = 'customer.products.cross_branch'
      `, { user_id: currentUserId });

      // Check branch override for cross-branch access
      const [crossBranchOverride] = await db.query(`
        SELECT override_type
        FROM branch_permission_overrides bpo
        INNER JOIN permissions p ON bpo.permission_id = p.id
        WHERE bpo.branch_name = :branch_name
        AND bpo.role_id = :role_id
        AND p.name = 'customer.products.cross_branch'
      `, {
        branch_name: currentBranch,
        role_id: currentUser.role_id
      });

      canAccessOtherBranches = crossBranchPerm.length > 0;

      // Apply override
      if (crossBranchOverride.length > 0) {
        const override = crossBranchOverride[0];
        if (override.override_type === 'add') {
          canAccessOtherBranches = true;
        } else if (override.override_type === 'remove') {
          canAccessOtherBranches = false;
        }
      }

      // ✅ Deny if trying to access another branch without permission
      if (!canAccessOtherBranches) {
        return res.status(403).json({
          error: true,
          message: `Access denied. This customer belongs to ${customerBranch}. You can only view customers from ${currentBranch}.`,
          message_kh: `មិនអនុញ្ញាត។ អតិថិជននេះជារបស់ ${customerBranch}។ អ្នកអាចមើលតែអតិថិជនពី ${currentBranch} ប៉ុណ្ណោះ។`,
          current_branch: currentBranch,
          customer_branch: customerBranch
        });
      }
    }

    // ✅ Get products (original logic with branch awareness)
    const sqlCustomerProducts = `
      SELECT 
        p.customer_id,
        c.id as category_id,
        c.name as category_name,
        c.barcode as category_barcode,
        SUM(CAST(COALESCE((SELECT SUM(quantity) FROM inventory_transaction WHERE product_id = p.id), 0) AS DECIMAL(10,2))) as total_quantity,
        COUNT(p.id) as product_count,
        SUM(
          CASE
            WHEN p.discount > 0 AND p.discount IS NOT NULL 
            THEN CAST(COALESCE((SELECT SUM(quantity) FROM inventory_transaction WHERE product_id = p.id), 0) AS DECIMAL(10,2)) * CAST(p.unit_price AS DECIMAL(10,2)) * (1 - CAST(p.discount AS DECIMAL(5,2)) / 100)
            ELSE CAST(COALESCE((SELECT SUM(quantity) FROM inventory_transaction WHERE product_id = p.id), 0) AS DECIMAL(10,2)) * CAST(p.unit_price AS DECIMAL(10,2))
          END
        ) AS total_value,
        AVG(CAST(p.unit_price AS DECIMAL(10,2))) as avg_unit_price,
        GROUP_CONCAT(DISTINCT COALESCE(p.company_name, 'Unknown') SEPARATOR ', ') as companies,
        MIN(p.create_at) as first_purchase,
        MAX(p.create_at) as last_purchase
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
      INNER JOIN user u ON p.user_id = u.id
      WHERE p.customer_id = :customer_id
      ${user_id ? 'AND p.user_id = :user_id' : ''}
      AND p.status != 'deleted'
      GROUP BY p.customer_id, c.id, c.name, c.barcode
      HAVING total_quantity > 0
      ORDER BY total_value DESC, total_quantity DESC
    `;

    const sqlDetailedProducts = `
      SELECT 
        p.id, 
        p.name, 
        p.category_id, 
        p.barcode, 
        COALESCE(p.company_name, 'Unknown') as company_name,
        p.description, 
        CAST(COALESCE((SELECT SUM(quantity) FROM inventory_transaction WHERE product_id = p.id), 0) AS DECIMAL(10,2)) as qty, 
        CAST(p.unit_price AS DECIMAL(10,2)) as unit_price, 
        CAST(COALESCE(p.discount, 0) AS DECIMAL(5,2)) as discount, 
        CAST(p.actual_price AS DECIMAL(10,2)) as actual_price,
        p.status, 
        p.create_by, 
        p.create_at, 
        p.unit, 
        p.receive_date,
        c.name AS category_name,
        c.barcode AS category_barcode,
        (CAST(COALESCE((SELECT SUM(quantity) FROM inventory_transaction WHERE product_id = p.id), 0) AS DECIMAL(10,2)) * CAST(p.unit_price AS DECIMAL(10,2))) AS original_price,
        CASE
          WHEN p.discount > 0 AND p.discount IS NOT NULL 
          THEN CAST(COALESCE((SELECT SUM(quantity) FROM inventory_transaction WHERE product_id = p.id), 0) AS DECIMAL(10,2)) * CAST(p.unit_price AS DECIMAL(10,2)) * (1 - CAST(p.discount AS DECIMAL(5,2)) / 100)
          ELSE CAST(COALESCE((SELECT SUM(quantity) FROM inventory_transaction WHERE product_id = p.id), 0) AS DECIMAL(10,2)) * CAST(p.unit_price AS DECIMAL(10,2))
        END AS total_price
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
      INNER JOIN user u ON p.user_id = u.id
      WHERE p.customer_id = :customer_id
      ${user_id ? 'AND p.user_id = :user_id' : ''}
      AND p.status != 'deleted'
      ORDER BY p.create_at DESC
    `;

    const sqlParams = user_id
      ? { customer_id, user_id }
      : { customer_id };

    const [categoryProducts] = await db.query(sqlCustomerProducts, sqlParams);
    const [detailedProducts] = await db.query(sqlDetailedProducts, sqlParams);

    const summary = {
      total_categories: categoryProducts.length,
      total_products: detailedProducts.length,
      total_quantity: categoryProducts.reduce((sum, item) => {
        const qty = parseFloat(item.total_quantity) || 0;
        return sum + qty;
      }, 0),
      total_value: categoryProducts.reduce((sum, item) => {
        const value = parseFloat(item.total_value) || 0;
        return sum + value;
      }, 0),
      avg_unit_price: categoryProducts.length > 0
        ? categoryProducts.reduce((sum, item) => {
          const price = parseFloat(item.avg_unit_price) || 0;
          return sum + price;
        }, 0) / categoryProducts.length
        : 0
    };

    const formattedCategories = categoryProducts.map(category => ({
      ...category,
      total_quantity: parseFloat(category.total_quantity) || 0,
      total_value: parseFloat(category.total_value) || 0,
      avg_unit_price: parseFloat(category.avg_unit_price) || 0,
      product_count: parseInt(category.product_count) || 0
    }));

    const formattedProducts = detailedProducts
      .filter(product => parseFloat(product.qty) > 0)
      .map(product => ({
        ...product,
        qty: parseFloat(product.qty) || 0,
        unit_price: parseFloat(product.unit_price) || 0,
        discount: parseFloat(product.discount) || 0,
        actual_price: parseFloat(product.actual_price) || 0,
        original_price: parseFloat(product.original_price) || 0,
        total_price: parseFloat(product.total_price) || 0
      }));

    return res.json({
      error: false,
      data: {
        customer: {
          ...customer,
          branch: customerBranch
        },
        access_info: {
          current_user_branch: currentBranch,
          customer_branch: customerBranch,
          is_same_branch: currentBranch === customerBranch,
          has_cross_branch_access: canAccessOtherBranches
        },
        summary: {
          ...summary,
          total_quantity: Math.round(summary.total_quantity * 100) / 100,
          total_value: Math.round(summary.total_value * 100) / 100,
          avg_unit_price: Math.round(summary.avg_unit_price * 100) / 100
        },
        categories: formattedCategories,
        products: formattedProducts
      }
    });

  } catch (error) {
    console.error("❌ Error in getCustomerProducts:", error);
    return res.status(500).json({
      error: true,
      message: "Failed to get customer products",
      details: error.message
    });
  }
};


exports.update = async (req, res) => {
  try {
    const {
      id, name, category_id, company_name, description, qty, unit,
      unit_price, discount, status, actual_price, create_at, receive_date
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required for the update.",
      });
    }

    const convertedUnitPrice = parseFloat(unit_price);
    const convertedDiscount = discount ? parseFloat(discount) : 0;
    const convertedActualPrice = parseFloat(actual_price);

    if (isNaN(convertedUnitPrice) || isNaN(convertedActualPrice)) {
      return res.status(400).json({
        success: false,
        message: "Invalid unit_price or actual_price. Please provide valid numbers.",
      });
    }

    const sql = `
      UPDATE product
      SET 
        name = :name, 
        category_id = :category_id, 
        company_name = :company_name, 
        description = :description, 
        qty = :qty, 
        unit = :unit, 
        unit_price = :unit_price, 
        discount = :discount, 
        status = :status,
        actual_price = :actual_price,
        create_at = :create_at,
        receive_date = :receive_date
      WHERE id = :id
    `;

    const [data] = await db.query(sql, {
      id,
      name,
      category_id,
      company_name,
      description,
      qty,
      unit,
      unit_price: convertedUnitPrice,
      discount: convertedDiscount,
      status,
      actual_price: convertedActualPrice,
      create_at,
      receive_date
    });

    if (data.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    res.json({
      success: true,
      message: "Product updated successfully.",
      data,
    });
  } catch (error) {
    console.error("Error while updating product:", error);
    logError("product.update", error, res);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the product. Please try again later.",
    });
  }
};





exports.remove = async (req, res) => {
  try {
    const id = req.params.id || req.body.id;

    if (!id) {
      return res.status(400).json({ message: "Product ID is required!" });
    }

    await db.query("DELETE FROM product_details WHERE product_id = :id", { id });

    var [data] = await db.query("DELETE FROM product WHERE id = :id", { id });

    if (data.affectedRows === 0) {
      return res.status(404).json({ message: "Product not found!" });
    }

    res.json({ message: "Product and related details deleted successfully!" });
  } catch (error) {
    logError("remove.product", error, res);
  }
};

exports.newBarcode = async (req, res) => {
  try {
    var sql =
      "SELECT " +
      "CONCAT('P',LPAD((SELECT COALESCE(MAX(id),0) + 1 FROM product), 3, '0')) " +
      "as barcode";
    var [data] = await db.query(sql);
    res.json({
      barcode: data[0].barcode,
    });
  } catch (error) {
    logError("remove.create", error, res);
  }
};

isExistBarcode = async (barcode) => {
  try {
    var sql = "SELECT COUNT(id) as Total FROM product WHERE barcode=:barcode";
    var [data] = await db.query(sql, {
      barcode: barcode,
    });
    if (data.length > 0 && data[0].Total > 0) {
      return true;
    }
    return false;
  } catch (error) {
    logError("remove.create", error, res);
  }
};


exports.getTotalPayments = async (req, res) => {
  try {
    const { from_date, to_date, order_date, receive_date } = req.query;

    let sqlWhere = `WHERE cu_user.id = ?`;
    const params = [req.current_id];

    if (order_date) {
      sqlWhere += ` AND DATE(pd.created_at) = DATE(?)`;
      params.push(order_date);
    } else if (receive_date) {
      sqlWhere += ` AND DATE(pd.receive_date) = DATE(?)`;
      params.push(receive_date);
    } else if (from_date && to_date) {
      // ✅ ប្រើ BETWEEN ឬ datetime range
      sqlWhere += ` AND pd.updated_at >= CONCAT(?, ' 00:00:00') AND pd.updated_at <= CONCAT(?, ' 23:59:59')`;
      params.push(from_date, to_date);
    } else if (from_date) {
      sqlWhere += ` AND pd.updated_at >= CONCAT(?, ' 00:00:00')`;
      params.push(from_date);
    } else if (to_date) {
      sqlWhere += ` AND pd.updated_at <= CONCAT(?, ' 23:59:59')`;
      params.push(to_date);
    }

    const sql = `
      SELECT COALESCE(SUM(p.amount), 0) AS totalAmount
      FROM payments p
      INNER JOIN customer cu ON p.customer_id = cu.id
      INNER JOIN user u ON cu.user_id = u.id
      INNER JOIN user cu_user ON cu_user.group_id = u.group_id
      LEFT JOIN product_details pd ON p.order_id = pd.product_id
      ${sqlWhere}
    `;

    const [rows] = await db.query(sql, params);

    res.json({
      success: true,
      totalAmount: parseFloat(rows[0]?.totalAmount || 0)
    });
  } catch (error) {
    console.error("Error fetching total payments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch total payments"
    });
  }
};

exports.getProductDetail = async (req, res) => {
  try {
    const { txt_search, category_id, page, from_date, to_date, order_date, receive_date, is_list_all } = req.query;

    const listAll = is_list_all === 'true';
    let sqlSelect = `
      SELECT 
        pd.id AS detail_id,
        p.id AS product_id,
        cu.name AS customer_name, 
        pd.name,
        pd.barcode AS detail_barcode,
        pd.company_name AS detail_company_name,
        pd.description AS detail_description,
        pd.qty,
        pd.unit,
        pd.unit_price AS detail_unit_price,
        pd.total_price,
        c.actual_price,
        c.name AS category_name,
        pd.status AS detail_status, 
        pd.created_at AS detail_created_at,
        pd.updated_at AS updated_at,
        pd.created_by AS detail_created_by,
        pd.is_completed,
        pd.created_date AS product_create_at,
        p.order_date AS product_created_at,
        pd.receive_date AS receive_date,
        p.create_by AS product_created_by,
        u.group_id,
        u.name AS user_name
    `;
    let sqlFrom = `
      FROM product_details pd
      INNER JOIN product p ON pd.product_id = p.id
      INNER JOIN category c ON CAST(pd.category AS UNSIGNED) = c.id
      INNER JOIN customer cu ON pd.customer_id = cu.id 
      INNER JOIN user u ON pd.user_id = u.id
      INNER JOIN user cu_user ON cu_user.group_id = u.group_id
    `;
    let sqlWhere = `WHERE cu_user.id = ?`;
    const params = [req.current_id];


    if (order_date) {
      sqlWhere += ` AND DATE(pd.created_date) = DATE(?)`;
      params.push(order_date);
    } else if (receive_date) {
      sqlWhere += ` AND DATE(pd.receive_date) = DATE(?)`;
      params.push(receive_date);
    } else if (from_date && to_date) {
      sqlWhere += ` AND DATE(pd.created_date) >= DATE(?) AND DATE(pd.created_date) <= DATE(?)`;
      params.push(from_date, to_date);
    } else if (from_date) {
      sqlWhere += ` AND DATE(pd.created_date) >= DATE(?)`;
      params.push(from_date);
    } else if (to_date) {
      sqlWhere += ` AND DATE(pd.created_date) <= DATE(?)`;
      params.push(to_date);
    }

    if (txt_search) {
      const pattern = `%${txt_search}%`;
      sqlWhere += `
        AND (
          pd.name LIKE ? OR 
          pd.barcode LIKE ? OR 
          pd.company_name LIKE ? OR 
          pd.description LIKE ? OR
          c.name LIKE ? OR
          cu.name LIKE ?
        )
      `;
      params.push(pattern, pattern, pattern, pattern, pattern, pattern);
    }

    if (category_id) {
      sqlWhere += ` AND CAST(pd.category AS UNSIGNED) = ?`;
      params.push(category_id);
    }

    const countSql = `SELECT COUNT(*) AS total ${sqlFrom} ${sqlWhere}`;
    const [countRows] = await db.query(countSql, params);
    const total = countRows[0]?.total || 0;

    const summarySql = `
      SELECT 
        SUM(pd.qty) AS totalQuantity,
        SUM((pd.qty * pd.unit_price) / c.actual_price) AS totalValue
      ${sqlFrom}
      ${sqlWhere}
    `;
    const [summaryRows] = await db.query(summarySql, params);

    let paymentWhere = `WHERE cu_user.id = ?`;
    const paymentParams = [req.current_id];

    if (order_date) {
      paymentWhere += ` AND DATE(pay.payment_date) = DATE(?)`;
      paymentParams.push(order_date);
    } else if (receive_date) {
      paymentWhere += ` AND DATE(pay.payment_date) = DATE(?)`;
      paymentParams.push(receive_date);
    } else if (from_date && to_date) {
      paymentWhere += ` AND pay.payment_date >= CONCAT(?, ' 00:00:00') AND pay.payment_date <= CONCAT(?, ' 23:59:59')`;
      paymentParams.push(from_date, to_date);
    } else if (from_date) {
      paymentWhere += ` AND pay.payment_date >= CONCAT(?, ' 00:00:00')`;
      paymentParams.push(from_date);
    } else if (to_date) {
      paymentWhere += ` AND pay.payment_date <= CONCAT(?, ' 23:59:59')`;
      paymentParams.push(to_date);
    }

    const paymentSql = `
      SELECT COALESCE(SUM(pay.amount), 0) AS totalPaid
      FROM payments pay
      INNER JOIN customer cu ON pay.customer_id = cu.id
      INNER JOIN user u ON cu.user_id = u.id
      INNER JOIN user cu_user ON cu_user.group_id = u.group_id
      ${paymentWhere}
    `;

    const [paymentRows] = await db.query(paymentSql, paymentParams);

    const summary = {
      totalQuantity: parseInt(summaryRows[0]?.totalQuantity || 0),
      totalValue: parseFloat(summaryRows[0]?.totalValue || 0),
      totalPaid: parseFloat(paymentRows[0]?.totalPaid || 0),
      remainingBalance: parseFloat(summaryRows[0]?.totalValue || 0) - parseFloat(paymentRows[0]?.totalPaid || 0)
    };

    let sql = `${sqlSelect} ${sqlFrom} ${sqlWhere} ORDER BY CAST(pd.description AS UNSIGNED) ASC`;

    if (!listAll && page) {
      const pageSize = 10;
      const offset = (parseInt(page) - 1) * pageSize;
      sql += ` LIMIT ${pageSize} OFFSET ${offset}`;
    }


    const [rows] = await db.query(sql, params);

    const formattedRows = rows.map((item) => {
      const totalPrice =
        (parseFloat(item.qty || 0) * parseFloat(item.detail_unit_price || 0)) /
        (parseFloat(item.actual_price) || 1);
      return {
        ...item,
        corrected_total_price: totalPrice.toFixed(2),
        is_completed: Boolean(item.is_completed)
      };
    });


    res.json({
      success: true,
      data: formattedRows,
      total,
      summary,
      message: formattedRows.length === 0 ? "No product details found" : undefined,
    });
  } catch (error) {
    console.error("❌ Error while getting product details:", error);
    logError("product.details", error, res);
    res.status(500).json({
      success: false,
      message: "An error occurred while retrieving product details. Please try again later.",
    });
  }
};
exports.updateProductCompletion = async (req, res) => {
  try {
    const { detail_id, is_completed } = req.body;

    if (!detail_id) {
      return res.status(400).json({
        success: false,
        message: "Product detail ID is required"
      });
    }

    const sql = `
      UPDATE product_details  
      SET is_completed = ?, updated_at = NOW() 
      WHERE id = ?
    `;

    const [result] = await db.query(sql, [is_completed ? 1 : 0, detail_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Product detail not found"
      });
    }

    res.json({
      success: true,
      message: "Completion status updated successfully"
    });

  } catch (error) {
    logError("updateProductCompletion", error)
  }
};





exports.getListByCurrentUserGroup = async (req, res) => {
  try {
    var sql = `
      SELECT 
        p.id, 
        p.name, 
        p.category_id, 
        p.barcode, 
        p.company_name,
        p.description, 
        p.qty, 
        p.unit_price, 
        p.discount, 
        p.actual_price, 
        p.status,
        p.create_by, 
        p.create_at, 
        p.unit, 
        p.customer_id,
        c.name AS category_name,
        c.barcode AS category_barcode,
        cu.name AS customer_name,
        cu.address AS customer_address,
        cu.tel AS customer_tel,
        c.actual_price AS category_actual_price,
        (p.qty * p.unit_price) AS original_price,
        CASE
          WHEN p.discount > 0 THEN ((p.qty * p.unit_price) * (1 - p.discount / 100)) / c.actual_price
          ELSE (p.qty * p.unit_price) / c.actual_price
        END AS total_price,
        u.group_id,
        u.name AS created_by_name,
        u.username AS created_by_username
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
      LEFT JOIN customer cu ON p.customer_id = cu.id
      INNER JOIN user u ON p.user_id = u.id
      WHERE u.group_id = (SELECT group_id FROM user WHERE id = ?)
        AND p.status != 'deleted'
      ORDER BY p.customer_id, p.id DESC
    `;

    var [data] = await db.query(sql, [req.current_id]);

    res.json({
      list: data,
      message: "Success!",
    });
  } catch (error) {
    logError("product.getListByCurrentUserGroup", error, res);
  }
};

// exports.createSingleProduct = async (productData, req) => {
//   const {
//     user_id, name, category_id, company_name, description, qty,
//     actual_price, unit, unit_price, discount, status, 
//     create_at,      
//     receive_date,    
//     created_date,    
//     customer_id
//   } = productData;


//   const [categoryRow] = await db.query(
//     "SELECT barcode, name FROM category WHERE id = :category_id",
//     { category_id }
//   );

//   if (!categoryRow || categoryRow.length === 0) {
//     throw new Error(`Invalid category_id: ${category_id}`);
//   }

//   const resolvedActualPrice = actual_price || 1190;
//   const qtyAdded = parseInt(qty);

//   const getCurrentTimestamp = () => {
//     return new Date().toISOString().slice(0, 19).replace('T', ' ');
//   };
//   const finalCreateAt = create_at || getCurrentTimestamp();
//   const finalReceiveDate = receive_date || getCurrentTimestamp();
//   const finalCreatedDate = created_date || getCurrentTimestamp();

//   const checkSql = `
//     SELECT * FROM product 
//     WHERE customer_id = :customer_id AND category_id = :category_id 
//     AND name = :name AND user_id = :user_id
//     LIMIT 1
//   `;
//   const [existingProducts] = await db.query(checkSql, {
//     customer_id,
//     category_id,
//     name,
//     user_id
//   });

//   let productId;
//   let isNewProduct = false;
//   let previousQty = 0;
//   let productBarcode = null;

//   if (existingProducts.length > 0) {
//     const existingProduct = existingProducts[0];
//     previousQty = parseInt(existingProduct.qty) || 0;
//     const newQty = previousQty + qtyAdded;
//     productBarcode = existingProduct.barcode;

//     await db.query(`
//       UPDATE product 
//       SET qty = :new_qty, 
//           unit_price = :unit_price, 
//           discount = :discount, 
//           actual_price = :actual_price, 
//           description = :description
//       WHERE id = :id
//     `, {
//       new_qty: newQty,
//       unit_price,
//       discount: discount || 0,
//       actual_price: resolvedActualPrice,
//       description: description || '',
//       id: existingProduct.id
//     });

//     productId = existingProduct.id;
//   } else {
//     const [barcodeResult] = await db.query(`
//       SELECT CONCAT('P',LPAD((SELECT COALESCE(MAX(id),0) + 1 FROM product), 3, '0')) as barcode
//     `);
//     const generatedBarcode = barcodeResult[0]?.barcode || `P${Date.now()}`;
//     productBarcode = generatedBarcode;

//     const [result] = await db.query(`
//       INSERT INTO product 
//       (user_id, name, category_id, barcode, company_name, description, qty, actual_price, 
//        unit, unit_price, discount, status, create_by, create_at, receive_date, customer_id)
//       VALUES
//       (:user_id, :name, :category_id, :barcode, :company_name, :description, :qty, :actual_price, 
//        :unit, :unit_price, :discount, :status, :create_by, :create_at, :receive_date, :customer_id)
//     `, {
//       user_id,
//       name,
//       category_id,
//       barcode: generatedBarcode,
//       company_name: company_name || '',
//       description: description || '',
//       qty,
//       actual_price: resolvedActualPrice,
//       unit: unit || '',
//       unit_price,
//       discount: discount || 0,
//       status: status || 1,
//       create_by: req.auth?.name || 'system',
//       create_at: finalCreateAt,  
//       receive_date: finalReceiveDate, 
//       customer_id
//     });

//     productId = result.insertId;
//     isNewProduct = true;
//   }

//   const totalPrice = ((qtyAdded * unit_price) * (1 - (discount || 0) / 100)) / resolvedActualPrice;

//   const [productDetailResult] = await db.query(`
//     INSERT INTO product_details (
//       product_id, user_id, customer_id, name, description, category, company_name,
//       qty, unit, unit_price, total_price, status, created_at, created_date, created_by, receive_date
//     )
//     VALUES (
//       :product_id, :user_id, :customer_id, :name, :description, :category, :company_name,
//       :qty, :unit, :unit_price, :total_price, :status, :created_at, :created_date, :created_by, :receive_date
//     )
//   `, {
//     product_id: productId,
//     user_id,
//     customer_id,
//     name,
//     description: description || '',
//     category: category_id,
//     company_name: company_name || '',
//     qty: qtyAdded,
//     unit: unit || '',
//     unit_price,
//     total_price: totalPrice,
//     status: status || 1,
//     created_at: finalCreateAt,       
//     created_date: finalCreatedDate,  
//     created_by: req.auth?.name || 'system',
//     receive_date: finalReceiveDate  
//   });

//   const productDetailId = productDetailResult.insertId;

//   let payableId = null;
//   let payableItemId = null;
//   let payableAmount = 0;

//   if (company_name && company_name.trim() !== '') {
//     try {

//       const baseAmount = (qtyAdded * unit_price) / resolvedActualPrice;
//       const discountAmount = baseAmount * ((discount || 0) / 100);
//       payableAmount = baseAmount - discountAmount;

//       const cardNumber = description || '';
//       const productInfo = cardNumber 
//         ? `Card: ${cardNumber} - ${name} (Qty: ${qtyAdded}, Unit: ${unit || 'pcs'}, $${payableAmount.toFixed(2)})`
//         : `${name} (Qty: ${qtyAdded}, Unit: ${unit || 'pcs'}, $${payableAmount.toFixed(2)})`;

//       const [existingPayable] = await db.query(`
//         SELECT id, total_amount, paid_amount, remaining_amount, description, card_number,
//                product_id, category_id
//         FROM company_payables 
//         WHERE company_name = :company_name 
//         AND status IN (0, 1)
//         ORDER BY create_at DESC
//         LIMIT 1
//       `, { 
//         company_name: company_name.trim() 
//       });

//       if (existingPayable.length > 0) {
//         const existing = existingPayable[0];
//         const newTotalAmount = parseFloat(existing.total_amount) + payableAmount;
//         const newRemainingAmount = parseFloat(existing.remaining_amount) + payableAmount;
//         const newStatus = newRemainingAmount <= 0 ? 2 : (parseFloat(existing.paid_amount) > 0 ? 1 : 0);

//         const updatedDescription = existing.description 
//           ? `${existing.description}\n• ${productInfo}`
//           : productInfo;

//         const updatedCardNumber = existing.card_number || cardNumber;

//         await db.query(`
//           UPDATE company_payables 
//           SET 
//             total_amount = :total_amount,
//             remaining_amount = :remaining_amount,
//             status = :status,
//             description = :description,
//             card_number = :card_number,
//             product_id = :product_id,
//             category_id = :category_id,
//             update_at = NOW()
//           WHERE id = :id
//         `, {
//           id: existing.id,
//           total_amount: newTotalAmount,
//           remaining_amount: newRemainingAmount,
//           status: newStatus,
//           description: updatedDescription,
//           card_number: updatedCardNumber,
//           product_id: productId,
//           category_id: category_id
//         });

//         payableId = existing.id;

//       } else {
//         const payableSql = `
//           INSERT INTO company_payables (
//             company_name, 
//             description, 
//             card_number,
//             product_id,
//             category_id,
//             total_amount, 
//             paid_amount, 
//             remaining_amount, 
//             status, 
//             due_date, 
//             create_by, 
//             create_at
//           )
//           VALUES (
//             :company_name, 
//             :description,
//             :card_number,
//             :product_id,
//             :category_id,
//             :total_amount, 
//             :paid_amount,
//             :remaining_amount, 
//             :status, 
//             :due_date, 
//             :create_by, 
//             NOW()
//           )
//         `;

//         const [payableResult] = await db.query(payableSql, {
//           company_name: company_name.trim(),
//           description: productInfo,
//           card_number: cardNumber,
//           product_id: productId,
//           category_id: category_id,
//           total_amount: payableAmount,
//           paid_amount: 0,
//           remaining_amount: payableAmount,
//           status: 0,
//           due_date: finalReceiveDate,  
//           create_by: req.auth?.name || 'system'
//         });

//         payableId = payableResult.insertId;
//       }

//       if (payableId) {
//         const itemTotalAmount = (qtyAdded * unit_price) / resolvedActualPrice;

//         const itemSql = `
//           INSERT INTO payable_items (
//             payable_id, product_id, category_id, barcode,
//             product_name, description, quantity, unit,
//             unit_price, total_amount, create_by, create_at
//           )
//           VALUES (
//             :payable_id, :product_id, :category_id, :barcode,
//             :product_name, :description, :quantity, :unit,
//             :unit_price, :total_amount, :create_by, NOW()
//           )
//         `;

//         const [itemResult] = await db.query(itemSql, {
//           payable_id: payableId,
//           product_id: productId,
//           category_id: category_id,
//           barcode: productBarcode,
//           product_name: name,
//           description: description || '',
//           quantity: qtyAdded,
//           unit: unit || '',
//           unit_price: unit_price,
//           total_amount: itemTotalAmount,
//           create_by: req.auth?.name || 'system'
//         });

//         payableItemId = itemResult.insertId;
//       }

//     } catch (payableError) {
//       console.error('  ❌ Error creating/updating company payable:', payableError.message);
//     }
//   }

//   const [productDataResult] = await db.query(`
//     SELECT 
//       p.id, p.name, p.category_id, p.barcode, p.user_id, p.company_name, 
//       p.description, p.qty, p.unit_price, p.discount, p.actual_price, p.status, 
//       p.create_by, p.create_at, p.unit, p.customer_id,
//       c.name AS category_name,
//       cust.name AS customer_name,
//       cust.address AS customer_address,
//       cust.tel AS customer_phone,
//       cust.email AS customer_email,
//       (p.qty * p.unit_price) AS original_price,
//       CASE
//         WHEN p.discount > 0 THEN ((p.qty * p.unit_price) * (1 - p.discount / 100)) / p.actual_price
//         ELSE (p.qty * p.unit_price) / p.actual_price
//       END AS total_price
//     FROM product p  
//     INNER JOIN category c ON p.category_id = c.id
//     LEFT JOIN customer cust ON p.customer_id = cust.id
//     WHERE p.id = :id
//   `, { id: productId });



//   return {
//     ...productDataResult[0],
//     isNewProduct,
//     previousQty,
//     addedQty: qtyAdded,
//     payable_id: payableId,
//     payable_item_id: payableItemId,
//     payable_amount: payableAmount
//   };
// };

// exports.sendBatchTelegramNotification = async (products) => {
//   if (!products || products.length === 0) return;

//   const firstProduct = products[0];
//   const now = new Date();
//   const currentDate = now.toLocaleString('en-US', {
//     timeZone: 'Asia/Phnom_Penh',
//     year: 'numeric',
//     month: '2-digit',
//     day: '2-digit',
//     hour: '2-digit',
//     minute: '2-digit',
//     second: '2-digit'
//   });

//   const parts = currentDate.split(', ');
//   const datePart = parts[0].split('/'); 
//   const timePart = parts[1];
//   const formattedDate = `${datePart[1]}/${datePart[0]}/${datePart[2]} ${timePart}`;

//   let message = `📦 <b>STOCK ${products.length > 1 ? 'UPDATES' : 'UPDATE'}</b> 📝\n\n`;
//   message += `👤 <b>Customer Information:</b>\n`;
//   message += `• <b>Name:</b> ${firstProduct.customer_name || 'N/A'}\n`;
//   message += `• <b>Address:</b> ${firstProduct.customer_address || 'N/A'}\n`;
//   message += `• <b>Phone:</b> ${firstProduct.customer_phone || 'N/A'}\n`;
//   const cardNumbers = products
//     .map(p => p.description)
//     .filter(d => d && d !== 'N/A' && d.trim() !== '');

//   if (cardNumbers.length > 0) {
//     message += `• <b>Card Number:</b> ${cardNumbers[0]}\n`;
//   }
//   message += `━━━━━━━━━━━━━━━━━`;
//   let grandTotal = 0;
//   products.forEach((product, index) => {
//     const productValue = parseFloat(product.total_price) || 0;
//     grandTotal += productValue;
//     if (product.isNewProduct) {
//       message += `\n🆕 <b>${index + 1}. NEW PRODUCT</b>\n`;
//       message += `• <b>Category:</b> ${product.category_name}\n`;
//       message += `• <b>Company:</b> ${product.company_name || 'N/A'}\n`;
//       message += `• <b>Quantity:</b> ${Number(product.qty).toLocaleString('en-US', { maximumFractionDigits: 2 })}${product.unit || ''}\n`;
//       message += `• <b>Unit Price:</b> $${parseFloat(product.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
//       message += `• <b>Total Value:</b> $${productValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
//       if (product.discount > 0) {
//         message += `• <b>Discount:</b> ${product.discount}%\n`;
//       }
//     } else {
//       message += `\n🔄 <b>${index + 1}. STOCK UPDATED</b>\n`;
//       message += `• <b>Category:</b> ${product.category_name}\n`;
//       message += `• <b>Company:</b> ${product.company_name || 'N/A'}\n`;
//       message += `• <b>New Total:</b> ${Number(product.qty).toLocaleString('en-US', { maximumFractionDigits: 2 })}${product.unit || ''}\n`;
//       message += `• <b>Unit Price:</b> $${parseFloat(product.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
//       message += `• <b>Total Value:</b> $${productValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
//       if (product.discount > 0) {
//         message += `• <b>Discount:</b> ${product.discount}%\n`;
//       }
//     }
//   });

//   message += `\n━━━━━━━━━━━━━━━━━\n`;
//   message += `💰 <b>GRAND TOTAL:</b> $${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
//   message += `👤 <b>${products[0].isNewProduct ? 'Created' : 'Updated'} by:</b> ${firstProduct.create_by}\n`;
//   message += `🕐 <b>Date:</b> ${formattedDate}`;

//   try {
//     await sendTelegramMessagenewstock(message);
//   } catch (error) {
//     console.error('❌ Failed to send batch Telegram notification:', error);
//   }
// };

exports.createSingleProduct = async (productData, req) => {
  const {
    user_id, name, category_id, company_name, description, qty,
    actual_price, unit, unit_price, discount, status,
    create_at,
    receive_date,
    created_date,
    customer_id
  } = productData;

  const [categoryRow] = await db.query(
    "SELECT barcode, name FROM category WHERE id = :category_id",
    { category_id }
  );

  if (!categoryRow || categoryRow.length === 0) {
    throw new Error(`Invalid category_id: ${category_id}`);
  }

  const resolvedActualPrice = actual_price || 1190;
  const qtyAdded = parseInt(qty);

  const getCurrentTimestamp = () => {
    return new Date().toISOString().slice(0, 19).replace('T', ' ');
  };
  const finalCreateAt = create_at || getCurrentTimestamp();
  const finalReceiveDate = receive_date || getCurrentTimestamp();
  const finalCreatedDate = created_date || getCurrentTimestamp();

  // ✅ Get branch name from request
  const branch_name = req.auth?.branch_name || null;

  const checkSql = `
    SELECT * FROM product 
    WHERE customer_id = :customer_id AND category_id = :category_id 
    AND name = :name AND user_id = :user_id
    LIMIT 1
  `;
  const [existingProducts] = await db.query(checkSql, {
    customer_id,
    category_id,
    name,
    user_id
  });

  let productId;
  let isNewProduct = false;
  let previousQty = 0;
  let productBarcode = null;

  if (existingProducts.length > 0) {
    const existingProduct = existingProducts[0];
    previousQty = parseInt(existingProduct.qty) || 0;
    const newQty = previousQty + qtyAdded;
    productBarcode = existingProduct.barcode;

    await db.query(`
      UPDATE product 
      SET qty = :new_qty, 
          unit_price = :unit_price, 
          discount = :discount, 
          actual_price = :actual_price, 
          description = :description
      WHERE id = :id
    `, {
      new_qty: newQty,
      unit_price,
      discount: discount || 0,
      actual_price: resolvedActualPrice,
      description: description || '',
      id: existingProduct.id
    });

    productId = existingProduct.id;
  } else {
    const [barcodeResult] = await db.query(`
      SELECT CONCAT('P',LPAD((SELECT COALESCE(MAX(id),0) + 1 FROM product), 3, '0')) as barcode
    `);
    const generatedBarcode = barcodeResult[0]?.barcode || `P${Date.now()}`;
    productBarcode = generatedBarcode;

    const [result] = await db.query(`
      INSERT INTO product 
      (user_id, name, category_id, barcode, company_name, description, qty, actual_price, 
       unit, unit_price, discount, status, create_by, create_at, receive_date, customer_id)
      VALUES
      (:user_id, :name, :category_id, :barcode, :company_name, :description, :qty, :actual_price, 
       :unit, :unit_price, :discount, :status, :create_by, :create_at, :receive_date, :customer_id)
    `, {
      user_id,
      name,
      category_id,
      barcode: generatedBarcode,
      company_name: company_name || '',
      description: description || '',
      qty,
      actual_price: resolvedActualPrice,
      unit: unit || '',
      unit_price,
      discount: discount || 0,
      status: status || 1,
      create_by: req.auth?.name || 'system',
      create_at: finalCreateAt,
      receive_date: finalReceiveDate,
      customer_id
    });

    productId = result.insertId;
    isNewProduct = true;
  }

  const totalPrice = ((qtyAdded * unit_price) * (1 - (discount || 0) / 100)) / resolvedActualPrice;

  const [productDetailResult] = await db.query(`
    INSERT INTO product_details (
      product_id, user_id, customer_id, name, description, category, company_name,
      qty, unit, unit_price, total_price, status, created_at, created_date, created_by, receive_date
    )
    VALUES (
      :product_id, :user_id, :customer_id, :name, :description, :category, :company_name,
      :qty, :unit, :unit_price, :total_price, :status, :created_at, :created_date, :created_by, :receive_date
    )
  `, {
    product_id: productId,
    user_id,
    customer_id,
    name,
    description: description || '',
    category: category_id,
    company_name: company_name || '',
    qty: qtyAdded,
    unit: unit || '',
    unit_price,
    total_price: totalPrice,
    status: status || 1,
    created_at: finalCreateAt,
    created_date: finalCreatedDate,
    created_by: req.auth?.name || 'system',
    receive_date: finalReceiveDate
  });

  const productDetailId = productDetailResult.insertId;

  let payableId = null;
  let payableItemId = null;
  let payableAmount = 0;

  if (company_name && company_name.trim() !== '') {
    try {
      const baseAmount = (qtyAdded * unit_price) / resolvedActualPrice;
      const discountAmount = baseAmount * ((discount || 0) / 100);
      payableAmount = baseAmount - discountAmount;

      const cardNumber = description || '';
      const productInfo = cardNumber
        ? `Card: ${cardNumber} - ${name} (Qty: ${qtyAdded}, Unit: ${unit || 'pcs'}, $${payableAmount.toFixed(2)})`
        : `${name} (Qty: ${qtyAdded}, Unit: ${unit || 'pcs'}, $${payableAmount.toFixed(2)})`;

      const [existingPayable] = await db.query(`
        SELECT id, total_amount, paid_amount, remaining_amount, description, card_number,
               product_id, category_id
        FROM company_payables 
        WHERE company_name = :company_name 
        AND status IN (0, 1)
        ORDER BY create_at DESC
        LIMIT 1
      `, {
        company_name: company_name.trim()
      });

      if (existingPayable.length > 0) {
        const existing = existingPayable[0];
        const newTotalAmount = parseFloat(existing.total_amount) + payableAmount;
        const newRemainingAmount = parseFloat(existing.remaining_amount) + payableAmount;
        const newStatus = newRemainingAmount <= 0 ? 2 : (parseFloat(existing.paid_amount) > 0 ? 1 : 0);

        const updatedDescription = existing.description
          ? `${existing.description}\n• ${productInfo}`
          : productInfo;

        const updatedCardNumber = existing.card_number || cardNumber;

        await db.query(`
          UPDATE company_payables 
          SET 
            total_amount = :total_amount,
            remaining_amount = :remaining_amount,
            status = :status,
            description = :description,
            card_number = :card_number,
            product_id = :product_id,
            category_id = :category_id,
            update_at = NOW()
          WHERE id = :id
        `, {
          id: existing.id,
          total_amount: newTotalAmount,
          remaining_amount: newRemainingAmount,
          status: newStatus,
          description: updatedDescription,
          card_number: updatedCardNumber,
          product_id: productId,
          category_id: category_id
        });

        payableId = existing.id;

      } else {
        const payableSql = `
          INSERT INTO company_payables (
            company_name, 
            description, 
            card_number,
            product_id,
            category_id,
            total_amount, 
            paid_amount, 
            remaining_amount, 
            status, 
            due_date, 
            create_by, 
            create_at
          )
          VALUES (
            :company_name, 
            :description,
            :card_number,
            :product_id,
            :category_id,
            :total_amount, 
            :paid_amount,
            :remaining_amount, 
            :status, 
            :due_date, 
            :create_by, 
            NOW()
          )
        `;

        const [payableResult] = await db.query(payableSql, {
          company_name: company_name.trim(),
          description: productInfo,
          card_number: cardNumber,
          product_id: productId,
          category_id: category_id,
          total_amount: payableAmount,
          paid_amount: 0,
          remaining_amount: payableAmount,
          status: 0,
          due_date: finalReceiveDate,
          create_by: req.auth?.name || 'system'
        });

        payableId = payableResult.insertId;
      }

      if (payableId) {
        const itemTotalAmount = (qtyAdded * unit_price) / resolvedActualPrice;

        const itemSql = `
          INSERT INTO payable_items (
            payable_id, product_id, category_id, barcode,
            product_name, description, quantity, unit,
            unit_price, total_amount, create_by, create_at
          )
          VALUES (
            :payable_id, :product_id, :category_id, :barcode,
            :product_name, :description, :quantity, :unit,
            :unit_price, :total_amount, :create_by, NOW()
          )
        `;

        const [itemResult] = await db.query(itemSql, {
          payable_id: payableId,
          product_id: productId,
          category_id: category_id,
          barcode: productBarcode,
          product_name: name,
          description: description || '',
          quantity: qtyAdded,
          unit: unit || '',
          unit_price: unit_price,
          total_amount: itemTotalAmount,
          create_by: req.auth?.name || 'system'
        });

        payableItemId = itemResult.insertId;
      }

    } catch (payableError) {
      console.error('  ❌ Error creating/updating company payable:', payableError.message);
    }
  }

  const [productDataResult] = await db.query(`
    SELECT 
      p.id, p.name, p.category_id, p.barcode, p.user_id, p.company_name, 
      p.description, p.qty, p.unit_price, p.discount, p.actual_price, p.status, 
      p.create_by, p.create_at, p.unit, p.customer_id,
      c.name AS category_name,
      cust.name AS customer_name,
      cust.address AS customer_address,
      cust.tel AS customer_phone,
      cust.email AS customer_email,
      (p.qty * p.unit_price) AS original_price,
      CASE
        WHEN p.discount > 0 THEN ((p.qty * p.unit_price) * (1 - p.discount / 100)) / p.actual_price
        ELSE (p.qty * p.unit_price) / p.actual_price
      END AS total_price
    FROM product p  
    INNER JOIN category c ON p.category_id = c.id
    LEFT JOIN customer cust ON p.customer_id = cust.id
    WHERE p.id = :id
  `, { id: productId });

  return {
    ...productDataResult[0],
    isNewProduct,
    previousQty,
    addedQty: qtyAdded,
    payable_id: payableId,
    payable_item_id: payableItemId,
    payable_amount: payableAmount,
    branch_name // ✅ Add branch name to result
  };
};

exports.create = async (req, res) => {
  try {
    const data = req.body;
    const result = await exports.createSingleProduct(data, req);
    res.status(201).json({
      error: false,
      message: "Product created successfully",
      data: result
    });
  } catch (error) {
    console.error("❌ Error in product.create:", error);
    res.status(500).json({
      error: true,
      message: error.message || "An error occurred while creating the product."
    });
  }
};

exports.sendBatchTelegramNotification = async (products) => {
  if (!products || products.length === 0) return;

  const firstProduct = products[0];
  const branch_name = firstProduct.branch_name || null;
  const group_id = firstProduct.group_id || null; // ✅ Get group_id if available

  const now = new Date();
  const currentDate = now.toLocaleString('en-US', {
    timeZone: 'Asia/Phnom_Penh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const parts = currentDate.split(', ');
  const datePart = parts[0].split('/');
  const timePart = parts[1];
  const formattedDate = `${datePart[1]}/${datePart[0]}/${datePart[2]} ${timePart}`;

  // ✅ Build Telegram message (HTML format)
  let telegramMessage = `📦 <b>STOCK ${products.length > 1 ? 'UPDATES' : 'UPDATE'}</b> 📝\n\n`;

  if (branch_name) {
    telegramMessage += `🏢 <b>Branch:</b> ${branch_name}\n\n`;
  }

  telegramMessage += `👤 <b>Customer Information:</b>\n`;
  telegramMessage += `• <b>Name:</b> ${firstProduct.customer_name || 'N/A'}\n`;
  telegramMessage += `• <b>Address:</b> ${firstProduct.customer_address || 'N/A'}\n`;
  telegramMessage += `• <b>Phone:</b> ${firstProduct.customer_phone || 'N/A'}\n`;

  const cardNumbers = products
    .map(p => p.description)
    .filter(d => d && d !== 'N/A' && d.trim() !== '');

  const cardNumber = cardNumbers.length > 0 ? cardNumbers[0] : null;

  if (cardNumber) {
    telegramMessage += `• <b>Card Number:</b> ${cardNumber}\n`;
  }

  telegramMessage += `━━━━━━━━━━━━━━━━━`;

  // ✅ Build plain text message for System Notification
  let plainMessage = `Stock ${products.length > 1 ? 'Updates' : 'Update'}\n\n`;

  if (branch_name) {
    plainMessage += `Branch: ${branch_name}\n`;
  }

  plainMessage += `\nCustomer: ${firstProduct.customer_name || 'N/A'}\n`;
  plainMessage += `Address: ${firstProduct.customer_address || 'N/A'}\n`;
  plainMessage += `Phone: ${firstProduct.customer_phone || 'N/A'}\n`;

  if (cardNumber) {
    plainMessage += `Card Number: ${cardNumber}\n`;
  }

  plainMessage += `\nItems:\n`;

  let grandTotal = 0;
  let items = [];

  products.forEach((product, index) => {
    const productValue = parseFloat(product.total_price) || 0;
    grandTotal += productValue;

    const itemName = `${product.category_name} (${product.company_name || 'N/A'})`;
    const quantity = Number(product.qty).toLocaleString('en-US', { maximumFractionDigits: 2 });
    const unit = product.unit || '';
    const unitPrice = parseFloat(product.unit_price);

    // For telegram (HTML)
    if (product.isNewProduct) {
      telegramMessage += `\n🆕 <b>${index + 1}. NEW PRODUCT</b>\n`;
      telegramMessage += `• <b>Category:</b> ${product.category_name}\n`;
      telegramMessage += `• <b>Company:</b> ${product.company_name || 'N/A'}\n`;
      telegramMessage += `• <b>Quantity:</b> ${quantity}${unit}\n`;
      telegramMessage += `• <b>Unit Price:</b> $${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      telegramMessage += `• <b>Total Value:</b> $${productValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      if (product.discount > 0) {
        telegramMessage += `• <b>Discount:</b> ${product.discount}%\n`;
      }
    } else {
      telegramMessage += `\n🔄 <b>${index + 1}. STOCK UPDATED</b>\n`;
      telegramMessage += `• <b>Category:</b> ${product.category_name}\n`;
      telegramMessage += `• <b>Company:</b> ${product.company_name || 'N/A'}\n`;
      telegramMessage += `• <b>New Total:</b> ${quantity}${unit}\n`;
      telegramMessage += `• <b>Unit Price:</b> $${unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      telegramMessage += `• <b>Total Value:</b> $${productValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      if (product.discount > 0) {
        telegramMessage += `• <b>Discount:</b> ${product.discount}%\n`;
      }
    }

    // For plain message
    const status = product.isNewProduct ? '🆕 NEW' : '🔄 UPDATED';
    plainMessage += `  ${index + 1}. ${status} - ${itemName}\n`;
    plainMessage += `     • Quantity: ${quantity}${unit}\n`;
    plainMessage += `     • Unit Price: $${unitPrice.toFixed(2)}\n`;
    plainMessage += `     • Total: $${productValue.toFixed(2)}\n`;

    // Store item data
    items.push({
      name: itemName,
      quantity: product.qty,
      unit: unit,
      unit_price: unitPrice,
      total_value: productValue,
      is_new: product.isNewProduct,
      discount: product.discount || 0
    });
  });

  telegramMessage += `\n━━━━━━━━━━━━━━━━━\n`;
  telegramMessage += `💰 <b>GRAND TOTAL:</b> $${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
  telegramMessage += `👤 <b>${products[0].isNewProduct ? 'Created' : 'Updated'} by:</b> ${firstProduct.create_by}\n`;
  telegramMessage += `🕐 <b>Date:</b> ${formattedDate}`;

  plainMessage += `\nGrand Total: $${grandTotal.toFixed(2)}\n`;
  plainMessage += `${products[0].isNewProduct ? 'Created' : 'Updated'} by: ${firstProduct.create_by}`;

  // ✅✅✅ SEND TELEGRAM NOTIFICATION ✅✅✅
  try {
    await sendSmartNotification({
      event_type: 'stock_update',
      branch_name: branch_name,
      message: telegramMessage,
      severity: 'normal'
    });

  } catch (error) {
    console.error('❌ Failed to send Telegram notification:', error);
  }

  try {
    const notificationTitle = products.length > 1
      ? `📦 ${products.length} Stock Updates`
      : `📦 Stock ${products[0].isNewProduct ? 'Added' : 'Updated'}`;

    await createSystemNotification({
      notification_type: 'stock_update',
      title: notificationTitle,
      message: plainMessage,
      data: {
        items: items,
        product_count: products.length,
        is_new: products[0].isNewProduct
      },
      order_id: null,
      order_no: null,
      customer_id: firstProduct.customer_id,
      customer_name: firstProduct.customer_name,
      customer_address: firstProduct.customer_address,
      customer_tel: firstProduct.customer_phone,
      total_amount: grandTotal,
      total_liters: null,
      card_number: cardNumber,
      user_id: null,
      created_by: firstProduct.create_by,
      branch_name: branch_name,
      group_id: group_id,
      priority: grandTotal > 10000 ? 'high' : 'normal',
      severity: 'info',
      icon: '📦',
      color: products[0].isNewProduct ? 'green' : 'blue',
      action_url: null
    });

  } catch (notifError) {
    console.error('❌ Failed to create system notification:', notifError);
  }
};












































exports.createMultiple = async (req, res) => {
  try {
    const { products, customer_id } = req.body;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        error: true,
        message: "Products array is required and must not be empty."
      });
    }

    if (!customer_id) {
      return res.status(400).json({
        error: true,
        message: "customer_id is required."
      });
    }

    const successResults = [];
    const errorResults = [];

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      try {
        const result = await exports.createSingleProduct({
          ...product,
          customer_id
        }, req);

        successResults.push(result);
      } catch (error) {
        console.error(`❌ Error creating product ${i + 1}:`, error);
        errorResults.push({
          index: i,
          productName: product.name,
          error: error.message
        });
      }
    }

    if (successResults.length > 0) {
      await exports.sendBatchTelegramNotification(successResults);
    }

    return res.json({
      error: false,
      message: `Successfully created/updated ${successResults.length} product(s)${errorResults.length > 0 ? ` with ${errorResults.length} error(s)` : ''}.`,
      data: {
        success: successResults,
        errors: errorResults
      }
    });

  } catch (error) {
    console.error("❌ Error in createMultiple:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred while creating products.",
      details: error.message
    });
  }
};





exports.createOpeningStock = async (req, res) => {
  try {
    const {
      branch_name,
      date,
      reference,
      products // Array of { product_name, category_id, tank_id, quantity, unit, cost_per_unit }
    } = req.body;

    const currentUserId = req.current_id;
    const createdBy = req.auth?.name || 'system';

    // ✅ VALIDATION
    if (!branch_name || !date || !products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({
        error: true,
        message: "Branch, date, and products are required",
        message_kh: "ត្រូវការសាខា ថ្ងៃ និងផលិតផល"
      });
    }

    // ✅ CHECK PERMISSION
    const [userInfo] = await db.query(`
      SELECT u.id, u.name, u.role_id, r.code as role_code
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
      WHERE u.id = :user_id
    `, { user_id: currentUserId });

    if (!userInfo || userInfo.length === 0) {
      return res.status(401).json({
        error: true,
        message: "User not found"
      });
    }

    const userRole = userInfo[0].role_code;

    if (userRole !== 'SUPER_ADMIN' && userRole !== 'admin') {
      return res.status(403).json({
        error: true,
        message: "Only Owner can create opening stock",
        message_kh: "មានតែម្ចាស់ទេដែលអាចបង្កើត Opening Stock"
      });
    }

    // ... (rest of the code remains the same)
    const existingChecks = await Promise.all(
      products.map(async (product) => {
        const [existing] = await db.query(`
          SELECT id, name, category_id
          FROM product
          WHERE branch_name = :branch_name
          AND category_id = :category_id
          AND stock_type = 'OPENING'
          AND is_locked = 1
          LIMIT 1
        `, {
          branch_name,
          category_id: product.category_id
        });

        return {
          category_id: product.category_id,
          exists: existing.length > 0,
          existing_product: existing[0]
        };
      })
    );

    const duplicates = existingChecks.filter(check => check.exists);

    if (duplicates.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Opening stock already exists for some products",
        message_kh: "Opening Stock មានរួចហើយសម្រាប់ផលិតផលខ្លះ",
        duplicates: duplicates.map(d => d.existing_product)
      });
    }

    // ✅ CREATE OPENING STOCK
    const successResults = [];

    for (let product of products) {
      const [barcodeResult] = await db.query(`
        SELECT CONCAT('P',LPAD((SELECT COALESCE(MAX(id),0) + 1 FROM product), 3, '0')) as barcode
      `);
      const generatedBarcode = barcodeResult[0]?.barcode || `P${Date.now()}`;

      const [categoryInfo] = await db.query(
        "SELECT name, actual_price FROM category WHERE id = :category_id",
        { category_id: product.category_id }
      );

      const categoryName = categoryInfo[0]?.name || 'Unknown';
      const actualPrice = categoryInfo[0]?.actual_price || 1190;

      const [insertResult] = await db.query(`
        INSERT INTO product (
          user_id, name, category_id, barcode, qty, unit, 
          unit_price, cost_per_unit, actual_price, stock_type, 
          is_locked, reference, approval_status, status, 
          create_by, create_at, branch_name, customer_id, description
        )
        VALUES (
          :user_id, :name, :category_id, :barcode, :qty, :unit,
          :unit_price, :cost_per_unit, :actual_price, 'OPENING',
          0, :reference, 'draft', 1,
          :create_by, :create_at, :branch_name, NULL, :description
        )
      `, {
        user_id: currentUserId,
        name: product.product_name || 'oil',
        category_id: product.category_id,
        barcode: generatedBarcode,
        qty: product.quantity,
        unit: product.unit || 'L',
        unit_price: product.cost_per_unit || 0,
        cost_per_unit: product.cost_per_unit || 0,
        actual_price: actualPrice,
        reference: reference || 'Opening Balance',
        create_by: createdBy,
        create_at: date,
        branch_name: branch_name,
        description: product.tank_id || ''
      });

      successResults.push({
        product_id: insertResult.insertId,
        barcode: generatedBarcode,
        category: categoryName,
        quantity: product.quantity,
        unit: product.unit || 'L',
        cost_per_unit: product.cost_per_unit || 0
      });
    }

    return res.json({
      error: false,
      message: `Opening stock created! ${successResults.length} items`,
      message_kh: `បង្កើត Opening Stock បានជោគជ័យ! ${successResults.length} ផលិតផល`,
      data: { success: successResults }
    });

  } catch (error) {
    console.error("❌ Error createOpeningStock:", error);
    return res.status(500).json({ error: true, message: "Failed to create opening stock" });
  }
};

/**
 * ✅ Lock Opening Stock
 */
exports.lockOpeningStock = async (req, res) => {
  try {
    const { product_ids } = req.body;
    const currentUserId = req.current_id;

    if (!product_ids || !Array.isArray(product_ids) || product_ids.length === 0) {
      return res.status(400).json({ error: true, message: "Product IDs required" });
    }

    const [userInfo] = await db.query(`
      SELECT r.code as role_code FROM user u
      INNER JOIN role r ON u.role_id = r.id
      WHERE u.id = :user_id
    `, { user_id: currentUserId });

    const userRole = userInfo[0]?.role_code;

    if (userRole !== 'admin' && userRole !== 'admin') {
      return res.status(403).json({
        error: true,
        message: "Only Owner can lock opening stock"
      });
    }

    const placeholders = product_ids.map(() => '?').join(',');

    await db.query(`
      UPDATE product
      SET is_locked = 1, approval_status = 'approved',
          approved_by = ?, approved_at = NOW()
      WHERE id IN (${placeholders})
      AND stock_type = 'OPENING' AND is_locked = 0
    `, [currentUserId, ...product_ids]);

    return res.json({
      error: false,
      message: "Opening stock locked successfully!",
      message_kh: "ចាក់សោ Opening Stock បានជោគជ័យ!"
    });

  } catch (error) {
    console.error("❌ Error lockOpeningStock:", error);
    return res.status(500).json({ error: true, message: "Failed to lock" });
  }
};

/**
 * ✅ Get Products by User ID (for ProductPage "My Items" view)
 */
exports.getListByUser = async (req, res) => {
  try {
    const { id: user_id } = req.params;
    const { txt_search, category_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: true, message: "User ID required" });
    }

    let sqlWhere = `WHERE p.user_id = :user_id`;
    const params = { user_id };

    if (txt_search) {
      sqlWhere += ` AND (p.name LIKE :search OR p.barcode LIKE :search)`;
      params.search = `%${txt_search}%`;
    }

    if (category_id) {
      sqlWhere += ` AND p.category_id = :category_id`;
      params.category_id = category_id;
    }

    const sql = `
      SELECT 
        p.id, p.name, p.category_id, p.barcode, p.company_name,
        p.description, p.unit, p.status, p.create_by, p.create_at, p.customer_id,
        p.actual_price, -- ✅ Added actual_price field
        c.name AS category_name,
        c.barcode AS category_barcode,
        cu.name AS customer_name,
        cu.address AS customer_address,
        cu.tel AS customer_tel,
        u.name AS created_by_name,
        u.username AS created_by_username,
        p.user_id
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
      LEFT JOIN customer cu ON p.customer_id = cu.id
      LEFT JOIN user u ON p.user_id = u.id
      ${sqlWhere}
      ORDER BY p.create_at DESC
    `;

    const [list] = await db.query(sql, params);

    res.json({
      list,
      total: list.length,
      success: true,
      message: "Products retrieved successfully"
    });

  } catch (error) {
    logError("product.getListByUser", error, res);
  }
};