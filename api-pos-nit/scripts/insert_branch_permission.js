const mysql = require('mysql2/promise');

const connectionUrl = 'mysql://root:nxYIDhiYcZweDftsuqbYHualVtBGrUnX@yamanote.proxy.rlwy.net:36838/railway';

async function run() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await mysql.createConnection(connectionUrl);

        // 1. Insert the new permission
        console.log('Inserting permission...');
        const [result] = await connection.query(
            "INSERT IGNORE INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES (?, ?, ?, ?)",
            ['branch-permission.getlist', 'branch-permission', 1, '/branch-permission']
        );

        let permissionId = result.insertId;
        if (!permissionId) {
            // Since it was IGNORE, maybe it exists. Fetch it.
            const [rows] = await connection.query("SELECT id FROM permissions WHERE name = ?", ['branch-permission.getlist']);
            if (rows.length > 0) {
                permissionId = rows[0].id;
            }
        }

        if (!permissionId) {
            throw new Error("Could not insert or find permission ID");
        }

        console.log(`Permission ID: ${permissionId}`);

        // 2. Assign to Admin (1), Super Admin (29), Manager (30)
        const roleIds = [1, 29, 30];
        for (const roleId of roleIds) {
            console.log(`Assigning to Role ${roleId}...`);
            await connection.query(
                "INSERT IGNORE INTO permission_roles (role_id, permission_id) VALUES (?, ?)",
                [roleId, permissionId]
            );
        }

        console.log('Success!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

run();
