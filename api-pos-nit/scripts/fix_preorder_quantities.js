const { db } = require('../src/util/helper');

async function fixPreOrderData() {
    try {
        console.log('\n🚀 Starting Pre-Order Data Repair...\n');

        // 1. Get all pre-orders with potential issues
        const [preOrders] = await db.query(`
      SELECT id, pre_order_no, customer_name FROM pre_order
    `);

        for (const po of preOrders) {
            console.log(`Checking Pre-Order: ${po.pre_order_no} (${po.customer_name})`);

            // 2. Find duplicate delivery records for this pre-order
            // (Same invoice_id and same pre_order_detail_id recorded multiple times)
            const [duplicates] = await db.query(`
        SELECT invoice_id, pre_order_detail_id, COUNT(*) as count, MIN(id) as keep_id
        FROM pre_order_delivery
        WHERE pre_order_id = ? AND invoice_id IS NOT NULL
        GROUP BY invoice_id, pre_order_detail_id
        HAVING COUNT(*) > 1
      `, [po.id]);

            if (duplicates.length > 0) {
                console.log(`   ⚠️  Found ${duplicates.length} duplicate delivery groups. Cleaning...`);

                for (const dup of duplicates) {
                    // Delete all EXCEPT the one we want to keep
                    await db.query(`
            DELETE FROM pre_order_delivery
            WHERE pre_order_id = ? 
              AND invoice_id = ? 
              AND pre_order_detail_id = ? 
              AND id != ?
          `, [po.id, dup.invoice_id, dup.pre_order_detail_id, dup.keep_id]);
                }
            } else {
                console.log(`   ✅ No duplicate delivery records found.`);
            }

            // 3. Recalculate delivered_qty and remaining_qty for all details in this PO
            const [details] = await db.query(`SELECT id, qty FROM pre_order_detail WHERE pre_order_id = ?`, [po.id]);

            for (const detail of details) {
                const [sumRes] = await db.query(`
          SELECT COALESCE(SUM(delivered_qty), 0) as actual_delivered
          FROM pre_order_delivery
          WHERE pre_order_detail_id = ?
        `, [detail.id]);

                const actualDelivered = parseFloat(sumRes[0].actual_delivered || 0);
                const newRemaining = detail.qty - actualDelivered;

                await db.query(`
          UPDATE pre_order_detail
          SET delivered_qty = ?, remaining_qty = ?
          WHERE id = ?
        `, [actualDelivered, newRemaining, detail.id]);
            }

            console.log(`   ✨ Quantities recalculated for details.`);
        }

        console.log('\n✅ Data repair completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Repair failed:', error.message);
        process.exit(1);
    }
}

fixPreOrderData();
