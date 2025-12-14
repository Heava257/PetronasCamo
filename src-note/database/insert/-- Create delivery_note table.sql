-- Create delivery_note table
CREATE TABLE delivery_note (
    id INT AUTO_INCREMENT PRIMARY KEY,
    delivery_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT NOT NULL,
    delivery_date DATE NOT NULL,
    note TEXT,
    status TINYINT DEFAULT 1 COMMENT '0: Inactive, 1: Active, 2: Delivered',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT,
    updated_by INT,
    FOREIGN KEY (customer_id) REFERENCES customer(id),
    FOREIGN KEY (created_by) REFERENCES user(id),
    FOREIGN KEY (updated_by) REFERENCES user(id)
);

-- Create delivery_note_items table
CREATE TABLE delivery_note_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    delivery_note_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50),
    unit_price DECIMAL(10,2) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (delivery_note_id) REFERENCES delivery_note(id),
    FOREIGN KEY (product_id) REFERENCES product(id)
);


ALTER TABLE delivery_note
ADD COLUMN order_date DATE NULL;


-- Update all existing records to set order_date equal to their delivery_date (or created_at)
-- This is a one-time operation to fill in the missing values

-- Option 1: Set order_date to delivery_date for all records where order_date is NULL
UPDATE `delivery_note` 
SET `order_date` = `delivery_date` 
WHERE `order_date` IS NULL;

-- Option 2: If you prefer to use created_at instead
-- UPDATE `delivery_note` 
-- SET `order_date` = `created_at` 
-- WHERE `order_date` IS NULL;



ALTER TABLE product_details 
MODIFY COLUMN total_price DECIMAL(15,2) GENERATED ALWAYS AS (qty * unit_price) STORED;




ALTER TABLE product_details 
MODIFY COLUMN qty DECIMAL(30,2),
MODIFY COLUMN unit_price DECIMAL(30,2),
MODIFY COLUMN total_price DECIMAL(30,2) GENERATED ALWAYS AS (qty * unit_price) STORED;







npm install react-datepicker
npm install date-fns
