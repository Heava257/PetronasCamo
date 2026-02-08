-- ==========================================================
-- RAILWAY DATABASE FIX: Missing User Columns
-- ==========================================================

-- 1. Update user table structure
ALTER TABLE `user` 
ADD COLUMN IF NOT EXISTS `branch_id` INT NULL AFTER `role_id`,
ADD COLUMN IF NOT EXISTS `token_version` INT DEFAULT 0 AFTER `is_active`,
ADD COLUMN IF NOT EXISTS `last_activity` DATETIME NULL AFTER `token_version`,
ADD COLUMN IF NOT EXISTS `auto_logout_enabled` TINYINT(1) DEFAULT 1 AFTER `last_activity`,
ADD COLUMN IF NOT EXISTS `branch_name` VARCHAR(150) NULL AFTER `branch_id`;

-- 2. Add indexes for faster login and branch filtering
CREATE INDEX IF NOT EXISTS idx_user_branch_id ON `user` (`branch_id`);
CREATE INDEX IF NOT EXISTS idx_user_branch_name ON `user` (`branch_name`);
CREATE INDEX IF NOT EXISTS idx_user_token_on_id ON `user` (`id`, `token_version`);

-- 3. Ensure Pre-Order Delivery table exists (For the PO Fix)
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

-- 4. Add safety columns to pre_order_detail if missing
-- ALTER TABLE `pre_order_detail` 
-- ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP;

-- ==========================================================
-- ✅ DONE. Copy and run these in your Railway SQL Editor.
-- ==========================================================
