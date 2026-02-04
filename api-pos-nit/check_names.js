require('dotenv').config();
const { db } = require("./src/util/helper");

async function checkUsers() {
    try {
        const [users] = await db.query("SELECT id, name, username, role_id FROM user");
        console.log("Users:", JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
}
checkUsers();
