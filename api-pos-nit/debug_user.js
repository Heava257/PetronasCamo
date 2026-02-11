const { db } = require("./src/util/helper");

async function findUser() {
    try {
        const email = "retreachpts@gmail.com";
        const [users] = await db.query("SELECT id, username, email, is_active, password FROM user WHERE email = ? OR username = ?", [email, email]);
        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`ID: ${u.id}, Username: ${u.username}, Email: ${u.email}, Active: ${u.is_active}, PWD_Length: ${u.password?.length}`);
        });

        // Also check the employee linked to this email
        const [emps] = await db.query("SELECT id, name, user_id, is_active FROM employee WHERE email = ?", [email]);
        console.log(`\nFound ${emps.length} employees:`);
        emps.forEach(e => {
            console.log(`ID: ${e.id}, Name: ${e.name}, UserID: ${e.user_id}, Active: ${e.is_active}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

findUser();
