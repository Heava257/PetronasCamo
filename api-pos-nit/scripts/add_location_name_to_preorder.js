require('dotenv').config();
const { db } = require("../src/util/helper");

async function runMigration() {
    console.log("🚀 Starting database migration: Add location_name to pre_order...");

    try {
        const [columns] = await db.query(`SHOW COLUMNS FROM pre_order LIKE 'location_name'`);
        if (columns.length === 0) {
            await db.query(`
                ALTER TABLE pre_order
                ADD COLUMN location_name VARCHAR(255) NULL AFTER delivery_address
            `);
            console.log("✅ Added location_name to pre_order table.");
        } else {
            console.log("ℹ️ Column location_name already exists in pre_order.");
        }

        console.log("🎉 Migration completed successfully!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

runMigration();
