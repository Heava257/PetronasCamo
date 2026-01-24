const { db } = require("./src/util/helper");

async function migrate() {
    try {
        console.log("Starting migration: Adding slip_image to supplier_payment...");
        await db.query("ALTER TABLE supplier_payment ADD COLUMN slip_image TEXT;");
        console.log("Success: slip_image column added.");
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_COLUMN_NAME') {
            console.log("Column slip_image already exists.");
            process.exit(0);
        }
        console.error("Migration failed:", error);
        process.exit(1);
    }
}

migrate();
