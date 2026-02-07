const mysql = require('mysql2/promise');

async function run() {
    const connectionUrl = "mysql://root:nxYIDhiYcZweDftsuqbYHualVtBGrUnX@yamanote.proxy.rlwy.net:36838/railway";
    let connection;
    try {
        connection = await mysql.createConnection(connectionUrl);
        console.log("Connected to database.");

        const [rows] = await connection.query(`
            SELECT it.id, it.product_id, it.transaction_type, it.reference_no, p.name as product_name
            FROM inventory_transaction it
            LEFT JOIN product p ON it.product_id = p.id
            WHERE it.transaction_type = 'TRANSFER_IN'
            ORDER BY it.id DESC
            LIMIT 5
        `);

        console.log("Recent TRANSFER_IN transactions:");
        console.table(rows);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        if (connection) await connection.end();
    }
}

run();
