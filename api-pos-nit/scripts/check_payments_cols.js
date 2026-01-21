
const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "petronas_last4_full",
    namedPlaceholders: true,
};

async function checkSchema() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to database...");

        const [columns] = await connection.query("SHOW COLUMNS FROM payments");
        const columnNames = columns.map(c => c.Field);
        console.log("Columns:", columnNames.join(", "));

    } catch (error) {
        console.error("❌ Failed:", error);
    } finally {
        if (connection) await connection.end();
    }
}

checkSchema();
