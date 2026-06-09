const path = require('path');
const fs = require('fs');

let db;
const tryPaths = [
  path.resolve(__dirname, '../../global/config/db'),
  path.resolve(__dirname, '../../global/config/db.ts'),
  path.resolve(__dirname, '../../../global/config/db'),
  path.resolve(__dirname, '../../../global/config/db.ts')
];

for (const dbPath of tryPaths) {
  if (fs.existsSync(dbPath + '.js')) {
    db = require(dbPath + '.js');
    break;
  }
  if (fs.existsSync(dbPath)) {
    db = require(dbPath);
    break;
  }
}

if (!db) {
  try {
    require('ts-node').register({ transpileOnly: true });
    db = require(path.resolve(__dirname, '../../global/config/db.ts'));
  } catch (error) {
    console.error('Failed to load portal database configuration:', error);
    throw new Error('Could not load portal database configuration. Please ensure ts-node is installed or compile global config.');
  }
}

async function testConnection() {
  if (!db || !db.pool) {
    throw new Error('Database connection not available');
  }

  try {
    await db.pool.query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Portal database testConnection failed:', error.message || error);
    throw error;
  }
}

module.exports = {
  executeQuery: db.safeQuery,
  safeQuery: db.safeQuery,
  safeQueryOne: db.safeQueryOne,
  transaction: db.transaction,
  getConnection: db.getConnection,
  pool: db.pool,
  testConnection,
};
