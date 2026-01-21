const mysql = require('mysql2/promise');
(async () => {
    try {
        const db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'petronas_last4_full'
        });

        const [orderId55] = await db.query("SELECT o.*, c.name FROM `order` o LEFT JOIN customer c ON o.customer_id = c.id WHERE o.id = 55");
        console.log('Order ID 55:', orderId55);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
