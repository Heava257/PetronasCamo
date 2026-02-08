require('dotenv').config();
const { db } = require("./src/util/helper");

const tablesToUpdate = [
    'pre_order',
    'pre_order_detail',
    'pre_order_delivery',
    'order_detail'
];

async function runExtendedBranchSync() {
    try {
        console.log("🚀 Starting Extended Branch Sync Migration...");

        for (const table of tablesToUpdate) {
            const escapedTable = `\`${table}\``;
            console.log(`📦 Checking table: ${table}...`);

            // 1. Add branch_id column
            try {
                await db.query(`ALTER TABLE ${escapedTable} ADD COLUMN \`branch_id\` INT NULL AFTER \`user_id\``);
                console.log(`✅ Added 'branch_id' to ${table}.`);
            } catch (dbErr) {
                if (dbErr.code === 'ER_DUP_FIELDNAME') {
                    console.log(`ℹ️ 'branch_id' already exists in ${table}.`);
                } else if (dbErr.code === 'ER_BAD_FIELD_ERROR' && table.includes('detail')) {
                    // Maybe no user_id in detail tables? Let's try adding it at the end
                    await db.query(`ALTER TABLE ${escapedTable} ADD COLUMN \`branch_id\` INT NULL`);
                    console.log(`✅ Added 'branch_id' to ${table} (appended).`);
                } else {
                    console.warn(`⚠️ Error adding column to ${table}: ${dbErr.message}`);
                }
            }

            // 2. Backfill branch_id
            // If table has user_id, sync from user table
            // If table is pre_order_detail, sync from pre_order
            // If table is order_detail, sync from order
            let syncSql = '';
            if (table === 'pre_order') {
                syncSql = `UPDATE pre_order po INNER JOIN user u ON po.created_by = u.id SET po.branch_id = u.branch_id WHERE po.branch_id IS NULL`;
            } else if (table === 'pre_order_detail') {
                syncSql = `UPDATE pre_order_detail pod INNER JOIN pre_order po ON pod.pre_order_id = po.id SET pod.branch_id = po.branch_id WHERE pod.branch_id IS NULL`;
            } else if (table === 'order_detail') {
                syncSql = `UPDATE order_detail od INNER JOIN \`order\` o ON od.order_id = o.id SET od.branch_id = o.branch_id WHERE od.branch_id IS NULL`;
            } else if (table === 'pre_order_delivery') {
                syncSql = `UPDATE pre_order_delivery pod INNER JOIN pre_order po ON pod.pre_order_id = po.id SET pod.branch_id = po.branch_id WHERE pod.branch_id IS NULL`;
            }

            if (syncSql) {
                const [result] = await db.query(syncSql);
                console.log(`✅ Synced ${result.affectedRows} rows in ${table}.`);
            }
        }

        console.log("\n✨ Extended Migration Completed!");
        process.exit(0);
    } catch (err) {
        console.error("\n❌ MIGRATION FAILED:", err.message);
        process.exit(1);
    }
}

runExtendedBranchSync();
