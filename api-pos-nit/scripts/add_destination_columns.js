
const { db } = require("../src/util/helper");

async function migrate() {
    const connection = await db.getConnection();
    try {
        console.log("Checking columns...");

        // Check pre_order_detail
        const [cols1] = await connection.query("SHOW COLUMNS FROM pre_order_detail LIKE 'destination'");
        if (cols1.length === 0) {
            console.log("Adding destination to pre_order_detail...");
            await connection.query("ALTER TABLE pre_order_detail ADD COLUMN destination VARCHAR(255) NULL AFTER amount");
        } else {
            console.log("pre_order_detail already has destination.");
        }

        // Check fakeinvoice_detail
        const [cols2] = await connection.query("SHOW COLUMNS FROM fakeinvoice_detail LIKE 'destination'");
        if (cols2.length === 0) {
            console.log("Adding destination to fakeinvoice_detail...");
            await connection.query("ALTER TABLE fakeinvoice_detail ADD COLUMN destination VARCHAR(255) NULL AFTER total_amount");
        } else {
            console.log("fakeinvoice_detail already has destination.");
        }

        console.log("Migration complete.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        connection.release();
        process.exit();
    }
}

migrate();
