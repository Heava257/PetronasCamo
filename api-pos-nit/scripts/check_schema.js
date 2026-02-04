const mysql = require('mysql2/promise');

async function run() {
    const connectionUrl = "mysql://root:nxYIDhiYcZweDftsuqbYHualVtBGrUnX@yamanote.proxy.rlwy.net:36838/railway";

    console.log("🚀 Checking Permissions Schema...");
    let connection;
    try {
        connection = await mysql.createConnection(connectionUrl);
        const [fields] = await connection.query("DESC permissions");
        console.log("Columns in permissions table:", fields.map(f => f.Field));
    } catch (error) {
        console.error("Error:", error);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

run();
