const mysql = require('mysql2/promise');

const connectionUrl = 'mysql://root:nxYIDhiYcZweDftsuqbYHualVtBGrUnX@yamanote.proxy.rlwy.net:36838/railway';

async function run() {
    let connection;
    try {
        console.log('Connecting...');
        connection = await mysql.createConnection(connectionUrl);

        // permissions to add
        const permissionsToAdd = [
            { name: 'permission.getlist', group: 'permission', is_menu_web: 1, web_route_key: '/permission' },
            { name: 'permission.getone', group: 'permission', is_menu_web: null, web_route_key: null },
            // permission.update already exists as ID 535 but I'll add it to the list just in case needed for role assignment logic
        ];

        for (const p of permissionsToAdd) {
            console.log(`Processing permission: ${p.name}`);

            // 1. Insert/Get ID
            let permissionId;
            const [rows] = await connection.query("SELECT id FROM permissions WHERE name = ?", [p.name]);

            if (rows.length > 0) {
                permissionId = rows[0].id;
                console.log(`  Exists with ID: ${permissionId}`);
            } else {
                const [res] = await connection.query(
                    "INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES (?, ?, ?, ?)",
                    [p.name, p.group, p.is_menu_web, p.web_route_key]
                );
                permissionId = res.insertId;
                console.log(`  Inserted new ID: ${permissionId}`);
            }

            // 2. Assign to Roles (1: Admin, 29: Super Admin, 30: Manager)
            const roleIds = [1, 29, 30];
            for (const roleId of roleIds) {
                await connection.query(
                    "INSERT IGNORE INTO permission_roles (role_id, permission_id) VALUES (?, ?)",
                    [roleId, permissionId]
                );
                console.log(`  Assigned to Role ${roleId}`);
            }
        }

        console.log('Success!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

run();
