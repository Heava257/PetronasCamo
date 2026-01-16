// ✅ FIXED inventory.controller.js - With proper actual_price conversion

const { logError, db } = require("../util/helper");
exports.getLatestSellingPrice = async (req, res) => {
    try {
        const { product_id, customer_id } = req.query;

        if (!product_id) {
            return res.status(400).json({
                success: false,
                message: "product_id is required"
            });
        }

        // ✅ Query latest SALE_OUT transaction for this product + customer
        const query = `
      SELECT selling_price, actual_price, created_at
      FROM inventory_transaction
      WHERE product_id = ?
        AND transaction_type = 'SALE_OUT'
        ${customer_id ? 'AND reference_no LIKE ?' : ''}
      ORDER BY created_at DESC
      LIMIT 1
    `;

        const params = [product_id];
        if (customer_id) {
            params.push(`%${customer_id}%`);
        }

        const [result] = await db.query(query, params);

        if (result.length > 0) {
            return res.json({
                success: true,
                selling_price: result[0].selling_price,
                actual_price: result[0].actual_price,
                last_transaction_date: result[0].created_at
            });
        }

        // ✅ Fallback: Get from product's default price
        const [product] = await db.query(
            "SELECT unit_price FROM product WHERE id = ?",
            [product_id]
        );

        if (product.length > 0) {
            return res.json({
                success: true,
                selling_price: product[0].unit_price,
                actual_price: 1000,
                is_default: true
            });
        }

        // ✅ No data found
        return res.json({
            success: false,
            selling_price: null,
            message: "No price data found"
        });

    } catch (error) {
        console.error("Error getting latest selling price:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get selling price",
            error: error.message
        });
    }
};

// ========================================
// ALTERNATIVE: Get selling price by customer history
// ========================================

exports.getCustomerProductPrice = async (req, res) => {
    try {
        const { product_id, customer_id } = req.query;

        if (!product_id || !customer_id) {
            return res.status(400).json({
                success: false,
                message: "product_id and customer_id are required"
            });
        }

        // ✅ Get latest price THIS CUSTOMER paid for THIS PRODUCT
        const query = `
      SELECT 
        it.selling_price,
        it.actual_price,
        it.created_at,
        o.customer_id,
        o.customer_name
      FROM inventory_transaction it
      INNER JOIN \`order\` o ON it.reference_no = o.order_no
      WHERE it.product_id = ?
        AND o.customer_id = ?
        AND it.transaction_type = 'SALE_OUT'
      ORDER BY it.created_at DESC
      LIMIT 1
    `;

        const [result] = await db.query(query, [product_id, customer_id]);

        if (result.length > 0) {
            return res.json({
                success: true,
                selling_price: result[0].selling_price,
                actual_price: result[0].actual_price,
                last_transaction_date: result[0].created_at,
                customer_name: result[0].customer_name
            });
        }

        // ✅ Fallback: Get general latest price
        return exports.getLatestSellingPrice(req, res);

    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to get price",
            error: error.message
        });
    }
};

exports.getTransactionList = async (req, res) => {
    try {
        const {
            page = 1,
            pageSize = 10,
            txtSearch,
            status,
            from_date,
            to_date
        } = req.query;

        const offset = (page - 1) * pageSize;
        const limit = parseInt(pageSize);

        let whereClause = "WHERE 1=1";
        const params = [];

        if (req.auth && req.auth.role !== "admin") {
            whereClause += ` AND u.branch_name = ?`;
            params.push(req.auth.branch_name);
        }

        if (txtSearch) {
            whereClause += ` AND (p.name LIKE ? OR it.reference_no LIKE ?)`;
            params.push(`%${txtSearch}%`, `%${txtSearch}%`);
        }

        if (status) {
            whereClause += ` AND it.transaction_type = ?`;
            params.push(status);
        }

        if (from_date) {
            whereClause += ` AND DATE(it.created_at) >= ?`;
            params.push(from_date);
        }
        if (to_date) {
            whereClause += ` AND DATE(it.created_at) <= ?`;
            params.push(to_date);
        }

        // Count total records
        const countSql = `
            SELECT COUNT(*) as total 
            FROM inventory_transaction it
            LEFT JOIN product p ON it.product_id = p.id
            LEFT JOIN user u ON it.user_id = u.id
            ${whereClause}
        `;
        const [countResult] = await db.query(countSql, params);
        const total = countResult[0].total;

        // ✅ Get data with robust actual_price fallback
        const sql = `
            SELECT 
                it.*,
                p.name as product_name,
                p.barcode as product_code,
                c.name as category_name,
                u.name as created_by_name,
                -- ✅ Robust actual_price logic: Priority (it.actual_price > p.actual_price > c.actual_price > fallback 1190)
                COALESCE(NULLIF(it.actual_price, 1), p.actual_price, c.actual_price, 1190) as actual_price,
                -- ✅ Calculate converted amount using the effective actual_price
                ROUND(
                    (it.quantity * it.unit_price) / 
                    NULLIF(COALESCE(NULLIF(it.actual_price, 1), p.actual_price, c.actual_price, 1190), 0), 
                    2
                ) as converted_amount
            FROM inventory_transaction it
            LEFT JOIN product p ON it.product_id = p.id
            LEFT JOIN category c ON p.category_id = c.id
            LEFT JOIN user u ON it.user_id = u.id
            ${whereClause}
            ORDER BY it.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [list] = await db.query(sql, [...params, limit, offset]);

        // ✅ NEW: Calculate global statistics (respecting date/branch but IGNORING transaction_type filter)
        let statsWhereClause = "WHERE 1=1";
        const statsParams = [];

        if (req.auth && req.auth.role !== "admin") {
            statsWhereClause += ` AND u.branch_name = ?`;
            statsParams.push(req.auth.branch_name);
        }

        if (from_date) {
            statsWhereClause += ` AND DATE(it.created_at) >= ?`;
            statsParams.push(from_date);
        }
        if (to_date) {
            statsWhereClause += ` AND DATE(it.created_at) <= ?`;
            statsParams.push(to_date);
        }

        const statsSql = `
            SELECT 
                SUM(CASE WHEN it.transaction_type = 'PURCHASE_IN' 
                    THEN (it.quantity * it.unit_price) / NULLIF(COALESCE(NULLIF(it.actual_price, 1), p.actual_price, c.actual_price, 1190), 0) 
                    ELSE 0 END) as total_in,
                SUM(CASE WHEN it.transaction_type = 'SALE_OUT' 
                    THEN ABS((it.quantity * it.unit_price) / NULLIF(COALESCE(NULLIF(it.actual_price, 1), p.actual_price, c.actual_price, 1190), 0)) 
                    ELSE 0 END) as total_out,
                -- ✅ New Quantity Statistics
                SUM(CASE WHEN it.transaction_type IN ('PURCHASE_IN', 'RETURN') OR (it.transaction_type = 'ADJUSTMENT' AND it.quantity > 0)
                    THEN it.quantity ELSE 0 END) as total_qty_in,
                SUM(CASE WHEN it.transaction_type = 'SALE_OUT' OR (it.transaction_type = 'ADJUSTMENT' AND it.quantity < 0)
                    THEN ABS(it.quantity) ELSE 0 END) as total_qty_out
            FROM inventory_transaction it
            LEFT JOIN product p ON it.product_id = p.id
            LEFT JOIN category c ON p.category_id = c.id
            LEFT JOIN user u ON it.user_id = u.id
            ${statsWhereClause}
        `;
        const [statsResult] = await db.query(statsSql, statsParams);

        // ✅ Get Current Stock (respecting branch but ignoring date filters)
        let stockSql = `SELECT SUM(p.qty) as current_stock FROM product p INNER JOIN user u ON p.user_id = u.id WHERE 1=1`;
        const stockParams = [];
        if (req.auth && req.auth.role !== "admin") {
            stockSql += ` AND u.branch_name = ?`;
            stockParams.push(req.auth.branch_name);
        }
        const [stockResult] = await db.query(stockSql, stockParams);

        const statistics = {
            total_in: Number(statsResult[0].total_in || 0).toFixed(2),
            total_out: Number(statsResult[0].total_out || 0).toFixed(2),
            net_value: Number((statsResult[0].total_in || 0) - (statsResult[0].total_out || 0)).toFixed(2),
            total_qty_in: Number(statsResult[0].total_qty_in || 0).toFixed(2),
            total_qty_out: Number(statsResult[0].total_qty_out || 0).toFixed(2),
            current_stock: Number(stockResult[0].current_stock || 0).toFixed(2)
        };

        res.json({
            list,
            total,
            statistics,
            page: parseInt(page),
            pageSize: parseInt(pageSize),
            success: true,
            message: "Inventory transactions retrieved successfully"
        });

    } catch (error) {
        logError("inventory.getTransactionList", error, res);
    }
};

exports.getStatistics = async (req, res) => {
    try {
        let sql = `
            SELECT 
                COUNT(DISTINCT p.id) as total_products,
                COALESCE(SUM(p.qty), 0) as total_quantity,
                -- ✅ Use converted values
                COALESCE(SUM(p.total_cost_value), 0) as total_value,
                COUNT(CASE WHEN p.qty <= 1000 THEN 1 END) as low_stock_count,
                COUNT(CASE WHEN p.qty > 10000 THEN 1 END) as high_stock_count
            FROM product p
            LEFT JOIN user u ON p.user_id = u.id
            WHERE 1=1
        `;

        const params = [];

        if (req.auth && req.auth.role !== "admin") {
            sql += ` AND u.branch_name = ?`;
            params.push(req.auth.branch_name);
        }

        const [results] = await db.query(sql, params);

        res.json({
            data: results[0],
            success: true,
            message: "Inventory statistics retrieved successfully"
        });

    } catch (error) {
        logError("inventory.getStatistics", error, res);
    }
};

exports.getRecentTransactions = async (req, res) => {
    try {
        const { limit = 10 } = req.query;

        let sql = `
            SELECT 
                it.*,
                p.name as product_name,
                c.name as category_name,
                c.actual_price,
                u.name as user_name,
                -- ✅ Include converted amount
                ROUND((it.quantity * it.unit_price) / NULLIF(c.actual_price, 0), 2) as converted_amount
            FROM inventory_transaction it
            LEFT JOIN product p ON it.product_id = p.id
            LEFT JOIN category c ON p.category_id = c.id
            LEFT JOIN user u ON it.user_id = u.id
            WHERE 1=1
        `;

        const params = [];

        if (req.auth && req.auth.role !== "admin") {
            sql += ` AND u.branch_name = ?`;
            params.push(req.auth.branch_name);
        }

        sql += ` ORDER BY it.created_at DESC LIMIT ?`;
        params.push(parseInt(limit));

        const [results] = await db.query(sql, params);

        res.json({
            data: results,
            success: true,
            message: "Recent transactions retrieved successfully"
        });

    } catch (error) {
        logError("inventory.getRecentTransactions", error, res);
    }
};

exports.getPosProducts = async (req, res) => {
    try {
        const { txt_search, category_id, brand } = req.query;

        // ✅ NEW QUERY - Includes selling_price
        let sql = `
            SELECT 
                p.id, 
                p.name, 
                p.category_id, 
                p.barcode, 
                p.company_name,
                p.description, 
                
                -- ✅ Dynamic Qty from Inventory Transactions
                COALESCE((
                    SELECT SUM(quantity) 
                    FROM inventory_transaction 
                    WHERE product_id = p.id
                ), 0) as qty,
                
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
                c.actual_price AS category_actual_price,
                
                cu.name AS customer_name,
                cu.address AS customer_address,
                cu.tel AS customer_tel,
                
                u.group_id,
                u.name AS created_by_name,
                u.username AS created_by_username,
                
                -- ✅ GET LATEST SELLING_PRICE from inventory_transaction
                (
                    SELECT it.selling_price
                    FROM inventory_transaction it
                    WHERE it.product_id = p.id
                      AND it.selling_price IS NOT NULL
                    ORDER BY it.created_at DESC
                    LIMIT 1
                ) AS selling_price,
                
                -- ✅ GET LATEST UNIT_PRICE (for fallback if selling_price is NULL)
                (
                    SELECT it.unit_price
                    FROM inventory_transaction it
                    WHERE it.product_id = p.id
                      AND it.unit_price IS NOT NULL
                    ORDER BY it.created_at DESC
                    LIMIT 1
                ) AS latest_unit_price
                
            FROM product p
            LEFT JOIN category c ON p.category_id = c.id
            LEFT JOIN customer cu ON p.customer_id = cu.id
            INNER JOIN user u ON p.user_id = u.id
            WHERE u.group_id = (SELECT group_id FROM user WHERE id = ?)
        `;

        const params = [req.current_id];

        if (txt_search) {
            sql += " AND (p.name LIKE ? OR p.barcode LIKE ?)";
            params.push(`%${txt_search}%`, `%${txt_search}%`);
        }

        if (category_id) {
            sql += " AND p.category_id = ?";
            params.push(category_id);
        }

        // ✅ Filter out zero stock (using HAVING because qty is calculated)
        sql += " HAVING qty > 0";
        sql += " ORDER BY p.customer_id, p.id DESC";

        const [rows] = await db.query(sql, params);

        // ✅ Process results with selling_price
        const list = rows.map(item => {
            // ✅ Prioritize product-level actual_price over category-level
            const actual_price_ref = item.actual_price || item.category_actual_price || 1;

            // ✅ Use selling_price if available, otherwise fallback to latest_unit_price
            const effective_selling_price = item.selling_price || item.latest_unit_price || item.unit_price || 0;

            // Calculate total_price using selling_price and correct actual_price_ref
            let total_price = 0;
            if (item.discount > 0) {
                total_price = ((item.qty * effective_selling_price) * (1 - item.discount / 100)) / actual_price_ref;
            } else {
                total_price = (item.qty * effective_selling_price) / actual_price_ref;
            }

            return {
                ...item,
                actual_price: actual_price_ref, // ✅ Ensure correct actual_price is passed
                selling_price: effective_selling_price, // ✅ Ensure selling_price is included
                original_price: item.qty * effective_selling_price,
                total_price
            };
        });

        res.json({
            list,
            message: "POS Products retrieved successfully from Inventory",
        });

    } catch (error) {
        logError("inventory.getPosProducts", error, res);
    }
};

exports.updateTransaction = async (req, res) => {
    try {
        const { id, unit_price, selling_price } = req.body;

        if (!id || unit_price === undefined) {
            return res.status(400).json({
                error: true,
                message: "Transaction ID and Unit Price are required"
            });
        }

        // ✅ This correctly updates selling_price
        if (selling_price !== undefined) {
            const actualPriceSql = `UPDATE inventory_transaction SET selling_price = ? WHERE id = ?`;
            await db.query(actualPriceSql, [selling_price, id]);
        }

        res.json({
            success: true,
            message: "Transaction updated successfully"
        });

    } catch (error) {
        logError("inventory.updateTransaction", error, res);
    }
};

// ✅ REFINED: Get stock breakdown by PRODUCT (Gasoline, Diesel separately)
exports.getCategoryStatistics = async (req, res) => {
    try {
        let sql = `
            SELECT 
                p.id as product_id,
                p.name as product_name,
                c.id as category_id,
                c.name as category_name,
                COALESCE(p.qty, 0) as total_qty,
                -- ✅ Per-product movement stats
                COALESCE((
                    SELECT SUM(quantity) 
                    FROM inventory_transaction 
                    WHERE product_id = p.id 
                      AND (transaction_type IN ('PURCHASE_IN', 'RETURN') OR (transaction_type = 'ADJUSTMENT' AND quantity > 0))
                ), 0) as total_qty_in,
                COALESCE((
                    SELECT ABS(SUM(quantity))
                    FROM inventory_transaction 
                    WHERE product_id = p.id 
                      AND (transaction_type = 'SALE_OUT' OR (transaction_type = 'ADJUSTMENT' AND quantity < 0))
                ), 0) as total_qty_out,
                -- ✅ Ultra Robust Value: Use product's unit_price OR fallback to latest purchase price
                COALESCE(
                    (p.qty * COALESCE(
                        NULLIF(p.unit_price, 0), 
                        (SELECT unit_price FROM inventory_transaction WHERE product_id = p.id AND transaction_type = 'PURCHASE_IN' ORDER BY created_at DESC LIMIT 1),
                        0
                    )) / NULLIF(COALESCE(p.actual_price, c.actual_price, 1190), 0),
                    0
                ) as total_value
            FROM product p
            LEFT JOIN category c ON p.category_id = c.id
            LEFT JOIN user u ON p.user_id = u.id
            WHERE p.status != 'deleted'
              AND (
                c.name LIKE '%Gas%' OR c.name LIKE '%Fuel%' OR c.name LIKE '%សាំង%' OR c.name LIKE '%ម៉ាស៊ូត%'
                OR p.name LIKE '%Gas%' OR p.name LIKE '%Fuel%' OR p.name LIKE '%សាំង%' OR p.name LIKE '%ម៉ាស៊ូត%'
                OR p.name LIKE '%Diesel%' OR p.name LIKE '%Benzine%'
              )
        `;

        const params = [];
        if (req.auth && req.auth.role !== "admin") {
            sql += ` AND (u.branch_name = ? OR u.branch_name IS NULL)`;
            params.push(req.auth.branch_name);
        }

        sql += ` ORDER BY p.name ASC`;

        const [results] = await db.query(sql, params);

        res.json({
            data: results,
            success: true,
            message: "Product stock breakdown retrieved successfully"
        });

    } catch (error) {
        logError("inventory.getCategoryStatistics", error, res);
    }
};