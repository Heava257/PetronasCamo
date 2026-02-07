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


(1,508),
(1,509),
(1,510),
(1,511),
(1,512);




INSERT INTO permissions	(name ,	`group`	,is_menu_web,	web_route_key	) VALUES
("settings.getlist","settings",1,"/settings"),
("settings.getone","settings",NULL,NULL),
("settings.create","settings",NULL,NULL),
("settings.update","settings",NULL,NULL),
("settings.remove","settings",NULL,NULL);




(28,190),
(28,191),
(28,256),
(28,259),
(28,166),
(28,263),
(28,266),



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
(1,555),
(1,556),
(1,557),
(1,558),
(1,559),
(1,560),
(29,203),
(29,365),
(29,377),
(29,378),
(29,367),
(29,368),
(29,307),
(29,308),
(29,309),
(29,310),
(29,311),
(29,312),
(29,313),
(29,314),
(29,315),
(29,316),
(29,317),
(29,318),
(29,319),
(29,320),
(29,321),
(29,322),
(29,323),
(29,324);


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

INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Log Analysis
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
("security.analyze", "security", NULL, NULL),

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- IP Management
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
("security.blacklist", "security", 1, "/security/blacklist"),
("security.blockip", "security", NULL, NULL),
("security.unblockip", "security", NULL, NULL),

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Incident Management
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
("security.investigate", "security", NULL, NULL),
("security.resolve", "security", NULL, NULL),

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Threat Pattern Management
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
("security.patterns.create", "security", NULL, NULL),
("security.patterns.update", "security", NULL, NULL),
("security.patterns.delete", "security", NULL, NULL);


-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Dashboard & Reports (Menu Items)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
("security.dashboard", "security", 1, "/security/dashboard"),
("security.incidents", "security", 1, "/security/incidents"),
("security.report", "security", 1, "/security/report"),
("security.patterns", "security", 1, "/security/patterns");




-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Log Analysis
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
("security.analyze", "security", NULL, NULL),

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- IP Management
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
("security.blacklist", "security", 1, "/security/blacklist"),
("security.blockip", "security", NULL, NULL),
("security.unblockip", "security", NULL, NULL),

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Incident Management
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
("security.investigate", "security", NULL, NULL),
("security.resolve", "security", NULL, NULL),

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- Threat Pattern Management
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
("security.patterns.create", "security", NULL, NULL),
("security.patterns.update", "security", NULL, NULL),
("security.patterns.delete", "security", NULL, NULL);




INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("super-BranchPermissionOverride.getlist", "super-BranchPermissionOverride", 1, "/super-BranchPermissionOverride"),
("super-BranchPermissionOverride.getone", "super-BranchPermissionOverride", NULL, NULL),
("super-BranchPermissionOverride.create", "super-BranchPermissionOverride", NULL, NULL),
("super-BranchPermissionOverride.update", "super-BranchPermissionOverride", NULL, NULL),
("super-BranchPermissionOverride.remove", "super-BranchPermissionOverride", NULL, NULL);


purchase-distribution



INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("purchase-distribution.getlist", "purchase-distribution", 1, "/purchase-distribution"),
("purchase-distribution.getone", "purchase-distribution", NULL, NULL),
("purchase-distribution.create", "purchase-distribution", NULL, NULL),
("purchase-distribution.update", "purchase-distribution", NULL, NULL),
("purchase-distribution.remove", "purchase-distribution", NULL, NULL);


INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("inventory-transactions.getlist", "inventory-transactions", 1, "/inventory-transactions"),
("inventory-transactions.getone", "inventory-transactions", NULL, NULL),
("inventory-transactions.create", "inventory-transactions", NULL, NULL),
("inventory-transactions.update", "inventory-transactions", NULL, NULL),
("inventory-transactions.remove", "inventory-transactions", NULL, NULL);


INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("supplier-payment.getlist", "supplier-payment", 1, "/supplier-payment"),
("supplier-payment.getone", "supplier-payment", NULL, NULL),
("supplier-payment.create", "supplier-payment", NULL, NULL),
("supplier-payment.update", "supplier-payment", NULL, NULL),
("supplier-payment.remove", "supplier-payment", NULL, NULL);



INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("pre-order-management.getlist", "pre-order-management", 1, "/pre-order-management"),
("pre-order-management.getone", "pre-order-management", NULL, NULL),
("pre-order-management.create", "pre-order-management", NULL, NULL),
("pre-order-management.update", "pre-order-management", NULL, NULL),
("pre-order-management.remove", "pre-order-management", NULL, NULL);

INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("pre-order-detail.getlist", "pre-order-detail", 1, "/pre-order-detail"),
("pre-order-detail.getone", "pre-order-detail", NULL, NULL),
("pre-order-detail.create", "pre-order-detail", NULL, NULL),
("pre-order-detail.update", "pre-order-detail", NULL, NULL),
("pre-order-detail.remove", "pre-order-detail", NULL, NULL);


INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("attendance.getlist", "attendance", 1, "/attendance"),
("attendance.getone", "attendance", NULL, NULL),
("attendance.create", "attendance", NULL, NULL),
("attendance.update", "attendance", NULL, NULL),
("attendance.remove", "attendance", NULL, NULL);

INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("driver-auth.getlist", "driver-auth", 1, "/driver-auth"),
("driver-auth.getone", "driver-auth", NULL, NULL),
("driver-auth.create", "driver-auth", NULL, NULL),
("driver-auth.update", "driver-auth", NULL, NULL),
("driver-auth.remove", "driver-auth", NULL, NULL);


INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("Truck.getlist", "Truck", 1, "/Truck"),
("Truck.getone", "Truck", NULL, NULL),
("Truck.create", "Truck", NULL, NULL),
("Truck.update", "Truck", NULL, NULL),
("Truck.remove", "Truck", NULL, NULL);

INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("driver.getlist", "driver", 1, "/driver"),
("driver.getone", "driver", NULL, NULL),
("driver.create", "driver", NULL, NULL),
("driver.update", "driver", NULL, NULL),
("driver.remove", "driver", NULL, NULL);


INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("admin-ShiftClosing.getlist", "admin-ShiftClosing", 1, "/admin-ShiftClosing"),
("admin-ShiftClosing.getone", "admin-ShiftClosing", NULL, NULL),
("admin-ShiftClosing.create", "admin-ShiftClosing", NULL, NULL),
("admin-ShiftClosing.update", "admin-ShiftClosing", NULL, NULL),
("admin-ShiftClosing.remove", "admin-ShiftClosing", NULL, NULL);

INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("admin-DailyClosing.getlist", "admin-DailyClosing", 1, "/admin-DailyClosing"),
("admin-DailyClosing.getone", "admin-DailyClosing", NULL, NULL),
("admin-DailyClosing.create", "admin-DailyClosing", NULL, NULL),
("admin-DailyClosing.update", "admin-DailyClosing", NULL, NULL),
("admin-DailyClosing.remove", "admin-DailyClosing", NULL, NULL);

INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("admin-ShiftClosingChecklist.getlist", "admin-ShiftClosingChecklist", 1, "/admin-ShiftClosingChecklist"),
("admin-ShiftClosingChecklist.getone", "admin-ShiftClosingChecklist", NULL, NULL),
("admin-ShiftClosingChecklist.create", "admin-ShiftClosingChecklist", NULL, NULL),
("admin-ShiftClosingChecklist.update", "admin-ShiftClosingChecklist", NULL, NULL),
("admin-ShiftClosingChecklist.remove", "admin-ShiftClosingChecklist", NULL, NULL);

INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("admin-StockReconciliation.getlist", "admin-StockReconciliation", 1, "/admin-StockReconciliation"),
("admin-StockReconciliation.getone", "admin-StockReconciliation", NULL, NULL),
("admin-StockReconciliation.create", "admin-StockReconciliation", NULL, NULL),
("admin-StockReconciliation.update", "admin-StockReconciliation", NULL, NULL),
("admin-StockReconciliation.remove", "admin-StockReconciliation", NULL, NULL);



INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("purchase.getlist", "purchase", 1, "/purchase"),
("purchase.getstatistics", "purchase", NULL, NULL),
("purchase.getbyid", "purchase", NULL, NULL),
("purchase.create", "purchase", NULL, NULL),
("purchase.update", "purchase", NULL, NULL),
("purchase.delete", "purchase", NULL, NULL);





INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("active-deliveries.getlist", "active-deliveries", 1, "/active-deliveries"),
("active-deliveries.getone", "active-deliveries", NULL, NULL),
("active-deliveries.create", "active-deliveries", NULL, NULL),
("active-deliveries.update", "active-deliveries", NULL, NULL),
("active-deliveries.remove", "active-deliveries", NULL, NULL);


INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("DeliveryReports.getlist", "DeliveryReports", 1, "/DeliveryReports"),
("DeliveryReports.getone", "DeliveryReports", NULL, NULL),
("DeliveryReports.create", "DeliveryReports", NULL, NULL),
("DeliveryReports.update", "DeliveryReports", NULL, NULL),
("DeliveryReports.remove", "DeliveryReports", NULL, NULL);




INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("inactive_admins.getlist", "inactive_admins", 1, "/inactive_admins"),
("inactive_admins.getone", "inactive_admins", NULL, NULL),
("inactive_admins.create", "inactive_admins", NULL, NULL),
("inactive_admins.update", "inactive_admins", NULL, NULL),
("inactive_admins.remove", "inactive_admins", NULL, NULL);

INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("company-payment-management.getlist", "company-payment-management", 1, "/company-payment-management"),
("company-payment-management.getone", "company-payment-management", NULL, NULL),
("company-payment-management.create", "company-payment-management", NULL, NULL),
("company-payment-management.update", "company-payment-management", NULL, NULL),
("company-payment-management.remove", "company-payment-management", NULL, NULL);


-- Permission សម្រាប់ BranchComparisonReport (Super Admin Only)
INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("report_BranchComparison.getlist", "report_BranchComparison", 1, "/report_BranchComparison"),
("report_BranchComparison.getone", "report_BranchComparison", NULL, NULL),
("report_BranchComparison.create", "report_BranchComparison", NULL, NULL),
("report_BranchComparison.update", "report_BranchComparison", NULL, NULL),
("report_BranchComparison.remove", "report_BranchComparison", NULL, NULL);
notifications/statistics


-- Permission សម្រាប់ BranchComparisonReport (Super Admin Only)
INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("notifications/statistics.getlist", "notifications/statistics", 1, "/notifications/statistics"),
("notifications/statistics.getone", "notifications/statistics", NULL, NULL),
("notifications/statistics.create", "notifications/statistics", NULL, NULL),
("notifications/statistics.update", "notifications/statistics", NULL, NULL),
("notifications/statistics.remove", "notifications/statistics", NULL, NULL);


-- Permission សម្រាប់ BranchComparisonReport (Super Admin Only)
INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("notifications.getlist", "notifications", 1, "/notifications"),
("notifications.getone", "notifications", NULL, NULL),
("notifications.create", "notifications", NULL, NULL),
("notifications.update", "notifications", NULL, NULL),
("notifications.remove", "notifications", NULL, NULL);





INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
('admin_management.view', 'admin_management', 1, '/admin-management'),
('admin_management.list', 'admin_management', NULL, NULL),
('admin_management.create', 'admin_management', NULL, NULL),
('admin_management.transfer', 'admin_management', NULL, NULL),
('admin_management.deactivate', 'admin_management', NULL, NULL),
('admin_management.reactivate', 'admin_management', NULL, NULL),
('admin_management.details', 'admin_management', NULL, NULL);


INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
('SuperAdminUserManagement.view', 'SuperAdminUserManagement', 1, '/superadmin-management'),
('SuperAdminUserManagement.list', 'SuperAdminUserManagement', NULL, NULL),
('SuperAdminUserManagement.create', 'SuperAdminUserManagement', NULL, NULL),
('SuperAdminUserManagement.transfer', 'SuperAdminUserManagement', NULL, NULL),
('SuperAdminUserManagement.deactivate', 'SuperAdminUserManagement', NULL, NULL),
('SuperAdminUserManagement.reactivate', 'SuperAdminUserManagement', NULL, NULL),
('SuperAdminUserManagement.details', 'SuperAdminUserManagement', NULL, NULL);




INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("delivery-map.getdelivery-map", "delivery-map", 1, "/delivery-map"),
("delivery-map.getone", "delivery-map", NULL, NULL),
("delivery-map.create", "delivery-map", NULL, NULL),
("delivery-map.update", "delivery-map", NULL, NULL),
("delivery-map.remove", "delivery-map", NULL, NULL);




INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("list.getlist", "list", 1, "/list"),
("list.getone", "list", NULL, NULL),
("list.create", "list", NULL, NULL),
("list.update", "list", NULL, NULL),
("list.remove", "list", NULL, NULL);


INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("create.getcreate", "create", 1, "/create"),
("create.getone", "create", NULL, NULL),
("create.create", "create", NULL, NULL),
("create.update", "create", NULL, NULL),
("create.remove", "create", NULL, NULL);

INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("deactivate.getdeactivate", "deactivate", 1, "/deactivate"),
("deactivate.getone", "deactivate", NULL, NULL),
("deactivate.deactivate", "deactivate", NULL, NULL),
("deactivate.update", "deactivate", NULL, NULL),
("deactivate.remove", "deactivate", NULL, NULL);

INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("reactivate.getreactivate", "reactivate", 1, "/reactivate"),
("reactivate.getone", "reactivate", NULL, NULL),
("reactivate.reactivate", "reactivate", NULL, NULL),
("reactivate.update", "reactivate", NULL, NULL),
("reactivate.remove", "reactivate", NULL, NULL);


INSERT INTO permissions (name, `group`, is_menu_web, web_route_key) VALUES
("details.getdetails", "details", 1, "/details"),
("details.getone", "details", NULL, NULL),
("details.details", "details", NULL, NULL),
("details.update", "details", NULL, NULL),
("details.remove", "details", NULL, NULL);


INSERT INTO permissions	(name ,	`group`	,is_menu_web,	web_route_key	) VALUES
("customer-payment.getlist","customer-payment",1,"/customer-payment"),
("customer-payment.getone","customer-payment",NULL,NULL),
("customer-payment.create","customer-payment",NULL,NULL),
("customer-payment.update","customer-payment",NULL,NULL),
("customer-payment.remove","customer-payment",NULL,NULL);

INSERT INTO permissions	(name ,	`group`	,is_menu_web,	web_route_key	) VALUES
("report_Stock_Movement.getlist","report_Stock_Movement",1,"/report_Stock_Movement"),
("report_Stock_Movement.getone","report_Stock_Movement",NULL,NULL),
("report_Stock_Movement.create","report_Stock_Movement",NULL,NULL),
("report_Stock_Movement.update","report_Stock_Movement",NULL,NULL),
("report_Stock_Movement.remove","report_Stock_Movement",NULL,NULL);


INSERT INTO permissions	(name ,	`group`	,is_menu_web,	web_route_key	) VALUES
("permission-management.getlist","permission-management",1,"/permission-management"),
("permission-management.getone","permission-management",NULL,NULL),
("permission-management.create","permission-management",NULL,NULL),
("permission-management.update","permission-management",NULL,NULL),
("permission-management.remove","permission-management",NULL,NULL);

INSERT INTO permissions	(name ,	`group`	,is_menu_web,	web_route_key	) VALUES
("company-payment.getlist","company-payment",1,"/company-payment"),
("company-payment.getone","company-payment",NULL,NULL),
("company-payment.create","company-payment",NULL,NULL),
("company-payment.update","company-payment",NULL,NULL),
("company-payment.remove","company-payment",NULL,NULL);


INSERT INTO permissions	(name ,	`group`	,is_menu_web,	web_route_key	) VALUES
("notify-inactive.getlist","notify-inactive",1,"/notify-inactive"),
("notify-inactive.getone","notify-inactive",NULL,NULL),
("notify-inactive.create","notify-inactive",NULL,NULL),
("notify-inactive.update","notify-inactive",NULL,NULL),
("notify-inactive.remove","notify-inactive",NULL,NULL);

INSERT INTO permissions	(name ,	`group`	,is_menu_web,	web_route_key	) VALUES
("my-notifications.getlist","my-notifications",1,"/my-notifications"),
("my-notifications.getone","my-notifications",NULL,NULL),
("my-notifications.create","my-notifications",NULL,NULL),
("my-notifications.update","my-notifications",NULL,NULL),
("my-notifications.remove","my-notifications",NULL,NULL);

INSERT INTO permissions	(name ,	`group`	,is_menu_web,	web_route_key	) VALUES
("unread-count.getlist","unread-count",1,"/unread-count"),
("unread-count.getone","unread-count",NULL,NULL),
("unread-count.create","unread-count",NULL,NULL),
("unread-count.update","unread-count",NULL,NULL),
("unread-count.remove","unread-count",NULL,NULL);


INSERT INTO permissions	(name ,	`group`	,is_menu_web,	web_route_key	) VALUES
("mark-read.getlist","mark-read",1,"/mark-read"),
("mark-read.getone","mark-read",NULL,NULL),
("mark-read.create","mark-read",NULL,NULL),
("mark-read.update","mark-read",NULL,NULL),
("mark-read.remove","mark-read",NULL,NULL);


INSERT INTO permissions	(name ,	`group`	,is_menu_web,	web_route_key	) VALUES
("mark-all-read.getlist","mark-all-read",1,"/mark-all-read"),
("mark-all-read.getone","mark-all-read",NULL,NULL),
("mark-all-read.create","mark-all-read",NULL,NULL),
("mark-all-read.update","mark-all-read",NULL,NULL),
("mark-all-read.remove","mark-all-read",NULL,NULL);


INSERT INTO permissions	(name ,	`group`	,is_menu_web,	web_route_key	) VALUES
(":super-TelegramConfiguration.getlist",":super-TelegramConfiguration",1,"/:super-TelegramConfiguration"),
(":super-TelegramConfiguration.getone",":super-TelegramConfiguration",NULL,NULL),
(":super-TelegramConfiguration.create",":super-TelegramConfiguration",NULL,NULL),
(":super-TelegramConfiguration.update",":super-TelegramConfiguration",NULL,NULL),
(":super-TelegramConfiguration.remove",":super-TelegramConfiguration",NULL,NULL);



INSERT INTO permissions	(name ,	`group`	,is_menu_web,	web_route_key	) VALUES
(":notification_id.getlist",":notification_id",1,"/:notification_id"),
(":notification_id.getone",":notification_id",NULL,NULL),
(":notification_id.create",":notification_id",NULL,NULL),
(":notification_id.update",":notification_id",NULL,NULL),
(":notification_id.remove",":notification_id",NULL,NULL);


INSERT INTO permissions	(name ,	`group`	,is_menu_web,	web_route_key	) VALUES
("report_Purchase_History.getlist","report_Purchase_History",1,"/report_Purchase_History"),
("report_Purchase_History.getone","report_Purchase_History",NULL,NULL),
("report_Purchase_History.create","report_Purchase_History",NULL,NULL),
("report_Purchase_History.update","report_Purchase_History",NULL,NULL),
("report_Purchase_History.remove","report_Purchase_History",NULL,NULL);

INSERT INTO permissions	(name ,	`group`	,is_menu_web,	web_route_key	) VALUES
("report_Outstanding_Debt.getlist","report_Outstanding_Debt",1,"/report_Outstanding_Debt"),
("report_Outstanding_Debt.getone","report_Outstanding_Debt",NULL,NULL),
("report_Outstanding_Debt.create","report_Outstanding_Debt",NULL,NULL),
("report_Outstanding_Debt.update","report_Outstanding_Debt",NULL,NULL),
("report_Outstanding_Debt.remove","report_Outstanding_Debt",NULL,NULL);

INSERT INTO permissions	(name ,	`group`	,is_menu_web,	web_route_key	) VALUES
("report_Payment_History.getlist","report_Payment_History",1,"/report_Payment_History"),
("report_Payment_History.getone","report_Payment_History",NULL,NULL),
("report_Payment_History.create","report_Payment_History",NULL,NULL),
("report_Payment_History.update","report_Payment_History",NULL,NULL),
("report_Payment_History.remove","report_Payment_History",NULL,NULL);


INSERT INTO permissions	(name ,	`group`	,is_menu_web,	web_route_key	) VALUES
("report_Profit_Loss.getlist","report_Profit_Loss",1,"/report_Profit_Loss"),
("report_Profit_Loss.getone","report_Profit_Loss",NULL,NULL),
("report_Profit_Loss.create","report_Profit_Loss",NULL,NULL),
("report_Profit_Loss.update","report_Profit_Loss",NULL,NULL),
("report_Profit_Loss.remove","report_Profit_Loss",NULL,NULL);


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

(1,372),
(1,373),
(1,374),
(1,375),
(1,376),
(1,377),
(1,378),
(1,379),
(1,380),
(1,381),
(1,382),
(1,383),
(1,384),
(1,385),
(1,386),
(1,387),
(1,388),
(1,389),
(1,390),
(1,391),
(1,392),
(1,393),
(1,394),
(1,395),
(1,396),
(1,397),
(1,398),
(1,399),
(1,400),
(1,401),
(1,402),
(1,403),
(1,404),
(1,405),
(1,406),
(1,407),
(1,408),
(1,409),
(1,410),
(1,411),
(1,412),
(1,413),
(1,414),
(1,415),
(1,416),
(1,417),
(1,418),
(1,419),
(1,420),
(1,421),
(1,422),
(1,423),
(1,424),
(1,425),
(1,426),
(1,427),
(1,428),
(1,429),
(1,430),
(1,431),
(1,432),
(1,433),
(1,434),
(1,435),
(1,436),
(1,437),
(1,438),
(1,439),
(1,440),
(1,441),
(1,442),
(1,443),
(1,444),
(1,445),
(1,446),
(1,447),
(1,448),
(1,449),
(1,450),
(1,451),
(1,452),
(1,453),
(1,454),
(1,455),
(1,456),
(1,457),
(1,458),
(1,459),
(1,460),
(1,461),
(1,462),
(1,463),
(1,464),
(1,465),
(1,466),
(1,467),
(1,468),
(1,469),
(1,470),
(1,471),
(1,472),
(1,473),
(1,474),
(1,475),
(1,476),
(1,477),
(1,478),
(1,479),
(1,480),
(1,481),
(1,482);
(1,483),
(1,484),
(1,485),
(1,486),
(1,487),
(1,488),
(1,489),
(1,490),
(1,491),
(1,492),
(1,493),
(1,494),
(1,495),
(1,496),
(1,497),
(1,498),
(1,499),
(1,500),
(1,501),
(1,502),
(1,503),
(1,504),
(1,505),
(1,506),
(1,507),
(1,508),
(1,509),
(1,510),
(1,511),
(1,512),
(1,513),
(1,514),
(1,515),
(1,516),
(1,517),
(1,518),
(1,519),
(1,520),
(1,521),
(1,522),
(1,523),
(1,524),
(1,525),
(1,526),
(1,527),
(1,528),
(1,529),
(1,530),
(1,531),
(1,532),
(1,533),
(1,534),
(1,535),
(1,536),
(1,537),
(1,538),
(1,539),
(1,540),
(1,541),
(1,542),
(1,543),
(1,544),
(1,545),
(1,546),
(1,547),
(1,548),
(1,549),
(1,550),
(1,551),
(1,552),
(1,553),
(1,554),
(1,555),
(1,556),
(1,557),
(1,558),
(1,559),
(1,560),
(1,561),
(1,562),
(1,563),
(1,564),
(1,565),
(1,566),
(1,567),
(1,568),
(1,569),
(1,570),
(1,571),
(1,572),
(1,


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

("purchase-orders.getlist","purchase-orders",1,"/purchase-orders"),
("purchase-orders.getone","purchase-orders",NULL,NULL),
("purchase-orders.create","purchase-orders",NULL,NULL),
("purchase-orders.update","purchase-orders",NULL,NULL),
("purchase-orders.remove","purchase-orders",NULL,NULL),

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




