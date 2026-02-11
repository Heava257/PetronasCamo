
const mysql = require('mysql2/promise');

async function checkCommandCenter() {
    const connectionUrl = "mysql://root:nxYIDhiYcZweDftsuqbYHualVtBGrUnX@yamanote.proxy.rlwy.net:36838/railway";
    let connection;
    try {
        connection = await mysql.createConnection(connectionUrl);
        const [rows] = await connection.query("SELECT id, name, branch_id, branch_name FROM user WHERE branch_name LIKE '%បញ្ជាការ%'");
        console.log("Users with 'Command Center' in branch name:");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

checkCommandCenter();
