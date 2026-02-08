-- ==========================================================
-- RAILWAY DATABASE FIX: Missing Tables and Columns
-- ==========================================================

-- 1. Create branch table (if missing)
CREATE TABLE IF NOT EXISTS `branch` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(50) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `tel` VARCHAR(50) DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `created_by` INT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Insert initial branches (based on your screenshot)
INSERT IGNORE INTO `branch` (`id`, `name`, `code`) VALUES
(1, 'Siem Reap', 'SIEM_REAP'),
(2, 'ទីស្នាក់ការកណ្តាល', 'ទីស្នាក់ការ'),
(3, 'Banteay Meanchey', 'BANTEAY_ME'),
(4, 'Pailin', 'PAILIN'),
(5, 'Sihanoukville', 'SIHANOUKVI'),
(6, 'Preah Vihear', 'PREAH_VIHE'),
(7, 'Kampong Cham', 'KAMPONG_CH');

-- 3. Update user table structure
ALTER TABLE `user` 
ADD COLUMN IF NOT EXISTS `branch_id` INT NULL AFTER `role_id`,
ADD COLUMN IF NOT EXISTS `token_version` INT DEFAULT 0 AFTER `is_active`,
ADD COLUMN IF NOT EXISTS `last_activity` DATETIME NULL AFTER `token_version`,
ADD COLUMN IF NOT EXISTS `auto_logout_enabled` TINYINT(1) DEFAULT 1 AFTER `last_activity`,
ADD COLUMN IF NOT EXISTS `branch_name` VARCHAR(150) NULL AFTER `branch_id`;

-- 4. Update pre_order table structure
ALTER TABLE `pre_order` 
ADD COLUMN IF NOT EXISTS `actual_delivery_date` DATETIME NULL AFTER `delivery_date`;

-- 5. Sync branch_id from branch table (BASED ON YOUR SCREENSHOT IDs)
-- Super Admins / System (Set to HQ - ID 2)
UPDATE `user` SET `branch_id` = 2 WHERE `id` IN (3, 60, 102, 104);

-- Pailin (ID 4)
UPDATE `user` SET `branch_id` = 4 WHERE `id` IN (73, 128);

-- Banteay Meanchey (ID 3)
UPDATE `user` SET `branch_id` = 3 WHERE `id` IN (74);

-- Kampong Cham (ID 7)
UPDATE `user` SET `branch_id` = 7 WHERE `id` IN (76, 129, 130);

-- Siem Reap (ID 1)
UPDATE `user` SET `branch_id` = 1 WHERE `id` IN (72, 131);

-- Others / Accounting (Sihanoukville or Preah Vihear - Change IDs as needed)
UPDATE `user` SET `branch_id` = 5 WHERE `id` IN (91);
UPDATE `user` SET `branch_id` = 6 WHERE `id` IN (127);

-- 5. Add indexes for faster login and branch filtering
CREATE INDEX IF NOT EXISTS idx_user_branch_id ON `user` (`branch_id`);
CREATE INDEX IF NOT EXISTS idx_user_branch_name ON `user` (`branch_name`);
CREATE INDEX IF NOT EXISTS idx_user_token_on_id ON `user` (`id`, `token_version`);

-- 6. Ensure Pre-Order Delivery table exists (For the PO Fix)
CREATE TABLE IF NOT EXISTS `pre_order_delivery` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `pre_order_id` INT NOT NULL,
  `pre_order_detail_id` INT NOT NULL,
  `invoice_id` INT NOT NULL,
  `delivered_qty` DECIMAL(15,3) NOT NULL,
  `delivery_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `created_by` INT DEFAULT NULL,
  INDEX `idx_po_inv` (`pre_order_id`, `invoice_id`),
  INDEX `idx_pod_id` (`pre_order_detail_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- ✅ DONE. Copy and run these in your Railway SQL Editor.
-- ==========================================================
