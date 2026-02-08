require('dotenv').config();
const { db } = require("./src/util/helper");

async function test() {
    try {
        console.log("🔄 Testing connection to Railway...");
        const [rows] = await db.query("SELECT 1 + 1 AS result, DATABASE() as db_name");
        console.log("✅ SUCCESS! Connected to:", rows[0].db_name);
        console.log("📝 Result of 1+1:", rows[0].result);

        const [users] = await db.query("SELECT COUNT(*) as count FROM user");
        console.log("👥 Total users in Railway:", users[0].count);

        const [branches] = await db.query("SELECT COUNT(*) as count FROM branch");
        console.log("🏢 Total branches in Railway:", branches[0].count);

        process.exit(0);
    } catch (err) {
        console.error("❌ CONNECTION FAILED:", err.message);
        process.exit(1);
    }
}

test();
