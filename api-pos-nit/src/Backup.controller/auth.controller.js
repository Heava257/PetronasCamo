const { logError, db, removeFile, sendTelegramMessagenewLogin,parseUserAgent, getLocationFromIP } = require("../util/helper");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../util/config");
const { json } = require("express");

// exports.getList = async (req, res) => {
//   try {
//     let sql = `
//   SELECT  
//     u.id, 
//     u.name, 
//     u.barcode, 
//     u.username, 
//     u.branch_name, 
//     u.create_by, 
//     u.create_at, 
//     u.address, 
//     u.tel, 
//     u.is_active, 
//     r.name AS role_name 
//   FROM user u 
//   INNER JOIN role r ON u.role_id = r.id 
//   ORDER BY u.create_at DESC
// `;


//     const [list] = await db.query(sql);
//     const [role] = await db.query(
//       "SELECT id AS value, name AS label FROM role"
//     );

//     res.json({
//       list,
//       role,
//     });
//   } catch (error) {
//     logError("auth.getList", error, res);
//   }
// };
exports.getList = async (req, res) => {
  try {
    let sql = `
      SELECT  
        u.id, 
        u.name, 
        u.barcode, 
        u.username, 
        u.branch_name, 
        u.create_by, 
        u.create_at, 
        u.address, 
        u.tel, 
        u.is_active, 
        u.profile_image, 
        u.group_id,
        r.name AS role_name 
      FROM user u 
      INNER JOIN role r ON u.role_id = r.id 
      INNER JOIN user cu ON cu.group_id = u.group_id
      WHERE cu.id = :current_user_id
      ORDER BY u.create_at DESC
    `;

    const [list] = await db.query(sql, {
      current_user_id: req.current_id // មកពី token validation 
    });

    const [role] = await db.query(
      "SELECT id AS value, name AS label FROM role"
    );

    res.json({
      list,
      role,
    });
  } catch (error) {
    logError("auth.getList", error, res);
  }
};



// Add this to your auth.controller.js
// exports.getUserProfile = async (req, res) => {
//   try {
//     const { userId } = req.params;

//     // Fetch user profile data from the database
//     const sql = `
//       SELECT 
//         u.id, 
//         u.name, 
//         u.username, 
//         u.profile_image, 
//         u.address, 
//         u.tel, 
//         u.branch_name, 
//         u.is_active, 
//         r.name AS role_name 
//       FROM user u 
//       INNER JOIN role r ON u.role_id = r.id 
//       WHERE u.id = ?
//     `;

//     const [user] = await db.query(sql, [userId]);

//     if (user.length > 0) {
//       res.json({ profile: user[0] });
//     } else {
//       res.status(404).json({ message: "User not found" });
//     }
//   } catch (error) {
//     logError("auth.getUserProfile", error, res);
//   }
// };


// exports.updateUserProfile = async (req, res) => {

// const { userId } = req.params;
// const { name, username, email, password } = req.body;
// const profileImage = req.file?.filename;

// try {
//   const sql = `
//     UPDATE user SET
//       name = ?,
//       username = ?,
//       email = ?,
//       password = ?,
//       profile_image = ?
//     WHERE id = ?
//   `;
//   const [data] = await db.query(sql, [name, username, email, password, profileImage, userId]);

//   res.json({ message: "Profile updated successfully", data });
// } catch (error) {
//   logError("auth.getUserProfile", error, res);
// }
// };


exports.updateuserProfile = async (req, res) => {
  const { userId } = req.params;

  try {
    const { name, username, password } = req.body;
    const profileImage = req.file?.filename;

    let sql = "UPDATE user SET name = ?, username = ?";
    let params = [name, username];

    if (password && password.trim() !== '') {
      const hashedPassword = bcrypt.hashSync(password, 10);
      sql += ", password = ?";
      params.push(hashedPassword);
    }

    if (profileImage) {
      sql += ", profile_image = ?";
      params.push(profileImage);
    }

    sql += " WHERE id = ?";
    params.push(userId);

    const [result] = await db.query(sql, params);

    if (result.affectedRows > 0) {
      const [updatedUser] = await db.query(
        "SELECT id, name, username, profile_image FROM user WHERE id = ?",
        [userId]
      );

      res.json({
        success: true,
        message: "Profile updated successfully",
        profile: updatedUser[0]
      });
    } else {
      res.status(404).json({ success: false, message: "User not found or no changes made" });
    }
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ success: false, message: "Failed to update profile" });
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

// exports.update = async (req, res) => {
//   try {
//     // Check if a password is provided for update
//     let password = req.body.password;

//     // Only hash the password if it's being updated (if password exists)
//     if (password) {
//       password = bcrypt.hashSync(password, 10); // Hash the password
//     }

//     // Create the SQL query based on the presence of the password
//     let sql = "UPDATE user SET name = :name, username = :username, role_id = :role_id, ";
//     sql += password ? "password = :password, " : "";  // Only add password field if password exists
//     sql += "tel = :tel, branch_name = :branch_name, "; // Added comma after branch_name
//     sql += "is_active = :is_active, address = :address, create_by = :create_by, create_at = :create_at ";
//     sql += "WHERE id = :id";

//     // Prepare the query parameters
//     const queryParams = { 
//       ...req.body, 
//       password: password || req.body.password, // If no new password, retain the original password
//       create_by: req.auth?.name,
//       create_at: new Date() // Use current timestamp or req.auth?.create_at
//     };

//     // Execute the query
//     const [data] = await db.query(sql, queryParams);

//     // Send response back
//     res.json({
//       data: data,
//       message: "Update success!",
//       create_by: req.auth?.name,
//     });
//   } catch (error) {
//     logError("user.update", error, res);
//   }
// };

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


// exports.register = async (req, res) => {
//   try {
//     let password = bcrypt.hashSync(req.body.password, 10);

//     const { role_id, name, username, address, tel, branch_name, barcode, status } = req.body;

//     // Insert into the user table
//     let userSql = `
//       INSERT INTO user (role_id, name, username, password, is_active, address, tel, branch_name, barcode, create_by, create_at)
//       VALUES (:role_id, :name, :username, :password, :is_active, :address, :tel, :branch_name, :barcode, :create_by, :create_at);
//     `;

//     let userData = await db.query(userSql, {
//       role_id,
//       name,
//       username,
//       password,
//       is_active: status, // Assuming status corresponds to is_active
//       address,
//       tel,
//       branch_name,
//       barcode,
//       create_by: req.auth?.name,
//       create_at: new Date(), // Using current date if create_at is not provided
//     });


//     let userId;
//     if (userData.insertId) {
//       userId = userData.insertId;
//     } else if (userData.rows && userData.rows.insertId) {
//       userId = userData.rows.insertId;
//     } else if (userData[0] && userData[0].insertId) {
//       userId = userData[0].insertId;
//     } else if (userData.lastInsertId) {
//       userId = userData.lastInsertId;
//     } else {
//       // If we can't find the ID, query for it
//       const findUserSql = `SELECT id FROM user WHERE username = :username LIMIT 1`;
//       const userResult = await db.query(findUserSql, { username });
//       userId = userResult[0]?.id;

//       if (!userId) {
//         throw new Error("Failed to retrieve the newly created user ID");
//       }
//     }

//     console.log("Using user ID:", userId);

//     // Insert into user_roles table
//     let rolesSql = `
//       INSERT INTO user_roles (user_id, role_id) 
//       VALUES (:user_id, :role_id);
//     `;

//     await db.query(rolesSql, {
//       user_id: userId,
//       role_id
//     });

//     res.json({
//       message: "Create new account success!",
//       data: userData,
//     });
//   } catch (error) {
//     // console.error("Registration error:", error);
//     logError("auth.register", error, res);
//   }
// };

exports.register = async (req, res) => {
  try {
    let password = bcrypt.hashSync(req.body.password, 10);

    const { role_id, group_id, name, username, address, tel, branch_name, barcode, status } = req.body;

    // Insert into the user table
    let userSql = `
      INSERT INTO user (
        role_id, group_id, name, username, password, is_active, address, tel, branch_name, barcode, profile_image, create_by, create_at
      ) VALUES (
        :role_id, :group_id, :name, :username, :password, :is_active, :address, :tel, :branch_name, :barcode, :profile_image, :create_by, :create_at
      );
    `;

    let userData = await db.query(userSql, {
      role_id,
      group_id,
      name,
      username,
      password,
      is_active: status, // Assuming status corresponds to is_active
      address,
      tel,
      branch_name,
      barcode,
      profile_image: req.file?.filename, // Save the uploaded profile image filename
      create_by: req.auth?.name,
      create_at: new Date(), // Using current date if create_at is not provided
    });

    // Get the newly created user's ID
    let userId = userData.insertId || userData[0]?.insertId;

    if (!userId) {
      // If we can't find the ID, query for it
      const findUserSql = `SELECT id FROM user WHERE username = :username LIMIT 1`;
      const userResult = await db.query(findUserSql, { username });
      userId = userResult[0]?.id;

      if (!userId) {
        throw new Error("Failed to retrieve the newly created user ID");
      }
    }

    // Insert into user_roles table
    let rolesSql = `
      INSERT INTO user_roles (user_id, role_id) 
      VALUES (:user_id, :role_id);
    `;

    await db.query(rolesSql, {
      user_id: userId,
      role_id,
    });

    res.json({
      message: "Create new account success!",
      body: req.body,
      data: userData,
      file: req.file
    });
  } catch (error) {
    logError("auth.register", error, res);
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

// exports.remove = async (req, res) => {
//   try {
//     var [data] = await db.query("DELETE FROM user WHERE id = :id", {
//       id: req.body.id,
//     });
//     res.json({
//       data: data,
//       message: "Data delete success!",
//     });
//   } catch (error) {
//     logError("user.remove", error, res);
//   }
// }
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

exports.login = async (req, res) => {
  try {
    let { password, username } = req.body;
    let sql =
      "SELECT " +
      " u.*," +
      " r.name as role_name" +
      " FROM user u " +
      " INNER JOIN role r ON u.role_id = r.id " +
      " WHERE u.username=:username ";

    let [data] = await db.query(sql, {
      username: username,
    });

    if (data.length == 0) {
      res.json({
        error: {
          username: "Username doesn't exist!",
        },
      });
    } else {
      let dbPass = data[0].password;
      let isCorrectPass = bcrypt.compareSync(password, dbPass);

      if (!isCorrectPass) {
        res.json({
          error: {
            password: "Password incorrect!",
          },
        });
      } else {
        delete data[0].password;
        let obj = {
          profile: data[0],
          permission: await getPermissionByUser(data[0].id),
        };

        // Generate tokens
        const accessToken = await getAccessToken(obj);
        const refreshToken = await getRefreshToken({ user_id: data[0].id });

        // Store refresh token in database
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
                        req.connection.remoteAddress || 
                        req.socket.remoteAddress || 
                        'Unknown';
        
        // Parse device info from user agent
        const deviceInfo = parseUserAgent(userAgent);
        
        // Get location info (if available)
        const locationInfo = await getLocationFromIP(clientIP);

        // Enhanced Telegram alert message with detailed information
        const alertMessage = `
🔐 <b>ការជូនដំណឹងចូលប្រើប្រាស់ថ្មី / New Login Alert</b>
━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 <b>អ្នកប្រើប្រាស់ / User:</b> ${data[0].name || 'N/A'}
🆔 <b>Username:</b> ${data[0].username}
📧 <b>Email:</b> ${data[0].email || 'N/A'}
🎭 <b>តួនាទី / Role:</b> ${data[0].role_name}
🏢 <b>សាខា / Branch:</b> ${data[0].branch_name || 'N/A'}
📱 <b>ទូរស័ព្ទ / Tel:</b> ${data[0].tel || 'N/A'}

━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ <b>ពេលវេលា / Login Time:</b> 
${loginTime}

🌐 <b>អាសយដ្ឋាន IP / IP Address:</b> 
<code>${clientIP}</code>

${locationInfo ? `
📍 <b>ទីតាំង / Location:</b>
   • Country: ${locationInfo.country || 'Unknown'}
   • City: ${locationInfo.city || 'Unknown'}
   • ISP: ${locationInfo.isp || 'Unknown'}
` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━
💻 <b>ព័ត៌មានឧបករណ៍ / Device Information:</b>

🖥️ <b>Platform:</b> ${deviceInfo.platform}
🌐 <b>Browser:</b> ${deviceInfo.browser} ${deviceInfo.version}
📱 <b>Device Type:</b> ${deviceInfo.deviceType}
🔧 <b>OS:</b> ${deviceInfo.os}

<b>User Agent:</b>
<code>${userAgent.substring(0, 100)}${userAgent.length > 100 ? '...' : ''}</code>

━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ <b>Status:</b> Login successful!
🔑 <b>Session ID:</b> ${data[0].id}
🆔 <b>User ID:</b> ${data[0].id}

━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ <b>សេចក្តីជូនដំណឹង / Security Notice:</b>
If this wasn't you, please change your password immediately!
ប្រសិនបើមិនមែនជាអ្នក សូមប្តូរពាក្យសម្ងាត់របស់អ្នកភ្លាមៗ!
        `;
 
        // Send Telegram notification
        sendTelegramMessagenewLogin(alertMessage).catch(err => {
          console.error("Failed to send Telegram alert:", err.message);
        });

        // Log login activity to database (optional)
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

        res.json({
          message: "Login success",
          ...obj,
          access_token: accessToken,
          refresh_token: refreshToken,
          login_details: {
            login_time: loginTime,
            ip_address: clientIP,
            device: deviceInfo.platform,
            browser: deviceInfo.browser
          }
        });
      }
    }
  } catch (error) {
    logError("auth.login", error, res);
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

    // Verify refresh token
    jwt.verify(refresh_token, config.config.token.refresh_token_key, async (error, decoded) => {
      if (error) {
        return res.status(401).json({
          message: "Invalid refresh token",
          error: { name: "InvalidRefreshToken", details: error.message }
        });
      }

      const userId = decoded.user_id;

      try {
        // Check if refresh token exists in database and is valid
        const isValidToken = await validateRefreshToken(userId, refresh_token);
        if (!isValidToken) {
          return res.status(401).json({
            message: "Invalid or expired refresh token",
            error: { name: "TokenExpiredError" }
          });
        }

        // Get user data
        let sql =
          "SELECT " +
          " u.*," +
          " r.name as role_name" +
          " FROM user u " +
          " INNER JOIN role r ON u.role_id = r.id " +
          " WHERE u.id = :userId ";

        let [userData] = await db.query(sql, { userId });

        if (userData.length === 0) {
          return res.status(404).json({
            message: "User not found",
            error: { name: "UserNotFound" }
          });
        }

        delete userData[0].password;
        let obj = {
          profile: userData[0],
          permission: await getPermissionByUser(userData[0].id),
        };

        // Generate new access token
        const newAccessToken = await getAccessToken(obj);
        
        // Generate new refresh token (token rotation for security)
        const newRefreshToken = await getRefreshToken({ user_id: userId });
        await updateRefreshToken(userId, refresh_token, newRefreshToken);

        res.json({
          message: "Token refreshed successfully",
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


exports.logout = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    const userId = req.auth?.id; // From token validation middleware

    if (refresh_token) {
      await revokeRefreshToken(userId, refresh_token);
    }

    res.json({
      message: "Logout successful",
    });
  } catch (error) {
    logError("auth.logout", error, res);
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
  return (req, res, next) => {
    const authorization = req.headers.authorization;
    let token_from_client = null;
    
    if (authorization && authorization.startsWith('Bearer ')) {
      token_from_client = authorization.slice(7); // Remove 'Bearer ' prefix
    }
    
    if (!token_from_client) {
      return res.status(401).json({
        message: "Unauthorized - No token provided",
        error: { name: "NoTokenProvided" }
      });
    }
    
    jwt.verify(
      token_from_client,
      config.config.token.access_token_key,
      (error, result) => {
        if (error) {
          if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
              message: "Token expired",
              error: { name: "TokenExpiredError" }
            });
          } else {
            return res.status(401).json({
              message: "Invalid token",
              error: { name: "InvalidToken", details: error.message }
            });
          }
        }
        
        // Check permissions if required
        if (permission_name) {
          const findIndex = result.data.permission?.findIndex(
            (item) => item.name === permission_name
          );
          if (findIndex === -1) {
            return res.status(403).json({
              message: "Forbidden - Insufficient permissions",
              error: { name: "InsufficientPermissions" }
            });
          }
        }
        
        req.current_id = result.data.profile.id;
        req.auth = result.data.profile;
        req.permission = result.data.permission;
        next();
      }
    );
  };
};

const getRefreshToken = async (userData) => {
  const refresh_token = await jwt.sign(
    userData,
    config.config.token.refresh_token_key,
    {
      expiresIn: "7d", // Refresh token expires in 7 days
    }
  );
  return refresh_token;
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
};

const getAccessToken = async (paramData) => {
  const access_token = await jwt.sign(
    { data: paramData },
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