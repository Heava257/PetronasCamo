require('dotenv').config();
const { db } = require("../src/util/helper");

async function run() {
    try {
        console.log("Adding code column to customer table...");
        await db.query(`ALTER TABLE customer ADD COLUMN code VARCHAR(50) AFTER id`);
        await db.query(`CREATE INDEX idx_customer_code ON customer(code)`);
        console.log("Success!");
        process.exit(0);
    } catch (error) {
        if (error.code === 'ER_DUP_COLUMN_NAME' || error.errno === 1060) {
            console.log("Column already exists.");
            process.exit(0);
        }
        console.error("Error:", error);
        process.exit(1);
    }
}

run();
