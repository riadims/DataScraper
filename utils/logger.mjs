import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Logger class to write logs to a file and console.
 */
class Logger {
  constructor() {
    this.logFilePath = path.join(__dirname, "../logs/server.log");
  }

  /**
   * Write logs to a file and console.
   * @param {string} message - The log message.
   */
  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;

    console.log(logMessage);

    fs.appendFile(this.logFilePath, logMessage, (err) => {
      if (err) console.error("❌ Error writing to log file:", err);
    });
  }

  error(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;

    console.log(`\x1b[31m${logMessage}\x1b[0m`);

    fs.appendFile(this.logFilePath, logMessage, (err) => {
      if (err) console.error("❌ Error writing to log file:", err);
    });
  }
}

export default new Logger();
