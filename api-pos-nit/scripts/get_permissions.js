const mysql = require('mysql2/promise');

async function run() {
    const connectionUrl = "mysql://root:nxYIDhiYcZweDftsuqbYHualVtBGrUnX@yamanote.proxy.rlwy.net:36838/railway";

    console.log("🚀 Fetching Existing Permissions...");
    let connection;
    try {
        connection = await mysql.createConnection(connectionUrl);
        const [rows] = await connection.query("SELECT name FROM permissions");
        console.log("Available permissions:", rows.map(r => r.name));
    } catch (error) {
        console.error("Error:", error);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

run();
