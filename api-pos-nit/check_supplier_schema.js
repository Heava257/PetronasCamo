
const { db } = require('./src/util/helper');
require('dotenv').config();

async function checkSchema() {
    try {
        const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'petronas_last4_full' 
      AND TABLE_NAME = 'supplier'
    `);
        console.log('Columns in supplier:', columns.map(c => c.COLUMN_NAME));
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkSchema();
