require('dotenv').config();
const { db } = require("./src/util/helper");

async function checkSales() {
    try {
        const [rows] = await db.query("SELECT name, `group` FROM permissions WHERE `group` IN ('Sales', 'invoices', 'order', 'EnhancedPOSOrder', 'fakeinvoices')");
        console.log("Sales Permissions:", JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}
checkSales();
