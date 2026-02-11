
const mysql = require('mysql2/promise');

async function checkRailwayUsers() {
    const connectionUrl = "mysql://root:nxYIDhiYcZweDftsuqbYHualVtBGrUnX@yamanote.proxy.rlwy.net:36838/railway";
    let connection;
    try {
        connection = await mysql.createConnection(connectionUrl);
        const [rows] = await connection.query("SELECT id, name, username, branch_id FROM user WHERE username IN ('rithsou@gmail.com', 'penhvms2222@gmail.come')");
        console.log("Railway Users Info:");
        console.log(JSON.stringify(rows, null, 2));

        if (rows.length > 0) {
            const branchIds = [...new Set(rows.map(r => r.branch_id).filter(id => id !== null))];
            if (branchIds.length > 0) {
                const [products] = await connection.query(`SELECT id, name, branch_id, user_id FROM product WHERE branch_id IN (${branchIds.join(',')}) LIMIT 5`);
                console.log("\nSample Products in these branches:");
                console.log(JSON.stringify(products, null, 2));

                const [allCount] = await connection.query(`SELECT COUNT(*) as total FROM product WHERE branch_id IN (${branchIds.join(',')})`);
                console.log(`\nTotal products in branch(es) ${branchIds.join(',')}: ${allCount[0].total}`);
            }
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

checkRailwayUsers();
