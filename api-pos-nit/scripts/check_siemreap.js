
const mysql = require('mysql2/promise');

async function checkSiemReap() {
    const connectionUrl = "mysql://root:nxYIDhiYcZweDftsuqbYHualVtBGrUnX@yamanote.proxy.rlwy.net:36838/railway";
    let connection;
    try {
        connection = await mysql.createConnection(connectionUrl);
        const [rows] = await connection.query("SELECT id, name, username, branch_id, branch_name FROM user WHERE branch_name LIKE '%Siem%' OR branch_id = 1");
        console.log("Users in Branch 1 or with 'Siem' in name:");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

checkSiemReap();
