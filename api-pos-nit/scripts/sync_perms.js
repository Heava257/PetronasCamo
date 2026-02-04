const mysql = require('mysql2/promise');

async function run() {
    const connectionUrl = "mysql://root:nxYIDhiYcZweDftsuqbYHualVtBGrUnX@yamanote.proxy.rlwy.net:36838/railway";

    console.log("🚀 Syncing Order and View Permissions...");
    let connection;
    try {
        connection = await mysql.createConnection(connectionUrl);

        const permsToEnsure = [
            'order.view',
            'order.create',
            'order.update',
            'order.remove',
            'product.view',
            'customer.view',
            'category.view'
        ];

        for (const permName of permsToEnsure) {
            const [exists] = await connection.query("SELECT id FROM permissions WHERE name = ?", [permName]);
            let permId;
            if (exists.length === 0) {
                const [ins] = await connection.query("INSERT INTO permissions (name, `group`) VALUES (?, ?)", [permName, permName.split('.')[0]]);
                permId = ins.insertId;
                console.log(`✅ Created ${permName}`);
            } else {
                permId = exists[0].id;
                console.log(`ℹ️ ${permName} already exists`);
            }

            // Assign to all roles
            const [roles] = await connection.query("SELECT id FROM role");
            let count = 0;
            for (const role of roles) {
                const [has] = await connection.query("SELECT * FROM permission_roles WHERE role_id = ? AND permission_id = ?", [role.id, permId]);
                if (has.length === 0) {
                    await connection.query("INSERT INTO permission_roles (role_id, permission_id) VALUES (?, ?)", [role.id, permId]);
                    count++;
                }
            }
            if (count > 0) console.log(`   Assigned to ${count} roles`);
        }

        console.log("🎉 Permission sync completed!");
    } catch (error) {
        console.error("Error:", error);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

run();
