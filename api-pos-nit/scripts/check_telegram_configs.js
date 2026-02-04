const { db } = require('../src/util/helper');

async function check() {
    try {
        const [configs] = await db.query("SELECT id, config_name, config_type, branch_name, event_types FROM telegram_config");
        console.log(JSON.stringify(configs, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

check();
