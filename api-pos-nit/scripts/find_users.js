
require('dotenv').config();
const { db } = require("../src/util/helper");

async function findUsers() {
    try {
        const [rows] = await db.query("SELECT id, name, username, branch_id FROM user WHERE username LIKE '%rithsou%' OR name LIKE '%Rithy%'");
        console.log("Users Found:");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
}

findUsers();
