import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const config = {
  host: process.env.MASTER_DB_HOST || 'localhost',
  port: parseInt(process.env.MASTER_DB_PORT || '3306'),
  user: process.env.MASTER_DB_USER || 'root',
  password: process.env.MASTER_DB_PASSWORD || 'root',
};

async function initMasterDatabase() {
  const dbName = process.env.MASTER_DB_NAME || 'master_db';
  
  console.log('📦 Initializing master database...');
  
  // Create connection without database selected
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
  });
  
  try {
    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    console.log(`✅ Database '${dbName}' created or already exists`);
    
    // Switch to the database
    await connection.query(`USE \`${dbName}\``);
    
    // Run Knex migrations
    console.log('📦 Running migrations...');
    const knex = require('knex');
    const knexConfig = require('../knexfile').default;
    const db = knex(knexConfig.development);
    
    await db.migrate.latest();
    console.log('✅ Migrations completed');
    
    await db.destroy();
    
    console.log('🎉 Master database setup complete!');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

// Run if called directly
if (require.main === module) {
  initMasterDatabase().catch(console.error);
}

export default initMasterDatabase;