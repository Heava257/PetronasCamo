require('dotenv').config();
const { db } = require("./src/util/helper");
const fs = require('fs');
const path = require('path');

async function runFix() {
    try {
        console.log("🚀 Starting database synchronization...");

        // 1. Sync branch_id based on specific user IDs as mapped before
        console.log("📊 Linking Users to Branch IDs...");

        const updates = [
            { branch_id: 2, users: [3, 60, 92, 96, 98, 102, 104] }, // HQ
            { branch_id: 1, users: [72, 131] },                   // Siem Reap
            { branch_id: 3, users: [74] },                        // Banteay Meanchey
            { branch_id: 4, users: [73, 128] },                   // Pailin
            { branch_id: 7, users: [76, 129, 130] },              // Kampong Cham
            { branch_id: 5, users: [91] },                        // Sihanoukville
            { branch_id: 6, users: [127] }                        // Preah Vihear
        ];

        for (const update of updates) {
            await db.query(
                "UPDATE user SET branch_id = :branch_id WHERE id IN (:user_ids)",
                { branch_id: update.branch_id, user_ids: update.users }
            );
            console.log(`✅ Branch ${update.branch_id} linked to ${update.users.length} users.`);
        }

        // 2. Double check if there are any remaining NULLs
        const [nullUsers] = await db.query("SELECT COUNT(*) as count FROM user WHERE branch_id IS NULL");
        if (nullUsers[0].count > 0) {
            console.log(`⚠️ Note: ${nullUsers[0].count} users still have no branch ID.`);
        }

        console.log("✨ All SQL fixes applied to Railway!");
        process.exit(0);
    } catch (err) {
        console.error("❌ FIX FAILED:", err);
        process.exit(1);
    }
}

runFix();
