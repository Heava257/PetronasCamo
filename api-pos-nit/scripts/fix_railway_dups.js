
const mysql = require('mysql2/promise');

async function checkRailwayDuplicates() {
    const connectionUrl = "mysql://root:nxYIDhiYcZweDftsuqbYHualVtBGrUnX@yamanote.proxy.rlwy.net:36838/railway";
    let connection;
    try {
        console.log("Connecting to RAILWAY database...");
        connection = await mysql.createConnection(connectionUrl);
        console.log("Connected.");

        const [rows] = await connection.query(`
            SELECT name, COUNT(*) as count 
            FROM permissions 
            GROUP BY name 
            HAVING count > 1
        `);

        console.log("Railway Duplicates:", JSON.stringify(rows, null, 2));

        if (rows.length > 0) {
            console.log("Found duplicates on Railway. Cleaning up...");
            // Run the same cleanup logic here
            for (const dup of rows) {
                const [all] = await connection.query("SELECT id FROM permissions WHERE name = ? ORDER BY id ASC", [dup.name]);
                const keepId = all[0].id;
                const removeIds = all.slice(1).map(r => r.id);

                for (const removeId of removeIds) {
                    console.log(`  Cleaning ${dup.name}: ID ${removeId} -> Keep ${keepId}`);
                    await connection.query("UPDATE IGNORE permission_roles SET permission_id = ? WHERE permission_id = ?", [keepId, removeId]);
                    await connection.query("DELETE FROM permission_roles WHERE permission_id = ?", [removeId]);
                    await connection.query("DELETE FROM permissions WHERE id = ?", [removeId]);
                }
            }
            console.log("Cleanup complete on Railway.");

            // Try to add UNIQUE index
            try {
                await connection.query("ALTER TABLE permissions ADD UNIQUE INDEX idx_permission_name_unique (name)");
                console.log("Unique index added on Railway.");
            } catch (e) {
                console.log("Could not add unique index:", e.message);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    } finally {
        if (connection) await connection.end();
    }
}

checkRailwayDuplicates();
