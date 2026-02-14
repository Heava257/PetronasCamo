
require('dotenv').config();
const axios = require('axios');
const { db } = require("./src/util/helper");

async function setupAllWebhooks() {
    try {
        console.log("🚀 Setting up Webhooks for ALL active bots...");
        const [configs] = await db.query("SELECT id, config_name, bot_token FROM telegram_config WHERE is_active = 1");

        if (configs.length === 0) {
            console.log("⚠️ No active bots found.");
            return;
        }

        const apiBase = "https://petronascamo-production.up.railway.app";

        for (const bot of configs) {
            const webhookUrl = `${apiBase}/api/telegram/webhook/${bot.bot_token}`;
            console.log(`\n🤖 Processing: ${bot.config_name}`);

            try {
                const res = await axios.post(`https://api.telegram.org/bot${bot.bot_token}/setWebhook`, {
                    url: webhookUrl,
                    allowed_updates: ["message", "callback_query"]
                });

                if (res.data.ok) {
                    console.log(`✅ Webhook Set: ${webhookUrl}`);
                } else {
                    console.log(`❌ Failed:`, res.data);
                }
            } catch (err) {
                console.error(`❌ Connection Error for ${bot.config_name}:`, err.message);
            }
        }

        console.log("\n🎉 Done!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

setupAllWebhooks();
