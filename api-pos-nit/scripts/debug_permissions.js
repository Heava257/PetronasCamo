
require('dotenv').config();
const { db } = require("../src/util/helper");
const fs = require('fs');

async function debugPermissions() {
    try {
        const [rows] = await db.query("SELECT * FROM permissions ORDER BY name ASC LIMIT 200");
        fs.writeFileSync('permissions_debug.json', JSON.stringify(rows, null, 2));
        console.log(`✅ Exported ${rows.length} permissions to permissions_debug.json`);
        process.exit(0);
    } catch (error) {
        console.error("💥 Debug failed:", error);
        process.exit(1);
    }
}

debugPermissions();
