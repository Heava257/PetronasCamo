require('dotenv').config();
const { db } = require("./src/util/helper");

async function migratePermissions() {
    try {
        console.log("🚀 Starting permission synchronization...");

        const modules = [
            { name: "product", group: "Inventory" },
            { name: "category", group: "Inventory" },
            { name: "customer", group: "Sales" },
            { name: "employee", group: "Human Resources" },
            { name: "user", group: "System" },
            { name: "role", group: "System" },
            { name: "order", group: "Sales" },
            { name: "expanse", group: "Finance" },
            { name: "expanse_type", group: "Finance" },
            { name: "supplier", group: "Purchase" },
            { name: "purchase", group: "Purchase" },
            { name: "supplier_payment", group: "Finance" },
            { name: "customer_payment", group: "Finance" },
            { name: "shift_closing", group: "Management" },
            { name: "daily_closing", group: "Management" },
            { name: "report", group: "Management" },
            { name: "settings", group: "System" },
            { name: "permission", group: "System" }
        ];

        const actions = ["view", "create", "update", "remove"];
        let addedCount = 0;

        for (const mod of modules) {
            for (const action of actions) {
                const permName = `${mod.name}.${action}`;

                // Use backticks for group as it's a reserved word in MySQL
                const [existing] = await db.query(
                    "SELECT id FROM permissions WHERE name = ?",
                    [permName]
                );

                if (existing.length === 0) {
                    await db.query(
                        "INSERT INTO permissions (name, `group`) VALUES (?, ?)",
                        [permName, mod.group]
                    );
                    console.log(`✅ Added: ${permName}`);
                    addedCount++;
                }
            }
        }

        console.log(`✨ Synchronization complete. Added ${addedCount} new permissions.`);
        process.exit(0);
    } catch (error) {
        console.error("❌ Synchronization failed:", error);
        process.exit(1);
    }
}

migratePermissions();
