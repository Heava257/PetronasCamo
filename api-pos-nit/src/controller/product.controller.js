const {
  db,
  isArray,
  isEmpty,
  logError,
  removeFile,
  sendTelegramMessagenewstock,
} = require("../util/helper");

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
        p.description, p.qty, p.unit_price, p.discount, p.actual_price, p.status,
        p.create_by, p.create_at, p.unit, p.customer_id, p.receive_date,
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
        END AS total_price
    `;

    const sqlJoin = `
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
      LEFT JOIN customer cu ON p.customer_id = cu.id
    `;

    let sqlWhere = `WHERE p.user_id = :user_id AND p.qty > 0`;

    // ✅ Date filter
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

    // Get list with pagination
    const sqlList = is_list_all === "1"
      ? `${sqlSelect} ${sqlJoin} ${sqlWhere} ${sqlOrderBy}`
      : `${sqlSelect} ${sqlJoin} ${sqlWhere} ${sqlOrderBy} LIMIT ${pageSize} OFFSET ${offset}`;

    const [list] = await db.query(sqlList, sqlParam);

    // Get total count
    let total = 0;
    if (currentPage === 1) {
      const sqlTotal = `SELECT COUNT(p.id) AS total ${sqlJoin} ${sqlWhere}`;
      const [count] = await db.query(sqlTotal, sqlParam);
      total = count[0]?.total || 0;
    }

    // ✅ Calculate grand total (sum of all total_price)
    const sqlGrandTotal = `
      SELECT 
        SUM(
          CASE
            WHEN p.discount > 0 THEN ((p.qty * p.unit_price) * (1 - p.discount / 100)) / c.actual_price
            ELSE (p.qty * p.unit_price) / c.actual_price
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
      grand_total: Number(grandTotal).toFixed(2), // ✅ Return formatted grand total
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

    if (!customer_id) {
      return res.status(400).json({
        error: true,
        message: "Customer ID is required"
      });
    }

    // First, verify customer exists and user has access (with group filtering)
    const sqlCustomerCheck = `
      SELECT c.id, c.name, c.tel, c.address, c.email, c.create_at, c.user_id
      FROM customer c
      INNER JOIN user u ON c.user_id = u.id
      INNER JOIN user cu ON cu.group_id = u.group_id
      WHERE c.id = ? AND cu.id = ?
      ${user_id ? 'AND c.user_id = ?' : ''}
      LIMIT 1
    `;

    const customerCheckParams = user_id ? [customer_id, req.current_id, user_id] : [customer_id, req.current_id];
    const [customerInfo] = await db.query(sqlCustomerCheck, customerCheckParams);

    if (!customerInfo || customerInfo.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Customer not found or access denied"
      });
    }

    // Fixed SQL for customer products grouped by category (with group filtering)
    const sqlCustomerProducts = `
      SELECT 
        p.customer_id,
        c.id as category_id,
        c.name as category_name,
        c.barcode as category_barcode,
        SUM(CAST(p.qty AS DECIMAL(10,2))) as total_quantity,
        COUNT(p.id) as product_count,
        SUM(
          CASE
            WHEN p.discount > 0 AND p.discount IS NOT NULL 
            THEN CAST(p.qty AS DECIMAL(10,2)) * CAST(p.unit_price AS DECIMAL(10,2)) * (1 - CAST(p.discount AS DECIMAL(5,2)) / 100)
            ELSE CAST(p.qty AS DECIMAL(10,2)) * CAST(p.unit_price AS DECIMAL(10,2))
          END
        ) AS total_value,
        AVG(CAST(p.unit_price AS DECIMAL(10,2))) as avg_unit_price,
        GROUP_CONCAT(DISTINCT COALESCE(p.company_name, 'Unknown') SEPARATOR ', ') as companies,
        MIN(p.create_at) as first_purchase,
        MAX(p.create_at) as last_purchase
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
      INNER JOIN user u ON p.user_id = u.id
      INNER JOIN user cu ON cu.group_id = u.group_id
      WHERE p.customer_id = ? AND cu.id = ?
      ${user_id ? 'AND p.user_id = ?' : ''}
      AND p.status != 'deleted'
      GROUP BY p.customer_id, c.id, c.name, c.barcode
      HAVING total_quantity > 0
      ORDER BY total_value DESC, total_quantity DESC
    `;

    // Fixed SQL for detailed products (with group filtering)
    const sqlDetailedProducts = `
      SELECT 
        p.id, 
        p.name, 
        p.category_id, 
        p.barcode, 
        COALESCE(p.company_name, 'Unknown') as company_name,
        p.description, 
        CAST(p.qty AS DECIMAL(10,2)) as qty, 
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
        (CAST(p.qty AS DECIMAL(10,2)) * CAST(p.unit_price AS DECIMAL(10,2))) AS original_price,
        CASE
          WHEN p.discount > 0 AND p.discount IS NOT NULL 
          THEN CAST(p.qty AS DECIMAL(10,2)) * CAST(p.unit_price AS DECIMAL(10,2)) * (1 - CAST(p.discount AS DECIMAL(5,2)) / 100)
          ELSE CAST(p.qty AS DECIMAL(10,2)) * CAST(p.unit_price AS DECIMAL(10,2))
        END AS total_price
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
      INNER JOIN user u ON p.user_id = u.id
      INNER JOIN user cu ON cu.group_id = u.group_id
      WHERE p.customer_id = ? AND cu.id = ?
      ${user_id ? 'AND p.user_id = ?' : ''}
      AND p.status != 'deleted'
      ORDER BY p.create_at DESC
    `;

    const sqlParams = user_id ? [customer_id, req.current_id, user_id] : [customer_id, req.current_id];

    // Execute queries
    const [categoryProducts] = await db.query(sqlCustomerProducts, sqlParams);
    const [detailedProducts] = await db.query(sqlDetailedProducts, sqlParams);

    // Calculate summary with proper null handling
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

    // Format the response data
    const formattedCategories = categoryProducts.map(category => ({
      ...category,
      total_quantity: parseFloat(category.total_quantity) || 0,
      total_value: parseFloat(category.total_value) || 0,
      avg_unit_price: parseFloat(category.avg_unit_price) || 0,
      product_count: parseInt(category.product_count) || 0
    }));

    const formattedProducts = detailedProducts
      .filter(product => parseFloat(product.qty) > 0) // ✅ Filter Here
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
        customer: customerInfo[0],
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
    console.error("Error while updating product:", error);
    logError("product.getCustomerProducts", error, res);

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

    // Process each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      try {
        const result = await createSingleProduct({
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

    // 🔔 Send SINGLE Telegram notification with ALL products
    if (successResults.length > 0) {
      await sendBatchTelegramNotification(successResults);
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


exports.create = async (req, res) => {
  try {
    const {
      user_id, name, category_id, company_name, description, qty,
      actual_price, unit, unit_price, discount, status, create_at, receive_date,
      customer_id, order_date  // ✅ បន្ថែម order_date
    } = req.body;

    if (!user_id || !name || !category_id || !qty || !unit_price || !customer_id) {
      return res.status(400).json({
        error: true,
        message: "Missing required fields (user_id, name, category_id, qty, unit_price, customer_id).",
      });
    }

    const [categoryRow] = await db.query(
      "SELECT barcode, name FROM category WHERE id = :category_id",
      { category_id }
    );

    if (!categoryRow || categoryRow.length === 0) {
      return res.status(400).json({
        error: true,
        message: "Invalid category_id, category not found.",
      });
    }

    const resolvedActualPrice = actual_price || 1190;
    const resolvedCustomerId = customer_id;

    const checkSql = `
      SELECT * FROM product 
      WHERE customer_id = :customer_id AND category_id = :category_id AND name = :name AND user_id = :user_id
      LIMIT 1
    `;
    const [existingProducts] = await db.query(checkSql, {
      customer_id: resolvedCustomerId,
      category_id,
      name,
      user_id
    });

    let productId;
    let isNewProduct = false;
    let previousQty = 0;

    if (existingProducts.length > 0) {
      // ✅ Update existing product qty (sum it)
      const existingProduct = existingProducts[0];
      previousQty = parseInt(existingProduct.qty);
      const newQty = previousQty + parseInt(qty);

      const updateSql = `
        UPDATE product 
        SET qty = :new_qty, unit_price = :unit_price, discount = :discount, 
            actual_price = :actual_price, description = :description, order_date = :order_date
        WHERE id = :id
      `;

      await db.query(updateSql, {
        new_qty: newQty,
        unit_price,
        discount,
        actual_price: resolvedActualPrice,
        description: description || '',
        order_date: order_date || new Date(),  // ✅ Auto current date if not provided
        id: existingProduct.id
      });

      productId = existingProduct.id;
    } else {
      // ✅ Generate barcode before insertion
      const barcodeQuery = `
        SELECT CONCAT('P',LPAD((SELECT COALESCE(MAX(id),0) + 1 FROM product), 3, '0')) as barcode
      `;
      const [barcodeResult] = await db.query(barcodeQuery);
      const generatedBarcode = barcodeResult[0]?.barcode || `P${Date.now()}`;

      // ✅ Insert new product WITH barcode and order_date
      const insertSql = `
        INSERT INTO product 
        (user_id, name, category_id, barcode, company_name, description, qty, actual_price, 
         unit, unit_price, discount, status, create_by, create_at, receive_date, customer_id, order_date)
        VALUES
        (:user_id, :name, :category_id, :barcode, :company_name, :description, :qty, :actual_price, 
         :unit, :unit_price, :discount, :status, :create_by, :create_at, :receive_date, :customer_id, :order_date)
      `;

      const insertParams = {
        user_id,
        name,
        category_id,
        barcode: generatedBarcode,
        company_name,
        description,
        qty,
        actual_price: resolvedActualPrice,
        unit,
        unit_price,
        discount,
        status,
        create_by: req.auth?.name || 'system',
        create_at,
        receive_date,
        customer_id: resolvedCustomerId,
        order_date: order_date || new Date()  // ✅ Auto current date if not provided
      };

      const [result] = await db.query(insertSql, insertParams);
      productId = result.insertId;
      isNewProduct = true;
    }

    if (productId) {
      const totalPrice = ((qty * unit_price) * (1 - (discount || 0) / 100)) / resolvedActualPrice;

      const detailSql = `
        INSERT INTO product_details (
          product_id, user_id, customer_id, name, description, category, company_name,
          qty, unit, unit_price, total_price, status, created_at, created_by, receive_date
        )
        VALUES (
          :product_id, :user_id, :customer_id, :name, :description, :category, :company_name,
          :qty, :unit, :unit_price, :total_price, :status, :created_at, :created_by, :receive_date
        )
      `;

      await db.query(detailSql, {
        product_id: productId,
        user_id,
        customer_id: resolvedCustomerId,
        name,
        description: description || '',
        category: category_id,
        company_name: company_name || '',
        qty,
        unit: unit || '',
        unit_price,
        total_price: totalPrice,
        status: status || 1,
        created_at: create_at || null,
        created_by: req.auth?.name || 'system',
        receive_date: receive_date || null
      });

      // Get complete product data WITH customer info for response and Telegram notification
      const [productData] = await db.query(`
        SELECT 
          p.id, p.name, p.category_id, p.barcode, p.user_id, p.company_name, 
          p.description, p.qty, p.unit_price, p.discount, p.actual_price, p.status, 
          p.create_by, p.create_at, p.unit, p.customer_id, p.order_date,
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

      const product = productData[0];

      // 🔔 Send Telegram Notification
      if (product) {
        const currentDate = new Date().toLocaleString('en-US', {
          timeZone: 'Asia/Phnom_Penh',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        const orderDateFormatted = product.order_date ? new Date(product.order_date).toLocaleString('en-US', {
          timeZone: 'Asia/Phnom_Penh',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }) : 'N/A';

        let telegramMessage = '';

        if (isNewProduct) {
          telegramMessage = `
🆕 <b>NEW PRODUCT ADDED</b> 📦

👤 <b>Customer Information:</b>
• <b>Name:</b> ${product.customer_name || 'N/A'}
• <b>Address:</b> ${product.customer_address || 'N/A'}
• <b>Phone:</b> ${product.customer_phone || 'N/A'}

📋 <b>Product Details:</b>
• <b>Product Name:</b> ${product.name}
• <b>Category:</b> ${product.category_name}
• <b>Company:</b> ${product.company_name || 'N/A'}
• <b>Card Number:</b> ${product.description || 'N/A'}
• <b>Barcode:</b> ${product.barcode}

📊 <b>Stock Information:</b>
• <b>Quantity:</b> ${Number(product.qty).toLocaleString('en-US', { maximumFractionDigits: 3 })}${product.unit || ''}
• <b>Unit Price:</b> $${parseFloat(product.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
• <b>Total Value:</b> $${parseFloat(product.total_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
${product.discount ? `• <b>Discount:</b> ${product.discount}%` : ''}

📅 <b>Order Date:</b> ${orderDateFormatted}
👤 <b>Created by:</b> ${product.create_by}
🕐 <b>Date:</b> ${currentDate}
          `.trim();
        } else {
          telegramMessage = `
🔄 <b>STOCK UPDATED</b> 📈

👤 <b>Customer Information:</b>
• <b>Name:</b> ${product.customer_name || 'N/A'}
• <b>Address:</b> ${product.customer_address || 'N/A'}
• <b>Phone:</b> ${product.customer_phone || 'N/A'}
• <b>Card Number:</b> ${product.description || 'N/A'}

📋 <b>Product Details:</b>
• <b>Category:</b> ${product.category_name}
• <b>Company:</b> ${product.company_name || 'N/A'}

📊 <b>Stock Changes:</b>
• <b>Previous Qty:</b> ${previousQty.toLocaleString()}${product.unit || ''}
• <b>Added Qty:</b> +${Number(qty).toLocaleString()}${product.unit || ''}
• <b>New Total:</b> ${Number(product.qty).toLocaleString()}${product.unit || ''}
• <b>Unit Price:</b> $${parseFloat(product.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
• <b>Total Value:</b> $${parseFloat(product.total_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
${product.discount ? `• <b>Discount:</b> ${product.discount}%` : ''}

📅 <b>Order Date:</b> ${orderDateFormatted}
👤 <b>Updated by:</b> ${product.create_by}
🕐 <b>Date:</b> ${currentDate}
          `.trim();
        }

        sendTelegramMessagenewstock(telegramMessage).catch(err => {
          console.error("Failed to send Telegram notification:", err);
        });
      }

      return res.json({
        error: false,
        message: isNewProduct ? "Product created successfully." : "Product quantity updated successfully.",
        data: product
      });
    }

    return res.status(500).json({
      error: true,
      message: "Failed to retrieve product data after creation."
    });

  } catch (error) {
    console.error("❌ Error while creating product:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while creating the product.",
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
      return true; // ស្ទួន
    }
    return false; // អត់ស្ទួនទេ
  } catch (error) {
    logError("remove.create", error, res);
  }
};


// Add this to your payment controller
exports.getTotalPayments = async (req, res) => {
  try {
    const { from_date, to_date, order_date, receive_date } = req.query;

    let sqlWhere = `WHERE cu_user.id = ?`;
    const params = [req.current_id];

    // ✅ កែនៅក្នុង getProductDetail controller
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
        pd.created_at AS product_create_at,
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

    // ✅ Date filtering logic - ប្រើ updated_at សម្រាប់ from/to date
    if (order_date) {
      sqlWhere += ` AND DATE(pd.created_at) = DATE(?)`;
      params.push(order_date);
    } else if (receive_date) {
      sqlWhere += ` AND DATE(pd.receive_date) = DATE(?)`;
      params.push(receive_date);
    } else if (from_date && to_date) {
      sqlWhere += ` AND DATE(pd.updated_at) >= DATE(?) AND DATE(pd.updated_at) <= DATE(?)`;
      params.push(from_date, to_date);
    } else if (from_date) {
      sqlWhere += ` AND DATE(pd.updated_at) >= DATE(?)`;
      params.push(from_date);
    } else if (to_date) {
      sqlWhere += ` AND DATE(pd.updated_at) <= DATE(?)`;
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

    // ✅ Payment query - ប្រើ updated_at matching
    let paymentWhere = `WHERE cu_user.id = ?`;
    const paymentParams = [req.current_id];

    if (order_date) {
      paymentWhere += ` AND DATE(pay.payment_date) = DATE(?)`;
      paymentParams.push(order_date);
    } else if (receive_date) {
      paymentWhere += ` AND DATE(pay.payment_date) = DATE(?)`;
      paymentParams.push(receive_date);
    } else if (from_date && to_date) {
      // ✅ ប្រើ datetime range
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

    // Build final query with ordering
    let sql = `${sqlSelect} ${sqlFrom} ${sqlWhere} ORDER BY CAST(pd.description AS UNSIGNED) ASC`;

    // Apply pagination if not showing all
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
    console.error("Error while getting product details:", error);
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
      WHERE u.group_id = (SELECT group_id FROM user WHERE id = :current_user_id)
        AND p.qty > 0
      ORDER BY p.customer_id, p.id DESC
    `;

    var [data] = await db.query(sql, {
      current_user_id: req.current_id // មកពី token validation
    });

    res.json({
      list: data,
      message: "Success!",
    });
  } catch (error) {
    logError("product.getListByCurrentUserGroup", error, res);
  }
};



exports.createSingleProduct = async (productData, req) => {
  const {
    user_id, name, category_id, company_name, description, qty,
    actual_price, unit, unit_price, discount, status, create_at,
    receive_date, customer_id
  } = productData;

  // Validate category
  const [categoryRow] = await db.query(
    "SELECT barcode, name FROM category WHERE id = :category_id",
    { category_id }
  );

  if (!categoryRow || categoryRow.length === 0) {
    throw new Error(`Invalid category_id: ${category_id}`);
  }

  const resolvedActualPrice = actual_price || 1190;

  // Check if product exists
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

  if (existingProducts.length > 0) {
    // Update existing product
    const existingProduct = existingProducts[0];
    previousQty = parseInt(existingProduct.qty) || 0;
    const newQty = previousQty + parseInt(qty);

    await db.query(`
      UPDATE product 
      SET qty = :new_qty, unit_price = :unit_price, discount = :discount, 
          actual_price = :actual_price, description = :description
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
    // Create new product
    const [barcodeResult] = await db.query(`
      SELECT CONCAT('P',LPAD((SELECT COALESCE(MAX(id),0) + 1 FROM product), 3, '0')) as barcode
    `);
    const generatedBarcode = barcodeResult[0]?.barcode || `P${Date.now()}`;

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
      create_at: create_at || null,
      receive_date: receive_date || null,
      customer_id
    });

    productId = result.insertId;
    isNewProduct = true;
  }

  // Insert product detail (history)
  const totalPrice = ((qty * unit_price) * (1 - (discount || 0) / 100)) / resolvedActualPrice;

  await db.query(`
    INSERT INTO product_details (
      product_id, user_id, customer_id, name, description, category, company_name,
      qty, unit, unit_price, total_price, status, created_at, created_by, receive_date
    )
    VALUES (
      :product_id, :user_id, :customer_id, :name, :description, :category, :company_name,
      :qty, :unit, :unit_price, :total_price, :status, :created_at, :created_by, :receive_date
    )
  `, {
    product_id: productId,
    user_id,
    customer_id,
    name,
    description: description || '',
    category: category_id,
    company_name: company_name || '',
    qty,
    unit: unit || '',
    unit_price,
    total_price: totalPrice,
    status: status || 1,
    created_at: create_at || null,
    created_by: req.auth?.name || 'system',
    receive_date: receive_date || null
  });

  // Get complete product data with customer info
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
    addedQty: qty
  };
};


exports.sendBatchTelegramNotification = async (products) => {
  if (!products || products.length === 0) return;

  const firstProduct = products[0];
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

  // Parse and reformat to DD/MM/YYYY HH:MM:SS
  const parts = currentDate.split(', ');
  const datePart = parts[0].split('/'); // [MM, DD, YYYY]
  const timePart = parts[1];
  const formattedDate = `${datePart[1]}/${datePart[0]}/${datePart[2]} ${timePart}`;

  let message = `📦 <b>STOCK ${products.length > 1 ? 'UPDATES' : 'UPDATE'}</b> 📝\n\n`;
  message += `👤 <b>Customer Information:</b>\n`;
  message += `• <b>Name:</b> ${firstProduct.customer_name || 'N/A'}\n`;
  message += `• <b>Address:</b> ${firstProduct.customer_address || 'N/A'}\n`;
  message += `• <b>Phone:</b> ${firstProduct.customer_phone || 'N/A'}\n`;
  const cardNumbers = products
    .map(p => p.description)
    .filter(d => d && d !== 'N/A' && d.trim() !== '');

  if (cardNumbers.length > 0) {
    message += `• <b>Card Number:</b> ${cardNumbers[0]}\n`;
  }
  message += `━━━━━━━━━━━━━━━━━`;
  let grandTotal = 0;
  products.forEach((product, index) => {
    const productValue = parseFloat(product.total_price) || 0;
    grandTotal += productValue;
    if (product.isNewProduct) {
      message += `\n🆕 <b>${index + 1}. NEW PRODUCT</b>\n`;
      message += `• <b>Category:</b> ${product.category_name}\n`;
      message += `• <b>Company:</b> ${product.company_name || 'N/A'}\n`;
      message += `• <b>Quantity:</b> ${Number(product.qty).toLocaleString('en-US', { maximumFractionDigits: 2 })}${product.unit || ''}\n`;
      message += `• <b>Unit Price:</b> $${parseFloat(product.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      message += `• <b>Total Value:</b> $${productValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      if (product.discount > 0) {
        message += `• <b>Discount:</b> ${product.discount}%\n`;
      }
    } else {
      message += `\n🔄 <b>${index + 1}. STOCK UPDATED</b>\n`;
      message += `• <b>Category:</b> ${product.category_name}\n`;
      message += `• <b>Company:</b> ${product.company_name || 'N/A'}\n`;
      message += `• <b>New Total:</b> ${Number(product.qty).toLocaleString('en-US', { maximumFractionDigits: 2 })}${product.unit || ''}\n`;
      message += `• <b>Unit Price:</b> $${parseFloat(product.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      message += `• <b>Total Value:</b> $${productValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
      if (product.discount > 0) {
        message += `• <b>Discount:</b> ${product.discount}%\n`;
      }
    }
  });

  message += `\n━━━━━━━━━━━━━━━━━\n`;
  message += `💰 <b>GRAND TOTAL:</b> $${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
  message += `👤 <b>${products[0].isNewProduct ? 'Created' : 'Updated'} by:</b> ${firstProduct.create_by}\n`;
  message += `🕐 <b>Date:</b> ${formattedDate}`;

  try {
    await sendTelegramMessagenewstock(message);
  } catch (error) {
    console.error('❌ Failed to send batch Telegram notification:', error);
  }
};
exports.getList = async (req, res) => {
  try {
    const { txt_search, category_id, page, is_list_all } = req.query;
    const { user_id } = req.params;

    const pageSize = 10;
    const currentPage = Number(page) || 1;
    const offset = (currentPage - 1) * pageSize;

    const sqlSelect = `
      SELECT 
        p.id, p.name, p.category_id, p.barcode, p.company_name,
        p.description, p.qty, p.unit_price, p.discount, p.actual_price, p.status,
        p.create_by, p.create_at, p.unit, p.customer_id,
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
        END AS total_price
    `;

    const sqlJoin = `
      FROM product p
      LEFT JOIN category c ON p.category_id = c.id
      LEFT JOIN customer cu ON p.customer_id = cu.id
    `;

    let sqlWhere = `WHERE p.user_id = :user_id AND p.qty > 0`;

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
    };

    // ✅ FIXED: Changed sqlList to sqlSelect + sqlJoin + sqlWhere + sqlOrderBy
    const sqlList = is_list_all === 'true'
      ? `${sqlSelect} ${sqlJoin} ${sqlWhere} ${sqlOrderBy}`
      : `${sqlSelect} ${sqlJoin} ${sqlWhere} ${sqlOrderBy} LIMIT ${pageSize} OFFSET ${offset}`;

    const [list] = await db.query(sqlList, sqlParam);

    let total = 0;
    if (currentPage === 1) {
      const sqlTotal = `SELECT COUNT(p.id) AS total ${sqlJoin} ${sqlWhere}`;
      const [count] = await db.query(sqlTotal, sqlParam);
      total = count[0]?.total || 0;
    }

    return res.json({
      list,
      total,
    });
  } catch (error) {
    console.error("❌ Error in product.getList:", error);
    return res.status(500).json({ error: "Internal server error" });
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

    // Process each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      try {
        // ✅ FIXED: Use exports.createSingleProduct
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

    // ✅ Send SINGLE Telegram notification with ALL products
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

// ... rest of the exports remain the same ...