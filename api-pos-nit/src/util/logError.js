const fs = require("fs/promises");
const moment = require("moment"); // Make sure to install moment: npm install moment

exports.logError = async (controller, error, res) => {
  try {
    const timestamp = moment().format("DD/MM/YYYY HH:mm:ss");
    
    const logDir = "./logs";
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir);
    }
    const errorLine = error.stack.split('\n')[1].trim(); // Gets the line where error occurred
    const errorMessage = error.message || "Unknown error";
    const errorStack = error.stack || "No stack trace";
    const logMessage = `[${timestamp}]
Controller: ${controller}
Error: ${errorMessage}
Line: ${errorLine}
Stack Trace:
${errorStack}
----------------------------------------\n`;
    const path = `${logDir}/${controller}_errors.log`;
    await fs.appendFile(path, logMessage);
    
    console.error(`Error logged to ${path}`);
  } catch (loggingError) {
    console.error("Failed to write error log:", loggingError);
  }

  if (res && !res.headersSent) {
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};