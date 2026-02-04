require('dotenv').config();
const { db } = require("./src/util/helper");

async function check() {
    try {
        const [rows] = await db.query('SELECT name FROM permissions WHERE name LIKE "%expanse_type%" OR name LIKE "%expense_type%"');
        console.log("Permissions found:", rows.map(r => r.name));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}
check();
