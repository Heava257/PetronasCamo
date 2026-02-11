
require('dotenv').config();
const { db } = require("../src/util/helper");

async function checkProductTable() {
    try {
        const [rows] = await db.query("DESCRIBE product");
        console.log("Product Table Fields:");
        rows.forEach(r => console.log(`- ${r.Field}`));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkProductTable();
