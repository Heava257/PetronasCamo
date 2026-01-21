const fs = require("fs/promises");
const moment = require("moment");

exports.logError = async (controller, error, res) => {
  try {
    const timestamp = moment().format("DD/MM/YYYY HH:mm:ss");

    // ===================================
    // ✅ IMPROVED CONSOLE ERROR LOGGING
    // ===================================
    console.log("\n" + "=".repeat(80));
    console.error(`❌ ERROR OCCURRED`);
    console.log("=".repeat(80));
    console.error(`📍 Function: ${controller}`);
    console.error(`⏰ Time: ${timestamp}`);
    console.error(`🔴 Error Type: ${error.name || 'Error'}`);
    console.error(`💬 Message: ${error.message || 'No message'}`);

    if (error.sql) {
      console.error(`🗄️  SQL Query: ${error.sql}`);
    }

    if (error.code) {
      console.error(`📋 Error Code: ${error.code}`);
    }

    const errorLine = error.stack?.split('\n')[1]?.trim() || 'Unknown location';
    console.error(`📌 Location: ${errorLine}`);

    console.log("-".repeat(80));
    console.error(`📚 Stack Trace:`);
    console.error(error.stack || 'No stack trace available');
    console.log("=".repeat(80) + "\n");

    // ===================================
    // File Logging
    // ===================================
    const logDir = "./logs";
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir);
    }

    const logMessage = `
${"=".repeat(80)}
ERROR LOG
${"=".repeat(80)}
Timestamp: ${timestamp}
Controller: ${controller}
Error Type: ${error.name || 'Error'}
Message: ${error.message || 'No message'}
Location: ${errorLine}
${error.sql ? `SQL Query: ${error.sql}` : ''}
${error.code ? `Error Code: ${error.code}` : ''}
${"-".repeat(80)}
Stack Trace:
${error.stack || 'No stack trace available'}
${"=".repeat(80)}

`;

    const path = `${logDir}/${controller}_errors.log`;
    await fs.appendFile(path, logMessage);

    console.log(`📝 Error logged to: ${path}`);

  } catch (loggingError) {
    console.error("⚠️  Failed to write error log:", loggingError);
  }

  if (res && !res.headersSent) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
