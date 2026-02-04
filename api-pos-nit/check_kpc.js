require('dotenv').config();
const { db } = require("./src/util/helper");

async function checkKPC() {
    try {
        const [users] = await db.query("SELECT id, username, tel, name, branch_name FROM user WHERE name LIKE '%កំពង់ចាម%' OR branch_name LIKE '%កំពង់ចាម%'");
        console.log("Kampong Cham users:", JSON.stringify(users, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}
checkKPC();
