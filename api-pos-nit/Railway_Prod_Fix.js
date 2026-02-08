/**
 * RAILWAY PRODUCTION FIX SCRIPT
 * Run this on your local machine with PRODUCTION credentials in .env
 * OR deploy it and run it on Railway.
 */
require('dotenv').config();
const { db } = require("./src/util/helper");

async function runProductionFix() {
    try {
        console.log("🚀 Starting Production Branch Sync...");

        const tablesToFix = [
            'product', 'category', 'customer', 'order', 'expense',
            'purchase', 'supplier', 'payments', 'pre_order',
            'pre_order_detail', 'pre_order_delivery', 'order_detail',
            'inventory_transaction',
            'employee'
        ];

        // 1. Add branch_id to all tables
        for (const table of tablesToFix) {
            const [cols] = await db.query(`SHOW COLUMNS FROM \`${table}\``);
            const fieldNames = cols.map(c => c.Field);

            if (!fieldNames.includes('branch_id')) {
                console.log(`➕ Adding 'branch_id' to ${table}...`);
                await db.query(`ALTER TABLE \`${table}\` ADD COLUMN branch_id INT NULL`);
            }

            if (!fieldNames.includes('branch_name') && !['pre_order_detail', 'pre_order_delivery', 'order_detail'].includes(table)) {
                console.log(`➕ Adding 'branch_name' to ${table}...`);
                await db.query(`ALTER TABLE \`${table}\` ADD COLUMN branch_name VARCHAR(255) NULL`);
            }
        }

        // 2. Add actual_delivery_date to pre_order
        const [poCols] = await db.query("SHOW COLUMNS FROM pre_order");
        if (!poCols.map(c => c.Field).includes('actual_delivery_date')) {
            console.log("➕ Adding 'actual_delivery_date' to pre_order...");
            await db.query("ALTER TABLE pre_order ADD COLUMN actual_delivery_date DATETIME NULL AFTER delivery_date");
        }

        // 3. Backfill data
        console.log("🔄 Backfilling branch data...");

        // Core tables (linked by user_id/create_by)
        const creatorJoinedTables = ['product', 'category', 'customer', 'expense', 'purchase', 'supplier'];
        for (const table of creatorJoinedTables) {
            const creatorCol = (table === 'customer' || table === 'category') ? 'user_id' : (table === 'expense' ? 'user_id' : 'create_by');
            // Note: 'create_by' in product is sometimes numeric, sometimes name. We use it if it matches user.id
            console.log(`   - Syncing ${table}...`);
            await db.query(`
        UPDATE \`${table}\` t 
        INNER JOIN user u ON t.${creatorCol} = u.id 
        SET t.branch_id = u.branch_id, t.branch_name = u.branch_name 
        WHERE t.branch_id IS NULL
      `);
        }

        // Orders (special keywords)
        console.log("   - Syncing order...");
        await db.query(`
      UPDATE \`order\` o 
      INNER JOIN user u ON o.user_id = u.id 
      SET o.branch_id = u.branch_id, o.branch_name = u.branch_name 
      WHERE o.branch_id IS NULL
    `);

        // Pre-orders
        console.log("   - Syncing pre_order...");
        await db.query(`
      UPDATE pre_order po 
      INNER JOIN user u ON po.created_by = u.id 
      SET po.branch_id = u.branch_id, po.branch_name = u.branch_name 
      WHERE po.branch_id IS NULL
    `);

        // Payments
        console.log("   - Syncing payments...");
        await db.query(`
      UPDATE payments p 
      INNER JOIN \`order\` o ON p.order_id = o.id 
      SET p.branch_id = o.branch_id 
      WHERE p.branch_id IS NULL
    `);

        // Detail tables
        console.log("   - Syncing detail tables...");
        await db.query(`UPDATE pre_order_detail pod JOIN pre_order po ON pod.pre_order_id = po.id SET pod.branch_id = po.branch_id WHERE pod.branch_id IS NULL`);
        await db.query(`UPDATE pre_order_delivery pod JOIN pre_order po ON pod.pre_order_id = po.id SET pod.branch_id = po.branch_id WHERE pod.branch_id IS NULL`);
        await db.query(`UPDATE order_detail od JOIN \`order\` o ON od.order_id = o.id SET od.branch_id = o.branch_id WHERE od.branch_id IS NULL`);
        await db.query(`UPDATE inventory_transaction it INNER JOIN user u ON it.user_id = u.id SET it.branch_id = u.branch_id WHERE it.branch_id IS NULL`);
        await db.query(`UPDATE employee e INNER JOIN user u ON e.creator_id = u.id SET e.branch_id = u.branch_id, e.branch_name = u.branch_name WHERE e.branch_id IS NULL`);

        console.log("✅ Production Fix Completed Successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ PRODUCTION FIX FAILED:", err.message);
        process.exit(1);
    }
}

runProductionFix();
