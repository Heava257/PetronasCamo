
const { db } = require('./src/util/helper');
require('dotenv').config();

async function migrate() {
    try {
        console.log("Checking transaction_type column type...");
        const [rows] = await db.query(`
            SELECT COLUMN_TYPE 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = 'inventory_transaction'
            AND COLUMN_NAME = 'transaction_type'
        `);

        if (rows.length > 0) {
            console.log("Current Type:", rows[0].COLUMN_TYPE);

            // Allow larger VARCHAR or update Enum
            console.log("Modifying column to VARCHAR(50) to support new types...");
            await db.query(`ALTER TABLE inventory_transaction MODIFY COLUMN transaction_type VARCHAR(50)`);
            console.log("✅ Column updated successfully.");
        } else {
            console.log("❌ Column not found?");
        }

        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
