const { logError, db } = require("../util/helper");

/**
 * Get branch overrides - FIXED
 */
exports.getBranchOverrides = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { branch_name, role_id } = req.params;


    // ✅ Verify Super Admin
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [currentUserId]
    );

    if (!currentUser[0] || currentUser[0].role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        success: false,
        message: "Only Super Admin can view branch overrides"
      });
    }


    // ✅ Get overrides
    const [overrides] = await db.query(`
      SELECT 
        bpo.id,
        bpo.branch_name,
        bpo.role_id,
        bpo.permission_id,
        bpo.override_type,
        bpo.reason,
        bpo.created_at,
        bpo.created_by,
        r.name as role_name,
        r.code as role_code,
        p.name as permission_name,
        p.\`group\` as permission_group,
        u.name as created_by_name
      FROM branch_permission_overrides bpo
      INNER JOIN role r ON bpo.role_id = r.id
      INNER JOIN permissions p ON bpo.permission_id = p.id
      LEFT JOIN user u ON bpo.created_by = u.id
      WHERE bpo.branch_name = ?
      AND bpo.role_id = ?
      ORDER BY bpo.override_type DESC, p.\`group\`, p.name
    `, [branch_name, role_id]);


    // ✅ Get base role permissions
    const [basePermissions] = await db.query(`
      SELECT 
        p.id, 
        p.name, 
        p.\`group\` as category
      FROM permissions p
      INNER JOIN permission_roles pr ON p.id = pr.permission_id
      WHERE pr.role_id = ?
      ORDER BY p.\`group\`, p.name
    `, [role_id]);


    // ✅ Calculate stats
    const addedCount = overrides.filter(o => o.override_type === 'add').length;
    const removedCount = overrides.filter(o => o.override_type === 'remove').length;

    const response = {
      success: true,
      branch_name: branch_name,
      role_id: parseInt(role_id),
      base_permissions_count: basePermissions.length,
      added_count: addedCount,
      removed_count: removedCount,
      effective_count: basePermissions.length + addedCount - removedCount,
      overrides: overrides,
      base_permissions: basePermissions
    };


    return res.json(response);

  } catch (error) {
    console.error('❌ Error in getBranchOverrides:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || "Failed to get branch overrides"
    });
  }
};

/**
 * Add branch override - FIXED
 */
exports.addBranchOverride = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { branch_name, role_id, permission_id, override_type, reason } = req.body;


    // ✅ Verify Super Admin
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code, u.name, u.username, u.branch_name 
       FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [currentUserId]
    );

    if (!currentUser[0] || currentUser[0].role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        success: false,
        message: "Only Super Admin can create branch overrides"
      });
    }

    // ✅ Validate override_type
    if (!['add', 'remove'].includes(override_type)) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "override_type must be 'add' or 'remove'"
      });
    }

    // ✅ Get permission and role info
    const [permission] = await db.query(
      `SELECT name, \`group\` as category FROM permissions WHERE id = ?`,
      [permission_id]
    );

    const [role] = await db.query(
      `SELECT name, code FROM role WHERE id = ?`,
      [role_id]
    );

    if (permission.length === 0 || role.length === 0) {
      return res.status(404).json({
        error: true,
        success: false,
        message: "Permission or Role not found"
      });
    }

    // ✅ Check if override already exists
    const [existing] = await db.query(`
      SELECT id FROM branch_permission_overrides
      WHERE branch_name = ? 
      AND role_id = ? 
      AND permission_id = ?
    `, [branch_name, role_id, permission_id]);

    if (existing.length > 0) {
      return res.status(400).json({
        error: true,
        success: false,
        message: "Override already exists for this branch+role+permission combination",
        message_kh: "មានការកំណត់ override នេះរួចហើយ"
      });
    }

    // ✅ Validate logic - FIXED: Check if row exists, not checking id field
    if (override_type === 'add') {
      const [inBaseRole] = await db.query(`
        SELECT 1 FROM permission_roles 
        WHERE role_id = ? AND permission_id = ?
        LIMIT 1
      `, [role_id, permission_id]);

      if (inBaseRole.length > 0) {
        return res.status(400).json({
          error: true,
          success: false,
          message: "This permission already exists in the base role. No need to add override.",
          message_kh: "សិទ្ធិនេះមានរួចហើយក្នុង role ដើម"
        });
      }
    } else if (override_type === 'remove') {
      const [inBaseRole] = await db.query(`
        SELECT 1 FROM permission_roles 
        WHERE role_id = ? AND permission_id = ?
        LIMIT 1
      `, [role_id, permission_id]);

      if (inBaseRole.length === 0) {
        return res.status(400).json({
          error: true,
          success: false,
          message: "This permission doesn't exist in the base role. Cannot remove.",
          message_kh: "សិទ្ធិនេះមិនមានក្នុង role ដើមទេ"
        });
      }
    }

    // ✅ Insert override
    const [result] = await db.query(`
      INSERT INTO branch_permission_overrides 
      (branch_name, role_id, permission_id, override_type, reason, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [branch_name, role_id, permission_id, override_type, reason || null, currentUserId]);


    // ✅ Send notification (without requiring notification_log table)
    try {
      const alertMessage = `
🔧 BRANCH PERMISSION OVERRIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━
🏢 Branch: ${branch_name}
🎭 Role: ${role[0].name} (${role[0].code})
🔐 Permission: ${permission[0].name}
${override_type === 'add' ? '➕' : '➖'} Action: ${override_type.toUpperCase()}
📝 Reason: ${reason || 'N/A'}
━━━━━━━━━━━━━━━━━━━━━━━━━━
👨‍💼 Created By: ${currentUser[0]?.name}
⏰ Time: ${new Date().toLocaleString()}
      `;
    } catch (notifError) {
      console.error("❌ Notification failed:", notifError);
    }

    return res.json({
      success: true,
      message: "Branch override created successfully",
      message_kh: "បង្កើត override សម្រាប់សាខាបានជោគជ័យ",
      data: {
        id: result.insertId,
        branch_name,
        role_name: role[0].name,
        permission_name: permission[0].name,
        override_type
      }
    });

  } catch (error) {
    console.error('❌ Error in addBranchOverride:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || "Failed to add branch override"
    });
  }
};

/**
 * Delete branch override - FIXED
 */
exports.deleteBranchOverride = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { override_id } = req.params;


    // ✅ Verify Super Admin
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code, u.name FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [currentUserId]
    );

    if (!currentUser[0] || currentUser[0].role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        success: false,
        message: "Only Super Admin can delete branch overrides"
      });
    }

    // ✅ Get override info before deleting
    const [override] = await db.query(`
      SELECT 
        bpo.*,
        r.name as role_name,
        p.name as permission_name
      FROM branch_permission_overrides bpo
      INNER JOIN role r ON bpo.role_id = r.id
      INNER JOIN permissions p ON bpo.permission_id = p.id
      WHERE bpo.id = ?
    `, [override_id]);

    if (override.length === 0) {
      return res.status(404).json({
        error: true,
        success: false,
        message: "Override not found"
      });
    }

    // ✅ Delete override
    await db.query(
      `DELETE FROM branch_permission_overrides WHERE id = ?`,
      [override_id]
    );


    return res.json({
      success: true,
      message: "Branch override deleted successfully",
      message_kh: "លុប override បានជោគជ័យ"
    });

  } catch (error) {
    console.error('❌ Error in deleteBranchOverride:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || "Failed to delete branch override"
    });
  }
};

/**
 * Get effective permissions for a user
 */
exports.getUserEffectivePermissions = async (req, res) => {
  try {
    const currentUserId = req.current_id;
    const { user_id } = req.params;

    // ✅ Verify Super Admin or same user
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [currentUserId]
    );

    const isSuperAdmin = currentUser[0]?.role_code === 'SUPER_ADMIN';
    const isSameUser = parseInt(currentUserId) === parseInt(user_id);

    if (!isSuperAdmin && !isSameUser) {
      return res.status(403).json({
        error: true,
        success: false,
        message: "Access denied"
      });
    }

    // ✅ Get user info
    const [userInfo] = await db.query(`
      SELECT u.id, u.name, u.username, u.branch_name, r.name as role_name, r.id as role_id
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
      WHERE u.id = ?
    `, [user_id]);

    if (userInfo.length === 0) {
      return res.status(404).json({
        error: true,
        success: false,
        message: "User not found"
      });
    }

    const user = userInfo[0];

    // ✅ Get base permissions - FIXED query
    const [basePermissions] = await db.query(`
      SELECT DISTINCT
        p.id as permission_id,
        p.name as permission_name,
        p.\`group\` as permission_group,
        'from_role' as permission_source
      FROM permissions p
      INNER JOIN permission_roles pr ON p.id = pr.permission_id
      WHERE pr.role_id = ?
      ORDER BY p.\`group\`, p.name
    `, [user.role_id]);

    // ✅ Get overrides
    const [overrides] = await db.query(`
      SELECT 
        bpo.permission_id,
        bpo.override_type,
        p.name as permission_name,
        p.\`group\` as permission_group
      FROM branch_permission_overrides bpo
      INNER JOIN permissions p ON bpo.permission_id = p.id
      WHERE bpo.branch_name = ?
      AND bpo.role_id = ?
    `, [user.branch_name, user.role_id]);

    // ✅ Calculate effective
    const basePermIds = new Set(basePermissions.map(p => p.permission_id));
    const removedPermIds = new Set(
      overrides.filter(o => o.override_type === 'remove').map(o => o.permission_id)
    );
    const addedOverrides = overrides.filter(o => o.override_type === 'add');

    let effectivePermissions = basePermissions
      .filter(p => !removedPermIds.has(p.permission_id))
      .map(p => ({ ...p, has_permission: 1 }));

    addedOverrides.forEach(override => {
      if (!basePermIds.has(override.permission_id)) {
        effectivePermissions.push({
          permission_id: override.permission_id,
          permission_name: override.permission_name,
          permission_group: override.permission_group,
          permission_source: 'added_by_branch',
          has_permission: 1
        });
      }
    });

    return res.json({
      success: true,
      user: user,
      permissions: effectivePermissions,
      total: effectivePermissions.length,
      summary: {
        base_permissions: basePermissions.length,
        added_by_branch: addedOverrides.length,
        removed_by_branch: removedPermIds.size,
        effective_total: effectivePermissions.length
      }
    });

  } catch (error) {
    console.error('❌ Error in getUserEffectivePermissions:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || "Failed to get effective permissions"
    });
  }
};

/**
 * Get branch override summary
 */
exports.getBranchOverrideSummary = async (req, res) => {
  try {
    const currentUserId = req.current_id;

    // ✅ Verify Super Admin
    const [currentUser] = await db.query(
      `SELECT r.code AS role_code FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [currentUserId]
    );

    if (!currentUser[0] || currentUser[0].role_code !== 'SUPER_ADMIN') {
      return res.status(403).json({
        error: true,
        success: false,
        message: "Only Super Admin can view branch override summary"
      });
    }

    // ✅ Get summary
    const [summary] = await db.query(`
      SELECT 
        u.branch_name,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT bpo.id) as total_overrides,
        SUM(CASE WHEN bpo.override_type = 'add' THEN 1 ELSE 0 END) as added_permissions,
        SUM(CASE WHEN bpo.override_type = 'remove' THEN 1 ELSE 0 END) as removed_permissions,
        COUNT(DISTINCT bpo.role_id) as affected_roles
      FROM user u
      LEFT JOIN branch_permission_overrides bpo ON u.branch_name = bpo.branch_name
      WHERE u.branch_name IS NOT NULL AND u.branch_name != ''
      GROUP BY u.branch_name
      ORDER BY u.branch_name
    `);

    return res.json({
      success: true,
      branches: summary,
      total_branches: summary.length,
      total_overrides: summary.reduce((sum, b) => sum + (b.total_overrides || 0), 0)
    });

  } catch (error) {
    console.error('❌ Error in getBranchOverrideSummary:', error);
    return res.status(500).json({
      error: true,
      success: false,
      message: error.message || "Failed to get branch override summary"
    });
  }
};

module.exports = exports;