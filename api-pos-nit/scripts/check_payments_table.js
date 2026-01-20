const { db } = require("../src/util/helper");

async function checkPaymentColumns() {
    try {
        const [columns] = await db.query("SHOW COLUMNS FROM payments");
        console.log("Columns in payments table:", columns.map(c => c.Field));
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkPaymentColumns();
