require('dotenv').config();
const { db } = require("./src/util/helper");

async function checkRoles() {
    try {
        const [roles] = await db.query("SELECT id, name, code FROM role");
        console.log(JSON.stringify(roles, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}
checkRoles();
