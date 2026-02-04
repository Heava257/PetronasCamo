require('dotenv').config();
const { db } = require("./src/util/helper");

// Re-implement the same logic to test
const getPermissionByUser = async (user_id) => {
    try {
        const [users] = await db.query(`
      SELECT u.role_id, u.branch_name, r.code as role_code 
      FROM user u 
      INNER JOIN role r ON u.role_id = r.id 
      WHERE u.id = :id
    `, { id: user_id });
        if (!users.length) return { error: "User not found", users };

        const { role_id, branch_name, role_code } = users[0];
        console.log("Context:", { role_id, branch_name, role_code });

        if (role_id === 29 || role_code === 'SUPER_ADMIN') {
            const [allPerms] = await db.query("SELECT id, name, `group`, is_menu_web, web_route_key FROM permissions");
            return { success: true, count: allPerms.length, permissions: allPerms.slice(0, 5), hasView: allPerms.some(p => p.name === 'permission.view') };
        }
        return { success: false, reason: "Not super admin" };
    } catch (error) {
        return { error: error.message };
    }
};

async function runTest() {
    // Test for user 102 (Super Admin)
    const result = await getPermissionByUser(102);
    console.log("Result for 102:", JSON.stringify(result, null, 2));
    process.exit(0);
}
runTest();
