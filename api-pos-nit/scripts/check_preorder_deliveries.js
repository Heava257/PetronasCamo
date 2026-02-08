const { db } = require('../src/util/helper');

async function checkPreOrderDeliveries() {
    try {
        console.log('\n🔍 Checking Pre-Order Deliveries...\n');

        // Get the latest pre-order
        const [preOrders] = await db.query(`
      SELECT id, pre_order_no, customer_name, status
      FROM pre_order
      ORDER BY id DESC
      LIMIT 1
    `);

        if (preOrders.length === 0) {
            console.log('❌ No pre-orders found');
            process.exit(0);
        }

        const preOrder = preOrders[0];
        console.log(`📦 Pre-Order: ${preOrder.pre_order_no} - ${preOrder.customer_name}`);
        console.log(`   Status: ${preOrder.status}\n`);

        // Get pre-order details
        const [details] = await db.query(`
      SELECT 
        pod.id,
        pod.product_name,
        pod.qty as ordered_qty,
        pod.delivered_qty,
        pod.remaining_qty
      FROM pre_order_detail pod
      WHERE pod.pre_order_id = ?
    `, [preOrder.id]);

        console.log('📋 Pre-Order Details:');
        details.forEach(d => {
            console.log(`   ${d.product_name}:`);
            console.log(`      Ordered: ${d.ordered_qty}L`);
            console.log(`      Delivered: ${d.delivered_qty}L`);
            console.log(`      Remaining: ${d.remaining_qty}L`);
        });

        // Get delivery history
        const [deliveries] = await db.query(`
      SELECT 
        pod_del.id,
        pod_del.invoice_id,
        pod_del.delivered_qty,
        pod_del.delivery_date,
        pod.product_name
      FROM pre_order_delivery pod_del
      JOIN pre_order_detail pod ON pod_del.pre_order_detail_id = pod.id
      WHERE pod_del.pre_order_id = ?
      ORDER BY pod_del.delivery_date DESC
    `, [preOrder.id]);

        console.log(`\n📜 Delivery History (${deliveries.length} records):`);
        deliveries.forEach((d, idx) => {
            console.log(`   ${idx + 1}. Invoice #${d.invoice_id || 'N/A'}: ${d.delivered_qty}L of ${d.product_name}`);
            console.log(`      Date: ${d.delivery_date}`);
        });

        // Check for duplicates
        const invoiceIds = deliveries.map(d => d.invoice_id).filter(id => id);
        const duplicates = invoiceIds.filter((id, idx) => invoiceIds.indexOf(id) !== idx);

        if (duplicates.length > 0) {
            console.log(`\n⚠️  DUPLICATE DELIVERIES DETECTED for invoices: ${[...new Set(duplicates)].join(', ')}`);
        } else {
            console.log(`\n✅ No duplicate deliveries found`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

checkPreOrderDeliveries();
