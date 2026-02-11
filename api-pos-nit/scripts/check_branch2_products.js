
const mysql = require('mysql2/promise');

async function checkProductCount() {
    const connectionUrl = "mysql://root:nxYIDhiYcZweDftsuqbYHualVtBGrUnX@yamanote.proxy.rlwy.net:36838/railway";
    let connection;
    try {
        connection = await mysql.createConnection(connectionUrl);
        const [rows] = await connection.query("SELECT COUNT(*) as total FROM product WHERE branch_id = 2");
        console.log(`Total products in branch 2: ${rows[0].total}`);
        process.exit(0);
    } catch (error) {
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

checkProductCount();
