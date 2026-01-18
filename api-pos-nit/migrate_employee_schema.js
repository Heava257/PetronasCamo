require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'petronas_last4_full',
    port: process.env.DB_PORT || 3306,
};

async function migrate() {
    try {
        const connection = await mysql.createConnection(dbConfig);

        console.log("Adding creator_id column...");
        // Check if column exists first to avoid error
        const [columns] = await connection.query("SHOW COLUMNS FROM employee LIKE 'creator_id'");
        if (columns.length === 0) {
            await connection.query("ALTER TABLE employee ADD COLUMN creator_id INT NULL AFTER create_by");
            console.log("Column creator_id added.");
        } else {
            console.log("Column creator_id already exists.");
        }

        console.log("Backfilling 'PENH VMS' data...");
        // Get PENH VMS user id
        const [users] = await connection.query("SELECT id FROM user WHERE name = 'PENH VMS' LIMIT 1");
        if (users.length > 0) {
            const penhVmsId = users[0].id;
            const [result] = await connection.query("UPDATE employee SET creator_id = ? WHERE create_by = 'PENH VMS'", [penhVmsId]);
            console.log(`Backfilled ${result.affectedRows} rows for PENH VMS.`);
        } else {
            console.log("User 'PENH VMS' not found, skipping backfill.");
        }

        await connection.end();
    } catch (error) {
        console.error("Error:", error);
    }
}

migrate();
