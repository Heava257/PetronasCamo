require('dotenv').config();
const { db } = require("../src/util/helper");

async function runMigration() {
    console.log("🚀 Starting database migration for Pre-Order Delivery...");

    try {
        // 1. Create table pre_order_delivery
        await db.query(`
      CREATE TABLE IF NOT EXISTS pre_order_delivery (
        id INT AUTO_INCREMENT PRIMARY KEY,
        pre_order_id INT NOT NULL,
        pre_order_detail_id INT NOT NULL,
        invoice_id INT NULL,
        delivered_qty DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        delivery_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        destination VARCHAR(255) NULL,
        created_by INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_pre_order (pre_order_id),
        INDEX idx_detail (pre_order_detail_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        console.log("✅ Table 'pre_order_delivery' checked/created.");

        // 2. Add columns to pre_order_detail if they don't exist
        // MySQL doesn't support IF NOT EXISTS for columns in ALTER TABLE directly in all versions, 
        // so we use a safe approach or ignore errors if columns exist.

        const [columns] = await db.query(`SHOW COLUMNS FROM pre_order_detail LIKE 'delivered_qty'`);
        if (columns.length === 0) {
            await db.query(`
            ALTER TABLE pre_order_detail
            ADD COLUMN delivered_qty DECIMAL(10, 2) DEFAULT 0.00 AFTER amount,
            ADD COLUMN remaining_qty DECIMAL(10, 2) DEFAULT 0.00 AFTER delivered_qty,
            ADD COLUMN destination VARCHAR(255) NULL AFTER remaining_qty
        `);
            console.log("✅ Added delivered_qty, remaining_qty, destination to pre_order_detail");

            // Initialize remaining_qty = qty
            await db.query(`UPDATE pre_order_detail SET remaining_qty = qty WHERE remaining_qty = 0`);
            console.log("✅ Initialized remaining_qty");
        } else {
            console.log("ℹ️ Columns in pre_order_detail already exist.");
        }

        console.log("🎉 Migration completed successfully!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

runMigration();
