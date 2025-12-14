CREATE TABLE product_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    barcode VARCHAR(20),
    description TEXT,
    category VARCHAR(100),
    company_name VARCHAR(255),
    qty INT DEFAULT 0,
    unit CHAR(1),
    unit_price DECIMAL(18,2),
    total_price DECIMAL(20,2),
    status VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50),
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);



DROP TABLE product_details;



DELETE FROM delivery_note_items;

DELETE FROM delivery_note

DELETE FROM product;