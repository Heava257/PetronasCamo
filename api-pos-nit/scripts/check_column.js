const path = require('path');
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { db } = require("../src/util/helper");

async function checkColumns() {
    try {
        const [columns] = await db.query("SHOW COLUMNS FROM pre_order_detail LIKE 'destination'");
        console.log("Column check:", columns);
        if (columns.length > 0) {
            console.log("✅ Destination column EXISTS!");
        } else {
            console.log("❌ Destination column MISSING!");
        }
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkColumns();
