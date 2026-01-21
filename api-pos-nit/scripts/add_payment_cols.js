
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

        // Check if columns exist
        const [columns] = await connection.query("SHOW COLUMNS FROM payments");
        const columnNames = columns.map(c => c.Field);

        let alterQuery = "ALTER TABLE payments ";
        let changes = [];

        if (!columnNames.includes('bank_name')) {
            changes.push("ADD COLUMN bank_name VARCHAR(100) NULL");
        }
        if (!columnNames.includes('slip_image')) {
            changes.push("ADD COLUMN slip_image VARCHAR(255) NULL");
        }

        if (changes.length > 0) {
            alterQuery += changes.join(", ");
            console.log("Executing:", alterQuery);
            await connection.query(alterQuery);
            console.log("✅ Successfully added columns.");
        } else {
            console.log("✅ Columns already exist.");
        }

    } catch (error) {
        console.error("❌ Failed to modify schema:", error);
    } finally {
        if (connection) await connection.end();
    }
}

fixSchema();
