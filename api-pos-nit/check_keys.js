require('dotenv').config();
const { db } = require("./src/util/helper");

async function checkKeys() {
    try {
        const [rows] = await db.query("SHOW KEYS FROM user");
        console.log("user table keys:", JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}
checkKeys();
