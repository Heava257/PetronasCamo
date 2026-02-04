require('dotenv').config();
const { db } = require("../src/util/helper");

async function check() {
    try {
        const [rows] = await db.query("DESC customer");
        console.log("Columns in customer table:");
        rows.forEach(row => console.log(`- ${row.Field} (${row.Type})`));
        process.exit(0);
    } catch (error) {
        console.error("Error connecting or querying:", error.message);
        process.exit(1);
    }
}

check();
