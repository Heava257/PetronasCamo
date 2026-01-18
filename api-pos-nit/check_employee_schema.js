require('dotenv').config();
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'petronas_last4_full',
    port: process.env.DB_PORT || 3306,
};

async function checkColumns() {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [columns] = await connection.query("SHOW COLUMNS FROM employee");
        console.log("Columns in employee table:");
        columns.forEach(col => console.log(`${col.Field}: ${col.Type}`));
        await connection.end();
    } catch (error) {
        console.error("Error:", error);
    }
}

checkColumns();
