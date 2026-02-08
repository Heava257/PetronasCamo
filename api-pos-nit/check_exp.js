require('dotenv').config(); const { db } = require('./src/util/helper'); db.query('SHOW COLUMNS FROM expanse').then(([cols]) => { console.log(cols.map(c => c.Field)); process.exit(0); });
