
require('dotenv').config();
const { db } = require("../src/util/helper");

async function checkUsers() {
    try {
        const [rows] = await db.query("SELECT id, name, username, branch_id FROM user WHERE username IN ('rithsou@gmail.com', 'penhvms2222@gmail.com')");
        console.log("Users Info:");
        console.log(JSON.stringify(rows, null, 2));

        if (rows.length > 0) {
            const branchIds = [...new Set(rows.map(r => r.branch_id).filter(id => id !== null))];
            if (branchIds.length > 0) {
                const [products] = await db.query(`SELECT id, name, branch_id, user_id FROM product WHERE branch_id IN (${branchIds.join(',')}) LIMIT 10`);
                console.log("\nProducts in these branches:");
                console.log(JSON.stringify(products, null, 2));
            } else {
                console.log("\nNeither user has a branch_id set.");
            }
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkUsers();
