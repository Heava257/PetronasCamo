require('dotenv').config(); const { db } = require('./src/util/helper'); db.query('SHOW TABLES LIKE \
branch\').then(([tables]) => { console.log(tables); process.exit(0); });
