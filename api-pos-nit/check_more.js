require('dotenv').config(); const { db } = require('./src/util/helper'); async function check() { const tables = ['pre_order', 'pre_order_detail', 'pre_order_delivery', 'order_detail']; for(const table of tables) { try { const [cols] = await db.query(\
SHOW
COLUMNS
FROM
\ + table); console.log(table + ':', cols.map(c => c.Field).includes('branch_id')); } catch(e) { console.log(table + ': MISSING TABLE'); } } process.exit(0); } check();
