
const mysql = require('mysql2/promise');

async function checkAllProducts() {
    const connectionUrl = "mysql://root:nxYIDhiYcZweDftsuqbYHualVtBGrUnX@yamanote.proxy.rlwy.net:36838/railway";
    let connection;
    try {
        connection = await mysql.createConnection(connectionUrl);
        const [rows] = await connection.query("SELECT id, name, branch_id FROM product");
        console.log(`Total rows fetched: ${rows.length}`);
        rows.forEach(r => console.log(`${r.id} | ${r.name} | ${r.branch_id}`));
        process.exit(0);
    } catch (error) {
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

checkAllProducts();
