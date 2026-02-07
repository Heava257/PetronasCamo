const mysql = require('mysql2/promise');

async function run() {
    const connectionUrl = "mysql://root:nxYIDhiYcZweDftsuqbYHualVtBGrUnX@yamanote.proxy.rlwy.net:36838/railway";
    let connection;
    try {
        connection = await mysql.createConnection(connectionUrl);
        console.log("Connected to database.");
        const [result] = await connection.query("DESCRIBE inventory_transaction");
        console.log("Table structure for inventory_transaction:");
        console.table(result);

        const typeCol = result.find(c => c.Field === 'transaction_type');
        if (typeCol) {
            console.log(`Current definition of transaction_type: ${typeCol.Type}`);
        }
    } catch (error) {
        console.error("Error:", error);
    } finally {
        if (connection) await connection.end();
    }
}

run();
