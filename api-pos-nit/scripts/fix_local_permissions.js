require('dotenv').config(); // Load .env file
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Use local config from .env or default to localhost
const connectionConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'petronas_last4_full',
    port: process.env.DB_PORT || 3306,
    namedPlaceholders: true
};

console.log('Using database config:', { ...connectionConfig, password: '***' });

async function run() {
    let connection;
    try {
        console.log('Connecting to LOCAL database...');
        connection = await mysql.createConnection(connectionConfig);
        console.log('Connected to local DB successfully.');

        // 1. Insert missing permissions for Permission Management
        // We need 'permission.getlist', 'permission.getone'
        // And 'branch-permission.getlist', 'branch-permission.getone', etc.

        // Check if branch-permission.getlist exists
        const permissionsToAdd = [
            { name: 'permission.getlist', group: 'permission', is_menu_web: 1, web_route_key: '/permission' },
            { name: 'permission.getone', group: 'permission', is_menu_web: null, web_route_key: null },
            { name: 'branch-permission.getlist', group: 'branch-permission', is_menu_web: 1, web_route_key: '/branch-permission' },
            { name: 'branch-permission.getone', group: 'branch-permission', is_menu_web: null, web_route_key: null },
            { name: 'branch-permission.create', group: 'branch-permission', is_menu_web: null, web_route_key: null },
            { name: 'branch-permission.update', group: 'branch-permission', is_menu_web: null, web_route_key: null },
            { name: 'branch-permission.remove', group: 'branch-permission', is_menu_web: null, web_route_key: null }
        ];

        for (const p of permissionsToAdd) {
            console.log(`Processing ${p.name}...`);

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

            // Assign to Roles (1: Admin, 29: Super Admin, 30: Manager)
            const roleIds = [1, 29, 30];
            for (const roleId of roleIds) {
                await connection.query(
                    "INSERT IGNORE INTO permission_roles (role_id, permission_id) VALUES (?, ?)",
                    [roleId, permissionId]
                );
            }
            console.log(`  Assigned to roles [1, 29, 30]`);
        }

        console.log('Local permissions fixed successfully!');

    } catch (error) {
        console.error('Error:', error);
        if (error.code === 'ECONNREFUSED') {
            console.error('Connection refused! Please check if MySQL is running on localhost:3306.');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('Access denied! Check username/password in .env file.');
        }
    } finally {
        if (connection) await connection.end();
    }
}

run();
