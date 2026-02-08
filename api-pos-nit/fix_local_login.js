require('dotenv').config();
const { db } = require("./src/util/helper");

async function fixLocalSchema() {
    try {
        console.log("🔍 Checking local database schema...");
        const [columns] = await db.query("SHOW COLUMNS FROM user");
        const columnNames = columns.map(c => c.Field);

        console.log("📋 Current columns:", columnNames.join(", "));

        const columnsToAdd = [
            { name: 'branch_id', type: 'INT NULL', after: 'role_id' },
            { name: 'branch_name', type: 'VARCHAR(150) NULL', after: 'branch_id' },
            { name: 'token_version', type: 'INT DEFAULT 0', after: 'is_active' },
            { name: 'last_activity', type: 'DATETIME NULL', after: 'token_version' },
            { name: 'auto_logout_enabled', type: 'TINYINT(1) DEFAULT 1', after: 'last_activity' },
            { name: 'online_status', type: 'VARCHAR(50) DEFAULT "offline"', after: 'is_online' }
        ];

        for (const col of columnsToAdd) {
            if (!columnNames.includes(col.name)) {
                console.log(`➕ Adding column [${col.name}]...`);
                await db.query(`ALTER TABLE \`user\` ADD COLUMN \`${col.name}\` ${col.type} AFTER \`${col.after}\``);
            }
        }

        console.log("🚀 Creating pre_order_delivery table if missing...");
        await db.query(`
      CREATE TABLE IF NOT EXISTS \`pre_order_delivery\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`pre_order_id\` INT NOT NULL,
        \`pre_order_detail_id\` INT NOT NULL,
        \`invoice_id\` INT NOT NULL,
        \`delivered_qty\` DECIMAL(15,3) NOT NULL,
        \`delivery_date\` DATETIME DEFAULT CURRENT_TIMESTAMP,
        \`created_by\` INT DEFAULT NULL,
        INDEX \`idx_po_inv\` (\`pre_order_id\`, \`invoice_id\`),
        INDEX \`idx_pod_id\` (\`pre_order_detail_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

        console.log("✅ Local schema fixed and matched with Production!");
        process.exit(0);
    } catch (err) {
        console.error("❌ FAILED:", err.message);
        process.exit(1);
    }
}

fixLocalSchema();
