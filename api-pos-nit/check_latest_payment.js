const { db } = require("./src/util/helper");

async function check() {
    try {
        const [rows] = await db.query("SELECT id, reference_no, bank_ref, slip_image FROM supplier_payment ORDER BY id DESC LIMIT 1;");
        console.log("Latest record:", JSON.stringify(rows[0], null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Check failed:", error);
        process.exit(1);
    }
}

check();
