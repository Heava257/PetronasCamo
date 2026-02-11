
const mysql = require('mysql2/promise');

async function checkUserFields() {
    const connectionUrl = "mysql://root:nxYIDhiYcZweDftsuqbYHualVtBGrUnX@yamanote.proxy.rlwy.net:36838/railway";
    let connection;
    try {
        connection = await mysql.createConnection(connectionUrl);
        const [rows] = await connection.query("DESCRIBE user");
        rows.forEach(r => console.log(`- ${r.Field}`));

        const [userData] = await connection.query("SELECT id, name, branch_id, branch_name FROM user WHERE id IN (72, 98)");
        console.log("\nUser Detail Data:");
        console.log(JSON.stringify(userData, null, 2));

        process.exit(0);
    } catch (error) {
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

checkUserFields();
