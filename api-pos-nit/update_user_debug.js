require('dotenv').config();
const { db } = require("./src/util/helper");

async function updateUser() {
    try {
        const userEmail = "kamsreymompts@gmail.com";
        console.log(`Updating user: ${userEmail} to Preah Vihear`);

        await db.query(
            "UPDATE user SET branch_name = 'Preah Vihear' WHERE username = :username",
            { username: userEmail }
        );

        console.log("Update complete.");
        process.exit();
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

updateUser();
