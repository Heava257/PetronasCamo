const path = require('path');
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { db } = require("../src/util/helper");

async function migrate() {
    try {
        console.log("Adding columns to payments table...");
        await db.query(`
      ALTER TABLE payments 
      ADD COLUMN status ENUM('active', 'void') DEFAULT 'active' AFTER amount,
      ADD COLUMN void_reason TEXT NULL AFTER notes,
      ADD COLUMN void_at DATETIME NULL AFTER updated_at,
      ADD COLUMN void_by INT NULL AFTER void_at
    `);
        console.log("✅ Columns added successfully.");
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log("⚠️ Columns already exist, skipping.");
            process.exit(0);
        }
        console.error("❌ Error:", error);
        process.exit(1);
    }
}

migrate();
