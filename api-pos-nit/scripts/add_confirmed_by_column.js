
const mysql = require("mysql2/promise");
require("dotenv").config();

const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "petronas_last4_full",
    namedPlaceholders: true,
};

async function migrate() {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log("Connected to database...");

        // Check if column exists
        const [columns] = await connection.query(`
      SHOW COLUMNS FROM pre_order LIKE 'confirmed_by'
    `);

        if (columns.length === 0) {
            console.log("Adding confirmed_by column...");
            await connection.query(`
        ALTER TABLE pre_order
        ADD COLUMN confirmed_by INT NULL AFTER status;
      `);
            console.log("✅ confirmed_by column added successfully!");
        } else {
            console.log("ℹ️ confirmed_by column already exists.");
        }

    } catch (error) {
        console.error("❌ Migration failed:", error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
