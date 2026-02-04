require('dotenv').config();
const { db } = require("./src/util/helper");

async function checkUsers() {
    try {
        const [users] = await db.query(`
            SELECT u.id, u.username, u.role_id, r.code as role_code, r.name as role_name 
            FROM user u 
            JOIN role r ON u.role_id = r.id
        `);
        console.log("Users:", JSON.stringify(users, null, 2));

        const [perms] = await db.query("SELECT * FROM permissions WHERE name LIKE 'permission%'");
        console.log("Permission rows:", JSON.stringify(perms, null, 2));

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}
checkUsers();
