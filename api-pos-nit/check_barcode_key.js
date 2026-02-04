require('dotenv').config();
const { db } = require("./src/util/helper");

async function checkBarcodeKey() {
    try {
        const [rows] = await db.query("SHOW KEYS FROM user WHERE Column_name = 'barcode'");
        console.log("barcode key:", JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}
checkBarcodeKey();
