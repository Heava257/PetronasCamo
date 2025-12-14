
const express = require("express");
const cors = require("cors");
const app = express();
const limiter = require("express-rate-limit");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({ origin: "*" }));


require("./src/route/category.route")(app);
require("./src/route/auth.route")(app);
require("./src/route/role.route")(app);
require("./src/route/supplier.route")(app);
require("./src/route/config.route")(app);
require("./src/route/product.route")(app);
require("./src/route/customer.route")(app);
require("./src/route/expanse.route")(app);
require("./src/route/employee.route")(app);
require("./src/route/order.route")(app);
require("./src/route/dashbaord.route")(app);
require("./src/route/report.route")(app);
require("./src/route/currency.route")(app);
require("./src/route/invoices.route")(app);
require("./src/route/admin_stock_transfer.route")(app); 
require("./src/route/StockUser.route")(app);
require("./src/route/Chat_Application.route")(app);
require("./src/route/family_finances.route")(app);
require("./src/route/expense_type.route")(app);
require("./src/route/delivery.route")(app);
require("./src/route/fakeinvoice.route")(app);

const PORT = 3000;
app.listen(PORT, () => {
  console.log("http://localhost:" + PORT);
});
