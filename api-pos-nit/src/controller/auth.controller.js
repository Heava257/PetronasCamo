const { logError, db, removeFile, sendTelegramMessagenewLogin, parseUserAgent, getLocationFromIP } = require("../util/helper");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../util/config");
const { json } = require("express");
const { OAuth2Client } = require('google-auth-library');
const { createSystemNotification } = require("./System_notification.controller");



const GOOGLE_CLIENT_ID = "560658332704-c0alvnu94ko2vbofdomrhnfhn4bn7i1h.apps.googleusercontent.com";
const GOOGLE_CLIENT_SECRET = "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";
const GOOGLE_REDIRECT_URI = "http://localhost:8080/api/auth/google/callback";
const FRONTEND_URL = "http://localhost:3000"


const googleClient = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

exports.getList = async (req, res) => {
  try {
    const currentUserId = req.current_id;

    // ✅ Get current user with role
    const [currentUser] = await db.query(
      `SELECT 
        u.id, 
        u.role_id, 
        u.group_id, 
        u.branch_name, 
        u.name, 
        r.code AS role_code,
        r.name AS role_name
       FROM user u 
       INNER JOIN role r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [currentUserId]
    );

    if (!currentUser || currentUser.length === 0) {
      console.error('❌ User not found for ID:', currentUserId);
      return res.status(404).json({
        error: true,
        message: "User not found",
        message_kh: "រកមិនឃើញអ្នកប្រើប្រាស់"
      });
    }

    const userRole = currentUser[0].role_code;
    const userRoleId = currentUser[0].role_id;
    const userGroupId = currentUser[0].group_id;



    // ✅✅✅ AUTO-FIX: If Admin has NULL group_id, fix it NOW ✅✅✅
    if (userRoleId === 1 && (!userGroupId || userGroupId === 0)) {  // role_id = 1 is Admin
      console.warn(`⚠️ FIXING: Admin ${currentUser[0].name} has NULL group_id. Setting to ${currentUserId}`);

      try {
        await db.query(
          `UPDATE user SET group_id = ? WHERE id = ?`,
          [currentUserId, currentUserId]
        );

        currentUser[0].group_id = currentUserId;
      } catch (fixError) {
        console.error('❌ Failed to auto-fix group_id:', fixError);
        return res.status(500).json({
          error: true,
          message: "Database error: Please contact administrator",
          message_kh: "មានបញ្ហាទិន្នន័យ សូមទាក់ទងអ្នកគ្រប់គ្រង"
        });
      }
    }

    let sql;
    let params = {};

    // ✅ Check role by role_id (more reliable than role_code)
    if (userRoleId === 29) {  // role_id = 29 is Super Admin

      sql = `
        SELECT  
          u.id, 
          u.name, 
          u.barcode, 
          u.username, 
          u.branch_name, 
          u.group_id,
          u.create_by, 
          u.create_at, 
          u.address, 
          u.tel, 
          u.is_active, 
          u.profile_image,
          r.name AS role_name,
          r.code AS role_code
        FROM user u 
        INNER JOIN role r ON u.role_id = r.id 
        ORDER BY u.branch_name, u.create_at DESC
      `;
    } else if (userRoleId === 1) {  // role_id = 1 is Admin
      const filterGroupId = currentUser[0].group_id;


      if (!filterGroupId || filterGroupId === 0) {
        console.error(`❌ CRITICAL: Admin still has invalid group_id!`);
        return res.status(500).json({
          error: true,
          message: "Account configuration error. Please contact administrator.",
          message_kh: "មានបញ្ហាការកំណត់គណនី សូមទាក់ទងអ្នកគ្រប់គ្រង"
        });
      }

      sql = `
        SELECT  
          u.id, 
          u.name, 
          u.barcode, 
          u.username, 
          u.branch_name, 
          u.group_id,
          u.create_by, 
          u.create_at, 
          u.address, 
          u.tel, 
          u.is_active, 
          u.profile_image,
          r.name AS role_name,
          r.code AS role_code
        FROM user u 
        INNER JOIN role r ON u.role_id = r.id 
        WHERE u.group_id = :current_group_id
        ORDER BY u.create_at DESC
      `;
      params.current_group_id = filterGroupId;
    } else {
      // Regular user - no access to user list
      console.warn(`⚠️ User with role_id ${userRoleId} attempted to access user list`);
      return res.status(403).json({
        error: true,
        message: "You don't have permission to view user list",
        message_kh: "អ្នកមិនមានសិទ្ធិមើលបញ្ជីអ្នកប្រើប្រាស់"
      });
    }

    const [list] = await db.query(sql, params);


    if (list.length > 0) {

    } else if (userRoleId === 1) {  // If Admin and no users found
      console.warn(`⚠️ No users found for group_id: ${params.current_group_id}`);
    }

    // Get all roles
    const [role] = await db.query(
      "SELECT id AS value, name AS label, code FROM role ORDER BY name"
    );

    res.json({
      list,
      role,
      is_super_admin: userRoleId === 29,  // Check by role_id, not role_code
      debug: {
        current_user_id: currentUserId,
        role: userRole,
        role_id: userRoleId,
        group_id: currentUser[0].group_id,
        filter_applied: params.current_group_id || 'none',
        users_found: list.length
      }
    });

  } catch (error) {
    console.error("❌ Error in getList:", error);
    logError("auth.getList", error, res);

    return res.status(500).json({
      error: true,
      message: "Failed to retrieve user list",
      message_kh: "មិនអាចទាញបញ្ជីអ្នកប្រើប្រាស់បានទេ"
    });
  }
};
exports.updateuserProfile = async (req, res) => {
  const { userId } = req.params;

  try {
    const { name, username } = req.body;
    
    // ✅ Validate required fields
    if (!name || !username) {
      return res.status(400).json({
        success: false,
        message: "Name and username are required",
        message_kh: "ត្រូវការឈ្មោះ និង Username"
      });
    }

    // ✅ Check if username already exists (exclude current user)
    const [existingUser] = await db.query(
      "SELECT id FROM user WHERE username = :username AND id != :userId",
      { username: username.trim(), userId }
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Username already exists",
        message_kh: "Username នេះមានរួចហើយ"
      });
    }

    // ✅ Get current user data to check for old profile image
    const [currentUser] = await db.query(
      "SELECT profile_image FROM user WHERE id = :userId",
      { userId }
    );

    if (currentUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        message_kh: "រកមិនឃើញអ្នកប្រើប្រាស់"
      });
    }

    // ✅ Handle profile image
    let profileImage = currentUser[0].profile_image; // Keep existing image by default
    
    if (req.file) {
      // New image uploaded
      profileImage = req.file.filename;

      // ✅ Delete old image if exists
      if (currentUser[0].profile_image && currentUser[0].profile_image !== profileImage) {
        try {
          removeFile(currentUser[0].profile_image);
        } catch (removeError) {
          console.error("Failed to delete old image:", removeError);
          // Don't fail the request if image deletion fails
        }
      }
    }

    // ✅ Update user profile
    const updateSql = `
      UPDATE user 
      SET 
        name = :name, 
        username = :username,
        profile_image = :profile_image
      WHERE id = :userId
    `;

    const [result] = await db.query(updateSql, {
      name: name.trim(),
      username: username.trim(),
      profile_image: profileImage,
      userId
    });

    if (result.affectedRows > 0) {
      // ✅ Fetch updated user data
      const [updatedUser] = await db.query(`
        SELECT 
          u.id, 
          u.name, 
          u.username, 
          u.email,
          u.tel,
          u.profile_image,
          u.branch_name,
          u.address,
          r.name as role_name
        FROM user u
        INNER JOIN role r ON u.role_id = r.id
        WHERE u.id = :userId
      `, { userId });


      // ✅ Log activity
      const clientIP = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'Unknown';
      const userAgent = req.get('User-Agent') || 'Unknown';

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
            'PROFILE_UPDATED',
            :description,
            :ip_address,
            :user_agent,
            NOW(),
            :created_by
          )
        `, {
          user_id: userId,
          description: `Profile updated: ${name} (${username})${req.file ? ' - Profile image changed' : ''}`,
          ip_address: clientIP,
          user_agent: userAgent,
          created_by: userId
        });
      } catch (logError) {
        console.error("Failed to log profile update:", logError);
      }

      return res.json({
        success: true,
        message: "Profile updated successfully",
        message_kh: "បានកែប្រែព័ត៌មានដោយជោគជ័យ",
        profile: updatedUser[0]
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "User not found or no changes made",
        message_kh: "រកមិនឃើញអ្នកប្រើប្រាស់ ឬគ្មានការផ្លាស់ប្តូរ"
      });
    }

  } catch (error) {
    console.error("❌ Error updating profile:", error);

    // ✅ Delete uploaded file if update failed
    if (req.file) {
      try {
        removeFile(req.file.filename);
      } catch (cleanupError) {
        console.error("Failed to cleanup uploaded file:", cleanupError);
      }
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update profile",
      message_kh: "មិនអាចកែប្រែព័ត៌មានបានទេ"
    });
  }
};
exports.getuserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const sql = `
      SELECT 
        u.id, 
        u.name, 
        u.username, 
        u.profile_image, 
        u.address, 
        u.tel, 
        u.branch_name, 
        u.is_active, 
        r.name AS role_name 
      FROM user u 
      INNER JOIN role r ON u.role_id = r.id 
      WHERE u.id = ?
    `;

    const [user] = await db.query(sql, [userId]);

    if (user.length > 0) {
      res.json({ profile: user[0] });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    logError("auth.getUserProfile", error, res);
  }
};

exports.update = async (req, res) => {
  try {
    // Check if a password is provided for update
    let password = req.body.password;

    // Only hash the password if it's being updated (if password exists)
    if (password) {
      password = bcrypt.hashSync(password, 10); // Hash the password
    }

    // Handle profile image upload or removal
    let profileImage = req.body.profile_image;

    if (req.file) {
      profileImage = req.file.filename; // New image uploaded
    }

    if (req.body.profile_image_remove === "1") {
      removeFile(req.body.profile_image); // Remove the old image file
      profileImage = null; // Set profile_image to NULL in the database
    }

    // Create the SQL query
    let sql = `
      UPDATE user SET
        name = :name,
        username = :username,
        role_id = :role_id,
        ${password ? "password = :password," : ""}
        tel = :tel,
        branch_name = :branch_name,
        is_active = :is_active,
        address = :address,
        profile_image = :profile_image,
        create_by = :create_by,
        create_at = :create_at
      WHERE id = :id
    `;

    // Prepare the query parameters
    const queryParams = {
      ...req.body,
      password: password || req.body.password, // If no new password, retain the original password
      profile_image: profileImage, // Set the new profile image filename
      create_by: req.auth?.name,
      create_at: new Date(), // Use current timestamp
    };

    // Execute the query
    const [data] = await db.query(sql, queryParams);

    res.json({
      data: data,
      message: "Update success!",
    });
  } catch (error) {
    logError("user.update", error, res);
  }
};
// ✅✅✅ COMPLETE FIXED VERSION - exports.register
// Replace the ENTIRE register function in auth.controller.js with this:

exports.register = async (req, res) => {
  try {
    const {
      role_id,
      group_id: frontendGroupId,  // Rename to avoid confusion
      name,
      username,
      email,
      password,
      address,
      tel,
      branch_name: frontendBranchName,  // Rename to avoid confusion
      barcode,
      status,
    } = req.body;

    // ✅ Validate input
    if (!username || !password || !name || !role_id) {
      return res.status(400).json({
        error: {
          message: "Username, password, name, and role are required!",
          message_kh: "ត្រូវការ Username, ពាក្យសម្ងាត់, ឈ្មោះ និងតួនាទី!"
        }
      });
    }



    // ✅✅✅ STEP 1: GET CREATOR'S INFO FROM DATABASE ✅✅✅
    const [creator] = await db.query(`
      SELECT 
        u.id, 
        u.username, 
        u.name, 
        u.branch_name, 
        u.group_id,
        r.code AS role_code, 
        r.name AS role_name,
        r.id AS creator_role_id
      FROM user u
      INNER JOIN role r ON u.role_id = r.id
      WHERE u.id = :creator_id
    `, { creator_id: req.current_id });

    if (creator.length === 0) {
      console.error('❌ Creator not found for ID:', req.current_id);
      return res.status(404).json({
        error: {
          message: "Creator not found",
          message_kh: "រកមិនឃើញអ្នកបង្កើត"
        }
      });
    }

    const creatorRole = creator[0].role_code;
    const creatorBranch = creator[0].branch_name;
    const creatorGroup = creator[0].group_id;
    const creatorName = creator[0].name;
    const creatorRoleId = creator[0].creator_role_id;



    // ✅ Check if username already exists
    const checkUserSql = "SELECT id FROM user WHERE username = :username LIMIT 1";
    const [existingUser] = await db.query(checkUserSql, { username });

    if (existingUser.length > 0) {
      return res.status(409).json({
        error: {
          message: "Username already exists!",
          message_kh: "Username នេះមានរួចហើយ!"
        }
      });
    }

    // ✅ Get target role info
    const [targetRole] = await db.query(
      "SELECT code, name FROM role WHERE id = :role_id",
      { role_id }
    );

    if (targetRole.length === 0) {
      return res.status(404).json({
        error: {
          message: "Role not found",
          message_kh: "រកមិនឃើញតួនាទី"
        }
      });
    }

    const targetRoleCode = targetRole[0].code;

    // ✅ Permission checks
    if (creatorRoleId !== 29) {  // Not Super Admin
      if (targetRoleCode === 'SUPER_ADMIN' || targetRoleCode === 'ADMIN') {
        return res.status(403).json({
          error: {
            message: "You don't have permission to create this role!",
            message_kh: "អ្នកមិនមានសិទ្ធិបង្កើតតួនាទីនេះទេ!"
          }
        });
      }
    }

    // ✅✅✅ STEP 2: DETERMINE FINAL branch_name and group_id ✅✅✅
    let finalBranchName;
    let finalGroupId;

    if (creatorRoleId === 29) {
      // Super Admin - uses what they selected
      finalBranchName = frontendBranchName;
      finalGroupId = frontendGroupId;



      if (!finalBranchName) {
        return res.status(400).json({
          error: {
            message: "Branch name is required!",
            message_kh: "ត្រូវការឈ្មោះសាខា!"
          }
        });
      }
    } else {
      finalBranchName = creatorBranch;
      finalGroupId = creatorGroup;



      // Validate creator has valid branch/group
      if (!finalBranchName || finalBranchName === 'null' || finalBranchName === '') {
        console.error('❌ Creator has invalid branch_name:', finalBranchName);
        return res.status(403).json({
          error: {
            message: "Your account doesn't have a valid branch. Contact administrator.",
            message_kh: "គណនីរបស់អ្នកមិនមានសាខាត្រឹមត្រូវ។ សូមទាក់ទងអ្នកគ្រប់គ្រង។"
          }
        });
      }

      if (!finalGroupId || finalGroupId === 0) {
        console.error('❌ Creator has invalid group_id:', finalGroupId);
        return res.status(403).json({
          error: {
            message: "Your account doesn't have a valid group. Contact administrator.",
            message_kh: "គណនីរបស់អ្នកមិនមានក្រុមត្រឹមត្រូវ។ សូមទាក់ទងអ្នកគ្រប់គ្រង។"
          }
        });
      }
    }

    // ✅ Hash password
    let hashedPassword = bcrypt.hashSync(password, 10);

    // ✅✅✅ STEP 3: INSERT USER WITH CORRECT VALUES ✅✅✅
    let userSql = `
      INSERT INTO user (
        role_id, 
        group_id, 
        name, 
        username,
        email, 
        password, 
        is_active, 
        address, 
        tel, 
        branch_name, 
        barcode, 
        profile_image, 
        create_by, 
        create_at
      ) VALUES (
        :role_id, 
        :group_id, 
        :name, 
        :username, 
        :email,
        :password, 
        :is_active, 
        :address, 
        :tel, 
        :branch_name, 
        :barcode, 
        :profile_image, 
        :create_by, 
        :create_at
      );
    `;

    let [userData] = await db.query(userSql, {
      role_id,
      group_id: finalGroupId,           // Initial value (might be 0)
      name,
      username,
      email: email || null,
      password: hashedPassword,
      is_active: status !== undefined ? status : 1,
      address: address || null,
      tel: tel || null,
      branch_name: finalBranchName,
      barcode: barcode || null,
      profile_image: req.file?.filename || null,
      create_by: creatorName,
      create_at: new Date(),
    });

    let userId = userData.insertId;

    if (!userId) {
      const [findUserResult] = await db.query(
        "SELECT id FROM user WHERE username = :username LIMIT 1",
        { username }
      );
      userId = findUserResult[0]?.id;

      if (!userId) {
        throw new Error("Failed to retrieve the newly created user ID");
      }
    }


    // Fix Admin/Super Admin - set group_id = own id
    if (targetRoleCode === 'ADMIN' || targetRoleCode === 'SUPER_ADMIN') {

      await db.query(`
        UPDATE user 
        SET group_id = :user_id 
        WHERE id = :user_id
      `, { user_id: userId });

      finalGroupId = userId;
    }
    // Fix regular users with group_id = 0
    else if (!finalGroupId || finalGroupId === 0 || finalGroupId === '0') {
      console.warn('⚠️ Regular user created with group_id = 0, attempting auto-assignment...');

      // Assign to first available admin in same branch
      const [defaultAdmin] = await db.query(`
        SELECT u.id 
        FROM user u
        INNER JOIN role r ON u.role_id = r.id
        WHERE r.code = 'ADMIN' 
          AND u.branch_name = :branch_name
          AND u.group_id = u.id
        ORDER BY u.id ASC
        LIMIT 1
      `, { branch_name: finalBranchName });

      if (defaultAdmin && defaultAdmin.length > 0) {
        finalGroupId = defaultAdmin[0].id;

        await db.query(`
          UPDATE user 
          SET group_id = :group_id 
          WHERE id = :user_id
        `, {
          group_id: finalGroupId,
          user_id: userId
        });

      } else {
        console.error('❌ No admin found in branch:', finalBranchName);
        console.error('   User', userId, 'will have group_id = 0 (needs manual assignment)');
      }
    } else {
    }

    // ✅ Insert into user_roles
    let rolesSql = `
      INSERT INTO user_roles (user_id, role_id) 
      VALUES (:user_id, :role_id);
    `;

    await db.query(rolesSql, {
      user_id: userId,
      role_id,
    });

    // ✅✅✅ STEP 5: VERIFY USER WAS CREATED CORRECTLY ✅✅✅
    const [verifyUser] = await db.query(
      "SELECT id, name, username, branch_name, group_id FROM user WHERE id = :user_id",
      { user_id: userId }
    );


    // ✅ Get role name for response
    const [roleData] = await db.query(
      "SELECT name, code FROM role WHERE id = :role_id",
      { role_id }
    );

    // ✅ Telegram notification
    const creationTime = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Phnom_Penh',
      dateStyle: 'full',
      timeStyle: 'long'
    });

    const userAgent = req.get('User-Agent') || 'Unknown';
    const clientIP = req.ip ||
      req.headers['x-forwarded-for']?.split(',')[0] ||
      'Unknown';

    const deviceInfo = parseUserAgent(userAgent);
    const locationInfo = await getLocationFromIP(clientIP);

    const alertMessage = `
🆕 <b>គណនីថ្មីត្រូវបានបង្កើត / New Account Created</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 <b>អ្នកប្រើប្រាស់ថ្មី / New User:</b> ${name}
🆔 <b>Username:</b> ${username}
📧 <b>Email:</b> ${email || 'N/A'}
🎭 <b>តួនាទី / Role:</b> ${roleData[0]?.name || 'N/A'}
🏢 <b>សាខា / Branch:</b> ${finalBranchName} ✅
🔢 <b>Group ID:</b> ${finalGroupId} ✅
📱 <b>ទូរស័ព្ទ / Tel:</b> ${tel || 'N/A'}
📊 <b>Status:</b> ${status ? 'Active ✅' : 'Inactive ⏸️'}

━━━━━━━━━━━━━━━━━━━━━━━━━━
👨‍💼 <b>បង្កើតដោយ / Created By:</b> 
${creatorName} (${creator[0].username})
🎭 <b>Creator Role:</b> ${creator[0].role_name}
🏢 <b>Creator Branch:</b> ${creatorBranch}
🔢 <b>Creator Group:</b> ${creatorGroup}

━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ <b>ពេលវេលាបង្កើត / Creation Time:</b>
${creationTime}

🌐 <b>IP Address:</b> <code>${clientIP}</code>

${locationInfo ? `
📍 <b>Location:</b>
   • Country: ${locationInfo.country || 'Unknown'}
   • City: ${locationInfo.city || 'Unknown'}
   • ISP: ${locationInfo.isp || 'Unknown'}
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━
💻 <b>Device Information:</b>
🖥️ Platform: ${deviceInfo.platform}
🌐 Browser: ${deviceInfo.browser} ${deviceInfo.version}
📱 Device: ${deviceInfo.deviceType}

━━━━━━━━━━━━━━━━━━━━━━━━━━
🆔 <b>User ID:</b> ${userId}
🔢 <b>Barcode:</b> ${barcode || 'N/A'}
📸 <b>Profile Image:</b> ${req.file?.filename ? '✅ Uploaded' : '❌ No image'}
    `;

    // Send Telegram notification (non-blocking)
    sendTelegramMessagenewLogin(alertMessage).catch(err => {
      console.error("Failed to send Telegram alert:", err.message);
    });

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
          'USER_CREATED',
          :description,
          :ip_address,
          :user_agent,
          NOW(),
          :created_by
        )
      `, {
        user_id: userId,
        description: `New user created: ${name} (${username}) with role ${roleData[0]?.name}, branch: ${finalBranchName}, group: ${finalGroupId} by ${creatorName}`,
        ip_address: clientIP,
        user_agent: userAgent,
        created_by: req.current_id
      });
    } catch (logError) {
      console.error("Failed to log user creation:", logError);
    }

    // ✅ Return success response
    return res.status(201).json({
      message: "Create new account success!",
      message_kh: "បង្កើតគណនីថ្មីបានជោគជ័យ!",
      data: {
        user_id: userId,
        username: username,
        name: name,
        role: roleData[0]?.name,
        branch_name: finalBranchName,
        group_id: finalGroupId,
        is_active: status,
        created_by: creatorName,
        profile_image: req.file?.filename || null
      }
    });

  } catch (error) {
    console.error("❌ Register error:", error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        error: {
          message: "Username or barcode already exists!",
          message_kh: "Username ឬ Barcode មានរួចហើយ!"
        }
      });
    }

    logError("auth.register", error, res);

    return res.status(500).json({
      error: {
        message: "Failed to create account",
        message_kh: "មិនអាចបង្កើតគណនីបានទេ"
      }
    });
  }
};
exports.newBarcode = async (req, res) => {
  try {
    var sql = `
      SELECT CONCAT('U', LPAD(COALESCE(MAX(id), 0) + 1, 3, '0')) AS barcode 
      FROM user
    `;
    var [data] = await db.query(sql);

    // If no users exist, default to "U001"
    let barcode = data[0]?.barcode || "U001";

    res.json({ barcode });
  } catch (error) {
    logError("barcode.create", error, res);
  }
};


isExistBarcode = async (barcode) => {
  try {
    var sql = "SELECT COUNT(id) as Total FROM user WHERE barcode=:barcode";
    var [data] = await db.query(sql, {
      barcode: barcode,
    });
    if (data.length > 0 && data[0].Total > 0) {
      return true; // ស្ទួន
    }
    return false; // អត់ស្ទួនទេ
  } catch (error) {
    logError("barcode.create", error, res);
  }
};
exports.remove = async (req, res) => {
  try {
    // Get the user's profile image before deleting
    const [user] = await db.query("SELECT profile_image FROM user WHERE id = :id", {
      id: req.body.id,
    });

    // Delete the user
    const [data] = await db.query("DELETE FROM user WHERE id = :id", {
      id: req.body.id,
    });

    // Remove the profile image file if it exists
    if (user[0]?.profile_image) {
      removeFile(user[0].profile_image);
    }

    res.json({
      data: data,
      message: "Data delete success!",
    });
  } catch (error) {
    logError("user.remove", error, res);
  }
};
// ✅ FIXED VERSION - Added is_active check during login
// នៅក្នុង auth.controller.js


// ❌ MISSING: Secure password change endpoint
// Backend currently updates password WITHOUT verifying current password
// This is a security risk!

// ✅ RECOMMENDED: Add this to backend (auth.controller.js)
// ✅ ADD THIS NEW FUNCTION to auth.controller.js
exports.changePassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All password fields are required",
        message_kh: "ត្រូវបញ្ចូលពាក្យសម្ងាត់ទាំងអស់"
      });
    }

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
        message_kh: "ពាក្យសម្ងាត់ថ្មីមិនត្រូវគ្នាទេ"
      });
    }

    // Check minimum length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
        message_kh: "ពាក្យសម្ងាត់ត្រូវតែមានយ៉ាងតិច ៦ តួអក្សរ"
      });
    }

    // Get user's current password from database
    const [user] = await db.query(
      "SELECT id, password, username, name FROM user WHERE id = :userId",
      { userId }
    );

    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        message_kh: "រកមិនឃើញអ្នកប្រើប្រាស់"
      });
    }

    // Verify current password
    const isCorrectPassword = bcrypt.compareSync(currentPassword, user[0].password);

    if (!isCorrectPassword) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
        message_kh: "ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវ"
      });
    }

    // Hash new password
    const hashedPassword = bcrypt.hashSync(newPassword, 10);

    // Update password in database
    await db.query(
      "UPDATE user SET password = :password WHERE id = :userId",
      {
        password: hashedPassword,
        userId
      }
    );

    // Increment token_version to force re-login on other devices (optional)
    await db.query(
      "UPDATE user SET token_version = COALESCE(token_version, 0) + 1 WHERE id = :userId",
      { userId }
    );

    // Log password change activity
    const clientIP = req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'Unknown';
    const userAgent = req.get('User-Agent') || 'Unknown';

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
          'PASSWORD_CHANGED',
          :description,
          :ip_address,
          :user_agent,
          NOW(),
          :created_by
        )
      `, {
        user_id: userId,
        description: `Password changed by ${user[0].name} (${user[0].username})`,
        ip_address: clientIP,
        user_agent: userAgent,
        created_by: userId
      });
    } catch (logError) {
      console.error("Failed to log password change:", logError);
    }

    res.json({
      success: true,
      message: "Password changed successfully",
      message_kh: "បានផ្លាស់ប្តូរពាក្យសម្ងាត់ដោយជោគជ័យ"
    });

  } catch (error) {
    console.error("Change password error:", error);
    logError("auth.changePassword", error, res);
    
    return res.status(500).json({
      success: false,
      message: "Failed to change password",
      message_kh: "មិនអាចផ្លាស់ប្តូរពាក្យសម្ងាត់បានទេ"
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const userId = req.current_id;

    // ✅ Mark user as offline
    await db.query(`
      UPDATE user 
      SET is_online = 0, 
          online_status = 'offline'
      WHERE id = ?
    `, [userId]);

    // ✅ Revoke refresh token
    const { refresh_token } = req.body;
    if (refresh_token) {
      await revokeRefreshToken(userId, refresh_token);
    }

    res.json({
      success: true,
      message: "Logged out successfully",
      message_kh: "ចាកចេញបានជោគជ័យ"
    });

  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: true,
      message: "Failed to logout"
    });
  }
};


exports.login = async (req, res) => {
  try {
    let { password, username } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        error: {
          message: "Username and password are required!",
          message_kh: "ត្រូវការ Username និង Password!"
        }
      });
    }

    let sql =
      "SELECT " +
      " u.*," +
      " r.name as role_name," +
      " r.code as role_code" +
      " FROM user u " +
      " INNER JOIN role r ON u.role_id = r.id " +
      " WHERE u.username=:username ";

    let [data] = await db.query(sql, { username: username });

    // ⚠️ USERNAME DOESN'T EXIST
    if (data.length == 0) {
      return res.status(401).json({
        error: {
          username: "Username doesn't exist!",
          username_kh: "មិនមាន Username នេះទេ!"
        }
      });
    }

    let dbPass = data[0].password;
    let isCorrectPass = bcrypt.compareSync(password, dbPass);

    // ⚠️ WRONG PASSWORD
    if (!isCorrectPass) {
      try {
        await exports.logLoginActivity({
          user_id: data[0].id,
          username: data[0].username,
          ip_address: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'Unknown',
          user_agent: req.get('User-Agent') || 'Unknown',
          device_info: JSON.stringify({}),
          location_info: JSON.stringify({}),
          login_time: new Date(),
          status: 'failed'
        });
      } catch (logError) {
        console.error("Failed to log failed attempt:", logError);
      }

      return res.status(401).json({
        error: {
          password: "Password incorrect!",
          password_kh: "ពាក្យសម្ងាត់មិនត្រឹមត្រូវ!"
        }
      });
    }

    // ✅ CHECK IF ACCOUNT IS ACTIVE
    if (data[0].is_active === 0 || data[0].is_active === false) {
      try {
        await exports.logLoginActivity({
          user_id: data[0].id,
          username: data[0].username,
          ip_address: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'Unknown',
          user_agent: req.get('User-Agent') || 'Unknown',
          device_info: JSON.stringify({}),
          location_info: JSON.stringify({}),
          login_time: new Date(),
          status: 'blocked - account deactivated'
        });
      } catch (logError) {
        console.error("Failed to log blocked attempt:", logError);
      }

      return res.status(403).json({
        error: {
          message: "Account has been deactivated. Please contact administrator.",
          message_kh: "គណនីនេះត្រូវបានបិទ។ សូមទាក់ទងអ្នកគ្រប់គ្រង។"
        }
      });
    }

    // ✅ UPDATE USER STATUS
    await db.query(`
      UPDATE user 
      SET is_online = 1, 
          last_activity = NOW(), 
          online_status = 'online',
          last_login = NOW()
      WHERE id = ?
    `, [data[0].id]);

    // ✅ GET PERMISSIONS (for response only, NOT for token)
    const permissions = await getPermissionByUser(data[0].id);

    // ✅✅✅ GENERATE MINIMAL TOKENS ✅✅✅
    const accessToken = await getAccessToken(
      data[0].id,
      data[0].role_id,
      data[0].token_version || 0
    );

    const refreshToken = await getRefreshToken({ user_id: data[0].id });

    // Store refresh token
    await storeRefreshToken(data[0].id, refreshToken);

    // Enhanced login information
    const loginTime = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Phnom_Penh',
      dateStyle: 'full',
      timeStyle: 'long'
    });

    const userAgent = req.get('User-Agent') || 'Unknown';
    const clientIP = req.ip ||
      req.headers['x-forwarded-for']?.split(',')[0] ||
      'Unknown';

    const deviceInfo = parseUserAgent(userAgent);
    const locationInfo = await getLocationFromIP(clientIP);

    // Telegram alert
    const alertMessage = `
🔐 <b>ការជូនដំណឹងចូលប្រើប្រាស់ថ្មី / New Login Alert</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 <b>អ្នកប្រើប្រាស់ / User:</b> ${data[0].name || 'N/A'}
🆔 <b>Username:</b> ${data[0].username}
📧 <b>Email:</b> ${data[0].email || 'N/A'}
🎭 <b>តួនាទី / Role:</b> ${data[0].role_name}
🏢 <b>សាខា / Branch:</b> ${data[0].branch_name || 'N/A'}

⏰ <b>ពេលវេលា / Login Time:</b> ${loginTime}
🌐 <b>IP Address:</b> <code>${clientIP}</code>
💻 <b>Device:</b> ${deviceInfo.platform} - ${deviceInfo.browser}
    `;

    sendTelegramMessagenewLogin(alertMessage).catch(err => {
      console.error("Failed to send Telegram alert:", err.message);
    });
    try {
      await createSystemNotification({
        notification_type: 'login_alert',
        title: `🔐 Login Alert: ${data[0].name}`,
        message: `New login detected\n\nUser: ${data[0].name}\nUsername: ${data[0].username}\nRole: ${data[0].role_name}\nBranch: ${data[0].branch_name || 'N/A'}\n\nLogin Time: ${loginTime}\nIP Address: ${clientIP}\nDevice: ${deviceInfo.platform}\nBrowser: ${deviceInfo.browser}`,
        data: {
          login_info: {
            user_id: null,              // ✅ IMPORTANT
            group_id: null,
            username: data[0].username,
            name: data[0].name,
            email: data[0].email,
            role_name: data[0].role_name,
            branch_name: data[0].branch_name,
            login_time: loginTime,
            ip_address: clientIP,
            device: deviceInfo.platform,
            browser: deviceInfo.browser,
            user_agent: userAgent,
            location: locationInfo,
            priority: 'high',
            severity: 'info',

          }
        },
        order_id: null,
        order_no: null,
        customer_id: null,
        customer_name: data[0].name,
        customer_address: null,
        customer_tel: data[0].tel,
        total_amount: null,
        total_liters: null,
        card_number: null,
        user_id: data[0].id,
        created_by: data[0].username,
        branch_name: data[0].branch_name,
        group_id: data[0].group_id,
        priority: 'normal',
        severity: 'info',
        icon: '🔐',
        color: 'blue',
        action_url: `/users/${data[0].id}`
      });

    } catch (sysNotifError) {
      console.error('❌ Failed to create login system notification:', sysNotifError);
    }
    try {
      await exports.logLoginActivity({
        user_id: data[0].id,
        username: data[0].username,
        ip_address: clientIP,
        user_agent: userAgent,
        device_info: JSON.stringify(deviceInfo),
        location_info: JSON.stringify(locationInfo),
        login_time: new Date(),
        status: 'success'
      });
    } catch (logError) {
      console.error("Failed to log successful login:", logError);
    }

    // ✅ Clean response - remove password
    delete data[0].password;

    // ✅✅✅ RETURN MINIMAL TOKEN + FULL DATA ✅✅✅
    return res.status(200).json({
      message: "Login success",
      message_kh: "ចូលប្រើប្រាស់បានជោគជ័យ",
      profile: data[0],           // Full profile in response
      permission: permissions,     // Full permissions in response
      access_token: accessToken,   // ✅ MINIMAL token
      refresh_token: refreshToken, // ✅ MINIMAL token
      login_details: {
        login_time: loginTime,
        ip_address: clientIP,
        device: deviceInfo.platform,
        browser: deviceInfo.browser
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    logError("auth.login", error, res);

    return res.status(500).json({
      error: {
        message: "Internal server error",
        message_kh: "មានបញ្ហាកើតឡើង សូមព្យាយាមម្តងទៀត"
      }
    });
  }
};
exports.logLoginActivity = async (activityData) => {
  try {
    const sql = `
      INSERT INTO login_activity 
      (user_id, username, ip_address, user_agent, device_info, location_info, login_time, status)
      VALUES 
      (:user_id, :username, :ip_address, :user_agent, :device_info, :location_info, :login_time, :status)
    `;

    await db.query(sql, activityData);
    return true;
  } catch (error) {
    console.error("Error logging login activity:", error);
    return false;
  }
};
exports.logLoginActivity = async (loginData) => {
  try {
    const sql = `
      INSERT INTO login_history (
        user_id, username, ip_address, user_agent, 
        device_info, location_info, login_time, status
      ) VALUES (
        :user_id, :username, :ip_address, :user_agent,
        :device_info, :location_info, :login_time, :status
      )
    `;

    await db.query(sql, loginData);
  } catch (error) {
    console.error('Error logging login activity:', error);
  }
}

exports.refreshToken = async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(401).json({
        message: "Refresh token is required",
        error: { name: "MissingRefreshToken" }
      });
    }

    jwt.verify(refresh_token, config.config.token.refresh_token_key, async (error, decoded) => {
      if (error) {
        return res.status(401).json({
          message: "Invalid refresh token",
          error: { name: "InvalidRefreshToken" }
        });
      }

      const userId = decoded.user_id;

      try {
        // Validate refresh token in database
        const isValidToken = await validateRefreshToken(userId, refresh_token);
        if (!isValidToken) {
          return res.status(401).json({
            message: "Invalid or expired refresh token",
            error: { name: "TokenExpiredError" }
          });
        }

        // Get user data
        const [userData] = await db.query(`
          SELECT 
            u.id, u.role_id, u.token_version,
            u.name, u.username, u.email,
            r.name as role_name
          FROM user u
          INNER JOIN role r ON u.role_id = r.id
          WHERE u.id = :userId
        `, { userId });

        if (userData.length === 0) {
          return res.status(404).json({
            message: "User not found",
            error: { name: "UserNotFound" }
          });
        }

        const user = userData[0];

        // ✅ Generate NEW MINIMAL tokens
        const newAccessToken = await getAccessToken(
          user.id,
          user.role_id,
          user.token_version || 0
        );

        const newRefreshToken = await getRefreshToken({ user_id: user.id });

        // Update refresh token in database
        await updateRefreshToken(userId, refresh_token, newRefreshToken);

        // ✅ Get full data for response
        const permissions = await getPermissionByUser(user.id);
        delete user.password;

        res.json({
          message: "Token refreshed successfully",
          profile: user,
          permission: permissions,
          access_token: newAccessToken,
          refresh_token: newRefreshToken,
        });

      } catch (dbError) {
        console.error("Database error during token refresh:", dbError);
        return res.status(500).json({
          message: "Internal server error",
          error: { name: "DatabaseError" }
        });
      }
    });
  } catch (error) {
    logError("auth.refreshToken", error, res);
  }
};
exports.profile = async (req, res) => {
  try {
    res.json({
      profile: req.profile,
    });
  } catch (error) {
    logError("auth.register", error, res);
  }
};

exports.validate_token = (permission_name) => {
  return async (req, res, next) => {
    const authorization = req.headers.authorization;
    let token_from_client = null;

    if (authorization && authorization.startsWith('Bearer ')) {
      token_from_client = authorization.slice(7);
    }

    if (!token_from_client) {
      return res.status(401).json({
        message: "Unauthorized - No token provided"
      });
    }

    jwt.verify(
      token_from_client,
      config.config.token.access_token_key,
      async (error, decoded) => {
        if (error) {
          return res.status(401).json({
            message: "Token expired or invalid",
            error: { name: "TokenExpiredError" },
            logout: true
          });
        }

        try {
          // ✅ Extract minimal data from token
          const userId = decoded.user_id;
          const tokenVersion = decoded.token_version || 0;

          // ✅ FETCH FULL USER DATA FROM DATABASE
          const [user] = await db.query(`
            SELECT 
              u.id,
              u.name,
              u.username,
              u.email,
              u.role_id,
              u.is_active, 
              u.token_version,
              u.last_activity,
              u.auto_logout_enabled,
              u.branch_name,
              u.group_id,
              u.profile_image,
              r.name as role_name,
              r.code as role_code
            FROM user u
            INNER JOIN role r ON u.role_id = r.id
            WHERE u.id = :user_id
          `, { user_id: userId });

          if (user.length === 0) {
            return res.status(404).json({
              message: "User not found",
              message_kh: "រកមិនឃើញអ្នកប្រើប្រាស់",
              logout: true,
              error: { name: "UserNotFound" }
            });
          }

          const userData = user[0];

          // ✅ Check if account is active
          if (userData.is_active === 0 || userData.is_active === false) {
            return res.status(403).json({
              message: "Account has been deactivated.",
              message_kh: "គណនីនេះត្រូវបានបិទ។ សូមទាក់ទងអ្នកគ្រប់គ្រង។",
              logout: true,
              error: { name: "AccountDeactivated" }
            });
          }

          // ✅ Check token version
          const currentTokenVersion = userData.token_version || 0;
          if (tokenVersion < currentTokenVersion) {
            return res.status(401).json({
              message: "Your permissions have been updated. Please login again.",
              message_kh: "សិទ្ធិរបស់អ្នកត្រូវបានកែប្រែ។ សូម login ម្តងទៀត។",
              logout: true,
              reason: "PERMISSIONS_UPDATED",
              error: { name: "TokenVersionMismatch" }
            });
          }

          // ✅ CHECK INACTIVITY - AUTO LOGOUT
          if (userData.auto_logout_enabled !== 0 && userData.last_activity) {
            const [configResult] = await db.query(`
              SELECT config_value 
              FROM system_config 
              WHERE config_key = 'auto_logout_minutes'
            `).catch(() => [[]]);

            const timeoutMinutes = parseInt(configResult[0]?.config_value || 30);
            const lastActivity = new Date(userData.last_activity);
            const now = new Date();
            const inactiveMinutes = (now - lastActivity) / 1000 / 60;

            if (inactiveMinutes > timeoutMinutes) {
              await db.query(`
                UPDATE user 
                SET is_online = 0, online_status = 'offline'
                WHERE id = ?
              `, [userId]);

              return res.status(401).json({
                message: `You have been logged out due to ${timeoutMinutes} minutes of inactivity.`,
                message_kh: `អ្នកត្រូវបាន logout ដោយសារគ្មានសកម្មភាពរយៈពេល ${timeoutMinutes} នាទី។`,
                logout: true,
                reason: "INACTIVITY_TIMEOUT",
                inactive_minutes: Math.round(inactiveMinutes),
                timeout_minutes: timeoutMinutes,
                error: { name: "InactivityTimeout" }
              });
            }
          }

          // ✅ Update last_activity (non-blocking)
          db.query(`
            UPDATE user 
            SET last_activity = NOW(), 
                is_online = 1,
                online_status = 'online'
            WHERE id = ?
          `, [userId]).catch(err => {
            console.error('Failed to update activity:', err);
          });

          // ✅ FETCH PERMISSIONS FROM DATABASE
          const permissions = await getPermissionByUser(userId);

          // ✅ Check permissions
          if (permission_name) {
            const hasPermission = permissions.some(p => p.name === permission_name);

            if (!hasPermission) {
              return res.status(403).json({
                message: "Forbidden - Insufficient permissions",
                message_kh: "អ្នកមិនមានសិទ្ធិធ្វើសកម្មភាពនេះទេ",
                required_permission: permission_name
              });
            }
          }

          // ✅ Attach to request object
          req.current_id = userId;
          req.auth = userData;
          req.permission = permissions;

          next();

        } catch (dbError) {
          console.error("Error checking user status:", dbError);
          return res.status(500).json({
            message: "Internal server error",
            message_kh: "មានបញ្ហាកើតឡើង"
          });
        }
      }
    );
  };
};

const getRefreshToken = async (userData) => {
  const refresh_token = await jwt.sign(
    userData,
    config.config.token.refresh_token_key,
    {
      expiresIn: "7d",  // Changed from 10s to 7d
    }
  );
  return refresh_token;
};

const validateRefreshToken = async (userId, refreshToken) => {
  try {
    const sql = `
      SELECT id FROM refresh_tokens 
      WHERE user_id = :user_id AND token = :token AND expires_at > NOW() AND is_revoked = 0
    `;

    const [result] = await db.query(sql, {
      user_id: userId,
      token: refreshToken,
    });

    return result.length > 0;
  } catch (error) {
    console.error("Error validating refresh token:", error);
    return false;
  }
};

const updateRefreshToken = async (userId, oldToken, newToken) => {
  try {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const sql = `
      UPDATE refresh_tokens 
      SET token = :new_token, expires_at = :expires_at, created_at = :created_at
      WHERE user_id = :user_id AND token = :old_token
    `;

    await db.query(sql, {
      user_id: userId,
      old_token: oldToken,
      new_token: newToken,
      expires_at: expiresAt,
      created_at: new Date(),
    });
  } catch (error) {
    console.error("Error updating refresh token:", error);
    throw error;
  }
};


const revokeRefreshToken = async (userId, refreshToken) => {
  try {
    const sql = `
      UPDATE refresh_tokens 
      SET is_revoked = 1 
      WHERE user_id = :user_id AND token = :token
    `;

    await db.query(sql, {
      user_id: userId,
      token: refreshToken,
    });
  } catch (error) {
    console.error("Error revoking refresh token:", error);
    throw error;
  }
};



const getPermissionByUser = async (user_id) => {
  let sql =
    "   SELECT  " +
    " DISTINCT " +
    " p.id, " +
    " p.name, " +
    " p.group, " +
    " p.is_menu_web, " +
    " p.web_route_key " +
    " FROM permissions  p " +
    " INNER JOIN permission_roles pr ON p.id = pr.permission_id " +
    " INNER JOIN `role` r ON pr.role_id = r.id " +
    " INNER JOIN user_roles ur ON r.id = ur.role_id " +
    " WHERE ur.user_id = :user_id; "


  const [permission] = await db.query(sql, { user_id })
  return permission;


}

const getAccessToken = async (userId, roleId, tokenVersion = 0) => {
  const access_token = await jwt.sign(
    {
      user_id: userId,
      role_id: roleId,
      token_version: tokenVersion,
      iat: Math.floor(Date.now() / 1000)
    },
    config.config.token.access_token_key,
    {
      expiresIn: "7d",
    }
  );
  return access_token;
};

const storeRefreshToken = async (userId, refreshToken) => {
  try {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now



    const sql = `
      INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
      VALUES (:user_id, :token, :expires_at, :created_at)
      ON DUPLICATE KEY UPDATE
      token = :token,
      expires_at = :expires_at,
      created_at = :created_at
    `;

    await db.query(sql, {
      user_id: userId,
      token: refreshToken,
      expires_at: expiresAt,
      created_at: new Date(),
    });
  } catch (error) {
    console.error("Error storing refresh token:", error);
    throw error;
  }
};


exports.updateUserProfile = async (req, res) => {
  try {
    const { username, password, address, tel } = req.body;
    const userId = req.user.id; // Assuming user ID is available in the request

    let hashedPassword;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10); // Hash the new password
    }

    // Update the user's profile in the database
    const sql = `
      UPDATE user SET
        username = :username,
        ${password ? "password = :password," : ""}
        address = :address,
        tel = :tel
      WHERE id = :userId
    `;

    await db.query(sql, {
      username,
      password: hashedPassword,
      address,
      tel,
      userId,
    });

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};




exports.getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user ID is available in the request

    // Fetch the user's profile from the database
    const sql = `
      SELECT id, username, address, tel, profile_image 
      FROM user 
      WHERE id = :userId
    `;
    const [user] = await db.query(sql, { userId });

    if (!user[0]) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ profile: user[0] });
  } catch (error) {
    console.error("Error retrieving profile:", error);
    res.status(500).json({ message: "Failed to retrieve profile" });
  }
};


exports.googleOAuth = async (req, res) => {
  try {
    const authorizeUrl = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'consent'
    });

    res.redirect(authorizeUrl);
  } catch (error) {
    console.error("❌ Google OAuth Error:", error);
    res.status(500).json({
      error: "Failed to initiate Google OAuth",
      message: error.message
    });
  }
};

exports.googleOAuthCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      console.error('❌ No authorization code received');
      return res.redirect(`${FRONTEND_URL}/login?error=no_code`);
    }


    // Exchange code for tokens
    const { tokens } = await googleClient.getToken(code);
    googleClient.setCredentials(tokens);


    // Get user info from Google
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    const googleUser = {
      google_id: payload.sub,
      email: payload.email,
      name: payload.name,
      profile_image: payload.picture,
      email_verified: payload.email_verified
    };

    // Check if user exists
    let sql = "SELECT * FROM user WHERE email = :email";
    let [existingUser] = await db.query(sql, { email: googleUser.email });

    let user;

    if (existingUser.length > 0) {
      user = existingUser[0];

      if (!user.google_id) {
        await db.query(
          "UPDATE user SET google_id = :google_id WHERE id = :id",
          { google_id: googleUser.google_id, id: user.id }
        );
      }
    } else {

      const insertSql = `
        INSERT INTO user (
          google_id, email, name, username, password, 
          profile_image, is_active, role_id, create_at
        ) VALUES (
          :google_id, :email, :name, :username, :password,
          :profile_image, :is_active, :role_id, :create_at
        )
      `;

      const username = googleUser.email.split('@')[0] + '_' + Date.now();
      const randomPassword = bcrypt.hashSync(Math.random().toString(36), 10);

      const insertResult = await db.query(insertSql, {
        google_id: googleUser.google_id,
        email: googleUser.email,
        name: googleUser.name,
        username: username,
        password: randomPassword,
        profile_image: googleUser.profile_image,
        is_active: 1,
        role_id: 2, // Default role
        create_at: new Date()
      });

      const userId = insertResult[0].insertId;

      await db.query(
        "INSERT INTO user_roles (user_id, role_id) VALUES (:user_id, :role_id)",
        { user_id: userId, role_id: 2 }
      );

      [existingUser] = await db.query("SELECT * FROM user WHERE id = :id", { id: userId });
      user = existingUser[0];
    }

    // Get role information
    const [roleData] = await db.query(
      "SELECT name as role_name FROM role WHERE id = :role_id",
      { role_id: user.role_id }
    );
    user.role_name = roleData[0]?.role_name;

    // Generate tokens
    delete user.password;
    const obj = {
      profile: user,
      permission: await getPermissionByUser(user.id)
    };

    const accessToken = await getAccessToken(obj);
    const refreshToken = await getRefreshToken({ user_id: user.id });
    await storeRefreshToken(user.id, refreshToken);


    // Log login activity
    try {
      await exports.logLoginActivity({
        user_id: user.id,
        username: user.username,
        ip_address: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'Unknown',
        user_agent: req.get('User-Agent') || 'Unknown',
        device_info: JSON.stringify({}),
        location_info: JSON.stringify({}),
        login_time: new Date(),
        status: 'success - Google OAuth'
      });
    } catch (logError) {
      console.error("Failed to log OAuth login:", logError);
    }

    // Redirect to frontend with tokens
    const redirectUrl = `${FRONTEND_URL}/oauth-callback?access_token=${accessToken}&refresh_token=${refreshToken}`;
    res.redirect(redirectUrl);

  } catch (error) {
    console.error("❌ Google OAuth Callback Error:", error);
    res.redirect(`${FRONTEND_URL}/login?error=oauth_failed&message=${encodeURIComponent(error.message)}`);
  }
};

// ==================== APPLE OAUTH ====================

// 3. Apple OAuth Login - Redirect to Apple
exports.appleOAuth = async (req, res) => {
  try {
    const appleAuthUrl = `https://appleid.apple.com/auth/authorize?` +
      `client_id=${process.env.APPLE_CLIENT_ID}` +
      `&redirect_uri=${encodeURIComponent(process.env.APPLE_REDIRECT_URI)}` +
      `&response_type=code id_token` +
      `&scope=name email` +
      `&response_mode=form_post`;

    res.redirect(appleAuthUrl);
  } catch (error) {
    console.error("Apple OAuth Error:", error);
    res.status(500).json({
      error: "Failed to initiate Apple OAuth",
      message: error.message
    });
  }
};

// 4. Apple OAuth Callback - Handle Apple response
exports.appleOAuthCallback = async (req, res) => {
  try {
    const { code, id_token, user } = req.body;

    if (!code || !id_token) {
      return res.redirect(`${FRONTEND_URL}/login?error=no_code`);
    }

    // Decode Apple ID token (simplified - use proper JWT verification in production)
    const jwt = require('jsonwebtoken');
    const decoded = jwt.decode(id_token);

    const appleUser = {
      apple_id: decoded.sub,
      email: decoded.email,
      email_verified: decoded.email_verified === 'true',
      name: user ? JSON.parse(user).name : null
    };

    // Check if user exists
    let sql = "SELECT * FROM user WHERE email = :email OR apple_id = :apple_id";
    let [existingUser] = await db.query(sql, {
      email: appleUser.email,
      apple_id: appleUser.apple_id
    });

    let userRecord;

    if (existingUser.length > 0) {
      // User exists - update apple_id if not set
      userRecord = existingUser[0];

      if (!userRecord.apple_id) {
        await db.query(
          "UPDATE user SET apple_id = :apple_id WHERE id = :id",
          { apple_id: appleUser.apple_id, id: userRecord.id }
        );
      }
    } else {
      // Create new user
      const insertSql = `
        INSERT INTO user (
          apple_id, email, name, username, password, 
          is_active, role_id, create_at
        ) VALUES (
          :apple_id, :email, :name, :username, :password,
          :is_active, :role_id, :create_at
        )
      `;

      const username = appleUser.email.split('@')[0] + '_' + Date.now();
      const randomPassword = bcrypt.hashSync(Math.random().toString(36), 10);

      const insertResult = await db.query(insertSql, {
        apple_id: appleUser.apple_id,
        email: appleUser.email,
        name: appleUser.name?.firstName + ' ' + appleUser.name?.lastName || 'Apple User',
        username: username,
        password: randomPassword,
        is_active: 1,
        role_id: 2, // Default role
        create_at: new Date()
      });

      const userId = insertResult[0].insertId;

      await db.query(
        "INSERT INTO user_roles (user_id, role_id) VALUES (:user_id, :role_id)",
        { user_id: userId, role_id: 2 }
      );

      [existingUser] = await db.query("SELECT * FROM user WHERE id = :id", { id: userId });
      userRecord = existingUser[0];
    }

    // Get role information
    const [roleData] = await db.query(
      "SELECT name as role_name FROM role WHERE id = :role_id",
      { role_id: userRecord.role_id }
    );
    userRecord.role_name = roleData[0]?.role_name;

    // Generate tokens
    delete userRecord.password;
    const obj = {
      profile: userRecord,
      permission: await getPermissionByUser(userRecord.id)
    };

    const accessToken = await getAccessToken(obj);
    const refreshToken = await getRefreshToken({ user_id: userRecord.id });
    await storeRefreshToken(userRecord.id, refreshToken);

    // Log login activity
    try {
      await exports.logLoginActivity({
        user_id: userRecord.id,
        username: userRecord.username,
        ip_address: req.ip || req.headers['x-forwarded-for']?.split(',')[0] || 'Unknown',
        user_agent: req.get('User-Agent') || 'Unknown',
        device_info: JSON.stringify({}),
        location_info: JSON.stringify({}),
        login_time: new Date(),
        status: 'success - Apple OAuth'
      });
    } catch (logError) {
      console.error("Failed to log OAuth login:", logError);
    }

    // Redirect to frontend with tokens
    const redirectUrl = `${FRONTEND_URL}/oauth-callback?access_token=${accessToken}&refresh_token=${refreshToken}`;
    res.redirect(redirectUrl);


  } catch (error) {
    console.error("Apple OAuth Callback Error:", error);
    res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
  }
};