require('dotenv').config();
const { db } = require("./src/util/helper");

const tablesToUpdate = [
    'product',
    'category',
    'customer',
    'order',
    'expense',
    'purchase',
    'supplier',
    'payments'
];

async function runFullBranchSync() {
    try {
        console.log("🚀 Starting Full Branch Sync Migration...");

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
                } else {
                    console.warn(`⚠️ Error adding column to ${table}: ${dbErr.message}`);
                }
            }

            // 2. Backfill branch_id from user table
            console.log(`🔄 Backfilling branch_id for ${table}...`);
            const syncSql = `
        UPDATE ${escapedTable} t
        INNER JOIN user u ON t.user_id = u.id
        SET t.branch_id = u.branch_id
        WHERE t.branch_id IS NULL AND u.branch_id IS NOT NULL
      `;
            const [result] = await db.query(syncSql);
            console.log(`✅ Synced ${result.affectedRows} rows in ${table}.`);

            // 3. Optional: Sync from branch_name if branch_id still NULL
            if (table === 'customer' || table === 'order') {
                console.log(`🔄 Fallback sync by branch_name for ${table}...`);
                const fallbackSql = `
          UPDATE ${escapedTable} t
          INNER JOIN branch b ON t.branch_name = b.name
          SET t.branch_id = b.id
          WHERE t.branch_id IS NULL
        `;
                const [fallbackResult] = await db.query(fallbackSql).catch(() => [{ affectedRows: 0 }]);
                console.log(`✅ Fallback synced ${fallbackResult.affectedRows} rows in ${table}.`);
            }
        }

        console.log("\n✨ Migration Completed Successfully!");
        process.exit(0);
    } catch (err) {
        console.error("\n❌ MIGRATION FAILED:", err.message);
        process.exit(1);
    }
}

runFullBranchSync();
