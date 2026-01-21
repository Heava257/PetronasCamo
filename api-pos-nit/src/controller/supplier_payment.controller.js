const { db, logError } = require("../util/helper");
const XLSX = require('xlsx');

// Create a new payment
exports.create = async (req, res) => {
    try {
        const {
            purchase_id,
            supplier_id,
            payment_date,
            amount,
            payment_method,
            reference_no,
            bank_name,
            note
        } = req.body;

        // Validation
        if (!supplier_id || !amount || !payment_date) {
            return res.status(400).json({
                success: false,
                message: "Supplier, Amount, and Payment Date are required"
            });
        }

        // Part 1: Allow shared reference_no (e.g. Invoice No)
        // Part 2: Strictly BLOCK duplicate bank slips (using bank_ref from OCR)
        // Part 3: Global Protection - check both Supplier AND Customer tables
        const bank_ref = req.body.bank_ref;
        if (bank_ref && bank_ref !== 'null' && bank_ref !== 'undefined') {
            const note_ref = `%[SlipRef: ${bank_ref}]%`;

            // Check Supplier table (supplier_payment)
            const [suppSlip] = await db.query(
                "SELECT id FROM supplier_payment WHERE bank_ref = :bank_ref OR note LIKE :note_ref",
                { bank_ref, note_ref }
            );

            // Check Customer table (payments)
            const [custSlip] = await db.query(
                "SELECT id FROM payments WHERE bank_ref = :bank_ref OR notes LIKE :note_ref",
                { bank_ref, note_ref }
            );

            if (suppSlip.length > 0 || custSlip.length > 0) {
                const location = suppSlip.length > 0 ? "Supplier Payments" : "Customer Payments";
                return res.status(400).json({
                    success: false,
                    message: `⚠️ This Bank Slip (Ref: ${bank_ref}) has already been used in ${location}. Please check your document.`
                });
            }
        }

        // Insert payment record
        const insertSql = `
      INSERT INTO supplier_payment (
        purchase_id, supplier_id, payment_date, amount,
        payment_method, reference_no, bank_ref, bank_name, note, created_by
      ) VALUES (
        :purchase_id, :supplier_id, :payment_date, :amount,
        :payment_method, :reference_no, :bank_ref, :bank_name, :note, :created_by
      )
    `;

        await db.query(insertSql, {
            purchase_id: purchase_id || null,
            supplier_id,
            payment_date,
            amount,
            payment_method: payment_method || 'bank_transfer',
            reference_no: reference_no || null,
            bank_ref: bank_ref || null,
            bank_name: bank_name || null,
            note: bank_ref ? `${note}\n\n[SlipRef: ${bank_ref}]` : (note || null),
            created_by: req.auth?.id || 1
        });

        // If linked to a purchase, update purchase payment status
        if (purchase_id) {
            await updatePurchasePaymentStatus(purchase_id);
        }

        res.json({
            success: true,
            message: "Payment recorded successfully"
        });

    } catch (error) {
        logError("supplier_payment.create", error, res);
    }
};

// Helper function to update purchase payment status
async function updatePurchasePaymentStatus(purchase_id) {
    // Get total payments for this purchase
    const [payments] = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as total_paid FROM supplier_payment WHERE purchase_id = :purchase_id`,
        { purchase_id }
    );

    // Get purchase total
    const [purchase] = await db.query(
        `SELECT total_amount FROM purchase WHERE id = :id`,
        { id: purchase_id }
    );

    if (purchase.length === 0) return;

    const totalAmount = parseFloat(purchase[0].total_amount || 0);
    const paidAmount = parseFloat(payments[0].total_paid || 0);

    let paymentStatus = 'unpaid';
    if (paidAmount >= totalAmount) {
        paymentStatus = 'paid';
    } else if (paidAmount > 0) {
        paymentStatus = 'partial';
    }

    // Update purchase
    await db.query(
        `UPDATE purchase SET paid_amount = :paid_amount, payment_status = :payment_status WHERE id = :id`,
        { id: purchase_id, paid_amount: paidAmount, payment_status: paymentStatus }
    );
}

// Get payment list
exports.getList = async (req, res) => {
    try {
        const { supplier_id, start_date, end_date } = req.query;

        let sql = `
      SELECT 
        sp.*,
        s.name as supplier_name,
        s.code as supplier_code,
        p.order_no,
        u.name as created_by_name
      FROM supplier_payment sp
      LEFT JOIN supplier s ON sp.supplier_id = s.id
      LEFT JOIN purchase p ON sp.purchase_id = p.id
      LEFT JOIN user u ON sp.created_by = u.id
      WHERE 1=1
    `;

        const params = {};

        if (supplier_id) {
            sql += ` AND sp.supplier_id = :supplier_id`;
            params.supplier_id = supplier_id;
        }

        if (start_date) {
            sql += ` AND sp.payment_date >= :start_date`;
            params.start_date = start_date;
        }

        if (end_date) {
            sql += ` AND sp.payment_date <= :end_date`;
            params.end_date = end_date;
        }

        sql += ` ORDER BY sp.payment_date DESC, sp.id DESC`;

        const [results] = await db.query(sql, params);

        res.json({
            success: true,
            list: results
        });

    } catch (error) {
        logError("supplier_payment.getList", error, res);
    }
};

// Get ledger (main function for detailed view)
exports.getLedger = async (req, res) => {
    try {
        const { supplier_id, start_date, end_date } = req.query;


        if (!supplier_id) {
            return res.status(400).json({
                success: false,
                message: "Supplier ID is required"
            });
        }

        const params = { supplier_id };

        // Get purchases - select specific columns with paid amount calculation
        let purchaseSql = `
      SELECT 
        p.id,
        p.order_no,
        p.order_date as transaction_date,
        p.total_amount as debit,
        0 as credit,
        'purchase' as transaction_type,
        p.items,
        NULL as reference_no,
        NULL as payment_method,
        NULL as bank_name,
        p.notes as note,
        COALESCE((SELECT SUM(sp.amount) FROM supplier_payment sp WHERE sp.purchase_id = p.id), 0) as paid_amount,
        (p.total_amount - COALESCE((SELECT SUM(sp.amount) FROM supplier_payment sp WHERE sp.purchase_id = p.id), 0)) as remaining_amount
      FROM purchase p
      WHERE p.supplier_id = :supplier_id
    `;

        if (start_date) {
            purchaseSql += ` AND p.order_date >= :start_date`;
            params.start_date = start_date;
        }

        if (end_date) {
            purchaseSql += ` AND p.order_date <= :end_date`;
            params.end_date = end_date;
        }

        // Get payments - select matching columns (must match purchase query for UNION)
        let paymentSql = `
      SELECT 
        sp.id,
        sp.purchase_id as order_no,
        sp.payment_date as transaction_date,
        0 as debit,
        sp.amount as credit,
        'payment' as transaction_type,
        NULL as items,
        sp.reference_no,
        sp.payment_method,
        sp.bank_name,
        sp.note,
        0 as paid_amount,
        0 as remaining_amount
      FROM supplier_payment sp
      WHERE sp.supplier_id = :supplier_id
    `;

        if (start_date) {
            paymentSql += ` AND sp.payment_date >= :start_date`;
        }

        if (end_date) {
            paymentSql += ` AND sp.payment_date <= :end_date`;
        }

        // Combine and order
        // Combine and order
        const combinedSql = `
      (${purchaseSql})
      UNION ALL
      (${paymentSql})
      ORDER BY transaction_date ASC, transaction_type DESC
    `;

        const [transactions] = await db.query(combinedSql, params);

        // 1. Calculate Beginning Balance (Purchases - Payments before start_date)
        let beginning_balance = 0;
        if (start_date) {
            const [prevPurchases] = await db.query(
                "SELECT SUM(total_amount) as total FROM purchase WHERE supplier_id = :supplier_id AND order_date < :start_date",
                { supplier_id, start_date }
            );
            const [prevPayments] = await db.query(
                "SELECT SUM(amount) as total FROM supplier_payment WHERE supplier_id = :supplier_id AND payment_date < :start_date",
                { supplier_id, start_date }
            );
            beginning_balance = (parseFloat(prevPurchases[0]?.total || 0)) - (parseFloat(prevPayments[0]?.total || 0));
        }

        // Calculate running balance starting from the beginning balance
        let current_running_balance = beginning_balance;
        const ledger = transactions.map(t => {
            current_running_balance += (parseFloat(t.debit || 0) - parseFloat(t.credit || 0));

            // Extract fuel details if purchase
            let fuel_extra = 0;
            let fuel_diesel = 0;
            if (t.transaction_type === 'purchase' && t.items) {
                try {
                    const items = typeof t.items === 'string' ? JSON.parse(t.items) : t.items;
                    items.forEach(item => {
                        const name = (item.product_name || "").toUpperCase();
                        if (name.includes('EXTRA') || name.includes('SUPER') || name.includes('95')) {
                            fuel_extra += parseFloat(item.quantity || 0);
                        } else if (name.includes('DIESEL') || name.includes('DO') || name.includes('92')) {
                            fuel_diesel += parseFloat(item.quantity || 0);
                        }
                    });
                } catch (e) {
                    console.error("Failed to parse items for fuel extraction", e);
                }
            }

            return {
                ...t,
                running_balance: current_running_balance,
                fuel_extra,
                fuel_diesel
            };
        });

        // Get supplier info
        const [supplier] = await db.query(
            `SELECT * FROM supplier WHERE id = :id`,
            { id: supplier_id }
        );

        const purchase_list = ledger.filter(l => l.transaction_type === 'purchase');
        const payment_list = ledger.filter(l => l.transaction_type === 'payment');

        const increase = purchase_list.reduce((sum, l) => sum + parseFloat(l.debit || 0), 0);
        const total_payments = payment_list.reduce((sum, l) => sum + parseFloat(l.credit || 0), 0);
        const ending_balance = beginning_balance + increase - total_payments;

        res.json({
            success: true,
            supplier: supplier[0] || {},
            ledger: ledger,
            summary: {
                beginning_balance,
                increase,
                increase_count: purchase_list.length,
                total_payments,
                payment_count: payment_list.length,
                ending_balance,
                comparison: ending_balance - beginning_balance,
                total_purchases: increase, // legacy compat
                outstanding_balance: ending_balance // legacy compat
            }
        });

    } catch (error) {
        logError("supplier_payment.getLedger", error, res);
    }
};

// Delete payment
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;

        // Get payment info before deleting
        const [payment] = await db.query(
            `SELECT * FROM supplier_payment WHERE id = :id`,
            { id }
        );

        if (payment.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Payment not found"
            });
        }

        const purchase_id = payment[0].purchase_id;

        // Delete payment
        await db.query(`DELETE FROM supplier_payment WHERE id = :id`, { id });

        // Update purchase if linked
        if (purchase_id) {
            await updatePurchasePaymentStatus(purchase_id);
        }

        res.json({
            success: true,
            message: "Payment deleted successfully"
        });

    } catch (error) {
        logError("supplier_payment.delete", error, res);
    }
};

// Export to Excel
exports.exportExcel = async (req, res) => {
    try {
        const { supplier_id, start_date, end_date } = req.query;

        if (!supplier_id) {
            return res.status(400).json({
                success: false,
                message: "Supplier ID is required"
            });
        }

        // Get ledger data using the same logic
        const params = { supplier_id };

        let purchaseSql = `
      SELECT 
        p.order_date as date,
        p.order_no as reference,
        'Purchase' as type,
        p.total_amount as amount,
        '' as payment_method
      FROM purchase p
      WHERE p.supplier_id = :supplier_id
    `;

        if (start_date) {
            purchaseSql += ` AND p.order_date >= :start_date`;
            params.start_date = start_date;
        }

        if (end_date) {
            purchaseSql += ` AND p.order_date <= :end_date`;
            params.end_date = end_date;
        }

        let paymentSql = `
      SELECT 
        sp.payment_date as date,
        sp.reference_no as reference,
        'Payment' as type,
        sp.amount,
        sp.payment_method
      FROM supplier_payment sp
      WHERE sp.supplier_id = :supplier_id
    `;

        if (start_date) {
            paymentSql += ` AND sp.payment_date >= :start_date`;
        }

        if (end_date) {
            paymentSql += ` AND sp.payment_date <= :end_date`;
        }

        const combinedSql = `
      (${purchaseSql})
      UNION ALL
      (${paymentSql})
      ORDER BY date ASC
    `;

        const [data] = await db.query(combinedSql, params);

        // Get supplier info
        const [supplier] = await db.query(
            `SELECT name FROM supplier WHERE id = :id`,
            { id: supplier_id }
        );

        // Create Excel workbook
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Ledger");

        // Generate buffer
        const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Set headers for download
        const supplierName = supplier[0]?.name || 'Supplier';
        const filename = `${supplierName}_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(excelBuffer);

    } catch (error) {
        logError("supplier_payment.exportExcel", error, res);
    }
};

// Import from Excel
exports.importExcel = async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({
                success: false,
                message: "No file uploaded"
            });
        }

        const file = req.files.file;
        const workbook = XLSX.read(file.data, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        let imported = 0;
        let errors = [];

        for (let row of data) {
            try {
                if (row.type === 'Payment' && row.supplier_id && row.amount) {
                    await db.query(`
            INSERT INTO supplier_payment (
              supplier_id, payment_date, amount, payment_method, reference_no, created_by
            ) VALUES (
              :supplier_id, :payment_date, :amount, :payment_method, :reference_no, :created_by
            )
          `, {
                        supplier_id: row.supplier_id,
                        payment_date: row.date,
                        amount: row.amount,
                        payment_method: row.payment_method || 'bank_transfer',
                        reference_no: row.reference || null,
                        created_by: req.auth?.id || 1
                    });
                    imported++;
                }
            } catch (err) {
                errors.push(`Row error: ${err.message}`);
            }
        }

        res.json({
            success: true,
            message: `Imported ${imported} payments`,
            errors: errors.length > 0 ? errors : null
        });

    } catch (error) {
        logError("supplier_payment.importExcel", error, res);
    }
};
