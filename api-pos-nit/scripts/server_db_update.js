const mysql = require('mysql2/promise');

async function run() {
    const connectionUrl = "mysql://root:nxYIDhiYcZweDftsuqbYHualVtBGrUnX@yamanote.proxy.rlwy.net:36838/railway";

    console.log("🚀 Connecting to Railway Database...");
    let connection;
    try {
        connection = await mysql.createConnection(connectionUrl);
        console.log("✅ Connected successfully!");

        // 1. Update Schema: Add 'code' column to customer
        console.log("\n📦 Updating customer table schema...");
        try {
            await connection.query(`ALTER TABLE customer ADD COLUMN code VARCHAR(50) AFTER id`);
            console.log("✅ Column 'code' added.");
        } catch (err) {
            if (err.errno === 1060) {
                console.log("ℹ️ Column 'code' already exists.");
            } else {
                console.error("❌ Error adding column:", err.message);
            }
        }

        try {
            await connection.query(`CREATE INDEX idx_customer_code ON customer(code)`);
            console.log("✅ Index idx_customer_code created.");
        } catch (err) {
            if (err.errno === 1061) {
                console.log("ℹ️ Index already exists.");
            } else {
                console.error("❌ Error creating index:", err.message);
            }
        }

        // 2. Backfill Customer Codes
        console.log("\n🔢 Backfilling customer codes...");
        const [customers] = await connection.query(
            "SELECT id FROM customer WHERE code IS NULL OR code = '' ORDER BY create_at ASC, id ASC"
        );

        if (customers.length > 0) {
            console.log(`Found ${customers.length} customers to update.`);

            const [maxResult] = await connection.query(
                "SELECT code FROM customer WHERE code IS NOT NULL AND code != '' ORDER BY code DESC LIMIT 1"
            );

            let startNum = 1;
            if (maxResult.length > 0) {
                const currentMax = maxResult[0].code;
                const match = currentMax.match(/\d+/);
                if (match) {
                    startNum = parseInt(match[0]) + 1;
                }
            }

            for (let i = 0; i < customers.length; i++) {
                const code = `C${String(startNum + i).padStart(4, '0')}`;
                await connection.query("UPDATE customer SET code = ? WHERE id = ?", [code, customers[i].id]);
            }
            console.log(`✅ Backfilled ${customers.length} customer codes.`);
        } else {
            console.log("ℹ️ No customers need backfilling.");
        }

        // 3. Permission Fix (category.view)
        console.log("\n🔐 Checking permissions fix...");
        // Ensure category.view permission exists
        const [permExists] = await connection.query("SELECT id FROM permissions WHERE name = 'category.view'");
        let permId;
        if (permExists.length === 0) {
            const [insResult] = await connection.query(
                "INSERT INTO permissions (name, `group`) VALUES ('category.view', 'category')"
            );
            permId = insResult.insertId;
            console.log(`✅ Created 'category.view' permission (ID: ${permId})`);
        } else {
            permId = permExists[0].id;
            console.log(`ℹ️ 'category.view' permission exists (ID: ${permId})`);
        }

        // Assign to all existing roles to ensure no one is blocked
        const [roles] = await connection.query("SELECT id FROM role");
        let assignedCount = 0;
        for (const role of roles) {
            const [mappingExists] = await connection.query(
                "SELECT * FROM permission_roles WHERE role_id = ? AND permission_id = ?",
                [role.id, permId]
            );
            if (mappingExists.length === 0) {
                await connection.query(
                    "INSERT INTO permission_roles (role_id, permission_id) VALUES (?, ?)",
                    [role.id, permId]
                );
                assignedCount++;
            }
        }
        console.log(`✅ Assigned 'category.view' to ${assignedCount} roles.`);

        console.log("\n🎉 ALL SERVER DATABASE UPDATES COMPLETED!");

    } catch (error) {
        console.error("💥 CRITICAL ERROR:", error);
    } finally {
        if (connection) await connection.end();
        process.exit(0);
    }
}

run();
