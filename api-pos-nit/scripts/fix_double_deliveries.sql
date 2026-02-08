-- SQL Script to Fix Double-Counted Deliveries
-- Run this to correct the existing data

-- 1. First, let's see the current state
SELECT 
  po.pre_order_no,
  po.customer_name,
  pod.product_name,
  pod.qty as ordered,
  pod.delivered_qty as delivered,
  pod.remaining_qty as remaining,
  (SELECT COUNT(*) FROM pre_order_delivery WHERE pre_order_detail_id = pod.id) as delivery_count
FROM pre_order po
JOIN pre_order_detail pod ON po.id = pod.pre_order_id
WHERE po.id = (SELECT id FROM pre_order ORDER BY id DESC LIMIT 1);

-- 2. Check for duplicate delivery records
SELECT 
  pod_del.invoice_id,
  COUNT(*) as count,
  SUM(pod_del.delivered_qty) as total_qty
FROM pre_order_delivery pod_del
WHERE pod_del.pre_order_id = (SELECT id FROM pre_order ORDER BY id DESC LIMIT 1)
GROUP BY pod_del.invoice_id
HAVING COUNT(*) > 1;

-- 3. To fix: Remove duplicate delivery records (keep only one per invoice)
-- IMPORTANT: Review the results above before running this!
/*
DELETE pod_del FROM pre_order_delivery pod_del
WHERE pod_del.id NOT IN (
  SELECT MIN(id) 
  FROM (SELECT * FROM pre_order_delivery) as temp
  WHERE temp.pre_order_id = pod_del.pre_order_id
    AND temp.invoice_id = pod_del.invoice_id
  GROUP BY temp.invoice_id, temp.pre_order_detail_id
);
*/

-- 4. Recalculate delivered_qty and remaining_qty based on actual deliveries
/*
UPDATE pre_order_detail pod
SET 
  delivered_qty = (
    SELECT COALESCE(SUM(delivered_qty), 0)
    FROM pre_order_delivery
    WHERE pre_order_detail_id = pod.id
  ),
  remaining_qty = pod.qty - (
    SELECT COALESCE(SUM(delivered_qty), 0)
    FROM pre_order_delivery
    WHERE pre_order_detail_id = pod.id
  )
WHERE pod.pre_order_id = (SELECT id FROM pre_order ORDER BY id DESC LIMIT 1);
*/
