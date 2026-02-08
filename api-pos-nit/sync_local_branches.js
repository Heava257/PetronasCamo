require('dotenv').config();
const { db } = require("./src/util/helper");

async function syncLocalBranchIds() {
    try {
        console.log("🚀 Syncing local branch_id based on branch_name...");

        const branchIds = [
            { id: 1, name: 'Siem Reap' },
            { id: 2, name: 'Head Office' },
            { id: 2, name: 'ទីស្នាក់ការកណ្តាល' },
            { id: 3, name: 'Banteay Meanchey' },
            { id: 4, name: 'Pailin' },
            { id: 5, name: 'Sihanoukville' },
            { id: 6, name: 'Preah Vihear' },
            { id: 7, name: 'Kampong Cham' }
        ];

        for (const b of branchIds) {
            const [result] = await db.query(
                "UPDATE user SET branch_id = ? WHERE branch_name LIKE ?",
                [b.id, `%${b.name}%`]
            );
            console.log(`✅ Synced [${b.name}] -> ID ${b.id} (${result.affectedRows} users)`);
        }

        // Default others to HQ if still null
        const [final] = await db.query("UPDATE user SET branch_id = 2 WHERE branch_id IS NULL");
        console.log(`📝 Defaulted ${final.affectedRows} remaining users to HQ (ID 2).`);

        process.exit(0);
    } catch (err) {
        console.error("❌ SYNC FAILED:", err.message);
        process.exit(1);
    }
}

syncLocalBranchIds();
