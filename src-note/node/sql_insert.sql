
-- CREATE TABLE IF NOT EXISTS `system_logs` (
--   `id` INT AUTO_INCREMENT PRIMARY KEY,
--   `action_type` VARCHAR(100) NOT NULL COMMENT 'ប្រភេទសកម្មភាព',
--   `description` TEXT COMMENT 'ការពិពណ៌នា',
--   `error_message` TEXT NULL COMMENT 'សារកំហុស (ប្រសិនបើមាន)',
--   `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
--   INDEX `idx_action_type` (`action_type`),
--   INDEX `idx_created_at` (`created_at`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
-- COMMENT='System logs សម្រាប់ tracking system activities';






-- ✅ Create system_logs table
-- CREATE TABLE IF NOT EXISTS `system_logs` (
--   `id` INT AUTO_INCREMENT PRIMARY KEY,
--   `log_type` VARCHAR(50) NOT NULL COMMENT 'LOGIN, LOGOUT, CREATE, UPDATE, DELETE, ERROR, NOTIFICATION, SECURITY',
--   `user_id` INT DEFAULT NULL,
--   `username` VARCHAR(100) DEFAULT NULL,
--   `action` VARCHAR(255) NOT NULL,
--   `description` TEXT,
--   `ip_address` VARCHAR(45) DEFAULT NULL,
--   `user_agent` TEXT,
--   `device_info` JSON DEFAULT NULL,
--   `location_info` JSON DEFAULT NULL,
--   `severity` ENUM('info', 'warning', 'error', 'critical') DEFAULT 'info',
--   `status` VARCHAR(50) DEFAULT 'success',
--   `error_message` TEXT DEFAULT NULL,
--   `request_data` JSON DEFAULT NULL,
--   `response_data` JSON DEFAULT NULL,
--   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   INDEX `idx_log_type` (`log_type`),
--   INDEX `idx_user_id` (`user_id`),
--   INDEX `idx_created_at` (`created_at`),
--   INDEX `idx_severity` (`severity`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ✅ Create login_history table (if not exists)
-- CREATE TABLE IF NOT EXISTS `login_history` (
--   `id` INT AUTO_INCREMENT PRIMARY KEY,
--   `user_id` INT NOT NULL,
--   `username` VARCHAR(100) NOT NULL,
--   `ip_address` VARCHAR(45) DEFAULT NULL,
--   `user_agent` TEXT,
--   `device_info` JSON DEFAULT NULL,
--   `location_info` JSON DEFAULT NULL,
--   `login_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   `logout_time` TIMESTAMP NULL,
--   `status` VARCHAR(50) DEFAULT 'success',
--   INDEX `idx_user_id` (`user_id`),
--   INDEX `idx_login_time` (`login_time`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ✅ Create user_activity_log table (if not exists)
-- CREATE TABLE IF NOT EXISTS `user_activity_log` (
--   `id` INT AUTO_INCREMENT PRIMARY KEY,
--   `user_id` INT NOT NULL,
--   `action_type` VARCHAR(100) NOT NULL,
--   `action_description` TEXT,
--   `ip_address` VARCHAR(45) DEFAULT NULL,
--   `user_agent` TEXT,
--   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   `created_by` INT DEFAULT NULL,
--   INDEX `idx_user_id` (`user_id`),
--   INDEX `idx_action_type` (`action_type`),
--   INDEX `idx_created_at` (`created_at`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;








-- CREATE TABLE IF NOT EXISTS user_online_status (
--   id INT PRIMARY KEY AUTO_INCREMENT,
--   user_id INT NOT NULL,
--   last_activity DATETIME NOT NULL,
--   is_online BOOLEAN DEFAULT 1,
--   session_id VARCHAR(255),
--   ip_address VARCHAR(45),
--   user_agent TEXT,
--   device_info JSON,
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--   updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
--   INDEX idx_user_id (user_id),
--   INDEX idx_last_activity (last_activity),
--   INDEX idx_is_online (is_online),
--   UNIQUE KEY unique_user_session (user_id, session_id)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CREATE OR REPLACE VIEW v_online_users AS
-- SELECT 
--   u.id,
--   u.name,
--   u.username,
--   u.profile_image,
--   u.is_online,
--   u.last_activity,
--   u.online_status,
--   r.name AS role_name,
--   r.code AS role_code,
--   TIMESTAMPDIFF(MINUTE, u.last_activity, NOW()) AS minutes_since_activity,
--   CASE
--     WHEN TIMESTAMPDIFF(MINUTE, u.last_activity, NOW()) < 3 THEN 'online'
--     WHEN TIMESTAMPDIFF(MINUTE, u.last_activity, NOW()) < 5 THEN 'away'
--     ELSE 'offline'
--   END AS computed_status
-- FROM user u
-- INNER JOIN role r ON u.role_id = r.id
-- WHERE u.is_active = 1
-- ORDER BY u.is_online DESC, u.last_activity DESC;


-- UPDATE user SET is_online = 0, online_status = 'offline';



-- SELECT * FROM v_online_users WHERE computed_status = 'online';

-- 
-- SELECT 
--   u.id,
--   u.name,
--   u.username,
--   u.is_online,
--   u.online_status,
--   u.last_activity,
--   TIMESTAMPDIFF(MINUTE, u.last_activity, NOW()) AS minutes_inactive,
--   r.name AS role_name
-- FROM user u
-- INNER JOIN role r ON u.role_id = r.id
-- WHERE r.code IN ('ADMIN', 'SUPER_ADMIN')
-- ORDER BY u.is_online DESC, u.last_activity DESC;

-- Count online users by role
-- SELECT 
--   r.name AS role_name,
--   COUNT(*) AS total_users,
--   SUM(CASE WHEN u.is_online = 1 THEN 1 ELSE 0 END) AS online_count,
--   SUM(CASE WHEN u.online_status = 'away' THEN 1 ELSE 0 END) AS away_count,
--   SUM(CASE WHEN u.is_online = 0 THEN 1 ELSE 0 END) AS offline_count
-- FROM user u
-- INNER JOIN role r ON u.role_id = r.id
-- WHERE u.is_active = 1
-- GROUP BY r.name;








-- ✅ Add token_version column to user table

-- ALTER TABLE `user` 
-- ADD COLUMN `token_version` INT DEFAULT 0 COMMENT 'Increment to invalidate old tokens';

-- -- ✅ Create index for faster lookups
-- CREATE INDEX idx_user_token_version ON `user`(id, token_version);

-- -- ✅ Optional: Add last_permission_update timestamp
-- ALTER TABLE `user`
-- ADD COLUMN `last_permission_update` DATETIME NULL COMMENT 'Last time permissions were modified';






-- ===================================================
-- AUTO LOGOUT SYSTEM - DATABASE MIGRATION
-- ===================================================

-- 1. Add last_activity column to user table (if not exists)
-- ALTER TABLE `user`
-- ADD COLUMN `last_activity` DATETIME NULL COMMENT 'Last activity timestamp';


-- 2. Add auto_logout_enabled column (per-user control)
-- ALTER TABLE `user`
-- ADD COLUMN `auto_logout_enabled` TINYINT(1) DEFAULT 1
-- COMMENT '1=enabled, 0=disabled for this user';


-- -- 3. Create index for performance
-- CREATE INDEX idx_user_last_activity 
-- ON `user` (id, last_activity);


-- CREATE TABLE `system_config` (
--   `id` INT AUTO_INCREMENT PRIMARY KEY,
--   `config_key` VARCHAR(100) NOT NULL,
--   `config_value` TEXT NOT NULL,
--   `description` VARCHAR(255),
--   `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   `updated_by` INT DEFAULT NULL,
--   UNIQUE KEY `uk_config_key` (`config_key`),
--   CONSTRAINT `fk_system_config_user`
--     FOREIGN KEY (`updated_by`) REFERENCES `user`(`id`)
--     ON DELETE SET NULL
-- ) ENGINE=InnoDB
-- DEFAULT CHARSET=utf8mb4;


-- 5. Insert default auto-logout configuration


-- INSERT INTO `system_config` (`config_key`, `config_value`, `description`) 
-- VALUES 
--   ('auto_logout_minutes', '30', 'Minutes of inactivity before automatic logout')
-- ON DUPLICATE KEY UPDATE 
--   `config_value` = VALUES(`config_value`);

-- -- 6. Insert auto-logout enabled/disabled flag
-- INSERT INTO `system_config` (`config_key`, `config_value`, `description`) 
-- VALUES 
--   ('auto_logout_enabled', 'true', 'Global enable/disable for auto-logout feature')
-- ON DUPLICATE KEY UPDATE 
--   `config_value` = VALUES(`config_value`);

-- -- 7. Update existing users to have last_activity = last_login (if available)
-- UPDATE `user` 
-- SET last_activity = last_login 
-- WHERE last_activity IS NULL AND last_login IS NOT NULL;

-- -- 8. Set current timestamp for users without any activity
-- UPDATE `user` 
-- SET last_activity = NOW() 
-- WHERE last_activity IS NULL;

-- ===================================================
-- VERIFICATION QUERIES (Run these to verify)
-- ===================================================

-- Check if columns were added
-- SELECT 
--   COLUMN_NAME, 
--   DATA_TYPE, 
--   COLUMN_DEFAULT, 
--   COLUMN_COMMENT 
-- FROM INFORMATION_SCHEMA.COLUMNS 
-- WHERE TABLE_NAME = 'user' 
--   AND COLUMN_NAME IN ('last_activity', 'auto_logout_enabled');

-- Check system config
-- SELECT * FROM system_config WHERE config_key LIKE 'auto_logout%';

-- Check users with last_activity
-- SELECT 
--   id, 
--   username, 
--   last_activity, 
--   auto_logout_enabled,
--   TIMESTAMPDIFF(MINUTE, last_activity, NOW()) as minutes_since_activity
-- FROM `user` 
-- LIMIT 10;

-- ===================================================
-- ROLLBACK (if needed)
-- ===================================================

-- To rollback changes, uncomment and run:
-- ALTER TABLE `user` DROP COLUMN IF EXISTS `last_activity`;
-- ALTER TABLE `user` DROP COLUMN IF EXISTS `auto_logout_enabled`;
-- DROP TABLE IF EXISTS `system_config`;
-- DROP INDEX IF EXISTS idx_user_last_activity ON `user`;




-- ================================================
-- COMPLETE FIX FOR YOUR DATABASE
-- ================================================

-- Step 1: Show current state of all admins
-- SELECT 
--   u.id,
--   u.name,
--   u.username,
--   u.role_id,
--   u.group_id AS current_group_id,
--   u.branch_name,
--   r.code AS role_code
-- FROM user u
-- INNER JOIN role r ON u.role_id = r.id
-- WHERE r.id IN (1, 29)  -- Admin and Super Admin
-- ORDER BY u.id;

-- Step 2: Fix ALL admins with role_id = 1 (Admin)
-- UPDATE user 
-- SET group_id = id 
-- WHERE role_id = 1  -- Admin role
--   AND (group_id IS NULL OR group_id = 0);

-- Step 3: Fix Super Admins (optional, they don't need group filtering)
-- UPDATE user 
-- SET group_id = id 
-- WHERE role_id = 29  -- Super Admin role
--   AND (group_id IS NULL OR group_id = 0);

-- Step 4: Verify the fix
-- SELECT 
--   u.id,
--   u.name,
--   u.username,
--   u.role_id,
--   u.group_id AS fixed_group_id,
--   u.branch_name,
--   r.code AS role_code
-- FROM user u
-- INNER JOIN role r ON u.role_id = r.id
-- WHERE r.id IN (1, 29)
-- ORDER BY u.id;

-- Step 5: Show which users belong to which admin
-- SELECT 
--   admin.id AS admin_id,
--   admin.name AS admin_name,
--   admin.branch_name AS admin_branch,
--   admin.group_id,
--   COUNT(DISTINCT u.id) AS total_users,
--   GROUP_CONCAT(DISTINCT u.name ORDER BY u.id SEPARATOR ', ') AS user_list
-- FROM user admin
-- LEFT JOIN user u ON u.group_id = admin.group_id AND u.id != admin.id
-- WHERE admin.role_id = 1  -- Only admins
-- GROUP BY admin.id, admin.name, admin.branch_name, admin.group_id
-- ORDER BY admin.id;

-- Step 6: Find orphaned users (users with NULL or mismatched group_id)
-- SELECT 
--   u.id,
--   u.name,
--   u.username,
--   u.group_id,
--   u.create_by,
--   u.branch_name,
--   r.name AS role_name
-- FROM user u
-- INNER JOIN role r ON u.role_id = r.id
-- WHERE u.group_id IS NULL 
--   OR u.group_id NOT IN (SELECT id FROM user WHERE role_id IN (1, 29))
-- ORDER BY u.id;

-- Step 7: Fix orphaned users by matching them to their creator
-- UPDATE user u
-- INNER JOIN user creator ON u.create_by = creator.name
-- SET u.group_id = creator.group_id
-- WHERE u.group_id IS NULL 
--   AND creator.role_id = 1  -- Creator is an admin
--   AND creator.group_id IS NOT NULL;



--   ALTER TABLE supplier ADD COLUMN user_id INT;
-- ALTER TABLE supplier ADD FOREIGN KEY (user_id) REFERENCES user(id); DROP


















-- ========================================
-- Telegram Configuration Management
-- Migration: telegram_config table
-- ========================================

-- CREATE TABLE IF NOT EXISTS `telegram_config` (
--   `id` INT PRIMARY KEY AUTO_INCREMENT,
  
--   -- Configuration Type
--   `config_type` ENUM('super_admin', 'branch', 'system') NOT NULL COMMENT 'Type of configuration',
--   `config_name` VARCHAR(100) NOT NULL COMMENT 'Display name for this config',
  
--   -- Telegram Credentials
--   `bot_token` VARCHAR(255) NOT NULL COMMENT 'Telegram bot token',
--   `chat_id` VARCHAR(100) NOT NULL COMMENT 'Telegram chat ID (user or group)',
  
--   -- Branch Association (optional)
--   `branch_name` VARCHAR(100) NULL COMMENT 'Branch name if config_type is branch',
  
--   -- Additional Info
--   `description` TEXT NULL COMMENT 'Description of this configuration',
--   `is_active` TINYINT(1) DEFAULT 1 COMMENT 'Enable/disable this config',
  
--   -- Testing Info
--   `last_test_at` DATETIME NULL COMMENT 'Last time this config was tested',
--   `last_test_status` ENUM('success', 'failed', 'pending') NULL COMMENT 'Result of last test',
  
--   -- Audit Fields
--   `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
--   `created_by` VARCHAR(100) NULL,
--   `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
--   `updated_by` VARCHAR(100) NULL,
  
--   -- Indexes
--   INDEX idx_config_type (config_type),
--   INDEX idx_branch_name (branch_name),
--   INDEX idx_is_active (is_active),
  
--   -- Unique constraint: one config per branch
--   UNIQUE KEY unique_branch_config (config_type, branch_name)
  
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Telegram bot configurations for different branches';

-- ========================================
-- Insert sample configurations
-- ========================================

-- Super Admin configuration
-- INSERT INTO `telegram_config` (
--   config_type,
--   config_name,
--   bot_token,
--   chat_id,
--   description,
--   is_active,
--   created_by
-- ) VALUES (
--   'super_admin',
--   'Super Admin Alerts',
--   'YOUR_SUPER_ADMIN_BOT_TOKEN',
--   'YOUR_SUPER_ADMIN_CHAT_ID',
--   'Main bot for Super Admin - receives all system alerts',
--   1,
--   'System'
-- );

-- Sample branch configurations
-- INSERT INTO `telegram_config` (
--   config_type,
--   config_name,
--   bot_token,
--   chat_id,
--   branch_name,
--   description,
--   is_active,
--   created_by
-- ) VALUES 
-- (
--   'branch',
--   'Station A Alerts',
--   'STATION_A_BOT_TOKEN',
--   'STATION_A_CHAT_ID',
--   'Station A',
--   'Telegram alerts for Station A branch',
--   1,
--   'System'
-- ),
-- (
--   'branch',
--   'Station B Alerts',
--   'STATION_B_BOT_TOKEN',
--   'STATION_B_CHAT_ID',
--   'Station B',
--   'Telegram alerts for Station B branch',
--   1,
--   'System'
-- );

-- ========================================
-- Update existing system_config (optional)
-- ========================================

-- Remove old single bot token if exists
-- DELETE FROM system_config WHERE config_key = 'telegram_bot_token';

-- Add global enable/disable flag
-- INSERT INTO system_config (config_key, config_value, description, updated_at) 
-- VALUES ('telegram_notifications_enabled', 'true', 'Global enable/disable for all Telegram notifications', NOW())
-- ON DUPLICATE KEY UPDATE config_value = 'true';

-- ========================================
-- Notes:
-- ========================================
-- 
-- 1. config_type:
--    - 'super_admin': For Super Admin (receives everything)
--    - 'branch': For specific branches (receives branch-only alerts)
--    - 'system': For system-wide notifications
--
-- 2. After migration, update bot tokens and chat IDs:
--    UPDATE telegram_config SET 
--      bot_token = 'YOUR_ACTUAL_TOKEN',
--      chat_id = 'YOUR_ACTUAL_CHAT_ID'
--    WHERE id = 1;
--
-- 3. To add new branch:
--    INSERT INTO telegram_config VALUES (
--      'branch', 'Station C', 'TOKEN', 'CHAT_ID', 'Station C', ...
--    );


-- CREATE TABLE IF NOT EXISTS `branch_permission_overrides` (
--   `id` INT PRIMARY KEY AUTO_INCREMENT,
--   `branch_name` VARCHAR(100) NOT NULL,
--   `role_id` INT NOT NULL,
--   `permission_id` INT NOT NULL,
--   `override_type` ENUM('add', 'remove') NOT NULL COMMENT 'add = grant additional permission, remove = revoke permission',
--   `reason` TEXT NULL COMMENT 'Why this override exists',
--   `created_by` INT NULL,
--   `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
--   `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
--   -- ✅ Unique: One override per branch + role + permission
--   UNIQUE KEY `unique_branch_role_permission` (`branch_name`, `role_id`, `permission_id`),
  
--   -- ✅ Indexes for fast lookup
--   KEY `idx_branch_role` (`branch_name`, `role_id`),
--   KEY `idx_role_permission` (`role_id`, `permission_id`),
  
--   -- ✅ Foreign keys
--   FOREIGN KEY (`role_id`) REFERENCES `role`(`id`) ON DELETE CASCADE,
--   FOREIGN KEY (`permission_id`) REFERENCES `permissions`(`id`) ON DELETE CASCADE,
--   FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE SET NULL
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
-- COMMENT='Branch-specific permission overrides - allows customization per branch';





-- Migration: Add branch_name to customer table
-- This allows filtering customers by branch

-- Step 1: Add branch_name column if it doesn't exist
-- ALTER TABLE customer 
-- ADD COLUMN IF NOT EXISTS branch_name VARCHAR(100) DEFAULT NULL 
-- AFTER user_id;

-- Step 2: Add index for better query performance
-- CREATE INDEX IF NOT EXISTS idx_customer_branch 
-- ON customer(branch_name);

-- Step 3: Add composite index for branch + group filtering
-- CREATE INDEX IF NOT EXISTS idx_customer_branch_user 
-- ON customer(branch_name, user_id);

-- Step 4: Update existing customers with branch from their creator
-- UPDATE customer c
-- INNER JOIN user u ON c.user_id = u.id
-- SET c.branch_name = u.branch_name
-- WHERE c.branch_name IS NULL AND u.branch_name IS NOT NULL;

-- Step 5: Verify the changes
-- SELECT 
--     COUNT(*) as total_customers,
--     COUNT(branch_name) as customers_with_branch,
--     COUNT(*) - COUNT(branch_name) as customers_without_branch
-- FROM customer;

-- Step 6: Show sample data
-- SELECT 
--     id, 
--     name, 
--     branch_name, 
--     user_id,
--     create_by,
--     create_at
-- FROM customer
-- ORDER BY create_at DESC
-- LIMIT 10;





-- ALTER TABLE system_logs
-- ADD INDEX IF NOT EXISTS idx_user_created (user_id, created_at);

-- ALTER TABLE system_logs

-- ADD COLUMN log_type VARCHAR(50) NULL AFTER action_type;


-- Check before creating index
-- CREATE INDEX idx_user_created ON system_logs (user_id, created_at);
-- CREATE INDEX idx_ip_created ON system_logs (ip_address, created_at);
-- CREATE INDEX idx_action ON system_logs (action);
-- CREATE INDEX idx_log_type ON system_logs (log_type);



DELIMITER $$

-- DROP PROCEDURE IF EXISTS cleanup_old_security_data$$

-- CREATE PROCEDURE cleanup_old_security_data(IN days_to_keep INT)
-- BEGIN
--   DELETE FROM security_incidents 
--   WHERE resolved = 1 
--     AND resolved_at < DATE_SUB(NOW(), INTERVAL days_to_keep DAY);

--   UPDATE ip_blacklist 
--   SET is_active = 0 
--   WHERE expires_at IS NOT NULL 
--     AND expires_at < NOW();

--   SELECT 'Cleanup completed' AS status;
-- END$$

-- DELIMITER ;


-- CREATE TABLE security_incidents (
--     id INT(11) NOT NULL AUTO_INCREMENT,
--     log_id INT(11) DEFAULT NULL,
--     user_id INT(11) DEFAULT NULL,
--     ip_address VARCHAR(45) DEFAULT NULL,
--     threats LONGTEXT DEFAULT NULL,
--     anomalies LONGTEXT DEFAULT NULL,
--     risk_score INT(11) DEFAULT 0,
--     status ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
--     investigated TINYINT(1) DEFAULT 0,
--     investigated_by INT(11) DEFAULT NULL,
--     investigation_notes TEXT DEFAULT NULL,
--     resolved TINYINT(1) DEFAULT 0,
--     resolved_at DATETIME DEFAULT NULL,
--     created_at DATETIME DEFAULT CURRENT_TIMESTAMP(),
--     threat_count INT AS (JSON_LENGTH(threats)) STORED,
--     PRIMARY KEY (id),
--     KEY log_id (log_id),
--     KEY user_id (user_id),
--     KEY ip_address (ip_address),
--     KEY risk_score (risk_score),
--     KEY status (status),
--     KEY created_at (created_at),
--     KEY threat_count (threat_count)
-- );


-- Enable event scheduler (if allowed)
-- SET GLOBAL event_scheduler = ON;

-- DROP EVENT IF EXISTS daily_security_cleanup;

-- CREATE EVENT daily_security_cleanup
-- ON SCHEDULE EVERY 1 DAY
-- STARTS CURRENT_DATE + INTERVAL 1 DAY + INTERVAL 2 HOUR
-- DO
--   CALL cleanup_old_security_data(90);



-- ALTER TABLE security_incidents
-- ADD COLUMN threat_count INT
-- GENERATED ALWAYS AS (JSON_LENGTH(threats)) STORED,
-- ADD INDEX idx_threat_count (threat_count);


-- ALTER TABLE system_logs ADD COLUMN response_time INT AFTER response_data;


-- DROP TABLE IF EXISTS system_logs;

-- CREATE TABLE system_logs (
--     id INT(11) NOT NULL AUTO_INCREMENT,
--     log_type VARCHAR(50) NOT NULL,
--     user_id INT(11) DEFAULT NULL,
--     username VARCHAR(100) DEFAULT NULL,
--     action VARCHAR(255) NOT NULL,
--     description TEXT DEFAULT NULL,
--     ip_address VARCHAR(45) DEFAULT NULL,
--     user_agent TEXT DEFAULT NULL,
--     device_info LONGTEXT DEFAULT NULL,
--     location_info LONGTEXT DEFAULT NULL,
--     severity ENUM('info', 'warning', 'error', 'critical') DEFAULT 'info',
--     status VARCHAR(50) DEFAULT 'success',
--     error_message TEXT DEFAULT NULL,
--     request_data LONGTEXT DEFAULT NULL,
--     response_data LONGTEXT DEFAULT NULL,
--     response_time INT(11) DEFAULT NULL,
--     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
--     PRIMARY KEY (id),
--     KEY log_type (log_type),
--     KEY user_id (user_id),
--     KEY action (action),
--     KEY ip_address (ip_address),
--     KEY severity (severity),
--     KEY created_at (created_at)
-- );

-- ════════════════════════════════════════════════════════════════
-- SYSTEM NOTIFICATIONS TABLE MIGRATION
-- ════════════════════════════════════════════════════════════════

-- CREATE TABLE IF NOT EXISTS `system_notifications` (
--   `id` INT AUTO_INCREMENT PRIMARY KEY,
--   `notification_type` ENUM('order_created', 'payment_received', 'stock_update', 'customer_created', 'alert', 'info', 'warning', 'error') NOT NULL,
--   `title` VARCHAR(255) NOT NULL,
--   `message` TEXT NOT NULL,
--   `data` JSON NULL COMMENT 'Additional structured data',
  
--   -- Order related fields
--   `order_id` INT NULL,
--   `order_no` VARCHAR(50) NULL,
--   `customer_id` INT NULL,
--   `customer_name` VARCHAR(255) NULL,
--   `customer_address` TEXT NULL,
--   `customer_tel` VARCHAR(50) NULL,
--   `total_amount` DECIMAL(15,2) NULL,
--   `total_liters` DECIMAL(15,2) NULL,
--   `card_number` VARCHAR(100) NULL COMMENT 'Product description/card number',
  
--   -- User & Branch info
--   `user_id` INT NULL,
--   `created_by` VARCHAR(255) NULL,
--   `branch_name` VARCHAR(255) NULL,
--   `group_id` INT NULL COMMENT 'For filtering by user group',
  
--   -- Notification status
--   `is_read` TINYINT(1) DEFAULT 0,
--   `read_by` JSON NULL COMMENT 'Array of user IDs who read this',
--   `read_at` DATETIME NULL,
--   `priority` ENUM('low', 'normal', 'high', 'critical') DEFAULT 'normal',
--   `severity` ENUM('info', 'success', 'warning', 'error', 'critical') DEFAULT 'info',
  
--   -- Metadata
--   `icon` VARCHAR(50) NULL DEFAULT '🔔',
--   `color` VARCHAR(20) NULL DEFAULT 'blue',
--   `action_url` VARCHAR(255) NULL,
--   `expires_at` DATETIME NULL COMMENT 'Auto-delete after this date',
  
--   -- Timestamps
--   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
--   -- Indexes
--   INDEX `idx_notification_type` (`notification_type`),
--   INDEX `idx_user_group` (`user_id`, `group_id`),
--   INDEX `idx_order` (`order_id`),
--   INDEX `idx_is_read` (`is_read`),
--   INDEX `idx_created_at` (`created_at`),
--   INDEX `idx_priority` (`priority`),
  
--   -- Foreign Keys
--   FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON DELETE CASCADE,
--   FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON DELETE SET NULL,
--   FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE SET NULL
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════════
-- CREATE NOTIFICATION SETTINGS TABLE
-- ════════════════════════════════════════════════════════════════

-- CREATE TABLE IF NOT EXISTS `notification_settings` (
--   `id` INT AUTO_INCREMENT PRIMARY KEY,
--   `user_id` INT NOT NULL,
--   `group_id` INT NULL,
--   `branch_name` VARCHAR(255) NULL,
  
--   -- Notification preferences
--   `order_created` TINYINT(1) DEFAULT 1,
--   `payment_received` TINYINT(1) DEFAULT 1,
--   `stock_update` TINYINT(1) DEFAULT 1,
--   `customer_created` TINYINT(1) DEFAULT 1,
--   `system_alerts` TINYINT(1) DEFAULT 1,
  
--   -- Delivery method
--   `in_app` TINYINT(1) DEFAULT 1,
--   `email` TINYINT(1) DEFAULT 0,
--   `telegram` TINYINT(1) DEFAULT 1,
  
--   -- Sound preferences
--   `sound_enabled` TINYINT(1) DEFAULT 1,
--   `sound_type` VARCHAR(50) DEFAULT 'default',
  
--   -- Auto-delete preferences
--   `auto_delete_days` INT DEFAULT 30 COMMENT 'Auto delete read notifications after X days',
  
--   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
--   UNIQUE KEY `unique_user_settings` (`user_id`),
--   FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ════════════════════════════════════════════════════════════════
-- SAMPLE DATA (Optional)
-- ════════════════════════════════════════════════════════════════

-- Insert default notification settings for all users
-- INSERT INTO `notification_settings` (`user_id`, `group_id`)
-- SELECT 
--   u.id, 
--   u.group_id
-- FROM `user` u
-- WHERE NOT EXISTS (
--   SELECT 1 FROM `notification_settings` ns WHERE ns.user_id = u.id
-- );

-- ════════════════════════════════════════════════════════════════
-- CLEANUP OLD NOTIFICATIONS (Run periodically via cron)
-- ════════════════════════════════════════════════════════════════

-- DELIMITER $$

-- CREATE EVENT IF NOT EXISTS `cleanup_old_notifications`
-- ON SCHEDULE EVERY 1 DAY
-- STARTS CURRENT_TIMESTAMP
-- DO
-- BEGIN
--   -- Delete read notifications older than 30 days
--   DELETE FROM `system_notifications` 
--   WHERE `is_read` = 1 
--     AND `created_at` < DATE_SUB(NOW(), INTERVAL 30 DAY);
  
--   -- Delete expired notifications
--   DELETE FROM `system_notifications` 
--   WHERE `expires_at` IS NOT NULL 
--     AND `expires_at` < NOW();
-- END$$

-- DELIMITER ;



-- Best balance: Fast + Emoji + Modern
-- ALTER TABLE system_notifications CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
-- ALTER TABLE user CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
-- ALTER TABLE role CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;


-- INSERT INTO system_notifications (
--   notification_type, title, message, data,
--   user_id, 
--   customer_id,
--   customer_name, customer_tel,
--   created_by, group_id, branch_name,
--   priority, severity, icon, color, created_at
-- ) 
-- SELECT
--   'login_alert',
--   CONCAT('🔐 Login Alert: ', u.name),
--   'New login detected...',
--   JSON_OBJECT(
--     'login_info',
--     JSON_OBJECT(
--       'username', u.username,
--       'time', NOW()
--     )
--   ),
--   u.id,
--   NULL,
--   u.name,
--   u.tel,
--   u.username,
--   NULL,
--   u.branch_name,
--   'normal', 'info', '🔐', 'blue', NOW()
-- FROM user u
-- INNER JOIN role r ON u.role_id = r.id
-- WHERE u.role_id = 29
-- LIMIT 1;



-- បង្កើន column size ទៅ 50 characters (safe!)
-- ALTER TABLE system_notifications
-- MODIFY COLUMN notification_type VARCHAR(50);




-- ពិនិត្យថាប្តូរបានជោគជ័យ
-- SELECT 
--   COLUMN_NAME,
--   CHARACTER_MAXIMUM_LENGTH,
--   COLUMN_TYPE
-- FROM information_schema.COLUMNS
-- WHERE TABLE_SCHEMA = DATABASE()
--   AND TABLE_NAME = 'system_notifications'
--   AND COLUMN_NAME = 'notification_type';

-- Expected:
-- CHARACTER_MAXIMUM_LENGTH = 50 ✅
-- COLUMN_TYPE = VARCHAR(50) ✅




-- ឥឡូវ UPDATE គួរដំណើរការ!
-- UPDATE system_notifications
-- SET notification_type = 'login_alert'
-- WHERE (notification_type = '' OR notification_type IS NULL)
--   AND title LIKE '%Login Alert%';

-- -- ពិនិត្យ
-- SELECT 
--   id,
--   notification_type,
--   CHAR_LENGTH(notification_type) as length,
--   title
-- FROM system_notifications
-- WHERE title LIKE '%Login Alert%'
-- ORDER BY id DESC
-- LIMIT 5;

-- Expected:
-- notification_type = 'login_alert' ✅
-- length = 11 ✅ (not 0!)




















-- ============================================
-- LOCATION DELIVERY SYSTEM - DATABASE SCHEMA
-- ============================================

-- 1. Customer Locations Table
-- CREATE TABLE IF NOT EXISTS `customer_locations` (
--   `id` INT PRIMARY KEY AUTO_INCREMENT,
--   `customer_id` INT NOT NULL,
--   `location_name` VARCHAR(255) NOT NULL,
--   `address` TEXT,
--   `latitude` DECIMAL(10, 8) NULL,
--   `longitude` DECIMAL(11, 8) NULL,
--   `default_price_adjustment` DECIMAL(10, 2) DEFAULT 0.00,
--   `is_default` TINYINT(1) DEFAULT 0,
--   `status` TINYINT(1) DEFAULT 1,
--   `notes` TEXT,
--   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   `created_by` INT,
--   FOREIGN KEY (`customer_id`) REFERENCES `customer`(`id`) ON DELETE CASCADE,
--   INDEX idx_customer_id (`customer_id`),
--   INDEX idx_status (`status`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Trucks/Vehicles Table
-- CREATE TABLE IF NOT EXISTS `trucks` (
--   `id` INT PRIMARY KEY AUTO_INCREMENT,
--   `plate_number` VARCHAR(50) NOT NULL UNIQUE,
--   `truck_type` ENUM('small', 'medium', 'large', 'tanker') DEFAULT 'medium',
--   `capacity_liters` DECIMAL(10, 2),
--   `driver_name` VARCHAR(255),
--   `driver_phone` VARCHAR(20),
--   `status` ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
--   `notes` TEXT,
--   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   `created_by` INT,
--   INDEX idx_plate_number (`plate_number`),
--   INDEX idx_status (`status`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Add location_id to orders table
-- ALTER TABLE `order` 
-- ADD COLUMN `location_id` INT NULL AFTER `customer_id`,
-- ADD COLUMN `truck_id` INT NULL AFTER `location_id`,
-- ADD COLUMN `delivery_status` ENUM('pending', 'in_transit', 'delivered', 'cancelled') DEFAULT 'pending',
-- ADD COLUMN `actual_delivery_date` DATETIME NULL,
-- ADD INDEX idx_location_id (`location_id`),
-- ADD INDEX idx_truck_id (`truck_id`),
-- ADD INDEX idx_delivery_status (`delivery_status`);

-- -- 4. Add location_id to delivery_note table
-- ALTER TABLE `delivery_note` 
-- ADD COLUMN `location_id` INT NULL AFTER `customer_id`,
-- ADD COLUMN `truck_id` INT NULL AFTER `location_id`,
-- ADD INDEX idx_location_id (`location_id`),
-- ADD INDEX idx_truck_id (`truck_id`);

-- 5. Delivery Tracking Table
-- CREATE TABLE IF NOT EXISTS `delivery_tracking` (
--   `id` INT PRIMARY KEY AUTO_INCREMENT,
--   `order_id` INT NOT NULL,
--   `delivery_note_id` INT NULL,
--   `truck_id` INT,
--   `location_id` INT,
--   `status` ENUM('preparing', 'loaded', 'in_transit', 'arrived', 'delivered', 'returned') NOT NULL,
--   `latitude` DECIMAL(10, 8) NULL,
--   `longitude` DECIMAL(11, 8) NULL,
--   `notes` TEXT,
--   `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   `created_by` INT,
--   FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON DELETE CASCADE,
--   FOREIGN KEY (`delivery_note_id`) REFERENCES `delivery_note`(`id`) ON DELETE SET NULL,
--   FOREIGN KEY (`truck_id`) REFERENCES `trucks`(`id`) ON DELETE SET NULL,
--   FOREIGN KEY (`location_id`) REFERENCES `customer_locations`(`id`) ON DELETE SET NULL,
--   INDEX idx_order_id (`order_id`),
--   INDEX idx_status (`status`),
--   INDEX idx_timestamp (`timestamp`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Driver Assignments Table
-- CREATE TABLE IF NOT EXISTS `driver_assignments` (
--   `id` INT PRIMARY KEY AUTO_INCREMENT,
--   `truck_id` INT NOT NULL,
--   `order_id` INT NOT NULL,
--   `driver_name` VARCHAR(255),
--   `driver_phone` VARCHAR(20),
--   `assigned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   `started_at` TIMESTAMP NULL,
--   `completed_at` TIMESTAMP NULL,
--   `status` ENUM('assigned', 'started', 'completed', 'cancelled') DEFAULT 'assigned',
--   `notes` TEXT,
--   FOREIGN KEY (`truck_id`) REFERENCES `trucks`(`id`) ON DELETE CASCADE,
--   FOREIGN KEY (`order_id`) REFERENCES `order`(`id`) ON DELETE CASCADE,
--   INDEX idx_truck_id (`truck_id`),
--   INDEX idx_order_id (`order_id`),
--   INDEX idx_status (`status`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Create views for easy querying
-- CREATE OR REPLACE VIEW `v_order_delivery_details` AS
-- SELECT 
--   o.id as order_id,
--   o.order_no,
--   o.customer_id,
--   c.name as customer_name,
--   c.tel as customer_tel,
--   o.location_id,
--   cl.location_name,
--   cl.address as location_address,
--   cl.latitude,
--   cl.longitude,
--   o.truck_id,
--   t.plate_number,
--   t.driver_name,
--   t.driver_phone,
--   o.delivery_status,
--   o.order_date,
--   o.delivery_date,
--   o.actual_delivery_date,
--   o.total_amount
-- FROM `order` o
-- LEFT JOIN customer c ON o.customer_id = c.id
-- LEFT JOIN customer_locations cl ON o.location_id = cl.id
-- LEFT JOIN trucks t ON o.truck_id = t.id;

-- 8. Insert sample data for testing
-- Sample trucks
-- INSERT INTO `trucks` (`plate_number`, `truck_type`, `capacity_liters`, `driver_name`, `driver_phone`, `status`, `created_by`)
-- VALUES 
--   ('PP-1234', 'tanker', 10000.00, 'Sok Dara', '012345678', 'active', 1),
--   ('PP-5678', 'tanker', 15000.00, 'Chan Vanna', '098765432', 'active', 1),
--   ('KH-9012', 'medium', 5000.00, 'Kim Srey', '077123456', 'active', 1);

-- Note: Sample customer locations will be added through the application UI


-- Drop view ចាស់
-- DROP VIEW IF EXISTS `v_delivery_tracking_full`;

-- Create view ថ្មី ដោយប្រើ delivery_number ជំនួស delivery_note_no
-- CREATE OR REPLACE VIEW `v_delivery_tracking_full` AS
-- SELECT 
--   dt.id,
--   dt.order_id,
--   o.order_no,
--   dt.delivery_note_id,
--   dn.delivery_number,  -- ✅ ប្រើ delivery_number ជំនួស delivery_note_no
--   dt.truck_id,
--   t.plate_number,
--   t.driver_name as truck_driver,
--   t.driver_phone as truck_driver_phone,
--   dt.location_id,
--   cl.location_name,
--   cl.address,
--   dt.status,
--   dt.latitude,
--   dt.longitude,
--   dt.distance_from_previous_km,
--   dt.estimated_time_arrival,
--   dt.notes,
--   dt.timestamp,
--   dt.created_by,
--   u.name as created_by_name
-- FROM delivery_tracking dt
-- LEFT JOIN `order` o ON dt.order_id = o.id
-- LEFT JOIN delivery_note dn ON dt.delivery_note_id = dn.id
-- LEFT JOIN trucks t ON dt.truck_id = t.id
-- LEFT JOIN customer_locations cl ON dt.location_id = cl.id
-- LEFT JOIN `user` u ON dt.created_by = u.id
-- ORDER BY dt.timestamp DESC;





-- -- បន្ថែម columns ដែលបាត់ (បើចាំបាច់)
-- ALTER TABLE `delivery_note`
-- -- ប្រសិនបើចង់បន្ថែម delivery_note_no (optional)
-- -- ADD COLUMN `delivery_note_no` VARCHAR(50) NULL AFTER `delivery_number`,
-- ADD COLUMN `driver_id` INT NULL AFTER `driver_name`,
-- ADD COLUMN `actual_delivery_time` DATETIME NULL AFTER `delivery_date`,
-- ADD COLUMN `delivery_status` ENUM('pending', 'in_transit', 'delivered', 'cancelled') DEFAULT 'pending' AFTER `status`,
-- ADD COLUMN `signature_url` VARCHAR(500) NULL AFTER `note`,
-- ADD COLUMN `verified_by` INT NULL AFTER `updated_by`,
-- ADD COLUMN `verified_at` TIMESTAMP NULL AFTER `verified_by`,
-- ADD INDEX idx_delivery_status (`delivery_status`),
-- ADD INDEX idx_delivery_date (`delivery_date`);

-- -- បន្ថែម foreign keys
-- ALTER TABLE `delivery_note`
-- ADD FOREIGN KEY (`driver_id`) REFERENCES `user`(`id`) ON DELETE SET NULL,
-- ADD FOREIGN KEY (`verified_by`) REFERENCES `user`(`id`) ON DELETE SET NULL;




-- -- ធ្វើសមកាលកម្ម data រវាង delivery_note និង trucks
-- UPDATE delivery_note dn
-- LEFT JOIN trucks t ON dn.vehicle_number = t.plate_number
-- SET 
--   dn.truck_id = t.id,
--   dn.driver_name = COALESCE(dn.driver_name, t.driver_name),
--   dn.driver_phone = COALESCE(dn.driver_phone, t.driver_phone)
-- WHERE dn.truck_id IS NULL AND t.id IS NOT NULL;

-- -- ឬ ប្រសិនបើចង់ធ្វើ update ពី trucks ទៅ delivery_note
-- UPDATE delivery_note dn
-- INNER JOIN trucks t ON dn.truck_id = t.id
-- SET 
--   dn.vehicle_number = t.plate_number,
--   dn.driver_name = t.driver_name,
--   dn.driver_phone = t.driver_phone
-- WHERE dn.vehicle_number IS NULL OR dn.driver_name IS NULL;



-- CREATE TABLE IF NOT EXISTS `drivers` (
--   `id` INT PRIMARY KEY AUTO_INCREMENT,
--   `user_id` INT NOT NULL,
--   `name` VARCHAR(255) NOT NULL,
--   `phone` VARCHAR(20),
--   `license_number` VARCHAR(100),
--   `license_type` VARCHAR(50),
--   `status` ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
--   `current_location_lat` DECIMAL(10, 8) NULL,
--   `current_location_lng` DECIMAL(11, 8) NULL,
--   `last_updated` DATETIME NULL,
--   `notes` TEXT,
--   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   `created_by` INT,
--   FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE CASCADE,
--   FOREIGN KEY (`created_by`) REFERENCES `user`(`id`) ON DELETE SET NULL,
--   INDEX idx_user_id (`user_id`),
--   INDEX idx_status (`status`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



-- បន្ថែម column driver_id
-- ALTER TABLE delivery_tracking 
-- ADD COLUMN driver_id INT NULL AFTER order_id,
-- ADD FOREIGN KEY (driver_id) REFERENCES user(id) ON DELETE SET NULL,
-- ADD INDEX idx_driver_id (driver_id);

-- ឬ បើចង់ប្រើ created_by ជាកន្លែង driver
-- UPDATE delivery_tracking SET driver_id = created_by WHERE driver_id IS NULL;


-- ALTER TABLE `order`
-- -- Delivery tracking columns
-- ADD COLUMN `actual_delivery_time` DATETIME NULL AFTER `delivery_date`,
-- ADD INDEX idx_actual_delivery_time (`actual_delivery_time`)





-- CREATE TABLE IF NOT EXISTS driver_sessions (
--   id INT PRIMARY KEY AUTO_INCREMENT,
--   user_id INT NOT NULL,
--   truck_id INT NULL,
--   login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
--   logout_time DATETIME NULL,
--   last_location_lat DECIMAL(10, 8) NULL,
--   last_location_lng DECIMAL(11, 8) NULL,
--   last_location_update DATETIME NULL,
--   session_status ENUM('active', 'ended') DEFAULT 'active',
--   FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
--   FOREIGN KEY (truck_id) REFERENCES trucks(id) ON DELETE SET NULL,
--   INDEX idx_user_session (user_id, session_status),
--   INDEX idx_truck_session (truck_id, session_status)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- CREATE TABLE IF NOT EXISTS delivery_notes (
--   id INT PRIMARY KEY AUTO_INCREMENT,
--   order_id INT NOT NULL,
--   note_type ENUM('general', 'customer_request', 'delivery_instruction', 'internal') DEFAULT 'general',
--   note_text TEXT NOT NULL,
--   created_by INT NULL,
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
--   is_visible_to_customer BOOLEAN DEFAULT FALSE,
--   FOREIGN KEY (order_id) REFERENCES `order`(id) ON DELETE CASCADE,
--   FOREIGN KEY (created_by) REFERENCES user(id) ON DELETE SET NULL,
--   INDEX idx_order_note (order_id),
--   INDEX idx_created_at (created_at)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



-- Fix ឡានដែលមាន status = NULL
-- UPDATE trucks 
-- SET status = 'active',
--     updated_at = NOW()
-- WHERE status IS NULL OR status = '';

-- -- ពិនិត្យ
-- SELECT 
--   id, plate_number, status,
--   CASE WHEN status IS NULL THEN '❌ NULL' ELSE '✅ OK' END as check_status
-- FROM trucks;


-- ALTER TABLE trucks 
-- MODIFY COLUMN status ENUM(
--   'active', 
--   'on_delivery', 
--   'maintenance', 
--   'inactive',
--   'reserved'
-- ) DEFAULT 'active';







-- CREATE TABLE attendance (
--   id INT PRIMARY KEY AUTO_INCREMENT,
--   user_id INT NOT NULL,
--   date DATE NOT NULL,
--   check_in_time DATETIME,
--   check_out_time DATETIME NULL,
--   working_hours DECIMAL(4,2) NULL,
--   status ENUM('present', 'absent', 'late', 'on-time') DEFAULT 'present',
--   ip_address VARCHAR(45),
--   location VARCHAR(255) NULL,
--   notes TEXT NULL,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
--   UNIQUE KEY unique_user_date (user_id, date),
--   INDEX idx_date (date),
--   INDEX idx_user_id (user_id),
--   INDEX idx_status (status)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;





-- CREATE TABLE allowed_ips (
--   id INT PRIMARY KEY AUTO_INCREMENT,
--   ip_address VARCHAR(45) NOT NULL UNIQUE,
--   description VARCHAR(255),
--   is_active BOOLEAN DEFAULT TRUE,
--   created_by INT,
--   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--   FOREIGN KEY (created_by) REFERENCES user(id) ON DELETE SET NULL,
--   INDEX idx_ip (ip_address),
--   INDEX idx_active (is_active)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Run in MySQL
-- INSERT INTO allowed_ips (ip_address, description, is_active) 
-- VALUES ('119.13.62.246', 'My Home/Office Connection', TRUE),
--        ('192.168.1.100', 'Office Network', TRUE),
--        ('10.0.0.1', 'VPN Connection', TRUE);

-- បន្ថែម audit columns
-- ALTER TABLE attendance
--   ADD COLUMN create_by VARCHAR(100) AFTER location,
--   ADD COLUMN update_by VARCHAR(100) AFTER notes;

-- -- ✅ Create supplier table
-- CREATE TABLE IF NOT EXISTS `supplier` (
--   `id` INT AUTO_INCREMENT PRIMARY KEY,
--   `name` VARCHAR(255) NOT NULL COMMENT 'Supplier name',
--   `code` VARCHAR(50) NOT NULL COMMENT 'Supplier code',
--   `tel` VARCHAR(50) NOT NULL COMMENT 'Telephone number',
--   `email` VARCHAR(255) NOT NULL COMMENT 'Email address',
--   `address` TEXT NOT NULL COMMENT 'Physical address',
--   `website` VARCHAR(255) NULL COMMENT 'Website URL',
--   `note` TEXT NULL COMMENT 'Additional notes',
--   `fuel_types` VARCHAR(255) NULL COMMENT 'Fuel types supplied by supplier',
--   `credit_terms` VARCHAR(50) NULL COMMENT 'Credit terms period',
--   `contact_person` VARCHAR(255) NULL COMMENT 'Primary contact person',
--   `company_license` VARCHAR(100) NULL COMMENT 'Business license number',
--   `tax_id` VARCHAR(50) NULL COMMENT 'Tax identification number',
--   `bank_account` VARCHAR(100) NULL COMMENT 'Bank account number',
--   `payment_method` ENUM('cash', 'check', 'transfer', 'online') NULL COMMENT 'Preferred payment method',
--   `is_active` TINYINT(1) DEFAULT 1 COMMENT '1=active, 0=inactive',
--   `user_id` INT NOT NULL COMMENT 'User who created the supplier',
--   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Creation timestamp',
--   `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
  
--   INDEX `idx_name` (`name`),
--   INDEX `idx_code` (`code`),
--   INDEX `idx_fuel_types` (`fuel_types`),
--   INDEX `idx_credit_terms` (`credit_terms`),
--   INDEX `idx_contact_person` (`contact_person`),
--   INDEX `idx_company_license` (`company_license`),
--   INDEX `idx_tax_id` (`tax_id`),
--   INDEX `idx_bank_account` (`bank_account`),
--   INDEX `idx_payment_method` (`payment_method`),
--   INDEX `idx_is_active` (`is_active`),
--   INDEX `idx_user_id` (`user_id`),
--   INDEX `idx_created_at` (`created_at`),
  
--   FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
-- COMMENT='Suppliers table for managing vendor information';

-- ឬប្តូរឈ្មោះ columns ដែលមានស្រាប់
-- ALTER TABLE attendance
--   CHANGE COLUMN created_at create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   CHANGE COLUMN updated_at update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;


  -- បន្ថែម columns នៅ employee table
-- ALTER TABLE employee
--   ADD COLUMN user_id INT DEFAULT NULL COMMENT 'Link to user table if has account',
--   ADD COLUMN has_account TINYINT(1) DEFAULT 0 COMMENT '0=No login, 1=Has login',
--   ADD CONSTRAINT fk_employee_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE SET NULL;

  -- បន្ថែម employee_id reference
-- ALTER TABLE user
--   ADD COLUMN employee_id INT DEFAULT NULL COMMENT 'Link to employee if is staff',
--   ADD CONSTRAINT fk_user_employee FOREIGN KEY (employee_id) REFERENCES employee(id) ON DELETE SET NULL;



--   ALTER TABLE employee
-- ADD COLUMN is_active TINYINT(1) DEFAULT 1
-- COMMENT '1=active, 0=inactive (resigned, suspended)'
-- AFTER has_account;


-- ALTER TABLE employee
-- MODIFY COLUMN work_type ENUM('full-time','part-time')
--   DEFAULT 'full-time'
--   COMMENT 'Employment type',

-- MODIFY COLUMN work_start_time TIME
--   DEFAULT '07:00:00'
--   COMMENT 'Scheduled work start time',

-- MODIFY COLUMN work_end_time TIME
--   DEFAULT '17:00:00'
--   COMMENT 'Scheduled work end time',

-- MODIFY COLUMN grace_period_minutes INT
--   DEFAULT 30
--   COMMENT 'Minutes late allowed before penalty',

-- MODIFY COLUMN working_days JSON
--   COMMENT 'Days of week employee works',

-- MODIFY COLUMN schedule_notes TEXT
--   COMMENT 'Special schedule notes';




--   ALTER TABLE attendance
-- MODIFY COLUMN status ENUM(
--   'on-time',
--   'late',
--   'absent',
--   'present',
--   'late-grace',
--   'late-penalty'
-- ) DEFAULT 'on-time'
-- COMMENT 'Attendance status';



-- CREATE OR REPLACE VIEW v_employee_schedule AS
-- SELECT 
--   e.id,
--   e.code,
--   e.name,
--   e.position,
--   e.work_type,
--   TIME_FORMAT(e.work_start_time, '%h:%i %p') AS start_time_12h,
--   TIME_FORMAT(e.work_end_time, '%h:%i %p') AS end_time_12h,
--   e.work_start_time,
--   e.work_end_time,
--   e.grace_period_minutes,
--   e.working_days,
--   e.schedule_notes,
--   TIMESTAMPDIFF(
--     HOUR,
--     e.work_start_time,
--     e.work_end_time
--   ) AS daily_hours
-- FROM employee e
-- WHERE e.is_active = 1
-- ORDER BY e.work_start_time;





-- CREATE OR REPLACE VIEW v_late_statistics AS
-- SELECT 
--   e.id AS employee_id,
--   e.name,
--   e.position,
--   e.work_type,
--   COUNT(a.id) AS total_days,
--   SUM(a.status = 'on-time') AS on_time_days,
--   SUM(a.status LIKE 'late%') AS late_days,
--   SUM(a.status = 'late-grace') AS late_grace_days,
--   SUM(a.status = 'late-penalty') AS late_penalty_days,
--   AVG(a.late_minutes) AS avg_late_minutes,
--   MAX(a.late_minutes) AS max_late_minutes,
--   SUM(a.late_minutes) AS total_late_minutes
-- FROM employee e
-- LEFT JOIN attendance a
--   ON e.id = a.user_id
--   AND a.date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
-- WHERE e.is_active = 1
-- GROUP BY e.id;



-- ALTER TABLE employee
-- ADD COLUMN updated_at TIMESTAMP NULL
-- DEFAULT CURRENT_TIMESTAMP
-- ON UPDATE CURRENT_TIMESTAMP
-- COMMENT 'Last updated time'
-- AFTER create_at;


-- ALTER TABLE employee
-- ADD COLUMN IF NOT EXISTS monthly_salary DECIMAL(10,2) DEFAULT 0 COMMENT 'Monthly base salary',
-- ADD COLUMN IF NOT EXISTS late_deduction_per_minute DECIMAL(5,2) DEFAULT 0.50 COMMENT 'Deduction amount per minute late (after grace period)',
-- ADD COLUMN IF NOT EXISTS absent_deduction_per_day DECIMAL(10,2) DEFAULT 0 COMMENT 'Deduction amount per day absent',
-- ADD COLUMN IF NOT EXISTS expected_working_days INT DEFAULT 26 COMMENT 'Expected working days per month';

-- UPDATE employee e
-- INNER JOIN user u ON u.email = e.email
-- SET e.user_id = u.id
-- WHERE e.user_id IS NULL;


-- CREATE TABLE notification_log (
--     id INT AUTO_INCREMENT PRIMARY KEY,
    
--     event_type VARCHAR(100) NOT NULL,
--     branch_name VARCHAR(150) NOT NULL,
--     message TEXT NOT NULL,
    
--     recipients_count INT NOT NULL DEFAULT 0,
--     success_count INT NOT NULL DEFAULT 0,
    
--     sent_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
--     status ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',

--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- );

-- CREATE INDEX idx_notification_event ON notification_log(event_type);
-- CREATE INDEX idx_notification_status ON notification_log(status);
-- CREATE INDEX idx_notification_sent_at ON notification_log(sent_at);


-- CREATE TABLE IF NOT EXISTS `purchase` (
--   `id` INT AUTO_INCREMENT PRIMARY KEY,
--   `supplier_id` INT NOT NULL,
--   `order_no` VARCHAR(50) NOT NULL UNIQUE,
--   `order_date` DATE NOT NULL,
--   `expected_delivery_date` DATE DEFAULT NULL,
--   `status` ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
--   `payment_terms` VARCHAR(50) DEFAULT NULL,
--   `items` JSON NOT NULL COMMENT 'Array of order items with product details',
--   `total_amount` DECIMAL(15,2) DEFAULT 0.00,
--   `notes` TEXT DEFAULT NULL,
--   `user_id` INT NOT NULL COMMENT 'User who created this purchase order',
--   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--   `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
--   -- Foreign keys
--   CONSTRAINT `fk_purchase_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `supplier` (`id`) ON DELETE RESTRICT,
--   CONSTRAINT `fk_purchase_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE RESTRICT,
  
--   -- Indexes for better performance
--   INDEX `idx_order_no` (`order_no`),
--   INDEX `idx_supplier_id` (`supplier_id`),
--   INDEX `idx_status` (`status`),
--   INDEX `idx_order_date` (`order_date`),
--   INDEX `idx_user_id` (`user_id`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CREATE TABLE `inventory_transaction` (
--   `id` INT AUTO_INCREMENT PRIMARY KEY,
--   `product_id` INT DEFAULT NULL,
--   `purchase_id` INT DEFAULT NULL,
--   `transaction_type` ENUM('PURCHASE_IN', 'SALE_OUT', 'ADJUSTMENT', 'RETURN') NOT NULL,
--   `quantity` DECIMAL(10,2) NOT NULL,
--   `unit_price` DECIMAL(10,2) DEFAULT 0.00,
--   `reference_no` VARCHAR(100) DEFAULT NULL,
--   `notes` TEXT DEFAULT NULL,
--   `user_id` INT NOT NULL,
--   `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
--   -- Foreign keys with proper handling
--   CONSTRAINT `fk_inventory_product` 
--     FOREIGN KEY (`product_id`) 
--     REFERENCES `product` (`id`) 
--     ON DELETE SET NULL 
--     ON UPDATE CASCADE,
    
--   CONSTRAINT `fk_inventory_purchase` 
--     FOREIGN KEY (`purchase_id`) 
--     REFERENCES `purchase` (`id`) 
--     ON DELETE SET NULL 
--     ON UPDATE CASCADE,
    
--   CONSTRAINT `fk_inventory_user` 
--     FOREIGN KEY (`user_id`) 
--     REFERENCES `user` (`id`) 
--     ON DELETE RESTRICT 
--     ON UPDATE CASCADE,
  
--   -- Indexes for better performance
--   INDEX `idx_product_id` (`product_id`),
--   INDEX `idx_purchase_id` (`purchase_id`),
--   INDEX `idx_transaction_type` (`transaction_type`),
--   INDEX `idx_created_at` (`created_at`),
--   INDEX `idx_user_id` (`user_id`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- ✅ ADD COST PRICE AND SELLING PRICE TO PRODUCT TABLE

-- ========================================
-- STEP 1: Check current product table structure
-- ========================================
-- DESCRIBE product;

-- ========================================
-- STEP 2: Add new columns if they don't exist
-- ========================================

-- Add purchase_price (តម្លៃដើម - cost from supplier)
-- ALTER TABLE product 
-- ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10,2) DEFAULT 0.00 COMMENT 'តម្លៃដើមទិញចូល (Cost Price from Supplier)' 
-- AFTER unit_price;

-- Add selling_price (តម្លៃលក់ចេញ - price to customer)  
-- ALTER TABLE product 
-- ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10,2) DEFAULT 0.00 COMMENT 'តម្លៃលក់ចេញ (Selling Price to Customer)' 
-- AFTER purchase_price;

-- Add profit_margin (ភាគរយប្រាក់ចំណេញ)
-- ALTER TABLE product 
-- ADD COLUMN IF NOT EXISTS profit_margin DECIMAL(5,2) DEFAULT 0.00 COMMENT 'ភាគរយប្រាក់ចំណេញ (Profit Margin %)' 
-- AFTER selling_price;

-- Add total_cost_value (តម្លៃស្តុកសរុប = qty × purchase_price)
-- ALTER TABLE product 
-- ADD COLUMN IF NOT EXISTS total_cost_value DECIMAL(15,2) GENERATED ALWAYS AS (qty * purchase_price) STORED COMMENT 'តម្លៃស្តុកសរុប (Total Stock Cost Value)';

-- Add total_selling_value (តម្លៃលក់សរុប = qty × selling_price)
-- ALTER TABLE product 
-- ADD COLUMN IF NOT EXISTS total_selling_value DECIMAL(15,2) GENERATED ALWAYS AS (qty * selling_price) STORED COMMENT 'តម្លៃលក់សរុប (Total Stock Selling Value)';

-- -- ========================================
-- STEP 3: Update existing products with sample prices
-- ========================================

-- Update products: set purchase_price and calculate selling_price with 20% markup
-- UPDATE product 
-- SET 
--     purchase_price = unit_price,  -- Use unit_price as purchase_price
--     selling_price = unit_price * 1.20,  -- 20% markup
--     profit_margin = 20.00
-- WHERE purchase_price = 0 OR purchase_price IS NULL;

-- ========================================
-- STEP 4: Create trigger to auto-calculate profit_margin
-- ========================================

-- DELIMITER $$

-- DROP TRIGGER IF EXISTS before_product_update_calculate_margin$$

-- CREATE TRIGGER before_product_update_calculate_margin
-- BEFORE UPDATE ON product
-- FOR EACH ROW
-- BEGIN
--     -- Auto-calculate profit_margin when prices change
--     IF NEW.purchase_price > 0 THEN
--         SET NEW.profit_margin = ((NEW.selling_price - NEW.purchase_price) / NEW.purchase_price) * 100;
--     END IF;
-- END$$

-- DROP TRIGGER IF EXISTS before_product_insert_calculate_margin$$

-- CREATE TRIGGER before_product_insert_calculate_margin
-- BEFORE INSERT ON product
-- FOR EACH ROW
-- BEGIN
--     -- Auto-calculate profit_margin on insert
--     IF NEW.purchase_price > 0 THEN
--         SET NEW.profit_margin = ((NEW.selling_price - NEW.purchase_price) / NEW.purchase_price) * 100;
--     END IF;
-- END$$

-- DELIMITER ;

-- ========================================
-- STEP 5: Verify the changes
-- ========================================

-- SELECT 
--     id,
--     name,
--     qty,
--     purchase_price AS 'តម្លៃដើម (Cost)',
--     selling_price AS 'តម្លៃលក់ (Selling)',
--     profit_margin AS 'ចំណេញ %',
--     total_cost_value AS 'តម្លៃស្តុកសរុប (Total Cost)',
--     total_selling_value AS 'តម្លៃលក់សរុប (Total Selling)',
--     (total_selling_value - total_cost_value) AS 'ប្រាក់ចំណេញសរុប (Total Profit)'
-- FROM product
-- ORDER BY id
-- LIMIT 10;

-- ========================================
-- STEP 6: Get summary statistics
-- ========================================

-- SELECT 
--     COUNT(*) as total_products,
--     SUM(qty) as total_quantity,
--     SUM(total_cost_value) as total_stock_cost,
--     SUM(total_selling_value) as potential_revenue,
--     SUM(total_selling_value - total_cost_value) as potential_profit,
--     AVG(profit_margin) as avg_profit_margin
-- FROM product
-- WHERE qty > 0;

-- ========================================
-- 🎯 EXPLANATION:
-- ========================================
-- purchase_price: តម្លៃដើមដែលយើងទិញពីក្រុមហ៊ុនផ្គត់ផ្គង់ (Cost from supplier)
-- selling_price: តម្លៃដែលយើងលក់ទៅអតិថិជន (Price to customers)
-- profit_margin: ភាគរយប្រាក់ចំណេញ (Profit percentage)
-- total_cost_value: តម្លៃស្តុកសរុប (Total value of stock at cost price)
-- total_selling_value: តម្លៃលក់សរុប (Total value if we sell all stock)
--
-- Formula:
-- profit_margin = ((selling_price - purchase_price) / purchase_price) × 100
-- total_cost_value = qty × purchase_price
-- total_selling_value = qty × selling_price
-- ========================================

-- ALTER TABLE inventory_transaction 
-- ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10,2) DEFAULT 0.00 COMMENT 'តម្លៃលក់ចេញ (Selling Price to Customer)' 
-- AFTER unit_price;


-- ALTER TABLE `inventory_transaction` 
-- ADD COLUMN `actual_price` DECIMAL(10,2) NULL DEFAULT NULL 
-- COMMENT 'Conversion factor from category (e.g., 1190 for Liters to Tons)'
-- AFTER `selling_price`;


-- ALTER TABLE inventory_transaction
-- ADD CONSTRAINT fk_it_supplier
-- FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE SET NULL;



-- ALTER TABLE product 
-- ADD COLUMN supplier_id INT NULL,
-- ADD COLUMN supplier_name VARCHAR(255) NULL;

-- ALTER TABLE inventory_transaction 
-- ADD COLUMN supplier_id INT NULL,
-- ADD COLUMN supplier_name VARCHAR(255) NULL;

-- ALTER TABLE fakeinvoice 
-- ADD COLUMN manual_customer_name VARCHAR(255) NULL AFTER customer_id,
-- ADD COLUMN manual_customer_tel VARCHAR(50) NULL AFTER manual_customer_name,
-- ADD COLUMN manual_customer_address TEXT NULL AFTER manual_customer_tel;
-- ADD COLUMN product_id  INT NULL AFTER manual_customer_tel;


-- ALTER TABLE fakeinvoice_detail 
-- ADD COLUMN product_id  INT NULL AFTER category_id;



-- ✅ COMPLETE DATABASE SCHEMA FOR CLOSING/SETTLEMENT SYSTEM

-- ========================================
-- 1. SHIFT CLOSING TABLE (បិទវេន)
-- ========================================

-- CREATE TABLE IF NOT EXISTS `shift_closing` (
--   `id` INT(11) NOT NULL AUTO_INCREMENT,
--   `shift_id` VARCHAR(50) NOT NULL COMMENT 'Shift identifier (e.g., SHIFT-2026-01-11-MORNING)',
--   `branch_name` VARCHAR(255) NULL COMMENT 'Branch name',
--   `shift_date` DATE NOT NULL COMMENT 'Date of shift',
--   `shift_name` ENUM('morning', 'afternoon', 'evening', 'night') NOT NULL COMMENT 'Shift period',
--   `start_time` DATETIME NOT NULL COMMENT 'Shift start time',
--   `end_time` DATETIME NULL COMMENT 'Shift end time',
  
--   -- Staff Information
--   `staff_id` INT(11) NULL COMMENT 'Staff member ID',
--   `staff_name` VARCHAR(255) NULL COMMENT 'Staff member name',
  
--   -- Opening Readings (តម្លៃចាប់ផ្តើម)
--   `opening_cash` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Opening cash in drawer',
--   `opening_stock_json` TEXT NULL COMMENT 'JSON: Opening stock by product {product_id: qty}',
  
--   -- Sales Summary (សង្ខេបការលក់)
--   `total_sales_amount` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Total sales in USD (converted)',
--   `total_sales_liters` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Total liters sold',
--   `total_orders` INT(11) DEFAULT 0 COMMENT 'Number of orders',
  
--   -- Payment Breakdown (ប្រាក់ទទួលបាន)
--   `cash_received` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Cash payments received',
--   `card_received` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Card payments received',
--   `transfer_received` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Bank transfer received',
--   `credit_sales` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Credit sales (unpaid)',
  
--   -- Closing Readings (តម្លៃបិទ)
--   `closing_cash_expected` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Expected cash (opening + received)',
--   `closing_cash_actual` DECIMAL(15,2) NULL COMMENT 'Actual cash counted',
--   `cash_variance` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Cash difference (actual - expected)',
--   `closing_stock_json` TEXT NULL COMMENT 'JSON: Closing stock by product',
  
--   -- Stock Variance (ប្រេងបាត់បង់)
--   `stock_variance_json` TEXT NULL COMMENT 'JSON: Stock differences by product',
--   `total_stock_loss_liters` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Total stock lost (liters)',
--   `total_stock_loss_value` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Value of stock lost (USD)',
  
--   -- Expenses (ចំណាយក្នុងវេន)
--   `expenses_json` TEXT NULL COMMENT 'JSON: [{description, amount, category}]',
--   `total_expenses` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Total expenses in shift',
  
--   -- Status & Notes
--   `status` ENUM('open', 'pending_approval', 'approved', 'rejected') DEFAULT 'open',
--   `notes` TEXT NULL COMMENT 'Shift notes/remarks',
--   `issues_reported` TEXT NULL COMMENT 'Issues encountered during shift',
  
--   -- Approval
--   `approved_by` INT(11) NULL COMMENT 'Manager who approved',
--   `approved_at` DATETIME NULL COMMENT 'Approval timestamp',
  
--   -- Audit
--   `created_by` INT(11) NULL,
--   `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
--   `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
--   PRIMARY KEY (`id`),
--   UNIQUE KEY `unique_shift` (`shift_id`),
--   INDEX `idx_shift_date` (`shift_date`),
--   INDEX `idx_staff_id` (`staff_id`),
--   INDEX `idx_status` (`status`),
--   INDEX `idx_branch` (`branch_name`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -- ========================================
-- -- 2. DAILY CLOSING TABLE (បិទថ្ងៃ)
-- -- ========================================

-- CREATE TABLE IF NOT EXISTS `daily_closing` (
--   `id` INT(11) NOT NULL AUTO_INCREMENT,
--   `closing_id` VARCHAR(50) NOT NULL COMMENT 'Daily closing ID (e.g., DC-2026-01-11)',
--   `branch_name` VARCHAR(255) NULL,
--   `closing_date` DATE NOT NULL COMMENT 'Date being closed',
  
--   -- Summary from all shifts
--   `total_shifts` INT(11) DEFAULT 0 COMMENT 'Number of shifts in this day',
--   `shift_ids_json` TEXT NULL COMMENT 'JSON: [shift_id1, shift_id2, ...]',
  
--   -- Sales Summary (សង្ខេបការលក់ទាំងថ្ងៃ)
--   `total_sales_amount` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Total daily sales (USD)',
--   `total_sales_liters` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Total liters sold',
--   `total_orders` INT(11) DEFAULT 0 COMMENT 'Total orders',
  
--   -- Payment Summary
--   `total_cash` DECIMAL(15,2) DEFAULT 0.00,
--   `total_card` DECIMAL(15,2) DEFAULT 0.00,
--   `total_transfer` DECIMAL(15,2) DEFAULT 0.00,
--   `total_credit` DECIMAL(15,2) DEFAULT 0.00,
  
--   -- Stock Summary (ស្តុកប្រេង)
--   `opening_stock_json` TEXT NULL COMMENT 'Opening stock (from previous day)',
--   `closing_stock_json` TEXT NULL COMMENT 'Closing stock (physical count)',
--   `stock_variance_json` TEXT NULL COMMENT 'Stock differences',
--   `total_stock_loss_liters` DECIMAL(15,2) DEFAULT 0.00,
--   `total_stock_loss_value` DECIMAL(15,2) DEFAULT 0.00,
  
--   -- Expenses (ចំណាយទាំងថ្ងៃ)
--   `total_expenses` DECIMAL(15,2) DEFAULT 0.00,
--   `expenses_breakdown_json` TEXT NULL COMMENT 'Expenses by category',
  
--   -- Financial Summary (សង្ខេបហិរញ្ញវត្ថុ)
--   `gross_revenue` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Total revenue',
--   `total_costs` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'COGS + expenses + losses',
--   `net_profit` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Revenue - costs',
--   `profit_margin` DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Percentage',
  
--   -- Cash Variance (សាច់ប្រាក់ខុសគ្នា)
--   `cash_variance_total` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Sum of all shift variances',
--   `variance_explanation` TEXT NULL,
  
--   -- Status
--   `status` ENUM('draft', 'pending_review', 'approved', 'finalized') DEFAULT 'draft',
--   `notes` TEXT NULL,
  
--   -- Approval
--   `reviewed_by` INT(11) NULL COMMENT 'Supervisor who reviewed',
--   `reviewed_at` DATETIME NULL,
--   `approved_by` INT(11) NULL COMMENT 'Manager who approved',
--   `approved_at` DATETIME NULL,
  
--   -- Audit
--   `created_by` INT(11) NULL,
--   `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
--   `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
--   PRIMARY KEY (`id`),
--   UNIQUE KEY `unique_closing` (`closing_id`),
--   UNIQUE KEY `unique_date_branch` (`closing_date`, `branch_name`),
--   INDEX `idx_closing_date` (`closing_date`),
--   INDEX `idx_status` (`status`),
--   INDEX `idx_branch` (`branch_name`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -- ========================================
-- -- 3. STOCK RECONCILIATION TABLE (ផ្ទៀងផ្ទាត់ស្តុក)
-- -- ========================================

-- CREATE TABLE IF NOT EXISTS `stock_reconciliation` (
--   `id` INT(11) NOT NULL AUTO_INCREMENT,
--   `reconciliation_id` VARCHAR(50) NOT NULL,
--   `reconciliation_date` DATE NOT NULL,
--   `branch_name` VARCHAR(255) NULL,
--   `reconciliation_type` ENUM('shift', 'daily', 'weekly', 'monthly', 'adhoc') DEFAULT 'daily',
  
--   -- Reference
--   `reference_type` ENUM('shift_closing', 'daily_closing', 'manual') NOT NULL,
--   `reference_id` INT(11) NULL COMMENT 'ID of shift_closing or daily_closing',
  
--   -- Product Details
--   `product_id` INT(11) NOT NULL,
--   `product_name` VARCHAR(255) NULL,
--   `category_id` INT(11) NULL,
--   `category_name` VARCHAR(255) NULL,
  
--   -- Stock Figures (គិតជាលីត្រ)
--   `system_stock` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Stock according to system',
--   `physical_stock` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Physical count',
--   `variance` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Difference (physical - system)',
--   `variance_percentage` DECIMAL(5,2) DEFAULT 0.00,
  
--   -- Value (គិតជាប្រាក់)
--   `unit_cost` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Cost per liter',
--   `variance_value` DECIMAL(15,2) DEFAULT 0.00 COMMENT 'Value of variance',
  
--   -- Reasons
--   `variance_reason` ENUM('evaporation', 'theft', 'measurement_error', 'spillage', 'other') NULL,
--   `notes` TEXT NULL,
--   `action_taken` TEXT NULL COMMENT 'Actions taken to address variance',
  
--   -- Status
--   `status` ENUM('pending', 'investigated', 'resolved', 'written_off') DEFAULT 'pending',
--   `investigated_by` INT(11) NULL,
--   `investigated_at` DATETIME NULL,
  
--   -- Audit
--   `created_by` INT(11) NULL,
--   `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
--   `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
--   PRIMARY KEY (`id`),
--   UNIQUE KEY `unique_reconciliation` (`reconciliation_id`),
--   INDEX `idx_date` (`reconciliation_date`),
--   INDEX `idx_product` (`product_id`),
--   INDEX `idx_reference` (`reference_type`, `reference_id`),
--   INDEX `idx_status` (`status`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -- ========================================
-- -- 4. SHIFT EXPENSES TABLE (ចំណាយក្នុងវេន)
-- -- ========================================

-- CREATE TABLE IF NOT EXISTS `shift_expenses` (
--   `id` INT(11) NOT NULL AUTO_INCREMENT,
--   `shift_closing_id` INT(11) NULL COMMENT 'Reference to shift_closing',
--   `expense_date` DATE NOT NULL,
--   `branch_name` VARCHAR(255) NULL,
  
--   -- Expense Details
--   `category` ENUM('fuel', 'maintenance', 'utilities', 'supplies', 'wages', 'transport', 'other') NOT NULL,
--   `description` VARCHAR(500) NOT NULL,
--   `amount` DECIMAL(15,2) NOT NULL,
--   `payment_method` ENUM('cash', 'card', 'transfer', 'credit') DEFAULT 'cash',
  
--   -- Receipt/Documentation
--   `receipt_number` VARCHAR(100) NULL,
--   `receipt_image` VARCHAR(500) NULL COMMENT 'Path to receipt image',
  
--   -- Approval
--   `approved_by` INT(11) NULL,
--   `approved_at` DATETIME NULL,
--   `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  
--   -- Audit
--   `created_by` INT(11) NULL,
--   `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
--   PRIMARY KEY (`id`),
--   INDEX `idx_shift` (`shift_closing_id`),
--   INDEX `idx_date` (`expense_date`),
--   INDEX `idx_category` (`category`),
--   FOREIGN KEY (`shift_closing_id`) REFERENCES `shift_closing`(`id`) ON DELETE CASCADE
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -- ========================================
-- -- 5. CLOSING CHECKLIST TABLE (បញ្ជីពិនិត្យ)
-- -- ========================================

-- CREATE TABLE IF NOT EXISTS `closing_checklist` (
--   `id` INT(11) NOT NULL AUTO_INCREMENT,
--   `checklist_type` ENUM('shift', 'daily') NOT NULL,
--   `reference_id` INT(11) NOT NULL COMMENT 'shift_closing_id or daily_closing_id',
--   `checklist_date` DATETIME NOT NULL,
  
--   -- Checklist Items (JSON)
--   `checklist_items_json` TEXT NOT NULL COMMENT 'JSON: [{item, checked, notes, checked_by, checked_at}]',
  
--   -- Completion Status
--   `total_items` INT(11) DEFAULT 0,
--   `completed_items` INT(11) DEFAULT 0,
--   `completion_percentage` DECIMAL(5,2) DEFAULT 0.00,
--   `all_completed` TINYINT(1) DEFAULT 0,
  
--   -- Staff
--   `completed_by` INT(11) NULL,
--   `completed_at` DATETIME NULL,
  
--   PRIMARY KEY (`id`),
--   INDEX `idx_type_ref` (`checklist_type`, `reference_id`),
--   INDEX `idx_date` (`checklist_date`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- SAMPLE DATA / DEFAULT CHECKLISTS
-- ========================================

-- Sample Shift Closing Checklist Template (stored in config or separate table)
/*
{
  "shift_checklist": [
    {"id": 1, "item": "ពិនិត្យក្បាលបូមទាំងអស់", "category": "equipment"},
    {"id": 2, "item": "រាប់សាច់ប្រាក់ក្នុងបន្ទប់កាន់លុយ", "category": "cash"},
    {"id": 3, "item": "ផ្ទៀងផ្ទាត់ស្តុកប្រេង (Physical count)", "category": "stock"},
    {"id": 4, "item": "បិទគណនីលក់ទាំងអស់", "category": "sales"},
    {"id": 5, "item": "ពិនិត្យ POS System", "category": "system"},
    {"id": 6, "item": "ធ្វើរបាយការណ៍បញ្ហាដែលជួបប្រទះ", "category": "issues"},
    {"id": 7, "item": "ដាក់ប្រាក់ចូល Safe", "category": "security"}
  ]
}
*/




-- Add updated_at column to pre_order_detail
-- ALTER TABLE `pre_order_detail` 
-- ADD COLUMN `updated_at` TIMESTAMP NULL DEFAULT NULL 
-- ON UPDATE CURRENT_TIMESTAMP;


-- ALTER TABLE `order` 
-- ADD COLUMN `pre_order_no` VARCHAR(50) DEFAULT NULL 
-- AFTER `order_no`;


-- ALTER TABLE `customer_debt` 
-- ADD COLUMN `pre_order_no` VARCHAR(50) DEFAULT NULL 
-- AFTER `order_id`;


-- ❌ Remove bad constraint
ALTER TABLE `telegram_config` 
DROP INDEX `unique_branch_config`;

-- ✅ Add correct constraint (only bot + chat)
ALTER TABLE `telegram_config` 
ADD UNIQUE KEY `unique_bot_chat` (`bot_token`, `chat_id`);


-- ✅✅✅ DATABASE SCHEMA UPDATE: Add event_types column ✅✅✅

-- Step 1: Add new column for event filtering
ALTER TABLE `telegram_config` 
ADD COLUMN `event_types` TEXT NULL COMMENT 'JSON array of event types this group should receive' 
AFTER `description`;

-- Step 2: Add some example data
UPDATE `telegram_config` 
SET `event_types` = '["new_customer", "customer_payment"]'
WHERE `config_name` = 'Customer Service Group';

UPDATE `telegram_config` 
SET `event_types` = '["purchase_created", "purchase_delivered"]'
WHERE `config_name` = 'Procurement Team';

UPDATE `telegram_config` 
SET `event_types` = '["order_created", "order_paid"]'
WHERE `config_name` = 'Sales Team';

UPDATE `telegram_config` 
SET `event_types` = '["low_stock_alert", "stock_received"]'
WHERE `config_name` = 'Warehouse Team';

-- Step 3: Super Admin receives ALL events (NULL = all events)
UPDATE `telegram_config` 
SET `event_types` = NULL
WHERE `config_type` = 'super_admin';

-- ✅ Expected Structure:
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Branch: ទីស្នាក់ការកណ្តាល
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. Customer Service Group
--    event_types: ["new_customer", "customer_payment", "customer_debt"]
-- 
-- 2. Sales Team Group
--    event_types: ["order_created", "order_paid", "order_cancelled"]
-- 
-- 3. Procurement Team Group
--    event_types: ["purchase_created", "purchase_delivered", "low_stock_alert"]
-- 
-- 4. Finance Team Group
--    event_types: ["payment_received", "expense_created", "daily_report"]
-- 
-- 5. Manager Group (receives all from this branch)
--    event_types: NULL (or ["*"])
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Step 4: Show updated structure
SELECT 
    id,
    config_name,
    branch_name,
    event_types,
    is_active
FROM telegram_config
ORDER BY branch_name, config_name;