const mysql = require('mysql2/promise');

async function run() {
    const connectionUrl = "mysql://root:nxYIDhiYcZweDftsuqbYHualVtBGrUnX@yamanote.proxy.rlwy.net:36838/railway";
    let connection;
    try {
        connection = await mysql.createConnection(connectionUrl);
        console.log("Connected to database.");

        console.log("Altering inventory_transaction table to add TRANSFER_IN and TRANSFER_OUT to transaction_type ENUM...");
        await connection.query(`
            ALTER TABLE inventory_transaction 
            MODIFY COLUMN transaction_type ENUM('PURCHASE_IN', 'SALE_OUT', 'ADJUSTMENT', 'RETURN', 'TRANSFER_IN', 'TRANSFER_OUT') NOT NULL
        `);

        console.log("✅ Success! Table altered.");

        // Verify
        const [result] = await connection.query("DESCRIBE inventory_transaction");
        const typeCol = result.find(c => c.Field === 'transaction_type');
        console.log(`New definition: ${typeCol.Type}`);

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        if (connection) await connection.end();
    }
}

run();
