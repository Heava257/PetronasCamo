
require('dotenv').config();
const { db } = require("../src/util/helper");

async function listUsers() {
    try {
        const [rows] = await db.query("SELECT id, name, username, branch_id FROM user ORDER BY id DESC LIMIT 50");
        console.log("Users List:");
        rows.forEach(r => console.log(`${r.id} | ${r.name} | ${r.username} | ${r.branch_id}`));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

listUsers();
