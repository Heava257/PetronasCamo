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
        const username = 'kampongspue@gmail.com';
        const [user] = await connection.execute("SELECT id FROM user WHERE username = ?", [username]);

        if (user.length > 0) {
            const userId = user[0].id;
            console.log(`Found user ID: ${userId}`);

            const [roles] = await connection.execute("SELECT * FROM user_roles WHERE user_id = ?", [userId]);
            console.log(`Roles found: ${JSON.stringify(roles)}`);

            if (roles.length === 0) {
                console.log("Broken user found (no roles). Deleting...");
                await connection.execute("DELETE FROM user WHERE id = ?", [userId]);
                console.log("User deleted successfully.");
            } else {
                console.log("User has roles. Not deleting.");
            }
        } else {
            console.log("User not found.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

check();
