// Directly use the global database functions
// Since the global config is TypeScript, we need to handle it
const path = require('path');

// Try different ways to import
let db;

try {
  // Try requiring as .js (if compiled)
  db = require('../../global/config/db');
} catch (e1) {
  try {
    // Try requiring as .ts with ts-node
    require('ts-node').register({ transpileOnly: true });
    db = require('../../global/config/db.ts');
  } catch (e2) {
    console.error('Failed to load database config:', e2.message);
    throw new Error('Could not load database configuration. Please ensure ts-node is installed.');
  }
}

module.exports = {
  safeQuery: db.safeQuery,
  safeQueryOne: db.safeQueryOne,
  transaction: db.transaction,
  getConnection: db.getConnection,
  initDB: db.initDB,
  pool: db.pool || db.default?.pool
};