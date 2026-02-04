require('dotenv').config();
const { db } = require("./src/util/helper");

async function checkPurchaseUpdate() {
    try {
        const [rows] = await db.query("SELECT id, name FROM permissions WHERE name IN ('purchase.update', 'purchase.edit')");
        console.log("Purchase Update/Edit info:", JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}
checkPurchaseUpdate();
