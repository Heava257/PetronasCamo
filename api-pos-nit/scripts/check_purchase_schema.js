
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

        const [purchaseCols] = await connection.query(`SHOW COLUMNS FROM purchase`);
        console.log("\n--- Purchase Table Columns ---");
        purchaseCols.forEach(col => console.log(`${col.Field} (${col.Type})`));

        const [supplierCols] = await connection.query(`SHOW COLUMNS FROM supplier`);
        console.log("\n--- Supplier Table Columns ---");
        supplierCols.forEach(col => console.log(`${col.Field} (${col.Type})`));

    } catch (error) {
        console.error("❌ Schema check failed:", error);
    } finally {
        if (connection) await connection.end();
    }
}

checkSchema();
