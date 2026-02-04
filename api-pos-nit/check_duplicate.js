require('dotenv').config();
const { db } = require("./src/util/helper");

async function findDuplicate() {
    try {
        const username = 'kampongchambranch1@gmail.com';
        const tel = '0965001000'; // I'll check both variations just in case
        const tel2 = '0965901000';
        const tel3 = '0065001000';

        const [users] = await db.query("SELECT id, username, tel, name FROM user WHERE username = ? OR tel IN (?, ?, ?)", [username, tel, tel2, tel3]);
        console.log("Found potentially conflicting users:", JSON.stringify(users, null, 2));

        // Also check if there's any other unique constraint failure message in the register code further down
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}
findDuplicate();
