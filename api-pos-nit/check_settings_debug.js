
const { db } = require("./src/util/helper");

const checkSettings = async () => {
    try {
        const [rows] = await db.query("SELECT * FROM system_settings");
        console.log("Current System Settings:");
        console.table(rows);
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};

checkSettings();
