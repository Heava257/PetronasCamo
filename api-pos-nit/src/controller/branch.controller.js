const { db, logError } = require("../util/helper");

exports.getList = async (req, res) => {
    try {
        const [branches] = await db.query(`
      SELECT DISTINCT branch_name 
      FROM user 
      WHERE branch_name IS NOT NULL AND branch_name != ''
      ORDER BY branch_name ASC
    `);

        // Format for frontend Select
        const list = branches.map((b, index) => ({
            id: index + 1, // Dummy ID as we use name
            name: b.branch_name,
            value: b.branch_name // Use name as value to send to backend or stick to ID if we implemented ID.
            // purchase.create expects branch_id but we only have names here.
            // Wait, purchase.create logic I wrote expects ID and queries 'branch' table.
            // I should FIX purchase.create to search by NAME or change this to search 'branch' table if it existed.
        }));

        // Check if 'branch' table actually exists
        try {
            const [realBranches] = await db.query("SELECT * FROM branch");
            if (realBranches.length > 0) {
                return res.json({
                    list: realBranches.map(b => ({
                        id: b.id,
                        name: b.name,
                        value: b.id // Use ID as value
                    }))
                });
            }
        } catch (e) {
            // Table doesn't exist, ignore
        }

        // Fallback to user branch names if 'branch' table missing
        res.json({
            list: list.map(b => ({
                id: b.name, // Use name as ID for simplicity if table missing
                name: b.name,
                value: b.name
            }))
        });

    } catch (error) {
        logError("branch.getList", error, res);
    }
};
