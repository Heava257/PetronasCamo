
const mysql = require('mysql2/promise');

async function fixDataInconsistency() {
    const connectionUrl = "mysql://root:nxYIDhiYcZweDftsuqbYHualVtBGrUnX@yamanote.proxy.rlwy.net:36838/railway";
    let connection;
    try {
        console.log("Connecting to RAILWAY database...");
        connection = await mysql.createConnection(connectionUrl);
        console.log("Connected.");

        // 1. Move products from branch 1 to branch 2
        console.log("Moving products from branch 1 (Siem Reap) to branch 2 (Headquarters)...");
        const [prodResult] = await connection.query("UPDATE product SET branch_id = 2 WHERE branch_id = 1");
        console.log(`Updated ${prodResult.affectedRows} products.`);

        // 2. Fix users who are in Headquarters but have wrong branch_id
        console.log("Consolidating Headquarters users into branch_id 2...");
        const [userResult] = await connection.query("UPDATE user SET branch_id = 2 WHERE branch_name = 'ទីស្នាក់ការកណ្តាល' AND branch_id != 2");
        console.log(`Updated ${userResult.affectedRows} users to Headquarters branch.`);

        // 3. Verify Rithy Sou and PENH VMS branch_id
        const [verify] = await connection.query("SELECT id, name, branch_id FROM user WHERE id IN (72, 98)");
        console.log("\nVerified Users:");
        console.log(JSON.stringify(verify, null, 2));

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

fixDataInconsistency();
