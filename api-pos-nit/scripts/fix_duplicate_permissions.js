
require('dotenv').config();
const { db } = require("../src/util/helper");

async function cleanupDuplicates() {
    try {
        console.log("🚀 Starting permission cleanup...");

        // 1. Find duplicate permission names
        const [duplicates] = await db.query(`
            SELECT name, COUNT(*) as count, MIN(id) as keep_id
            FROM permissions
            GROUP BY name
            HAVING count > 1
        `);

        if (duplicates.length === 0) {
            console.log("✅ No duplicate permissions found.");
        } else {
            console.log(`🔍 Found ${duplicates.length} duplicate permission names.`);

            for (const dup of duplicates) {
                console.log(`\n📦 Processing: ${dup.name} (Keep ID: ${dup.keep_id})`);

                // Get all IDs for this name
                const [allIds] = await db.query(
                    "SELECT id FROM permissions WHERE name = ? AND id != ?",
                    [dup.name, dup.keep_id]
                );
                const removeIds = allIds.map(row => row.id);

                for (const removeId of removeIds) {
                    console.log(`  - Migrating data from ID: ${removeId} to ${dup.keep_id}`);

                    // Migrate permission_roles
                    await db.query(`
                        INSERT IGNORE INTO permission_roles (role_id, permission_id)
                        SELECT role_id, ? FROM permission_roles WHERE permission_id = ?
                    `, [dup.keep_id, removeId]);

                    await db.query("DELETE FROM permission_roles WHERE permission_id = ?", [removeId]);

                    // Migrate branch_permission_overrides (if table exists)
                    try {
                        await db.query(`
                            UPDATE IGNORE branch_permission_overrides 
                            SET permission_id = ? 
                            WHERE permission_id = ?
                        `, [dup.keep_id, removeId]);

                        await db.query("DELETE FROM branch_permission_overrides WHERE permission_id = ? AND permission_id != ?", [removeId, dup.keep_id]);
                    } catch (e) {
                        // Table might not exist or have different structure
                    }

                    // Delete the duplicate permission
                    await db.query("DELETE FROM permissions WHERE id = ?", [removeId]);
                }
                console.log(`  ✅ Cleaned up duplicates for: ${dup.name}`);
            }
        }

        // 2. Add UNIQUE constraint to prevent future duplicates
        console.log("\n🛡️  Attempting to add UNIQUE constraint to name column...");
        try {
            await db.query("ALTER TABLE permissions ADD UNIQUE INDEX idx_permission_name_unique (name)");
            console.log("✅ Unique index added successfully.");
        } catch (err) {
            if (err.errno === 1061 || err.code === 'ER_DUP_KEYNAME') {
                console.log("ℹ️  Unique index already exists.");
            } else {
                console.error("❌ Failed to add unique index:", err.message);
                console.log("💡 You might have duplicates I couldn't clean automatically. Check manually.");
            }
        }

        console.log("\n✨ Cleanup process completed.");
        process.exit(0);
    } catch (error) {
        console.error("💥 Cleanup failed:", error);
        process.exit(1);
    }
}

cleanupDuplicates();
