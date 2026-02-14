const { db } = require('./src/util/helper');

async function insertTestData() {
    try {
        console.log("🚀 Starting test data insertion...");

        const userId = 102; // Super Admin
        const branchId = 2; // ទីស្នាក់ការកណ្តាល
        const productIds = [496, 499, 504, 505, 506];
        const months = 12; // Cover full year
        const now = new Date();

        // 1. Ensure a customer exists
        console.log("👤 Checking for test customer...");
        const [customers] = await db.query("SELECT id FROM customer LIMIT 1");
        let customerId;
        if (customers.length === 0) {
            const [res] = await db.query("INSERT INTO customer (name, gender, type, tel) VALUES ('Test Customer', 'male', 'regular', '012345678')");
            customerId = res.insertId;
            console.log("✅ Created test customer ID:", customerId);
        } else {
            customerId = customers[0].id;
            console.log("✅ Using existing customer ID:", customerId);
        }

        // 2. Insert Orders for the last 12 months
        console.log("📊 Inserting 12 months of sales data (Real money)...");
        for (let i = 0; i < months; i++) {
            const date = new Date(now.getFullYear(), 11 - i, 15); // Spread across months
            const dateStr = date.toISOString().split('T')[0];

            const numOrders = 8 + Math.floor(Math.random() * 10); // More orders
            for (let j = 0; j < numOrders; j++) {
                const specificDate = new Date(now.getFullYear(), 11 - i, Math.floor(Math.random() * 28) + 1);
                const specificDateStr = specificDate.toISOString().split('T')[0];

                const orderNo = `REAL-SALES-${11 - i}-${j}-${Math.floor(Math.random() * 1000)}`;
                // Sales between $1000 - $5000 per order to make chart look big
                const totalAmount = 1000 + Math.floor(Math.random() * 4000);

                const [orderRes] = await db.query(
                    "INSERT INTO `order` (order_no, customer_id, user_id, branch_id, total_amount, payment_method, order_date, delivery_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                    [orderNo, customerId, userId, branchId, totalAmount, 'Cash', specificDateStr, specificDateStr]
                );
                const orderId = orderRes.insertId;

                const productId = productIds[Math.floor(Math.random() * productIds.length)];
                const qty = 10 + Math.floor(Math.random() * 50);
                const price = totalAmount / qty;

                await db.query(
                    "INSERT INTO order_detail (order_id, product_id, qty, price) VALUES (?, ?, ?, ?)",
                    [orderId, productId, qty, price]
                );

                await db.query(
                    "INSERT INTO inventory_transaction (product_id, transaction_type, quantity, unit_price, user_id, branch_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [productId, 'SALE_OUT', -qty, price, userId, branchId, specificDate]
                );
            }
        }
        console.log("✅ 12 months of sales data inserted.");

        // 3. Insert Expenses (Keep them lower than sales)
        console.log("💸 Inserting 12 months of expense data...");
        for (let i = 0; i < months; i++) {
            const numExp = 5 + Math.floor(Math.random() * 5);
            for (let k = 0; k < numExp; k++) {
                const specificDate = new Date(now.getFullYear(), 11 - i, Math.floor(Math.random() * 28) + 1);
                // Expenses between $200 - $800 to ensure profit
                const amount = 200 + Math.floor(Math.random() * 600);

                const [types] = await db.query("SELECT id FROM expense_type LIMIT 1");
                let typeId = types.length > 0 ? types[0].id : 1;

                await db.query(
                    "INSERT INTO expense (expense_type_id, remark, amount, expense_date, user_id, branch_id) VALUES (?, ?, ?, ?, ?, ?)",
                    [typeId, 'Monthly Operating Expense', amount, specificDate, userId, branchId]
                );
            }
        }
        console.log("✅ Expense data inserted.");

        console.log("✨ Test data insertion complete!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Error inserting test data:", err);
        process.exit(1);
    }
}

insertTestData();
