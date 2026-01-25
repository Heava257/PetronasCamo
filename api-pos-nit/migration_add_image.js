
const { db } = require("./src/util/helper");

async function run() {
    try {
        console.log("Attempting to add 'image' column to 'purchase' table...");
        await db.query("ALTER TABLE purchase ADD COLUMN image VARCHAR(255) DEFAULT NULL");
        console.log("Migration success: Column 'image' added.");
    } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log("Migration info: Column 'image' already exists.");
        } else {
            console.error("Migration failed:", error.message);
        }
    }
    process.exit();
}

run();
