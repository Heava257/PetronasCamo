
const mysql = require('mysql2/promise');

async function checkRailwayQty() {
    const connectionUrl = "mysql://root:nxYIDhiYcZweDftsuqbYHualVtBGrUnX@yamanote.proxy.rlwy.net:36838/railway";
    let connection;
    try {
        connection = await mysql.createConnection(connectionUrl);
        const [rows] = await connection.query("SELECT id, name, qty, branch_id FROM product");
        console.log("Railway Products Detail:");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

checkRailwayQty();
