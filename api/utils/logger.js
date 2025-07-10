const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Simple logger utility
const logger = {
  info: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = JSON.stringify({
      timestamp,
      level: 'INFO',
      message,
      ...meta
    });
    
    console.log(`[INFO] ${timestamp}: ${message}`);
    
    // In production, also write to file
    if (process.env.NODE_ENV === 'production') {
      fs.appendFileSync(path.join(logsDir, 'app.log'), logEntry + '\n');
    }
  },
  
  error: (message, error = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = JSON.stringify({
      timestamp,
      level: 'ERROR',
      message,
      error: error.message || error,
      stack: error.stack
    });
    
    console.error(`[ERROR] ${timestamp}: ${message}`, error);
    
    // In production, also write to file
    if (process.env.NODE_ENV === 'production') {
      fs.appendFileSync(path.join(logsDir, 'error.log'), logEntry + '\n');
    }
  },
  
  warn: (message, meta = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = JSON.stringify({
      timestamp,
      level: 'WARN',
      message,
      ...meta
    });
    
    console.warn(`[WARN] ${timestamp}: ${message}`);
    
    // In production, also write to file
    if (process.env.NODE_ENV === 'production') {
      fs.appendFileSync(path.join(logsDir, 'app.log'), logEntry + '\n');
    }
  }
};

module.exports = logger;