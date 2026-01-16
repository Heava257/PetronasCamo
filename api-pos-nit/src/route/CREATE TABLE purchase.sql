CREATE TABLE purchase (
  id INT AUTO_INCREMENT PRIMARY KEY,
  supplier_id INT NOT NULL,
  order_no VARCHAR(50) NOT NULL UNIQUE,
  order_date DATE NOT NULL,
  expected_delivery_date DATE NULL,
  status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  payment_terms ENUM('cod', 'net30', 'net60', 'advance') NULL,
  items JSON NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  notes TEXT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_supplier_id (supplier_id),
  INDEX idx_order_no (order_no),
  INDEX idx_status (status),
  INDEX idx_order_date (order_date),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  
  FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE RESTRICT
);

-- Insert sample data for testing
INSERT INTO purchase (
  supplier_id, 
  order_no, 
  order_date, 
  expected_delivery_date, 
  status, 
  payment_terms, 
  items, 
  total_amount, 
  notes, 
  user_id
) VALUES 
(
  1, 
  'PO-001', 
  CURDATE(), 
  DATE_ADD(CURDATE(), INTERVAL 7 DAY), 
  'pending', 
  'net30', 
  '[{"product_id": 1, "product_name": "Diesel", "quantity": 1000, "unit_price": 1.25, "total": 1250.00}]', 
  1250.00, 
  'Initial purchase order for diesel fuel', 
  1
);
