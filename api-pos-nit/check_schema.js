require('dotenv').config();
const { db } = require("./src/util/helper");

async function checkSchema() {
    try {
        const [rows] = await db.query("SHOW CREATE TABLE user");
        console.log("user table schema:", rows[0]['Create Table']);
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}
checkSchema();
