require('dotenv').config();
const { db } = require("./src/util/helper");

async function checkCols() {
    const [cols] = await db.query("SHOW COLUMNS FROM user");
    console.log("ALL USER COLUMNS:");
    cols.forEach(c => console.log(`- ${c.Field}`));
    process.exit(0);
}
checkCols();
