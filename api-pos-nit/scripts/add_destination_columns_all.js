
const { db } = require("../src/util/helper");

async function migrate() {
    const connection = await db.getConnection();
    try {
        console.log("Starting migration...");

        const checkAndAddColumn = async (table, column, type, after) => {
            console.log(`Checking ${table}.${column}...`);
            const [cols] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE '${column}'`);
            if (cols.length === 0) {
                console.log(`Adding ${column} to ${table}...`);
                await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${type} NULL AFTER ${after}`);
                console.log(`Added ${column} to ${table}.`);
            } else {
                console.log(`${table}.${column} already exists.`);
            }
        };

        // 1. pre_order_detail
        await checkAndAddColumn('pre_order_detail', 'destination', 'VARCHAR(255)', 'amount');

        // 2. fakeinvoice_detail
        await checkAndAddColumn('fakeinvoice_detail', 'destination', 'VARCHAR(255)', 'total_amount');

        // 3. order_detail (POS)
        await checkAndAddColumn('order_detail', 'destination', 'VARCHAR(255)', 'total');

        console.log("All migrations checks complete.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        connection.release();
        process.exit();
    }
}

migrate();
