
const { db, logError } = require("../util/helper");

// Get all system settings
exports.getSettings = async (req, res) => {
    try {
        const [settings] = await db.query("SELECT * FROM system_settings");

        // Convert to object for easier frontend consumption
        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.setting_key] = s.setting_value;
        });

        res.json({
            success: true,
            data: settingsMap,
            list: settings
        });
    } catch (error) {
        console.error("❌ Error in getSettings:", error);
        logError("setting.get", error, res);
    }
};

// Update a system setting
exports.updateSetting = async (req, res) => {
    try {
        const { key, value } = req.body;

        if (!key) {
            return res.status(400).json({
                success: false,
                message: "Setting key is required"
            });
        }

        // Check if exists
        const [existing] = await db.query(
            "SELECT id FROM system_settings WHERE setting_key = ?",
            [key]
        );

        if (existing.length === 0) {
            // Insert new
            await db.query(
                "INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)",
                [key, value]
            );
        } else {
            // Update
            await db.query(
                "UPDATE system_settings SET setting_value = ? WHERE setting_key = ?",
                [value, key]
            );
        }

        res.json({
            success: true,
            message: "Setting updated successfully"
        });

    } catch (error) {
        console.error("❌ Error in updateSetting:", error);
        logError("setting.update", error, res);
    }
};

// Bulk update settings
exports.updateSettingsBulk = async (req, res) => {
    try {
        const settings = req.body; // Expect object { key: value, ... }

        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({
                success: false,
                message: "Invalid settings format"
            });
        }

        for (const [key, value] of Object.entries(settings)) {
            // Check if exists
            const [existing] = await db.query(
                "SELECT id FROM system_settings WHERE setting_key = ?",
                [key]
            );

            if (existing.length === 0) {
                await db.query(
                    "INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)",
                    [key, String(value)]
                );
            } else {
                await db.query(
                    "UPDATE system_settings SET setting_value = ? WHERE setting_key = ?",
                    [String(value), key]
                );
            }
        }

        res.json({
            success: true,
            message: "Settings updated successfully"
        });

    } catch (error) {
        console.error("❌ Error in updateSettingsBulk:", error);
        logError("setting.updateBulk", error, res);
    }
};
