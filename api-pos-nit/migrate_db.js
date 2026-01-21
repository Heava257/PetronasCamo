require('dotenv').config();
const { db } = require("./src/util/helper");

async function migrate() {
    try {
        console.log("Starting migration...");
        await db.query(`
            ALTER TABLE payments 
            ADD COLUMN IF NOT EXISTS bank_ref VARCHAR(255) NULL AFTER reference_no,
            ADD INDEX IF NOT EXISTS (bank_ref)
        `);
        await db.query(`
            ALTER TABLE supplier_payment 
            ADD COLUMN IF NOT EXISTS bank_ref VARCHAR(255) NULL AFTER reference_no,
            ADD INDEX IF NOT EXISTS (bank_ref)
        `);
        console.log("Migration successful: Added bank_ref column to payments and supplier_payment tables.");
        process.exit(0);
    } catch (error) {
        // If "IF NOT EXISTS" is not supported by the MariaDB/MySQL version, it might throw 1060 (Duplicate column name)
        if (error.errno === 1060 || error.code === 'ER_DUP_FIELDNAME') {
            console.log("Migration skipped: Column bank_ref already exists.");
            process.exit(0);
        }
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
