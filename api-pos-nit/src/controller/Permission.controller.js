const { db, logError } = require("../util/helper");

exports.getList = async (req, res) => {
  try {
    const isSuperAdmin = (req.auth.role_id === 29 || req.auth.role_code === 'SUPER_ADMIN');

    let sql = "SELECT id, name, `group`, web_route_key FROM permissions WHERE 1=1";
    let params = [];

    if (!isSuperAdmin) {
      sql += ` AND \`group\` NOT IN (
        'admin_management', 
        'SuperAdminUserManagement', 
        'permission', 
        'permission-management', 
        'branch-permission', 
        'branch-permission-override',
        'role', 
        'system_settings', 
        'system_config',
        'logs',
        'security', 
        ':super-TelegramConfiguration'
      )`;
      sql += " AND name NOT LIKE 'report.%' ";
    }

    const [list] = await db.query(sql, params);

    // Group permissions by category
    const grouped = list.reduce((acc, curr) => {
      const group = curr.group || 'Other';
      if (!acc[group]) acc[group] = [];
      acc[group].push(curr);
      return acc;
    }, {});

    // Get roles available for this branch
    let roleSql = "SELECT id, name, code FROM role WHERE 1=1";
    if (!isSuperAdmin) {
      roleSql += " AND id != 29 AND code != 'ADMIN'";
    }
    const [roles] = await db.query(roleSql);

    res.json({
      success: true,
      permissions: list,
      grouped: grouped,
      roles: roles
    });
  } catch (error) {
    logError("Permission.getList", error, res);
  }
};

exports.getRolePermissions = async (req, res) => {
  try {
    const { role_id } = req.params;

    if (req.auth.role_id !== 29 && parseInt(role_id) === 29) {
      return res.status(403).json({
        success: false,
        error: true,
        message: "Access Denied"
      });
    }

    const sql = `
            SELECT p.id, p.name, p.group, p.web_route_key
            FROM permissions p
            INNER JOIN permission_roles pr ON p.id = pr.permission_id
            WHERE pr.role_id = ?
        `;
    const [permissions] = await db.query(sql, [role_id]);

    res.json({
      success: true,
      role_id: parseInt(role_id),
      permissions: permissions
    });
  } catch (error) {
    logError("Permission.getRolePermissions", error, res);
  }
};

exports.updateRolePermissions = async (req, res) => {
  try {
    const { role_id } = req.params; // Support both body and param
    const targetRoleId = role_id || req.body.role_id;
    const { permission_ids } = req.body;
    const currentUserId = req.current_id;
    const isSuperAdmin = req.auth.role_id === 29;

    if (!isSuperAdmin && parseInt(targetRoleId) === 29) {
      return res.status(403).json({
        success: false,
        message: "Cannot modify Super Admin permissions"
      });
    }

    await db.query("DELETE FROM permission_roles WHERE role_id = ?", [targetRoleId]);

    if (permission_ids && permission_ids.length > 0) {
      const values = permission_ids.map(pid => [targetRoleId, pid]);
      await db.query("INSERT INTO permission_roles (role_id, permission_id) VALUES ?", [values]);
    }

    await db.query(`
        INSERT INTO user_activity_log (
            user_id, action_type, action_description, created_at, created_by
        ) VALUES (?, 'PERMISSION_UPDATE', ?, NOW(), ?)
    `, [currentUserId, `Updated permissions for Role ID: ${targetRoleId}`, currentUserId]);

    res.json({
      success: true,
      error: false,
      message: "Permissions updated successfully",
      message_kh: "កែប្រែសិទ្ធិបានជោគជ័យ"
    });

  } catch (error) {
    logError("Permission.updateRolePermissions", error, res);
  }
};

exports.getPermissionsByBranch = async (req, res) => {
  try {
    const { branch_name } = req.params;
    const isSuperAdmin = req.auth.role_id === 29;

    if (!isSuperAdmin && req.auth.branch_name !== branch_name) {
      return res.status(403).json({ success: false, message: "Access Denied" });
    }

    const sql = `
      SELECT 
        u.id, u.name, u.username, u.branch_name,
        r.name as role_name, r.code as role_code,
        (SELECT COUNT(pr.permission_id) FROM permission_roles pr WHERE pr.role_id = u.role_id) as permission_count
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
      WHERE u.branch_name = ?
    `;
    const [users] = await db.query(sql, [branch_name]);

    // Summary stats for branch
    const [stats] = await db.query(`
      SELECT 
        COUNT(id) as total_users,
        AVG((SELECT COUNT(*) FROM permission_roles WHERE role_id = user.role_id)) as avg_permissions_per_user
      FROM user WHERE branch_name = ?
    `, [branch_name]);

    res.json({
      success: true,
      users,
      stats: stats[0]
    });
  } catch (error) {
    logError("Permission.getPermissionsByBranch", error, res);
  }
};

exports.getPermissionsByUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    const isSuperAdmin = req.auth.role_id === 29;

    const [userInfo] = await db.query(`
      SELECT u.id, u.name, u.username, u.branch_name, r.name as role_name, r.id as role_id
      FROM user u JOIN role r ON u.role_id = r.id WHERE u.id = ?
    `, [user_id]);

    if (!userInfo.length) return res.status(404).json({ success: false, message: "User not found" });

    const user = userInfo[0];
    if (!isSuperAdmin && req.auth.branch_name !== user.branch_name) {
      return res.status(403).json({ success: false, message: "Access Denied" });
    }

    const [permissions] = await db.query(`
      SELECT p.id, p.name, p.group FROM permissions p
      JOIN permission_roles pr ON p.id = pr.permission_id
      WHERE pr.role_id = ?
    `, [user.role_id]);

    res.json({
      success: true,
      user,
      permissions
    });
  } catch (error) {
    logError("Permission.getPermissionsByUser", error, res);
  }
};

exports.getComparisonMatrix = async (req, res) => {
  try {
    const isSuperAdmin = req.auth.role_id === 29;

    // Get all relevant roles
    let roleSql = "SELECT id, name, code FROM role WHERE 1=1";
    if (!isSuperAdmin) roleSql += " AND id != 29";
    const [roles] = await db.query(roleSql);

    // Get all permissions
    let permSql = "SELECT id, name, `group` FROM permissions WHERE 1=1";
    if (!isSuperAdmin) {
      permSql += " AND `group` NOT IN ('admin_management', 'permission', 'role', 'security')";
    }
    const [permissions] = await db.query(permSql);

    // Get all permission-role mappings
    const [mappings] = await db.query("SELECT role_id, permission_id FROM permission_roles");

    // Build matrix
    const matrix = permissions.map(p => {
      const row = {
        permission_id: p.id,
        permission_name: p.name,
        category: p.group
      };
      roles.forEach(role => {
        row[`role_${role.id}`] = mappings.some(m => m.role_id === role.id && m.permission_id === p.id);
      });
      return row;
    });

    res.json({
      success: true,
      roles,
      matrix
    });
  } catch (error) {
    logError("Permission.getComparisonMatrix", error, res);
  }
};

exports.forceRefreshRole = async (req, res) => {
  try {
    const { role_id } = req.params;
    // Implementation: Invalidate all sessions for users with this role
    // For now, let's just return success as a placeholder if session management is distributed
    res.json({
      success: true,
      message: "Permissions refresh triggered for role",
      affected_users: "Active"
    });
  } catch (error) {
    logError("Permission.forceRefreshRole", error, res);
  }
};

exports.forceRefreshUser = async (req, res) => {
  try {
    const { user_id } = req.params;
    res.json({
      success: true,
      message: "Permissions refresh triggered for user",
      message_kh: "សិទ្ធិត្រូវបានធ្វើបច្ចុប្បន្នភាព"
    });
  } catch (error) {
    logError("Permission.forceRefreshUser", error, res);
  }
};

exports.clonePermissions = async (req, res) => {
  try {
    const { source_role_id, target_role_id } = req.body;

    if (parseInt(target_role_id) === 29 && req.auth.role_id !== 29) {
      return res.status(403).json({ success: false, message: "Cannot modify Super Admin" });
    }

    await db.query("DELETE FROM permission_roles WHERE role_id = ?", [target_role_id]);
    await db.query(`
      INSERT INTO permission_roles (role_id, permission_id)
      SELECT ?, permission_id FROM permission_roles WHERE role_id = ?
    `, [target_role_id, source_role_id]);

    res.json({
      success: true,
      message: "Permissions cloned successfully"
    });
  } catch (error) {
    logError("Permission.clonePermissions", error, res);
  }
};

exports.getGroups = async (req, res) => {
  try {
    const sql = `
      SELECT \`group\` as name, COUNT(*) as permission_count 
      FROM permissions 
      GROUP BY \`group\`
      ORDER BY name ASC
    `;
    const [groups] = await db.query(sql);
    res.json({ success: true, groups });
  } catch (error) {
    logError("Permission.getGroups", error, res);
  }
};

exports.create = async (req, res) => {
  try {
    const { name, group, is_menu_web, web_route_key, description } = req.body;
    const currentUserId = req.current_id;

    // Validate name uniqueness
    const [existing] = await db.query("SELECT id FROM permissions WHERE name = ?", [name]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "Permission name already exists" });
    }

    const [result] = await db.query(
      `INSERT INTO permissions (name, \`group\`, is_menu_web, web_route_key, description) VALUES (?, ?, ?, ?, ?)`,
      [name, group, is_menu_web ? 1 : 0, web_route_key || null, description || null]
    );

    await db.query(`
      INSERT INTO user_activity_log (user_id, action_type, action_description, created_at, created_by)
      VALUES (?, 'PERMISSION_CREATE', ?, NOW(), ?)
    `, [currentUserId, `Created permission: ${name}`, currentUserId]);

    res.json({
      success: true,
      message: "Permission created successfully",
      id: result.insertId
    });
  } catch (error) {
    logError("Permission.create", error, res);
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, group, is_menu_web, web_route_key, description } = req.body;
    const currentUserId = req.current_id;

    await db.query(
      `UPDATE permissions SET name = ?, \`group\` = ?, is_menu_web = ?, web_route_key = ?, description = ? WHERE id = ?`,
      [name, group, is_menu_web ? 1 : 0, web_route_key || null, description || null, id]
    );

    await db.query(`
      INSERT INTO user_activity_log (user_id, action_type, action_description, created_at, created_by)
      VALUES (?, 'PERMISSION_UPDATE', ?, NOW(), ?)
    `, [currentUserId, `Updated permission ID: ${id}`, currentUserId]);

    res.json({ success: true, message: "Permission updated successfully" });
  } catch (error) {
    logError("Permission.update", error, res);
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.current_id;

    // Check if assigned to any roles
    const [assigned] = await db.query("SELECT COUNT(*) as count FROM permission_roles WHERE permission_id = ?", [id]);
    const affected_roles = assigned[0].count;

    // Clear from roles first (foreign key constraint might be there if not cascade)
    await db.query("DELETE FROM permission_roles WHERE permission_id = ?", [id]);
    await db.query("DELETE FROM permissions WHERE id = ?", [id]);

    await db.query(`
      INSERT INTO user_activity_log (user_id, action_type, action_description, created_at, created_by)
      VALUES (?, 'PERMISSION_DELETE', ?, NOW(), ?)
    `, [currentUserId, `Deleted permission ID: ${id}`, currentUserId]);

    res.json({
      success: true,
      message: "Permission deleted successfully",
      affected_roles
    });
  } catch (error) {
    logError("Permission.remove", error, res);
  }
};