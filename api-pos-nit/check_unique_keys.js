require('dotenv').config();
const { db } = require("./src/util/helper");

async function checkUniqueKeys() {
    try {
        const [rows] = await db.query("SHOW KEYS FROM user WHERE Non_unique = 0");
        console.log("Unique keys:", JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}
checkUniqueKeys();
