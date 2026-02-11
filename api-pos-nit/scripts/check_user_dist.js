
const mysql = require('mysql2/promise');

async function checkUsersByBranch() {
    const connectionUrl = "mysql://root:nxYIDhiYcZweDftsuqbYHualVtBGrUnX@yamanote.proxy.rlwy.net:36838/railway";
    let connection;
    try {
        connection = await mysql.createConnection(connectionUrl);
        const [rows] = await connection.query("SELECT branch_id, branch_name, COUNT(*) as count FROM user GROUP BY branch_id, branch_name");
        console.log("User distributions:");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

checkUsersByBranch();
