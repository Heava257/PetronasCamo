const { db } = require("./src/util/helper");

async function checkCustomers() {
    try {
        const [customers] = await db.query("SELECT id, name, branch_name, user_id FROM customer");
        console.log("Customers in DB:", JSON.stringify(customers, null, 2));

        const [users] = await db.query("SELECT id, name, branch_name, branch_id FROM user");
        console.log("Users in DB:", JSON.stringify(users, null, 2));
    } catch (error) {
        console.error("Error:", error);
    } finally {
        process.exit();
    }
}

checkCustomers();
