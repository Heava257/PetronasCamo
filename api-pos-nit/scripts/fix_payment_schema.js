
const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "petronas_last4_full",
    namedPlaceholders: true,
};

async function fixSchema() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to database...");

        // Check if table exists
        const [tables] = await connection.query("SHOW TABLES LIKE 'payments'");
        if (tables.length === 0) {
            console.error("❌ 'payments' table does not exist!");
            return;
        }

        console.log("Found 'payments' table. Altering 'order_id' column...");

        // Alter table to make order_id nullable
        await connection.query("ALTER TABLE payments MODIFY order_id INT NULL DEFAULT NULL");

        console.log("✅ Successfully modified 'order_id' to allow NULL.");

    } catch (error) {
        console.error("❌ Failed to modify schema:", error);
    } finally {
        if (connection) await connection.end();
    }
}

fixSchema();
