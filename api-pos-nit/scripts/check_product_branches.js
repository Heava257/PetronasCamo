
const mysql = require('mysql2/promise');

async function checkProductBranches() {
    const connectionUrl = "mysql://root:nxYIDhiYcZweDftsuqbYHualVtBGrUnX@yamanote.proxy.rlwy.net:36838/railway";
    let connection;
    try {
        connection = await mysql.createConnection(connectionUrl);
        const [rows] = await connection.query("SELECT branch_id, COUNT(*) as count FROM product GROUP BY branch_id");
        console.log("Product counts by branch_id:");
        console.log(JSON.stringify(rows, null, 2));

        const [sample1] = await connection.query("SELECT name, branch_id FROM product WHERE branch_id = 1 LIMIT 5");
        console.log("\nSample products for branch_id 1:");
        console.log(JSON.stringify(sample1, null, 2));

        process.exit(0);
    } catch (error) {
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

checkProductBranches();
