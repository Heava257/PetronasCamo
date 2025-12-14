CREATE TABLE user_roles (
    user_id INT NOT NULL,
    role_id INT NOT NULL,
    PRIMARY KEY (user_id,role_id),
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE
)


CREATE TABLE permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR (255) NOT NULL,
    `group` VARCHAR (255) NOT NULL<
    is_menu_web VARCHAR (255)  NULL,
    web_route_key VARCHAR (255) NULL
)
 
CREATE TABLE permission_roles (
        role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (permission_id,role_id),
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES role(id) ON DELETE CASCADE
)


---add permission

INSERT INTO user_roles (user_id,role_id) VALUES
-- (1,1)
-- (1,3)
(52,25)



INSERT INTO permission_roles (role_id, permission_id) VALUES
(28,166),
(28,263),
(28,266),



(28,187),
(28,189),
(28,190),
(28,191),
(28,256),
(28,259),
(28,260),
(28,261),
(28,182),
(28,184),
(28,185),
(28,186),
(28,177),
(28,179),
(28,180),
(28,181),
(28,217),
(28,219),
(28,220),
(28,221);



INSERT INTO permission_roles (role_id, permission_id) VALUES

(28,255);

(28,222),
(28,227),
(28,232),
(28,242),
(28,165);


(25,174),
(25,175);



SELECT * FROM `delivery_note`

ALTER TABLE delivery_date ADD COLUMN 	driver_phone VARCHAR(255);


("user.getattendanceDashboard","attendanceDashboard",1,"/attendanceDashboard");


INSERT INTO permissions	(name ,	`group`	,is_menu_web,	web_route_key	) VALUES
("about.getlist","about",1,"/about"),
("about.getone","about",NULL,NULL),
("about.create","about",NULL,NULL),
("about.update","about",NULL,NULL),
("about.remove","about",NULL,NULL);


INSERT INTO permissions	(name ,	`group`	,is_menu_web,	web_route_key	) VALUES
("delivery-note.getone","delivery-note",NULL,NULL),
("delivery-note.create","delivery-note",NULL,NULL),
("delivery-note.update","delivery-note",NULL,NULL),
("delivery-note.remove","delivery-note",NULL,NULL);



INSERT INTO permissions	(name ,	`group`	,is_menu_web,	web_route_key	) VALUES
("payment/history.getlist","payment_history",1,"/payment/history");



("invoices.getone","invoices",NULL,NULL),
("invoices.create","invoices",NULL,NULL),
("invoices.update","invoices",NULL,NULL),
("invoices.remove","invoices",NULL,NULL);




("delivery-note.getlist","deliverynote",1,"/deliverynote"),



("finance.getone","finance",NULL,NULL),
("finance.create","finance",NULL,NULL),
("finance.update","finance",NULL,NULL),
("finance.remove","finance",NULL,NULL),

("invoices.getlist","invoices",1,"/invoices"),

("dashboard.getlist","dashboard",1,"/"),
("invoices.getlist","invoices",1,"/invoices"),

("customer.getlist","customer",1,"/customer"),
("customer.getone","customer",NULL,NULL),
("customer.create","customer",NULL,NULL),
("customer.update","customer",NULL,NULL),
("customer.remove","customer",NULL,NULL),


("category.getlist","category",1,"/category"),
("category.getone","category",NULL,NULL),
("category.create","category",NULL,NULL),
("category.update","category",NULL,NULL),
("category.remove","category",NULL,NULL),

("order.getlist","order",1,"/order"),
("order.getone","order",NULL,NULL),
("order.create","order",NULL,NULL),
("order.update","order",NULL,NULL),
("order.remove","order",NULL,NULL),

("total_due.getlist","total_due",1,"/total_due"),
("total_due.getone","total_due",NULL,NULL),
("total_due.create","total_due",NULL,NULL),
("total_due.update","total_due",NULL,NULL),
("total_due.remove","total_due",NULL,NULL),

("product.getlist","product",1,"/product"),
("product.getone","product",NULL,NULL),
("product.create","product",NULL,NULL),
("product.update","product",NULL,NULL),
("product.remove","product",NULL,NULL),

("user.getlist","user",1,"/user"),
("user.getone","user",NULL,NULL),
("user.create","user",NULL,NULL),
("user.update","user",NULL,NULL),
("user.remove","user",NULL,NULL),



("role.getlist","role",1,"/role"),
("role.getone","role",NULL,NULL),
("role.create","role",NULL,NULL),
("role.update","role",NULL,NULL),
("role.remove","role",NULL,NULL),


("supplier.getlist","supplier",1,"/supplier"),
("supplier.getone","supplier",NULL,NULL),
("supplier.create","supplier",NULL,NULL),
("supplier.update","supplier",NULL,NULL),
("supplier.remove","supplier",NULL,NULL),


("employee.getlist","employee",1,"/employee"),
("employee.getone","employee",NULL,NULL),
("employee.create","employee",NULL,NULL),
("employee.update","employee",NULL,NULL),
("employee.remove","employee",NULL,NULL),

("expanse_type.getlist","expanse_type",1,"/expanse_type"),
("expanse_type.getone","expanse_type",NULL,NULL),
("expanse_type.create","expanse_type",NULL,NULL),
("expanse_type.update","expanse_type",NULL,NULL),
("expanse_type.remove","expanse_type",NULL,NULL),

("expanse.getlist","expanse",1,"/expanse"),
("expanse.getone","expanse",NULL,NULL),
("expanse.create","expanse",NULL,NULL),
("expanse.update","expanse",NULL,NULL),
("expanse.remove","expanse",NULL,NULL),

("report_Sale_Summary.getlist","report_Sale_Summary",1,"/report_Sale_Summary"),
("report_Sale_Summary.getone","report_Sale_Summary",NULL,NULL),
("report_Sale_Summary.create","report_Sale_Summary",NULL,NULL),
("report_Sale_Summary.update","report_Sale_Summary",NULL,NULL),
("report_Sale_Summary.remove","report_Sale_Summary",NULL,NULL),




INSERT INTO permission_roles (role_id, permission_id) VALUES

(25,256),
(1,256);


(25,184);
(25,185);
(25,186);



     SELECT 
   DISTINCT
   p.id,
   p.name,
   p.group,
   p.is_menu_web,
   p.web_route_key
   FROM permissions  p
   INNER JOIN permission_roles pr ON p.id = pr.permission_id
   INNER JOIN `role` r ON pr.role_id = r.id
   INNER JOIN user_roles ur ON r.id = ur.role_id
   WHERE ur.user_id = :user_id; 

   
---Remove role_id all
DELETE FROM permission_roles WHERE role_id = 1



   -- Insert into permission_roles table
INSERT INTO permission_roles (role_id, permission_id) VALUES
-- Lab-103 role
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8),
(1, 9), (1, 10), (1, 11), (1, 12), (1, 13), (1, 14), (1, 15), (1, 16),
(1, 17), (1, 18), (1, 19), (1, 20), (1, 21), (1, 22), (1, 23), (1, 24),
(1, 25), (1, 26), (1, 27), (1, 28), (1, 29), (1, 30), (1, 31), (1, 32),
(1, 33), (1, 34), (1, 35), (1, 36), (1, 37), (1, 38), (1, 39), (1, 40),
(1, 41), (1, 42), (1, 43), (1, 44), (1, 45), (1, 46), (1, 47), (1, 48),
(1, 49), (1, 50), (1, 51), (1, 52)

(3, 46), (3, 47), (3, 48), (3, 49), (3, 50), (3, 51), (3, 52);






INSERT INTO permission (name, `group`, is_menu_web, web_route_key) VALUES

("report_Expense_Summary.getlist","report_Expense_Summary",1,"/report_Expense_Summary"),
("report_Expense_Summary.getone","report_Expense_Summary",NULL,NULL),
("report_Expense_Summary.create","report_Expense_Summary",NULL,NULL),
("report_Expense_Summary.update","report_Expense_Summary",NULL,NULL),
("report_Expense_Summary.remove","report_Expense_Summary",NULL,NULL),

("purchase_Summary.getlist","purchase_Summary",1,"/purchase_Summary"),
("purchase_Summary.getone","purchase_Summary",NULL,NULL),
("purchase_Summary.create","purchase_Summary",NULL,NULL),
("purchase_Summary.update","purchase_Summary",NULL,NULL),
("purchase_Summary.remove","purchase_Summary",NULL,NULL),

("report_Customer.getlist","report_Customer",1,"/report_Customer"),
("report_Customer.getone","report_Customer",NULL,NULL),
("report_Customer.create","report_Customer",NULL,NULL),
("report_Customer.update","report_Customer",NULL,NULL),
("report_Customer.remove","report_Customer",NULL,NULL),

("Top_Sale.getlist","Top_Sale",1,"/Top_Sale"),
("Top_Sale.getone","Top_Sale",NULL,NULL),
("Top_Sale.create","Top_Sale",NULL,NULL),
("Top_Sale.update","Top_Sale",NULL,NULL),
("Top_Sale.remove","Top_Sale",NULL,NULL),

("dashboard.getlist","dashboard",1,"/"),
("pos.getlist","pos",1,"/pos"),

("customer.getlist","customer",1,"/customer"),
("customer.getone","customer",NULL,NULL),
("customer.create","customer",NULL,NULL),
("customer.update","customer",NULL,NULL),
("customer.remove","customer",NULL,NULL),

("category.getlist","category",1,"/category"),
("category.getone","category",NULL,NULL),
("category.create","category",NULL,NULL),
("category.update","category",NULL,NULL),
("category.remove","category",NULL,NULL),

("order.getlist","order",1,"/order"),
("order.getone","order",NULL,NULL),
("order.create","order",NULL,NULL),
("order.update","order",NULL,NULL),
("order.remove","order",NULL,NULL),

("product.getlist","product",1,"/product"),
("product.getone","product",NULL,NULL),
("product.create","product",NULL,NULL),
("product.update","product",NULL,NULL),
("product.remove","product",NULL,NULL),

("user.getlist","user",1,"/user"),
("user.getone","user",NULL,NULL),
("user.create","user",NULL,NULL),
("user.update","user",NULL,NULL),
("user.remove","user",NULL,NULL),
("role.getlist","role",1,"/role"),

("role.getone","role",NULL,NULL),
("role.create","role",NULL,NULL),
("role.update","role",NULL,NULL),
("role.remove","role",NULL,NULL),

("supplier.getlist","supplier",1,"/supplier"),
("supplier.getone","supplier",NULL,NULL),
("supplier.create","supplier",NULL,NULL),
("supplier.update","supplier",NULL,NULL),
("supplier.remove","supplier",NULL,NULL),

("expanse_type.getlist","expanse_type",1,"/expanse_type"),
("expanse_type.getone","expanse_type",NULL,NULL),
("expanse_type.create","expanse_type",NULL,NULL),
("expanse_type.update","expanse_type",NULL,NULL),
("expanse_type.remove","expanse_type",NULL,NULL),

("expanse.getlist","expanse",1,"/expanse"),
("expanse.getone","expanse",NULL,NULL),
("expanse.create","expanse",NULL,NULL),
("expanse.update","expanse",NULL,NULL),
("expanse.remove","expanse",NULL,NULL),

("report_Sale_Summary.getlist","report_Sale_Summary",1,"/report_Sale_Summary"),
("report_Sale_Summary.getone","report_Sale_Summary",NULL,NULL),
("report_Sale_Summary.create","report_Sale_Summary",NULL,NULL),
("report_Sale_Summary.update","report_Sale_Summary",NULL,NULL),
("report_Sale_Summary.remove","report_Sale_Summary",NULL,NULL);



("purchase_product.getlist","purchase_product",1,"/purchase_product"),
("purchase_product.getone","purchase_product",NULL,NULL),
("purchase_product.create","purchase_product",NULL,NULL),
("purchase_product.update","purchase_product",NULL,NULL),
("purchase_product.remove","purchase_product",NULL,NULL),

("purchase.getlist","purchase",1,"/purchase"),
("purchase.getone","purchase",NULL,NULL),
("purchase.create","purchase",NULL,NULL),
("purchase.update","purchase",NULL,NULL),
("purchase.remove","purchase",NULL,NULL),

("employee.getlist","employee",1,"/employee"),
("employee.getone","employee",NULL,NULL),
("employee.create","employee",NULL,NULL),
("employee.update","employee",NULL,NULL),
("employee.remove","employee",NULL,NULL),

("payroll.getlist","payroll",1,"/payroll"),
("payroll.getone","payroll",NULL,NULL),
("payroll.create","payroll",NULL,NULL),
("payroll.update","payroll",NULL,NULL),
("payroll.remove","payroll",NULL,NULL),

("role_permission.getlist","role_permission",1,"/role_permission"),
("role_permission.getone","role_permission",NULL,NULL),
("role_permission.create","role_permission",NULL,NULL),
("role_permission.update","role_permission",NULL,NULL),
("role_permission.remove","role_permission",NULL,NULL),

("report_Expense_Summary.getlist","report_Expense_Summary",1,"/report_Expense_Summary"),
("report_Expense_Summary.getone","report_Expense_Summary",NULL,NULL),
("report_Expense_Summary.create","report_Expense_Summary",NULL,NULL),
("report_Expense_Summary.update","report_Expense_Summary",NULL,NULL),
("report_Expense_Summary.remove","report_Expense_Summary",NULL,NULL),

("purchase_Summary.getlist","purchase_Summary",1,"/purchase_Summary"),
("purchase_Summary.getone","purchase_Summary",NULL,NULL),
("purchase_Summary.create","purchase_Summary",NULL,NULL),
("purchase_Summary.update","purchase_Summary",NULL,NULL),
("purchase_Summary.remove","purchase_Summary",NULL,NULL),

("report_Customer.getlist","report_Customer",1,"/report_Customer"),
("report_Customer.getone","report_Customer",NULL,NULL),
("report_Customer.create","report_Customer",NULL,NULL),
("report_Customer.update","report_Customer",NULL,NULL),
("report_Customer.remove","report_Customer",NULL,NULL),

("Top_Sale.getlist","Top_Sale",1,"/Top_Sale"),
("Top_Sale.getone","Top_Sale",NULL,NULL),
("Top_Sale.create","Top_Sale",NULL,NULL),
("Top_Sale.update","Top_Sale",NULL,NULL),
("Top_Sale.remove","Top_Sale",NULL,NULL),

("Currency.getlist","Currency",1,"/Currency"),
("Currency.getone","Currency",NULL,NULL),
("Currency.create","Currency",NULL,NULL),
("Currency.update","Currency",NULL,NULL),
("Currency.remove","Currency",NULL,NULL),

("language.getlist","language",1,"/language"),
("language.getone","language",NULL,NULL),
("language.create","language",NULL,NULL),
("language.update","language",NULL,NULL),
("language.remove","language",NULL,NULL);

CREATE TABLE `permission` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `group` VARCHAR(255) NOT NULL,
  `is_menu_web` TINYINT(1),
  `web_route_key` VARCHAR(255)
);


---Asign id 1 to all in row 
INSERT INTO permission_roles  (role_id,permission_id)
SELECT 1 AS role_id,id FROM permissions;

INSERT INTO permission_roles (role_id, permission_id)
VALUES 
(25, 177),

(1, 58),
(1, 59),
(1, 60),
(1, 61),
(1, 62),
(1, 63),
(1, 64),
(1, 65),
(1, 66),
(1, 67),
(1, 68),
(1, 69),
(1, 70),
(1, 71),
(1, 72),
(1, 73),
(1, 74),
(1, 75),
(1, 76),
(1, 77),
(1, 78),
(1, 79),
(1, 80),
(1, 81),
(1, 82),
(1, 83),
(1, 84),
(1, 85),
(1, 86),
(1, 87),
(1, 88),
(1, 89),
(1, 90),
(1, 91),
(1, 92),
(1, 93),
(1, 94),
(1, 95),
(1, 96),
(1, 97),
(1, 98),
(1, 99),
(1, 100),
(1, 101),
(1, 102),
(1, 103),
(1, 104),
(1, 105),


(11, 100),
(11, 105),





INSERT INTO permission_roles (role_id, permission_id)
VALUES 

(25, 166),
(25, 167),
(25, 187)
(1, 169),
(1, 170),
(1, 171),
(1, 172),
(1, 173),
(1, 174),
(1, 175),
(1, 176),
(1, 177),
(1, 178),
(1, 179),
(1, 180),
(1, 181),
(1, 182),
(1, 183),
(1, 184),
(1, 185),
(1, 186),
(1, 187),
(1, 188),
(1, 189),
(1, 190),
(1, 191),
(1, 192),
(1, 193),
(1, 194),
(1, 195),
(1, 196),
(1, 197),
(1, 198),
(1, 199),
(1, 200),
(1, 201),
(1, 202),
(1, 203),
(1, 204),
(1, 205),
(1, 206),
(1, 207),
(1, 208),
(1, 209),
(1, 210),
(1, 211),
(1, 212),
(1, 213),
(1, 214),
(1, 215),
(1, 216),
(1, 217),
(1, 218),
(1, 219),
(1, 220),
(1, 221),
(1, 222),
(1, 223),
(1, 224),
(1, 225),
(1, 226),
(1, 227),
(1, 228),
(1, 229),
(1, 230),
(1, 231),
(1, 232),
(1, 233),
(1, 234),
(1, 235),
(1, 236),
(1, 237),
(1, 238),
(1, 239),
(1, 240),
(1, 241),
(1, 242),
(1, 243),
(1, 244),
(1, 245),
(1, 246);






កែប្រែ Status ទៅ "Paid" នៅពេលបង់ប្រាក់ពេញលេញ

UPDATE `order` 
SET payment_status = 'Paid', total_due = 0 
WHERE id = ?;



កែប្រែ Status ទៅ "Partial" ប្រសិនបើបង់លុយខ្លះ


UPDATE `order` 
SET payment_status = 'Partial', total_due = total_due - ? 
WHERE id = ?;


ប្រសិនបើអ្នកចង់ SELECT លេខវិក័យបត្រ (Order) ដែលអតិថិជន (Customer) នៅជំពាក់លុយ (total_due > 0) អ្នកអាចប្រើ SQL Query ខាងក្រោម៖
SELECT 
    id, 
    order_no, 
    customer_id, 
    user_id, 
    total_amount, 
    paid_amount, 
    total_due, 
    payment_status, 
    create_at
FROM `order`
WHERE total_due > 0;



បើចង់ SELECT ជាមួយឈ្មោះអតិថិជន

SELECT 
    o.id, 
    o.order_no, 
    c.name AS customer_name, 
    o.total_amount, 
    o.paid_amount, 
    o.total_due, 
    o.payment_status, 
    o.create_at
FROM `order` o
JOIN `customer` c ON o.customer_id = c.id
WHERE o.total_due > 0;



CREATE TABLE user_stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    qty INT DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES product(id)
);

ALTER TABLE user_stock
ADD COLUMN category_id INT NOT NULL,
ADD COLUMN barcode VARCHAR(255),
ADD COLUMN brand VARCHAR(255),
ADD COLUMN description TEXT,
ADD COLUMN price DECIMAL(10, 2) DEFAULT 0.00,
ADD COLUMN discount DECIMAL(5, 2) DEFAULT 0.00,
ADD COLUMN status ENUM('active', 'inactive') DEFAULT 'active',
ADD COLUMN image VARCHAR(255),
ADD COLUMN create_by VARCHAR(255),
ADD COLUMN create_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN unit VARCHAR(50),
ADD COLUMN unit_price4 DECIMAL(10, 2) DEFAULT 0.00,
ADD CONSTRAINT fk_user_stock_category
    FOREIGN KEY (category_id) REFERENCES category(id)
    ON DELETE CASCADE,
ADD CONSTRAINT fk_user_stock_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,
ADD CONSTRAINT fk_user_stock_product
    FOREIGN KEY (product_id) REFERENCES product(id)
    ON DELETE CASCADE;




