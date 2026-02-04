require('dotenv').config();
const { db } = require("./src/util/helper");

const migrate = async () => {
    try {
        console.log("Starting migration for branch_permission_overrides...");

        const sql = `
      CREATE TABLE IF NOT EXISTS branch_permission_overrides (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branch_name VARCHAR(100) NOT NULL,
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        override_type ENUM('add', 'remove') NOT NULL,
        reason TEXT NULL,
        created_by INT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_override (branch_name, role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

        await db.query(sql);
        console.log("✅ Table branch_permission_overrides created or already exists.");

    } catch (error) {
        console.error("❌ Migration failed:", error);
    } finally {
        process.exit();
    }
};

migrate();
