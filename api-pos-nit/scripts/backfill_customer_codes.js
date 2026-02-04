require('dotenv').config();
const { db } = require("../src/util/helper");

async function run() {
    try {
        console.log("Starting to backfill customer codes...");

        // 1. Get all customers with NULL code, ordered by create_at (oldest first)
        // We also use ID as a tie-breaker
        const [customers] = await db.query(
            "SELECT id FROM customer WHERE code IS NULL OR code = '' ORDER BY create_at ASC, id ASC"
        );

        if (customers.length === 0) {
            console.log("No customers found with missing codes.");
            process.exit(0);
        }

        console.log(`Found ${customers.length} customers to update.`);

        // 2. Determine starting number
        // Find the current max number if any exist (in case some were already manually entered)
        const [maxResult] = await db.query(
            "SELECT code FROM customer WHERE code IS NOT NULL AND code != '' ORDER BY code DESC LIMIT 1"
        );

        let startNum = 1;
        if (maxResult.length > 0) {
            // If code format is C0001, extract number
            const currentMax = maxResult[0].code;
            const match = currentMax.match(/\d+/);
            if (match) {
                startNum = parseInt(match[0]) + 1;
            }
        }

        console.log(`Starting sequence from: ${startNum}`);

        // 3. Update each customer
        let count = 0;
        for (const customer of customers) {
            const code = `C${String(startNum + count).padStart(4, '0')}`;
            await db.query("UPDATE customer SET code = ? WHERE id = ?", [code, customer.id]);
            count++;
            if (count % 20 === 0) {
                console.log(`Progress: ${count}/${customers.length}...`);
            }
        }

        console.log(`Successfully backfilled ${count} customer codes!`);
        process.exit(0);
    } catch (error) {
        console.error("Error during backfill:", error);
        process.exit(1);
    }
}

run();
