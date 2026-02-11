const { db } = require("./src/util/helper");

async function checkSchema() {
    try {
        const [columns] = await db.query("DESCRIBE user");
        console.log("User table columns:");
        columns.forEach(col => {
            console.log(`${col.Field}: ${col.Type} (${col.Null}, ${col.Key}, ${col.Default})`);
        });

        const [emp_columns] = await db.query("DESCRIBE employee");
        console.log("\nEmployee table columns:");
        emp_columns.forEach(col => {
            console.log(`${col.Field}: ${col.Type}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchema();
