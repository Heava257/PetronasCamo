
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { db } = require("./src/util/helper");

const migrateSystemSettings = async () => {
    console.log("🚀 Starting System Settings Migration...");

    try {
        // 1. Create system_settings table
        const createTableSql = `
      CREATE TABLE IF NOT EXISTS system_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

        await db.query(createTableSql);
        console.log("✅ Table 'system_settings' checked/created.");

        // 2. Insert default values if they don't exist
        const defaultSettings = [
            {
                key: 'face_login_enabled',
                value: 'false',
                description: 'Enable or disable face recognition login flow'
            },
            {
                key: 'password_complexity',
                value: 'standard', // or 'high'
                description: 'Password complexity requirement: standard (8+ chars) or high (uppercase, symbol, etc)'
            }
        ];

        for (const setting of defaultSettings) {
            const [existing] = await db.query(
                "SELECT id FROM system_settings WHERE setting_key = ?",
                [setting.key]
            );

            if (existing.length === 0) {
                await db.query(
                    "INSERT INTO system_settings (setting_key, setting_value, description) VALUES (?, ?, ?)",
                    [setting.key, setting.value, setting.description]
                );
                console.log(`✅ Inserted default setting: ${setting.key}`);
            } else {
                console.log(`ℹ️ Setting already exists: ${setting.key}`);
            }
        }

        console.log("🎉 Migration completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
};

migrateSystemSettings();
