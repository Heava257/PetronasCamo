const { logError, db, sendTelegramMessagenewLogin } = require("../util/helper");

// ==================== PERMISSION MANAGEMENT ====================

/**
 * Get all permissions (for permission assignment UI)
 */
exports.getAllPermissions = async (req, res) => {
  try {
    const currentUserId = req.current_id;

    // ✅ Verify Super Admin
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Access denied. Super Admin only."
      });
    }

    // ✅ Get all permissions grouped by category
    const [permissions] = await db.query(`
      SELECT 
        id,
        name,
        \`group\` as category,
        is_menu_web,
        web_route_key
      FROM permissions
      ORDER BY \`group\`, name
    `);

    // ✅ Group permissions by category
    const groupedPermissions = permissions.reduce((acc, perm) => {
      const category = perm.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(perm);
      return acc;
    }, {});

    return res.json({
      success: true,
      permissions: permissions,
      grouped: groupedPermissions,
      total: permissions.length
    });

  } catch (error) {
    console.error('❌ Error in getAllPermissions:', error);
    logError("permission.getAllPermissions", error, res);
  }
};

/**
 * Get user permissions with details
 */
exports.getUserPermissions = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { user_id } = req.params;

    // ✅ Verify Super Admin or same user
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    const isSuperAdmin = currentUser[0]?.role_code === 'SUPER_ADMIN';
    const isSameUser = parseInt(currentUserId) === parseInt(user_id);

    if (!isSuperAdmin && !isSameUser) {
      return res.status(403).json({
        error: true,
        message: "Access denied."
      });
    }

    // ✅ Get user info
    const [userInfo] = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.username,
        u.branch_name,
        r.name as role_name,
        r.code as role_code
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
      WHERE u.id = :user_id
    `, { user_id });

    if (userInfo.length === 0) {
      return res.status(404).json({
        error: true,
        message: "User not found"
      });
    }

    // ✅ Get user's permissions
    const [userPermissions] = await db.query(`
      SELECT DISTINCT
        p.id,
        p.name,
        p.\`group\` as category,
        p.is_menu_web,
        p.web_route_key
      FROM permissions p
      INNER JOIN permission_roles pr ON p.id = pr.permission_id
      INNER JOIN user u ON pr.role_id = u.role_id
      WHERE u.id = :user_id
      ORDER BY p.\`group\`, p.name
    `, { user_id });

    // ✅ Group permissions by category
    const groupedPermissions = userPermissions.reduce((acc, perm) => {
      const category = perm.category || 'Other';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(perm);
      return acc;
    }, {});

    return res.json({
      success: true,
      user: userInfo[0],
      permissions: userPermissions,
      grouped: groupedPermissions,
      total: userPermissions.length
    });

  } catch (error) {
    console.error('❌ Error in getUserPermissions:', error);
    logError("permission.getUserPermissions", error, res);
  }
};

/**
 * Get permissions by branch
 */
exports.getPermissionsByBranch = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { branch_name } = req.params;

    // ✅ Verify Super Admin
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Access denied. Super Admin only."
      });
    }

    // ✅ Get all users in branch with their permissions
    const [branchUsers] = await db.query(`
      SELECT 
        u.id,
        u.name,
        u.username,
        u.branch_name,
        r.name as role_name,
        r.code as role_code,
        GROUP_CONCAT(DISTINCT p.name ORDER BY p.name SEPARATOR ', ') as permissions,
        COUNT(DISTINCT p.id) as permission_count
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
      LEFT JOIN permission_roles pr ON u.role_id = pr.role_id
      LEFT JOIN permissions p ON pr.permission_id = p.id
      WHERE u.branch_name = :branch_name
      GROUP BY u.id, u.name, u.username, u.branch_name, r.name, r.code
      ORDER BY u.name
    `, { branch_name });

    // ✅ Get summary statistics
    const [stats] = await db.query(`
      SELECT 
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT p.id) as total_unique_permissions,
        AVG(perm_counts.perm_count) as avg_permissions_per_user
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
      LEFT JOIN permission_roles pr ON u.role_id = pr.role_id
      LEFT JOIN permissions p ON pr.permission_id = p.id
      LEFT JOIN (
        SELECT 
          u2.id as user_id,
          COUNT(DISTINCT pr2.permission_id) as perm_count
        FROM user u2
        INNER JOIN permission_roles pr2 ON u2.role_id = pr2.role_id
        GROUP BY u2.id
      ) as perm_counts ON u.id = perm_counts.user_id
      WHERE u.branch_name = :branch_name
    `, { branch_name });

    return res.json({
      success: true,
      branch_name: branch_name,
      users: branchUsers,
      stats: stats[0]
    });

  } catch (error) {
    console.error('❌ Error in getPermissionsByBranch:', error);
    logError("permission.getPermissionsByBranch", error, res);
  }
};

/**
 * Update role permissions (Super Admin only)
 */
exports.updateRolePermissions = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { role_id } = req.params;
    const { permission_ids } = req.body; // Array of permission IDs

    // ✅ Verify Super Admin
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code, u.name, u.username FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Only Super Admin can modify role permissions"
      });
    }

    // ✅ Get role info
    const [roleInfo] = await db.query(
      "SELECT * FROM role WHERE id = :role_id",
      { role_id }
    );

    if (roleInfo.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Role not found"
      });
    }

    // ✅ Start transaction
    await db.query("START TRANSACTION");

    try {
      // ✅ Delete existing permissions for this role
      await db.query(
        "DELETE FROM permission_roles WHERE role_id = :role_id",
        { role_id }
      );

      // ✅ Insert new permissions
      if (permission_ids && permission_ids.length > 0) {
        const values = permission_ids.map(perm_id =>
          `(${role_id}, ${perm_id})`
        ).join(', ');

        await db.query(`
          INSERT INTO permission_roles (role_id, permission_id)
          VALUES ${values}
        `);
      }

      // ✅ Commit transaction
      await db.query("COMMIT");

      // ✅ Log activity
      try {
        await db.query(`
          INSERT INTO user_activity_log (
            user_id,
            action_type,
            action_description,
            ip_address,
            user_agent,
            created_at,
            created_by
          ) VALUES (
            :user_id,
            'ROLE_PERMISSIONS_UPDATED',
            :description,
            :ip_address,
            :user_agent,
            NOW(),
            :created_by
          )
        `, {
          user_id: currentUserId,
          description: `Updated permissions for role: ${roleInfo[0].name} (${permission_ids?.length || 0} permissions)`,
          ip_address: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'Unknown',
          user_agent: req.get('User-Agent') || 'Unknown',
          created_by: currentUserId
        });
      } catch (logError) {
        console.error("Failed to log permission update:", logError);
      }

      // ✅ Send Telegram notification
      const alertMessage = `
🔐 <b>ROLE PERMISSIONS UPDATED</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━

🎭 <b>Role:</b> ${roleInfo[0].name} (${roleInfo[0].code})
📊 <b>Permissions:</b> ${permission_ids?.length || 0}

━━━━━━━━━━━━━━━━━━━━━━━━━━
👨‍💼 <b>Updated By:</b>
${currentUser[0]?.name} (${currentUser[0]?.username})

⏰ <b>Time:</b> ${new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Phnom_Penh',
        dateStyle: 'full',
        timeStyle: 'long'
      })}
      `;

      sendTelegramMessagenewLogin(alertMessage).catch(err => {
        console.error("Failed to send Telegram alert:", err.message);
      });

      return res.json({
        success: true,
        message: "Role permissions updated successfully",
        message_kh: "កែប្រែសិទ្ធិតួនាទីបានជោគជ័យ",
        data: {
          role_id: role_id,
          role_name: roleInfo[0].name,
          permission_count: permission_ids?.length || 0
        }
      });

    } catch (error) {
      // ✅ Rollback on error
      await db.query("ROLLBACK");
      throw error;
    }

  } catch (error) {
    console.error('❌ Error in updateRolePermissions:', error);
    logError("permission.updateRolePermissions", error, res);
  }
};

/**
 * Get permission comparison across roles
 */
exports.getPermissionComparison = async (req, res) => {
  try {
    const currentUserId = req.current_id;

    // ✅ Verify Super Admin
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Access denied. Super Admin only."
      });
    }

    // ✅ Get all roles
    const [roles] = await db.query(`
      SELECT id, name, code FROM role ORDER BY id
    `);

    // ✅ Get all permissions
    const [permissions] = await db.query(`
      SELECT id, name, \`group\` as category FROM permissions ORDER BY \`group\`, name
    `);

    // ✅ Get permission-role mapping
    const [permissionRoles] = await db.query(`
      SELECT role_id, permission_id FROM permission_roles
    `);

    // ✅ Build comparison matrix
    const matrix = permissions.map(perm => {
      const row = {
        permission_id: perm.id,
        permission_name: perm.name,
        category: perm.category
      };

      roles.forEach(role => {
        const hasPermission = permissionRoles.some(
          pr => pr.role_id === role.id && pr.permission_id === perm.id
        );
        row[`role_${role.id}`] = hasPermission;
      });

      return row;
    });

    return res.json({
      success: true,
      roles: roles,
      permissions: permissions,
      matrix: matrix
    });

  } catch (error) {
    console.error('❌ Error in getPermissionComparison:', error);
    logError("permission.getPermissionComparison", error, res);
  }
};

/**
 * Clone permissions from one role to another
 */
exports.cloneRolePermissions = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { source_role_id, target_role_id } = req.body;

    // ✅ Verify Super Admin
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code, u.name FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Only Super Admin can clone permissions"
      });
    }

    // ✅ Get source role permissions
    const [sourcePermissions] = await db.query(`
      SELECT permission_id FROM permission_roles WHERE role_id = :role_id
    `, { role_id: source_role_id });

    if (sourcePermissions.length === 0) {
      return res.status(400).json({
        error: true,
        message: "Source role has no permissions to clone"
      });
    }

    // ✅ Start transaction
    await db.query("START TRANSACTION");

    try {
      // ✅ Delete existing permissions for target role
      await db.query(
        "DELETE FROM permission_roles WHERE role_id = :role_id",
        { role_id: target_role_id }
      );

      // ✅ Copy permissions
      const values = sourcePermissions.map(p =>
        `(${target_role_id}, ${p.permission_id})`
      ).join(', ');

      await db.query(`
        INSERT INTO permission_roles (role_id, permission_id)
        VALUES ${values}
      `);

      // ✅ Commit
      await db.query("COMMIT");

      return res.json({
        success: true,
        message: "Permissions cloned successfully",
        message_kh: "ចម្លងសិទ្ធិបានជោគជ័យ",
        count: sourcePermissions.length
      });

    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }

  } catch (error) {
    console.error('❌ Error in cloneRolePermissions:', error);
    logError("permission.cloneRolePermissions", error, res);
  }
};

// ==================== PERMISSION CRUD ====================

/**
 * Create new permission
 */
exports.createPermission = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { name, group, is_menu_web, web_route_key, description } = req.body;

    // ✅ Verify Super Admin
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code, u.name, u.username FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Only Super Admin can create permissions"
      });
    }

    // ✅ Check if permission already exists
    const [existing] = await db.query(
      "SELECT id FROM permissions WHERE name = :name",
      { name }
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error: true,
        message: "Permission with this name already exists",
        message_kh: "សិទ្ធិនេះមានរួចហើយ"
      });
    }

    // ✅ Insert new permission
    const [result] = await db.query(`
      INSERT INTO permissions (name, \`group\`, is_menu_web, web_route_key, description, created_at)
      VALUES (:name, :group, :is_menu_web, :web_route_key, :description, NOW())
    `, {
      name,
      group: group || 'other',
      is_menu_web: is_menu_web ? 1 : 0,
      web_route_key: web_route_key || null,
      description: description || null
    });

    // ✅ Log activity
    try {
      await db.query(`
        INSERT INTO user_activity_log (
          user_id, action_type, action_description, 
          ip_address, user_agent, created_at, created_by
        ) VALUES (
          :user_id, 'PERMISSION_CREATED', :description,
          :ip_address, :user_agent, NOW(), :created_by
        )
      `, {
        user_id: currentUserId,
        description: `Created permission: ${name} (${group})`,
        ip_address: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'Unknown',
        user_agent: req.get('User-Agent') || 'Unknown',
        created_by: currentUserId
      });
    } catch (logErr) {
      console.error("Failed to log activity:", logErr);
    }

    // ✅ Send Telegram notification
    const alertMessage = `
🆕 <b>NEW PERMISSION CREATED</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 <b>Permission:</b> ${name}
📁 <b>Group:</b> ${group || 'other'}
🌐 <b>Menu:</b> ${is_menu_web ? 'Yes' : 'No'}
🔗 <b>Route:</b> ${web_route_key || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━
👨‍💼 <b>Created By:</b>
${currentUser[0]?.name} (${currentUser[0]?.username})

⏰ <b>Time:</b> ${new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Phnom_Penh',
      dateStyle: 'full',
      timeStyle: 'long'
    })}
    `;

    sendTelegramMessagenewLogin(alertMessage).catch(err => {
      console.error("Failed to send Telegram alert:", err.message);
    });

    return res.json({
      success: true,
      message: "Permission created successfully",
      message_kh: "បង្កើតសិទ្ធិបានជោគជ័យ",
      data: {
        id: result.insertId,
        name,
        group: group || 'other'
      }
    });

  } catch (error) {
    console.error('❌ Error in createPermission:', error);
    logError("permission.createPermission", error, res);
  }
};

/**
 * Update permission
 */
exports.updatePermission = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { permission_id } = req.params;
    const { name, group, is_menu_web, web_route_key, description } = req.body;

    // ✅ Verify Super Admin
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code, u.name FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Only Super Admin can update permissions"
      });
    }

    // ✅ Check if permission exists
    const [existing] = await db.query(
      "SELECT * FROM permissions WHERE id = :id",
      { id: permission_id }
    );

    if (existing.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Permission not found"
      });
    }

    // ✅ Check for duplicate name (if changing name)
    if (name && name !== existing[0].name) {
      const [duplicate] = await db.query(
        "SELECT id FROM permissions WHERE name = :name AND id != :id",
        { name, id: permission_id }
      );

      if (duplicate.length > 0) {
        return res.status(400).json({
          error: true,
          message: "Permission with this name already exists",
          message_kh: "សិទ្ធិនេះមានរួចហើយ"
        });
      }
    }

    // ✅ Update permission
    await db.query(`
      UPDATE permissions 
      SET 
        name = :name,
        \`group\` = :group,
        is_menu_web = :is_menu_web,
        web_route_key = :web_route_key,
        description = :description,
        updated_at = NOW()
      WHERE id = :id
    `, {
      id: permission_id,
      name: name || existing[0].name,
      group: group || existing[0].group,
      is_menu_web: is_menu_web !== undefined ? (is_menu_web ? 1 : 0) : existing[0].is_menu_web,
      web_route_key: web_route_key !== undefined ? web_route_key : existing[0].web_route_key,
      description: description !== undefined ? description : existing[0].description
    });

    // ✅ Log activity
    try {
      await db.query(`
        INSERT INTO user_activity_log (
          user_id, action_type, action_description,
          ip_address, user_agent, created_at, created_by
        ) VALUES (
          :user_id, 'PERMISSION_UPDATED', :description,
          :ip_address, :user_agent, NOW(), :created_by
        )
      `, {
        user_id: currentUserId,
        description: `Updated permission: ${name || existing[0].name}`,
        ip_address: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'Unknown',
        user_agent: req.get('User-Agent') || 'Unknown',
        created_by: currentUserId
      });
    } catch (logErr) {
      console.error("Failed to log activity:", logErr);
    }

    return res.json({
      success: true,
      message: "Permission updated successfully",
      message_kh: "កែប្រែសិទ្ធិបានជោគជ័យ"
    });

  } catch (error) {
    console.error('❌ Error in updatePermission:', error);
    logError("permission.updatePermission", error, res);
  }
};

/**
 * Delete permission
 */
exports.deletePermission = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { permission_id } = req.params;

    // ✅ Verify Super Admin
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code, u.name, u.username FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Only Super Admin can delete permissions"
      });
    }

    // ✅ Get permission info
    const [permission] = await db.query(
      "SELECT * FROM permissions WHERE id = :id",
      { id: permission_id }
    );

    if (permission.length === 0) {
      return res.status(404).json({
        error: true,
        message: "Permission not found"
      });
    }

    // ✅ Check how many roles use this permission
    const [usage] = await db.query(`
      SELECT COUNT(*) as count FROM permission_roles WHERE permission_id = :id
    `, { id: permission_id });

    // ✅ Start transaction
    await db.query("START TRANSACTION");

    try {
      // ✅ Delete from permission_roles first (foreign key)
      await db.query(
        "DELETE FROM permission_roles WHERE permission_id = :id",
        { id: permission_id }
      );

      // ✅ Delete permission
      await db.query(
        "DELETE FROM permissions WHERE id = :id",
        { id: permission_id }
      );

      // ✅ Commit
      await db.query("COMMIT");

      // ✅ Log activity
      try {
        await db.query(`
          INSERT INTO user_activity_log (
            user_id, action_type, action_description,
            ip_address, user_agent, created_at, created_by
          ) VALUES (
            :user_id, 'PERMISSION_DELETED', :description,
            :ip_address, :user_agent, NOW(), :created_by
          )
        `, {
          user_id: currentUserId,
          description: `Deleted permission: ${permission[0].name} (used by ${usage[0].count} roles)`,
          ip_address: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'Unknown',
          user_agent: req.get('User-Agent') || 'Unknown',
          created_by: currentUserId
        });
      } catch (logErr) {
        console.error("Failed to log activity:", logErr);
      }

      // ✅ Send Telegram notification
      const alertMessage = `
🗑️ <b>PERMISSION DELETED</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 <b>Permission:</b> ${permission[0].name}
📁 <b>Group:</b> ${permission[0].group}
⚠️ <b>Affected Roles:</b> ${usage[0].count}

━━━━━━━━━━━━━━━━━━━━━━━━━━
👨‍💼 <b>Deleted By:</b>
${currentUser[0]?.name} (${currentUser[0]?.username})

⏰ <b>Time:</b> ${new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Phnom_Penh',
        dateStyle: 'full',
        timeStyle: 'long'
      })}
      `;

      sendTelegramMessagenewLogin(alertMessage).catch(err => {
        console.error("Failed to send Telegram alert:", err.message);
      });

      return res.json({
        success: true,
        message: "Permission deleted successfully",
        message_kh: "លុបសិទ្ធិបានជោគជ័យ",
        affected_roles: usage[0].count
      });

    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }

  } catch (error) {
    console.error('❌ Error in deletePermission:', error);
    logError("permission.deletePermission", error, res);
  }
};

/**
 * Get all groups/categories
 */
exports.getAllGroups = async (req, res) => {
  try {
    const currentUserId = req.current_id;

    // ✅ Verify Super Admin
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Access denied"
      });
    }

    // ✅ Get distinct groups
    const [groups] = await db.query(`
      SELECT DISTINCT \`group\` as name, COUNT(*) as permission_count
      FROM permissions
      WHERE \`group\` IS NOT NULL AND \`group\` != ''
      GROUP BY \`group\`
      ORDER BY \`group\`
    `);

    return res.json({
      success: true,
      groups: groups,
      total: groups.length
    });

  } catch (error) {
    console.error('❌ Error in getAllGroups:', error);
    logError("permission.getAllGroups", error, res);
  }
};



// ✅ Add this to Permission.controller.js

/**
 * Force refresh user permissions (invalidate current session)
 */
exports.refreshUserPermissions = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { user_id } = req.params;

    // ✅ Verify Super Admin
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Only Super Admin can refresh permissions"
      });
    }

    // ✅ Update user's token_version to invalidate current sessions
    await db.query(`
      UPDATE user 
      SET token_version = COALESCE(token_version, 0) + 1,
          updated_at = NOW()
      WHERE id = :user_id
    `, { user_id });

    // ✅ Log activity
    try {
      await db.query(`
        INSERT INTO user_activity_log (
          user_id, action_type, action_description,
          ip_address, user_agent, created_at, created_by
        ) VALUES (
          :user_id, 'PERMISSIONS_REFRESHED', :description,
          :ip_address, :user_agent, NOW(), :created_by
        )
      `, {
        user_id: user_id,
        description: `Permissions refreshed - session invalidated`,
        ip_address: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'Unknown',
        user_agent: req.get('User-Agent') || 'Unknown',
        created_by: currentUserId
      });
    } catch (logErr) {
      console.error("Failed to log activity:", logErr);
    }

    return res.json({
      success: true,
      message: "User will be logged out and must re-login to see updated permissions",
      message_kh: "អ្នកប្រើប្រាស់នឹងត្រូវ logout ហើយ login ម្តងទៀតដើម្បីមើលសិទ្ធិថ្មី"
    });

  } catch (error) {
    console.error('❌ Error in refreshUserPermissions:', error);
    logError("permission.refreshUserPermissions", error, res);
  }
};

/**
 * Batch refresh permissions for all users with a specific role
 */
exports.refreshRolePermissions = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { role_id } = req.params;

    // ✅ Verify Super Admin
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = :user_id`,
      { user_id: currentUserId }
    );

    if (currentUser[0]?.role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        message: "Only Super Admin can refresh permissions"
      });
    }

    // ✅ Get all users with this role
    const [users] = await db.query(`
      SELECT u.id, u.name, u.username 
      FROM user u
      INNER JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.role_id = :role_id
    `, { role_id });

    if (users.length === 0) {
      return res.json({
        success: true,
        message: "No users found with this role",
        affected_users: 0
      });
    }

    // ✅ Invalidate all these users' sessions
    await db.query(`
      UPDATE user 
      SET token_version = COALESCE(token_version, 0) + 1,
          updated_at = NOW()
      WHERE id IN (
        SELECT user_id FROM user_roles WHERE role_id = :role_id
      )
    `, { role_id });

    // ✅ Log activity
    try {
      await db.query(`
        INSERT INTO user_activity_log (
          user_id, action_type, action_description,
          ip_address, user_agent, created_at, created_by
        ) VALUES (
          :user_id, 'ROLE_PERMISSIONS_REFRESHED', :description,
          :ip_address, :user_agent, NOW(), :created_by
        )
      `, {
        user_id: currentUserId,
        description: `Refreshed permissions for ${users.length} users with role_id ${role_id}`,
        ip_address: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'Unknown',
        user_agent: req.get('User-Agent') || 'Unknown',
        created_by: currentUserId
      });
    } catch (logErr) {
      console.error("Failed to log activity:", logErr);
    }

    return res.json({
      success: true,
      message: `${users.length} users will be logged out and must re-login`,
      message_kh: `អ្នកប្រើប្រាស់ ${users.length} នាក់នឹងត្រូវ logout ហើយ login ម្តងទៀត`,
      affected_users: users.length,
      users: users.map(u => ({ id: u.id, name: u.name, username: u.username }))
    });

  } catch (error) {
    console.error('❌ Error in refreshRolePermissions:', error);
    logError("permission.refreshRolePermissions", error, res);
  }
};


module.exports = exports;