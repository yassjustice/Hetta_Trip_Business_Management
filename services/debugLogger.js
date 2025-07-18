const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '../logs');
const LOG_FILE = path.join(LOG_DIR, 'extraction-debug.log');

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

function logDebug(section, data) {
  ensureLogDir();
  // If data is already an object, log as JSON line for analytics
  // Ensure address is always a string
  let entryObj = {
    timestamp: new Date().toISOString(),
    section
  };
  if (typeof data === 'object' && data !== null) {
    entryObj = { ...entryObj, ...data };
    if (entryObj.address && typeof entryObj.address !== 'string') {
      entryObj.address = Array.isArray(entryObj.address)
        ? entryObj.address.join(', ')
        : JSON.stringify(entryObj.address);
    }
  } else {
    entryObj.message = data;
  }
  fs.appendFileSync(LOG_FILE, JSON.stringify(entryObj) + '\n', 'utf8');
}

module.exports = { logDebug };
