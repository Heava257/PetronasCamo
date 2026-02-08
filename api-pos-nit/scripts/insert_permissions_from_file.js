const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const filePath = path.join('C:', 'Users', 'pongc', 'Desktop', 'PO_System', 'family_finances', 'src-note', 'database', 'insert', 'Permission.sql');
const connectionUrl = 'mysql://root:nxYIDhiYcZweDftsuqbYHualVtBGrUnX@yamanote.proxy.rlwy.net:36838/railway';

async function run() {
    let connection;
    try {
        console.log(`Connecting to database...`);
        connection = await mysql.createConnection(connectionUrl);
        console.log('Connected.');

        console.log(`Reading file: ${filePath}`);
        const content = fs.readFileSync(filePath, 'utf8');

        // 1. Extract all values in tuple format: ("name", "group", 1/NULL, "route"/NULL)
        const regex = /\(\s*"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*(\d+|NULL)\s*,\s*("[^"]+"|NULL)\s*\)/g;

        let match;
        const values = [];
        const seen = new Set();

        while ((match = regex.exec(content)) !== null) {
            const name = match[1];
            const group = match[2];
            const isMenu = match[3] === 'NULL' ? null : parseInt(match[3]);
            let route = match[4];
            if (route === 'NULL') route = null;
            else route = route.replace(/^"|"$/g, ''); // Remove quotes

            // Avoid duplicates in the localized list
            if (!seen.has(name)) {
                seen.add(name);
                values.push([name, group, isMenu, route]);
            }
        }

        console.log(`Found ${values.length} permissions to insert.`);

        if (values.length > 0) {
            // Chunk inserts to avoid packet size issues
            const chunkSize = 50;
            for (let i = 0; i < values.length; i += chunkSize) {
                const chunk = values.slice(i, i + chunkSize);

                const sql = `
          INSERT IGNORE INTO permissions (name, \`group\`, is_menu_web, web_route_key)
          VALUES ?
        `;

                await connection.query(sql, [chunk]);
                console.log(`Inserted chunk ${i / chunkSize + 1}`);
            }
            console.log('Permissions inserted successfully.');
        } else {
            console.log('No permissions found matching the pattern.');
        }

        // 2. Assign ALL permissions to Super Admin (Role ID 29)
        console.log('Assigning all permissions to Super Admin (Role 29)...');
        await connection.query(`
      INSERT IGNORE INTO permission_roles (role_id, permission_id)
      SELECT 29, id FROM permissions
    `);
        console.log('Super Admin permissions updated.');

        // 3. Assign ALL permissions to Admin (Role ID 1)
        console.log('Assigning all permissions to Admin (Role 1)...');
        await connection.query(`
      INSERT IGNORE INTO permission_roles (role_id, permission_id)
      SELECT 1, id FROM permissions
    `);
        console.log('Admin permissions updated.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

run();
