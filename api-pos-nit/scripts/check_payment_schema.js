const path = require('path');
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const { db } = require("../src/util/helper");

async function checkPaymentTable() {
    try {
        const [columns] = await db.query("SHOW COLUMNS FROM payments");
        console.log("Columns:", columns.map(c => c.Field));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkPaymentTable();
