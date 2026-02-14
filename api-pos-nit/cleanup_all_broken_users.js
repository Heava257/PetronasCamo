const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'petronas_last4_full',
        port: process.env.DB_PORT || 3306,
    });

    try {
        const [brokenUsers] = await connection.execute(`
      SELECT u.id, u.username, u.name 
      FROM user u 
      LEFT JOIN user_roles ur ON u.id = ur.user_id 
      WHERE ur.user_id IS NULL
    `);

        if (brokenUsers.length > 0) {
            console.log(`Found ${brokenUsers.length} broken users (no roles).`);
            for (const u of brokenUsers) {
                console.log(`Deleting broken user: ${u.username} (ID: ${u.id})`);
                await connection.execute("DELETE FROM user WHERE id = ?", [u.id]);
            }
            console.log("Cleanup complete.");
        } else {
            console.log("No other broken users found.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

check();
