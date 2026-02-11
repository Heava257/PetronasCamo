
const mysql = require('mysql2/promise');

async function checkUserRoles() {
    const connectionUrl = "mysql://root:nxYIDhiYcZweDftsuqbYHualVtBGrUnX@yamanote.proxy.rlwy.net:36838/railway";
    let connection;
    try {
        connection = await mysql.createConnection(connectionUrl);
        const [rows] = await connection.query(`
            SELECT u.id, u.name, r.name as role_name, r.id as role_id 
            FROM user u 
            JOIN role r ON u.role_id = r.id 
            WHERE u.id IN (72, 98)
        `);
        console.log("User Roles:");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

checkUserRoles();
