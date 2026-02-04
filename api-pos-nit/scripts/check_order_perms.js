const mysql = require('mysql2/promise');

async function run() {
    const connectionUrl = "mysql://root:nxYIDhiYcZweDftsuqbYHualVtBGrUnX@yamanote.proxy.rlwy.net:36838/railway";

    console.log("🚀 Checking specific permissions...");
    let connection;
    try {
        connection = await mysql.createConnection(connectionUrl);
        const [rows] = await connection.query("SELECT name FROM permissions WHERE name IN ('order.view', 'order.create', 'order.update', 'order.remove')");
        console.log("Found permissions:", rows.map(r => r.name));
    } catch (error) {
        console.error("Error:", error);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

run();
