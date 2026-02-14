const { validate_token } = require("../controller/auth.controller");
const {
    getTransactionList,
    getStatistics,
    getRecentTransactions,
    getPosProducts,
    getLatestSellingPrice,
    getCustomerProductPrice,
    getCategoryStatistics,  // ✅ ADD THIS
    updateTransaction,      // ✅ ADD THIS
    transferStock           // ✅ ADD THIS
} = require("../controller/inventory.controller");

module.exports = (app) => {
    // GET /api/inventory/transactions - Get all inventory transactions with pagination
    app.get("/api/inventory/transactions", validate_token("inventory-transactions.getlist"), getTransactionList);

    // GET /api/inventory/statistics - Get inventory statistics
    app.get("/api/inventory/statistics", validate_token("inventory-transactions.view"), getStatistics);

    // ✅ Get stock breakdown by category (Gasoline, Diesel, etc.)
    app.get("/api/inventory/category-statistics", validate_token("inventory-transactions.view"), getCategoryStatistics);

    // GET /api/inventory/recent - Get recent transactions
    app.get("/api/inventory/recent", validate_token("inventory-transactions.getlist"), getRecentTransactions);

    // ✅ GET /api/inventory/pos-products - Get products for POS from Inventory
    app.get("/api/inventory/pos-products", validate_token("product.view"), getPosProducts);

    // ✅ POST /api/inventory/transfer - Transfer Stock
    app.post("/api/inventory/transfer", validate_token("inventory-transactions.create"), transferStock);

    // ✅ PUT /api/inventory/transaction - Update transaction (e.g. unit_price)
    app.put("/api/inventory/transaction", validate_token("inventory-transactions.update"), updateTransaction);

    // Get latest selling price
    app.get("/api/inventory/latest-selling-price", validate_token("product.view"), getLatestSellingPrice);

    // Get customer product price
    app.get("/api/inventory/customer-product-price", validate_token("product.view"), getCustomerProductPrice);
};
