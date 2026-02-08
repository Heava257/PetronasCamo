const mysql = require('mysql2/promise');

// Use local config
const connectionConfig = {
    host: 'localhost',
    user: 'root',
    database: 'petronas_last4_full',
    namedPlaceholders: true
};

async function run() {
    let connection;
    try {
        console.log('Connecting to LOCAL database...');
        connection = await mysql.createConnection(connectionConfig);

        // 1. Create `branch` table if not exists
        console.log('Creating `branch` table...');
        await connection.query(`
      CREATE TABLE IF NOT EXISTS branch (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        code VARCHAR(50) NULL,
        address TEXT NULL,
        tel VARCHAR(50) NULL,
        is_active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
        created_by INT NULL
      )
    `);

        // 2. Add `branch_id` column to `user` table if not exists
        console.log('Adding `branch_id` to `user` table...');
        try {
            await connection.query("ALTER TABLE user ADD COLUMN branch_id INT NULL AFTER branch_name");
            await connection.query("ALTER TABLE user ADD FOREIGN KEY (branch_id) REFERENCES branch(id) ON DELETE SET NULL");
        } catch (e) {
            if (!e.message.includes("Duplicate column name")) {
                console.error("Column add error (ignoring if duplicate):", e.message);
            }
        }

        // 3. Migrate unique branch names to `branch` table
        console.log('Migrating branch names...');
        const [users] = await connection.query("SELECT DISTINCT branch_name FROM user WHERE branch_name IS NOT NULL AND branch_name != ''");

        for (const u of users) {
            const branchName = u.branch_name;
            // Generate a simple code (e.g., SIEM_REAP)
            const code = branchName.toUpperCase().replace(/\s+/g, '_').substring(0, 10);

            console.log(`Processing branch: ${branchName} (${code})`);

            // Insert branch
            await connection.query(`
            INSERT IGNORE INTO branch (name, code, is_active) 
            VALUES (?, ?, 1)
        `, [branchName, code]);

            // Get branch ID
            const [rows] = await connection.query("SELECT id FROM branch WHERE name = ?", [branchName]);
            if (rows.length > 0) {
                const branchId = rows[0].id;

                // Update users
                await connection.query("UPDATE user SET branch_id = ? WHERE branch_name = ?", [branchId, branchName]);
                console.log(`  Updated users for branch ${branchName} -> ID ${branchId}`);
            }
        }

        console.log('Migration completed successfully!');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) await connection.end();
    }
}

run();
