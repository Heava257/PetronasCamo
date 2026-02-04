const { db } = require("./src/util/helper");

async function checkSchema() {
    try {
        const [columns] = await db.query("SHOW COLUMNS FROM product");
        console.log("Product Columns:", columns.map(c => c.Field));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
