-- Migration: Add destination column to detail tables
-- Run this in your MySQL database

-- 1. Add destination to pre_order_detail
ALTER TABLE pre_order_detail ADD COLUMN destination VARCHAR(255) NULL;

-- 2. Add destination to fakeinvoice_detail  
ALTER TABLE fakeinvoice_detail ADD COLUMN destination VARCHAR(255) NULL;

-- 3. Add destination to order_detail
ALTER TABLE order_detail ADD COLUMN destination VARCHAR(255) NULL;

-- Verify columns were added
SHOW COLUMNS FROM pre_order_detail LIKE 'destination';
SHOW COLUMNS FROM fakeinvoice_detail LIKE 'destination';
SHOW COLUMNS FROM order_detail LIKE 'destination';
