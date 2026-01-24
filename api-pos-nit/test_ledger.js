const { db } = require("./src/util/helper");

async function check() {
    try {
        const supplier_id = 4; // Based on screenshot "Supplier selected: 4"
        const params = { supplier_id };
        const purchaseSql = `
      SELECT 
        p.id, p.order_no, p.order_date as transaction_date, p.total_amount as debit, 0 as credit, 'purchase' as transaction_type,
        NULL as reference_no, NULL as payment_method, NULL as bank_name, NULL as bank_ref, NULL as slip_image, p.notes as note
      FROM purchase p WHERE p.supplier_id = :supplier_id
    `;
        const paymentSql = `
      SELECT 
        sp.id, p.order_no as order_no, sp.payment_date as transaction_date, 0 as debit, sp.amount as credit, 'payment' as transaction_type,
        sp.reference_no, sp.payment_method, sp.bank_name, sp.bank_ref, sp.slip_image, sp.note
      FROM supplier_payment sp
      LEFT JOIN purchase p ON sp.purchase_id = p.id
      WHERE sp.supplier_id = :supplier_id
    `;
        const combinedSql = `(${purchaseSql}) UNION ALL (${paymentSql}) ORDER BY transaction_date ASC, transaction_type DESC`;

        const [results] = await db.query(combinedSql, params);
        const payments = results.filter(r => r.transaction_type === 'payment');
        console.log("Latest payments:", JSON.stringify(payments.slice(-3), null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Check failed:", error);
        process.exit(1);
    }
}

check();
