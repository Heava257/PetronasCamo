
require('dotenv').config();
const { db } = require("../src/util/helper");

async function findAllDuplicates() {
    try {
        console.log("Searching for any row that looks like a duplicate...");
        const [rows] = await db.query(`
            SELECT name, \`group\`, COUNT(*) as count 
            FROM permissions 
            GROUP BY name, \`group\` 
            HAVING count > 1
        `);
        console.log("Duplicates found:", JSON.stringify(rows, null, 2));

        if (rows.length > 0) {
            for (const row of rows) {
                const [details] = await db.query("SELECT * FROM permissions WHERE name = ? AND `group` = ?", [row.name, row.group]);
                console.log(`Details for ${row.name}:`, JSON.stringify(details, null, 2));
            }
        } else {
            // Check if there are invisible characters
            const [all] = await db.query("SELECT id, name, `group` FROM permissions");
            const names = all.map(r => r.name);
            const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
            console.log("Raw name duplicates (including potential invisible chars):", duplicates);

            // Try trimming and checking
            const trimmedNames = all.map(r => r.name.trim());
            const trimmedDuplicates = trimmedNames.filter((name, index) => trimmedNames.indexOf(name) !== index);
            console.log("Trimmed name duplicates:", [...new Set(trimmedDuplicates)]);
        }
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
}

findAllDuplicates();
