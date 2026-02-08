const { db, logError } = require("../util/helper");
const XLSX = require('xlsx');

// Create a new payment
exports.create = async (req, res) => {
    try {
        const {
            customer_id,
            order_id,
            payment_date,
            amount,
            payment_method,
            bank_name,
            reference_no,
            note
        } = req.body;

        // Get upload file path
        let slip_image = null;
        if (req.file) {
            slip_image = req.file.path; // Cloudinary URL or local path
        }

        // Validation
        if (!customer_id || !amount || !payment_date) {
            return res.status(400).json({
                success: false,
                message: "Customer, Amount, and Payment Date are required"
            });
        }

        // Part 1: Allow shared reference_no (e.g. Invoice No)
        // Part 2: Strictly BLOCK duplicate bank slips (using bank_ref from OCR)
        // Part 3: Global Protection - check both Customer AND Supplier tables
        const bank_ref = req.body.bank_ref;
        if (bank_ref && bank_ref !== 'null' && bank_ref !== 'undefined') {
            const note_ref = `%[SlipRef: ${bank_ref}]%`;

            // Check Customer table (payments)
            const [custSlip] = await db.query(
                "SELECT id FROM payments WHERE bank_ref = :bank_ref OR notes LIKE :note_ref",
                { bank_ref, note_ref }
            );

            // Check Supplier table (supplier_payment)
            const [suppSlip] = await db.query(
                "SELECT id FROM supplier_payment WHERE bank_ref = :bank_ref OR note LIKE :note_ref",
                { bank_ref, note_ref }
            );

            if (custSlip.length > 0 || suppSlip.length > 0) {
                const location = custSlip.length > 0 ? "Customer Payments" : "Supplier Payments";
                return res.status(400).json({
                    success: false,
                    message: `⚠️ This Bank Slip (Ref: ${bank_ref}) has already been used in ${location}. Please check your document.`
                });
            }
        }

        // Insert payment record
        const insertSql = `
      INSERT INTO payments (
        customer_id, order_id, payment_date, amount,
        payment_method, bank_name, slip_image, reference_no, bank_ref, notes, created_at, updated_at, created_by
      ) VALUES (
        :customer_id, :order_id, :payment_date, :amount,
        :payment_method, :bank_name, :slip_image, :reference_no, :bank_ref, :note, NOW(), NOW(), :created_by
      )
    `;

        const [result] = await db.query(insertSql, {
            customer_id,
            order_id: order_id || null,
            payment_date,
            amount,
            payment_method,
            bank_name: bank_name || null,
            slip_image,
            reference_no: reference_no || null,
            bank_ref: bank_ref || null,
            note: bank_ref ? `${note && note !== 'undefined' ? note : ''}\n\n[SlipRef: ${bank_ref}]` : (note && note !== 'undefined' ? note : ''),
            created_by: req.auth?.id || 1
        });

        // If linked to an specific order, update order payment status
        if (order_id) {
            await updateOrderPaymentStatus(order_id);
        }

        res.json({
            success: true,
            message: "Payment recorded successfully",
            id: result.insertId,
            slip_image: slip_image
        });

    } catch (error) {
        logError("customer_payment.create", error, res);
    }
};

// Get single payment detail
exports.getOne = async (req, res) => {
    try {
        const { id } = req.params;
        const [payment] = await db.query(`
            SELECT 
                p.*,
                c.name as customer_name,
                c.tel as customer_tel
            FROM payments p
            JOIN customer c ON p.customer_id = c.id
            WHERE p.id = :id
        `, { id });

        if (payment.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        res.json({
            success: true,
            payment: payment[0]
        });
    } catch (error) {
        logError("customer_payment.getOne", error, res);
    }
};

// Helper function to update order payment status
async function updateOrderPaymentStatus(order_id) {
    // Get total payments for this order
    const [payments] = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE order_id = :order_id`,
        { order_id }
    );

    // Get order total
    const [order] = await db.query(
        `SELECT total_amount FROM \`order\` WHERE id = :id`,
        { id: order_id }
    );

    if (order.length === 0) return;

    const totalAmount = parseFloat(order[0].total_amount || 0);
    const paidAmount = parseFloat(payments[0].total_paid || 0);

    let paymentStatus = 'unpaid';
    if (paidAmount >= totalAmount) {
        paymentStatus = 'Paid'; // Changed to 'Paid' to match enum in order.controller.js
    } else if (paidAmount > 0) {
        paymentStatus = 'Partial'; // Changed to 'Partial'
    } else {
        paymentStatus = 'Pending'; // Default
    }

    // Update order
    await db.query(
        `UPDATE \`order\` SET paid_amount = :paid_amount, payment_status = :payment_status WHERE id = :id`,
        { id: order_id, paid_amount: paidAmount, payment_status: paymentStatus }
    );
}

// Get ledger (Orders + Payments)
exports.getLedger = async (req, res) => {
    try {
        const { customer_id, start_date, end_date } = req.query;

        if (!customer_id) {
            return res.status(400).json({
                success: false,
                message: "Customer ID is required"
            });
        }

        const params = { customer_id };

        // 1. Get Orders (Debits) - Grouped per Invoice
        let orderSql = `
      SELECT 
        o.id,
        COALESCE(o.pre_order_no, o.order_no) as reference,
        o.order_date as transaction_date,
        o.total_amount as debit,
        0 as credit,
        'order' as transaction_type,
        (SELECT COUNT(*) FROM order_detail WHERE order_id = o.id) as product_count,
        (
            SELECT GROUP_CONCAT(CONCAT(p.name, ' (', od.qty, 'L)') SEPARATOR ', ')
            FROM order_detail od
            JOIN product p ON od.product_id = p.id
            WHERE od.order_id = o.id
        ) as description,
        (
            SELECT SUM(od.qty) 
            FROM order_detail od 
            JOIN product p ON od.product_id = p.id 
            LEFT JOIN category c ON p.category_id = c.id
            WHERE od.order_id = o.id AND (
                 p.name LIKE '%EXTRA%' OR p.name LIKE '%95%' OR p.name LIKE '%RED%' 
                 OR p.name LIKE '%ស៊ុបពែរ%' OR p.name LIKE '%SUPER%'
                 OR c.name LIKE '%Premium%' OR c.name LIKE '%Extra%'
            )
        ) as fuel_extra,
        (
            SELECT SUM(od.qty) 
            FROM order_detail od 
            JOIN product p ON od.product_id = p.id 
            LEFT JOIN category c ON p.category_id = c.id
            WHERE od.order_id = o.id AND (
                 (p.name LIKE '%92%' OR p.name LIKE '%REGULAR%' OR p.name LIKE '%GASOLINE%' OR p.name LIKE '%ធម្មតា%' OR p.name LIKE '%សាំង%' OR p.name LIKE '%BENZINE%')
                 AND p.name NOT LIKE '%SUPER%' AND p.name NOT LIKE '%EXTRA%' AND p.name NOT LIKE '%ស៊ុបពែរ%'
                 OR (c.name LIKE '%Gasoline%' OR c.name LIKE '%Regular%' OR (c.name LIKE '%សាំង%' AND c.name NOT LIKE '%ស៊ុបពែរ%'))
            )
        ) as fuel_regular,
        (
            SELECT SUM(od.qty) 
            FROM order_detail od 
            JOIN product p ON od.product_id = p.id 
            LEFT JOIN category c ON p.category_id = c.id
            WHERE od.order_id = o.id AND (
                p.name LIKE '%ហ្គា%' OR p.name LIKE '%ហ្កា%' OR p.name LIKE '%LPG%' OR p.name LIKE '%P501%'
                OR (p.name LIKE '%Gas%' AND p.name NOT LIKE '%GASOLINE%')
                OR c.name LIKE '%ហ្គា%' OR c.name LIKE '%LPG%' OR c.name LIKE '%Gas%'
            )
        ) as fuel_gas,
        (
            SELECT SUM(od.qty) 
            FROM order_detail od 
            JOIN product p ON od.product_id = p.id 
            LEFT JOIN category c ON p.category_id = c.id
            WHERE od.order_id = o.id AND (
                p.name LIKE '%DIESEL%' OR p.name LIKE '%DO%' OR p.name LIKE '%EURO%'
                OR p.name LIKE '%ម៉ាស៊ូត%'
                OR c.name LIKE '%ម៉ាស៊ូត%' OR c.name LIKE '%Diesel%'
            )
        ) as fuel_diesel,
        CAST(COALESCE(o.pre_order_no, o.order_no) as CHAR) as reference_no,
        o.payment_method,
        o.remark as note,
        o.paid_amount,
        (o.total_amount - o.paid_amount) as remaining_balance,
        CAST(o.id AS CHAR) as original_id,
        NULL as bank_name,
        NULL as slip_image,
        NULL as bank_ref
      FROM \`order\` o
      WHERE o.customer_id = :customer_id
    `;

        if (start_date) {
            orderSql += ` AND o.order_date >= :start_date`;
            params.start_date = start_date;
        }

        if (end_date) {
            orderSql += ` AND o.order_date <= :end_date`;
            params.end_date = end_date;
        }

        // 2. Get Payments (Credits)
        let paymentSql = `
      SELECT 
        p.id,
        COALESCE(o.pre_order_no, o.order_no, p.reference_no) as reference,
        p.payment_date as transaction_date,
        0 as debit,
        p.amount as credit,
        CONCAT('Payment - ', p.payment_method, IF(p.bank_name IS NOT NULL, CONCAT(' (', p.bank_name, ')'), '')) as transaction_type,
        0 as product_count, -- Placeholder
        NULL as description, -- Placeholder
        0 as fuel_extra, -- Placeholder
        0 as fuel_regular, -- Added for consistency with orderSql
        0 as fuel_gas, -- Placeholder
        0 as fuel_diesel, -- Placeholder
        p.reference_no as manual_ref,
        p.payment_method,
        p.notes as note,
        0 as paid_amount,
        0 as remaining_balance,
        CAST(p.id AS CHAR) as original_id,
        p.bank_name,
        p.slip_image,
        p.bank_ref
      FROM payments p
      LEFT JOIN \`order\` o ON p.order_id = o.id
      WHERE p.customer_id = :customer_id
    `;

        if (start_date) {
            paymentSql += ` AND p.payment_date >= :start_date`;
        }

        if (end_date) {
            paymentSql += ` AND p.payment_date <= :end_date`;
        }

        // Combine and order
        const combinedSql = `
      (${orderSql})
      UNION ALL
      (${paymentSql})
      ORDER BY transaction_date ASC, original_id ASC
    `;

        const [transactions] = await db.query(combinedSql, params);

        // Calculate Beginning Balance (Orders - Payments before start_date)
        let beginning_balance = 0;
        if (start_date) {
            const [prevOrders] = await db.query(
                "SELECT SUM(total_amount) as total FROM `order` WHERE customer_id = :customer_id AND order_date < :start_date",
                { customer_id, start_date }
            );
            const [prevPayments] = await db.query(
                "SELECT SUM(amount) as total FROM payments WHERE customer_id = :customer_id AND payment_date < :start_date",
                { customer_id, start_date }
            );
            beginning_balance = (parseFloat(prevOrders[0]?.total || 0)) - (parseFloat(prevPayments[0]?.total || 0));
        }

        // Calculate running balance starting from the beginning balance
        let current_running_balance = beginning_balance;
        const ledger = transactions.map(t => {
            // Debit increases customer debt (positive balance), Credit decreases it
            current_running_balance += (parseFloat(t.debit || 0) - parseFloat(t.credit || 0));

            return {
                ...t,
                running_balance: current_running_balance,
                fuel_extra: t.fuel_extra || 0,
                fuel_regular: t.fuel_regular || 0,
                fuel_gas: t.fuel_gas || 0,
                fuel_diesel: t.fuel_diesel || 0,
                product_count: t.product_count || 0,
                description: t.transaction_type === 'order' ?
                    t.description :
                    t.transaction_type
            };
        });

        // Get customer info
        const [customer] = await db.query(
            `SELECT * FROM customer WHERE id = :id`,
            { id: customer_id }
        );

        const sale_list = ledger.filter(l => !l.transaction_type.startsWith('Payment'));
        const payment_list = ledger.filter(l => l.transaction_type.startsWith('Payment'));

        const increase = sale_list.reduce((sum, l) => sum + parseFloat(l.debit || 0), 0);
        const total_payments = payment_list.reduce((sum, l) => sum + parseFloat(l.credit || 0), 0);
        const ending_balance = beginning_balance + increase - total_payments;

        res.json({
            success: true,
            customer: customer[0] || {},
            ledger: ledger,
            summary: {
                beginning_balance,
                increase,
                increase_count: sale_list.length,
                total_payments,
                payment_count: payment_list.length,
                ending_balance,
                comparison: ending_balance - beginning_balance,
                total_purchases: increase, // legacy compat
                outstanding_balance: ending_balance // legacy compat
            }
        });

    } catch (error) {
        logError("customer_payment.getLedger", error, res);
    }
};

// Delete payment
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        // Get payment info before deleting
        const [payment] = await db.query(
            `SELECT * FROM payments WHERE id = :id`,
            { id }
        );

        if (payment.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        const order_id = payment[0].order_id;

        // Delete payment
        await db.query(`DELETE FROM payments WHERE id = :id`, { id });

        // Update order if linked
        if (order_id) {
            await updateOrderPaymentStatus(order_id);
        }

        res.json({
            success: true,
            message: "Payment deleted successfully"
        });

    } catch (error) {
        logError("customer_payment.delete", error, res);
    }
};

// Export to Excel
exports.exportExcel = async (req, res) => {
    try {
        const { customer_id, start_date, end_date } = req.query;

        if (!customer_id) {
            return res.status(400).json({
                success: false,
                message: "Customer ID is required"
            });
        }

        // Get ledger data logic (simplified for export)
        const params = { customer_id };

        let orderSql = `
            SELECT 
                o.order_date as date,
                COALESCE(o.pre_order_no, o.order_no) as reference,
                p.name as type,
                od.qty,
                od.price as unit_price,
                od.total as debit,
                0 as credit,
                o.payment_method,
                (
                    SELECT SUM(od2.qty) 
                    FROM order_detail od2 
                    JOIN product p2 ON od2.product_id = p2.id 
                    WHERE od2.order_id = o.id AND (p2.name LIKE '%EXTRA%' OR p2.name LIKE '%95%' OR p2.name LIKE '%RED%' OR p2.name LIKE '%ស៊ុបពែរ%' OR p2.name LIKE '%SUPER%')
                ) as fuel_extra,
                (
                    SELECT SUM(od2.qty) 
                    FROM order_detail od2 
                    JOIN product p2 ON od2.product_id = p2.id 
                    WHERE od2.order_id = o.id AND (p2.name LIKE '%92%' OR p2.name LIKE '%GASOLINE%' OR p2.name LIKE '%ធម្មតា%' OR p2.name LIKE '%សាំង%')
                    AND p2.name NOT LIKE '%SUPER%' AND p2.name NOT LIKE '%EXTRA%' AND p2.name NOT LIKE '%ស៊ុបពែរ%'
                ) as fuel_regular,
                (
                    SELECT SUM(od2.qty) 
                    FROM order_detail od2 
                    JOIN product p2 ON od2.product_id = p2.id 
                    WHERE od2.order_id = o.id AND (p2.name LIKE '%ហ្គា%' OR p2.name LIKE '%LPG%' OR (p2.name LIKE '%Gas%' AND p2.name NOT LIKE '%GASOLINE%'))
                ) as fuel_gas,
                (
                    SELECT SUM(od2.qty) 
                    FROM order_detail od2 
                    JOIN product p2 ON od2.product_id = p2.id 
                    WHERE od2.order_id = o.id AND (p2.name LIKE '%DIESEL%' OR p2.name LIKE '%DO%' OR p2.name LIKE '%EURO%' OR p2.name LIKE '%ម៉ាស៊ូត%')
                ) as fuel_diesel
            FROM \`order\` o
            JOIN order_detail od ON o.id = od.order_id
            LEFT JOIN product p ON od.product_id = p.id
            WHERE o.customer_id = :customer_id
        `;

        if (start_date) {
            orderSql += ` AND o.order_date >= :start_date`;
            params.start_date = start_date;
        }
        if (end_date) {
            orderSql += ` AND o.order_date <= :end_date`;
            params.end_date = end_date;
        }

        let paymentSql = `
            SELECT 
                p.payment_date as date,
                CAST(p.order_id AS CHAR) as reference,
                'Payment' as type,
                NULL as qty,
                NULL as unit_price,
                0 as debit,
                p.amount as credit,
                p.payment_method,
                0 as fuel_extra,
                0 as fuel_regular,
                0 as fuel_gas,
                0 as fuel_diesel
            FROM payments p
            WHERE p.customer_id = :customer_id
        `;

        if (start_date) paymentSql += ` AND p.payment_date >= :start_date`;
        if (end_date) paymentSql += ` AND p.payment_date <= :end_date`;

        const combinedSql = `(${orderSql}) UNION ALL (${paymentSql}) ORDER BY date ASC`;
        const [data] = await db.query(combinedSql, params);

        // Formatting for Excel
        let balance = 0;
        const formattedData = data.map(row => {
            balance += (parseFloat(row.debit || 0) - parseFloat(row.credit || 0));
            return {
                Date: row.date,
                Reference: row.reference,
                Type: row.type,
                "Extra (L)": row.fuel_extra || 0,
                "Regular (L)": row.fuel_regular || 0,
                "Gas (L)": row.fuel_gas || 0,
                "Diesel (L)": row.fuel_diesel || 0,
                Qty: row.qty,
                "Unit Price": row.unit_price,
                Debit: row.debit,
                Credit: row.credit,
                Balance: balance,
                Method: row.payment_method
            };
        });

        const [customer] = await db.query(`SELECT name FROM customer WHERE id = :id`, { id: customer_id });
        const customerName = customer[0]?.name || 'Customer';

        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Statement");

        const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${customerName}_Statement.xlsx"`);
        res.send(excelBuffer);

    } catch (error) {
        logError("customer_payment.exportExcel", error, res);
    }
};

// Check if invoice exists for customer
exports.checkInvoice = async (req, res) => {
    try {
        const { customer_id, invoice_no } = req.body;

        if (!customer_id || !invoice_no) {
            return res.status(400).json({
                success: false,
                message: "Customer ID and Invoice No are required"
            });
        }

        // Check if order exists with this reference no (prioritizing pre_order_no)
        const [orders] = await db.query(
            `SELECT id, total_amount, paid_amount FROM \`order\` 
             WHERE customer_id = :customer_id AND (pre_order_no = :ref OR order_no = :ref)`,
            { customer_id, ref: invoice_no }
        );

        if (orders.length > 0) {
            return res.json({
                success: true,
                exists: true,
                order: orders[0]
            });
        } else {
            return res.json({
                success: true,
                exists: false,
                message: "Invoice does not exist"
            });
        }

    } catch (error) {
        logError("customer_payment.checkInvoice", error, res);
    }
};

// Check if payment reference exists for customer
exports.checkReference = async (req, res) => {
    try {
        const { customer_id, reference_no } = req.body;

        if (!customer_id || !reference_no) {
            return res.status(400).json({
                success: false,
                message: "Customer ID and Reference No are required"
            });
        }

        const sql = `SELECT id FROM payments WHERE customer_id = :customer_id AND reference_no = :reference_no LIMIT 1`;
        const [payment] = await db.query(sql, { customer_id, reference_no });

        if (payment && payment.length > 0) {
            return res.json({
                success: true,
                exists: true,
                message: "Payment reference already exists"
            });
        } else {
            return res.json({
                success: true,
                exists: false,
                message: "Reference number available"
            });
        }
    } catch (error) {
        logError("customer_payment.checkReference", error, res);
    }
};

exports.getPendingInvoices = async (req, res) => {
    try {
        const { customer_id, show_all } = req.query;
        if (!customer_id) return res.json({ success: false, message: "Customer ID required" });

        // Show all invoices from the last 30 days even if paid, 
        // OR only unpaid invoices if not show_all
        const sql = `
            SELECT 
                id, 
                order_no,
                pre_order_no,
                pre_order_no as invoice_no, 
                total_amount, 
                COALESCE(paid_amount, 0) as paid_amount,
                (total_amount - COALESCE(paid_amount, 0)) as balance
            FROM \`order\` 
            WHERE customer_id = :customer_id 
              AND pre_order_no IS NOT NULL AND pre_order_no != ''
              ${show_all === 'true' ? '' : 'AND (total_amount > (COALESCE(paid_amount, 0) + 0.01))'}
            ORDER BY order_date DESC, id DESC
            LIMIT 100
        `;
        const [list] = await db.query(sql, { customer_id });
        res.json({ success: true, list });
    } catch (error) {
        logError("customer_payment.getPendingInvoices", error, res);
    }
};

exports.getDebtors = async (req, res) => {
    try {
        const { branch_name } = req.query;
        let params = {};

        // Calculate Debt based on Ledger Logic: (Sum of All Orders) - (Sum of All Payments)
        // This ensures the "Total Debt" matches the "Ending Balance" in the Ledger view.
        // Check permissions
        const currentUserBranch = req.auth?.branch_name;
        const currentUserId = req.auth?.id; // Assuming auth middleware populates this

        // If user is not Super Admin (e.g. branch manager or staff), force branch filter
        // You might need a more robust role check here (e.g. based on role_id)
        // For now, if req.auth.branch_name exists and is NOT 'All', we use it.

        // Fetch user role to be sure? Or rely on branch_name from token?
        // Assuming if branch_name is present in token, they are restricted.

        let branchFilter = branch_name;

        // If user has a specific branch assigned (and not All/Head Office), force it
        if (currentUserBranch && currentUserBranch !== 'All') {
            branchFilter = currentUserBranch;
        }

        let sql = `
            SELECT 
                c.id as customer_id,
                c.name as customer_name,
                c.address,
                c.tel as customer_tel,
                c.branch_name,
                u.name as seller_name,
                u.tel as seller_tel,
                
                COALESCE((SELECT SUM(total_amount) FROM \`order\` WHERE customer_id = c.id), 0) as total_order_amount,
                COALESCE((SELECT SUM(amount) FROM payments WHERE customer_id = c.id), 0) as total_payment_amount,
                (
                    COALESCE((SELECT SUM(total_amount) FROM \`order\` WHERE customer_id = c.id), 0) - 
                    COALESCE((SELECT SUM(amount) FROM payments WHERE customer_id = c.id), 0)
                ) as total_debt,

                (SELECT COUNT(*) FROM \`order\` WHERE customer_id = c.id AND total_amount > (COALESCE(paid_amount, 0) + 0.01)) as unpaid_invoices_count,

                (SELECT DATEDIFF(NOW(), MIN(order_date)) FROM \`order\` WHERE customer_id = c.id AND total_amount > (COALESCE(paid_amount, 0) + 0.01)) as days_overdue

            FROM customer c
            LEFT JOIN user u ON c.user_id = u.id
            WHERE 1=1
        `;

        if (branchFilter && branchFilter !== 'All') {
            sql += " AND c.branch_name = :branch_name";
            params.branch_name = branchFilter;
        }

        // Filter only customers with positive debt
        sql += `
            HAVING total_debt > 0.01
            ORDER BY total_debt DESC
        `;

        const [debtors] = await db.query(sql, params);

        res.json({
            success: true,
            list: debtors
        });
    } catch (error) {
        logError("customer_payment.getDebtors", error, res);
    }
};
