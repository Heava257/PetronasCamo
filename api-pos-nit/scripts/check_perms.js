
require('dotenv').config();
const { db } = require("../src/util/helper");

async function checkCategoryCreate() {
    try {
        const [rows] = await db.query("SELECT id, name, `group` FROM permissions WHERE name LIKE 'category.create%'");
        console.log(JSON.stringify(rows, null, 2));
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
}

checkCategoryCreate();
