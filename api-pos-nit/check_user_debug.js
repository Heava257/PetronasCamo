require('dotenv').config();
const { db } = require("./src/util/helper");

async function checkUser() {
    try {
        const userEmail = "kamsreymompts@gmail.com";
        console.log(`Checking user: ${userEmail}`);

        const [users] = await db.query(
            "SELECT id, username, name, role_id, branch_name, group_id FROM user WHERE username = :username OR email = :username",
            { username: userEmail }
        );

        if (users.length === 0) {
            console.log("User not found!");
        } else {
            console.log("User found:", JSON.stringify(users[0], null, 2));

            const roleId = users[0].role_id;
            const [role] = await db.query("SELECT * FROM role WHERE id = :id", { id: roleId });
            console.log("Role info:", JSON.stringify(role[0], null, 2));
        }

        process.exit();
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkUser();
