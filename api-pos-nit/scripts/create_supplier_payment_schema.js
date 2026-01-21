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

        // 1. Create supplier_payment table
        console.log("\n1. Creating supplier_payment table...");
        await connection.query(`
      CREATE TABLE IF NOT EXISTS supplier_payment (
        id INT AUTO_INCREMENT PRIMARY KEY,
        purchase_id INT,
        supplier_id INT NOT NULL,
        payment_date DATETIME NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        payment_method ENUM('cash', 'bank_transfer', 'cheque', 'other') DEFAULT 'bank_transfer',
        reference_no VARCHAR(255),
        bank_name VARCHAR(100),
        note TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (purchase_id) REFERENCES purchase(id) ON DELETE SET NULL,
        FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE CASCADE,
        INDEX idx_supplier_id (supplier_id),
        INDEX idx_payment_date (payment_date),
        INDEX idx_purchase_id (purchase_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
        console.log("✅ supplier_payment table created successfully!");

        // 2. Add paid_amount to purchase table
        console.log("\n2. Adding paid_amount to purchase table...");
        const [paidAmountCol] = await connection.query(`
      SHOW COLUMNS FROM purchase LIKE 'paid_amount'
    `);
        if (paidAmountCol.length === 0) {
            await connection.query(`
        ALTER TABLE purchase
        ADD COLUMN paid_amount DECIMAL(15,2) DEFAULT 0 AFTER total_amount;
      `);
            console.log("✅ paid_amount column added!");
        } else {
            console.log("ℹ️ paid_amount column already exists.");
        }

        // 3. Add payment_status to purchase table
        console.log("\n3. Adding payment_status to purchase table...");
        const [paymentStatusCol] = await connection.query(`
      SHOW COLUMNS FROM purchase LIKE 'payment_status'
    `);
        if (paymentStatusCol.length === 0) {
            await connection.query(`
        ALTER TABLE purchase
        ADD COLUMN payment_status ENUM('unpaid', 'partial', 'paid') DEFAULT 'unpaid' AFTER paid_amount;
      `);
            console.log("✅ payment_status column added!");
        } else {
            console.log("ℹ️ payment_status column already exists.");
        }

        console.log("\n✅ All migrations completed successfully!");

    } catch (error) {
        console.error("❌ Migration failed:", error);
    } finally {
        if (connection) await connection.end();
    }
}

migrate();
