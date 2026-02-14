const { db } = require('./src/util/helper');

async function checkSchema() {
    try {
        console.log("--- order table ---");
        const [orderCols] = await db.query("DESCRIBE `order` ");
        console.log(JSON.stringify(orderCols, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
