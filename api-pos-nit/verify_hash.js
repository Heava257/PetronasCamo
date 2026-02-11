const { db } = require("./src/util/helper");
const bcrypt = require("bcrypt");

async function verifyHash() {
    try {
        const username = "retreachpts@gmail.com";
        const plainPassword = "123456";

        const [users] = await db.query("SELECT id, username, password FROM user WHERE username = ?", [username]);

        if (users.length === 0) {
            console.log("User not found");
            process.exit(1);
        }

        const user = users[0];
        console.log(`Checking user ID: ${user.id}`);
        console.log(`Stored hash: ${user.password}`);

        const isMatch = bcrypt.compareSync(plainPassword, user.password);
        console.log(`Match result for '123456': ${isMatch}`);

        const isMatchTrimmed = bcrypt.compareSync(plainPassword.trim(), user.password);
        console.log(`Match result for '123456'.trim(): ${isMatchTrimmed}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verifyHash();
