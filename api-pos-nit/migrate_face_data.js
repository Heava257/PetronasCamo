
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { db } = require("./src/util/helper");

const migrateFaceData = async () => {
    try {
        console.log("🚀 Starting Face Data Migration...");

        // Check if column exists
        const [columns] = await db.query("SHOW COLUMNS FROM user LIKE 'face_descriptor'");

        if (columns.length === 0) {
            // Add column for face descriptor (JSON array of 128 floats)
            await db.query("ALTER TABLE user ADD COLUMN face_descriptor TEXT DEFAULT NULL");
            console.log("✅ Added 'face_descriptor' column to 'user' table.");
        } else {
            console.log("ℹ️ 'face_descriptor' column already exists.");
        }

        process.exit(0);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
};

migrateFaceData();
