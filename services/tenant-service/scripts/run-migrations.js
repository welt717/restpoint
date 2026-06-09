const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const config = {
  host: process.env.MASTER_DB_HOST || 'localhost',
  port: parseInt(process.env.MASTER_DB_PORT || '3306'),
  user: process.env.MASTER_DB_USER || 'root',
  password: process.env.MASTER_DB_PASSWORD || 'root',
};

// Auth plugins to skip GSSAPI
const authPlugins = {
  auth_gssapi_client: () => () => {
    return Buffer.from([]);
  },
};

async function runMigrations() {
  const dbName = process.env.MASTER_DB_NAME || 'master_db';
  
  console.log('📦 Running database migrations...');
  
  const connection = mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    authPlugins,
  });
  
  connection.connect(async (err) => {
    if (err) {
      console.error('❌ Connection error:', err.message);
      process.exit(1);
    }
    
    console.log('✅ Connected to MySQL');
    
    try {
      // Create database
      await query(connection, `CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
      console.log(`✅ Database '${dbName}' ready`);
      
      // Use database
      await query(connection, `USE \`${dbName}\``);
      
      // Create tenants table
      await query(connection, `
        CREATE TABLE IF NOT EXISTS tenants (
          tenant_id INT PRIMARY KEY AUTO_INCREMENT,
          tenant_name VARCHAR(100) NOT NULL,
          subdomain VARCHAR(50) NOT NULL UNIQUE,
          db_name VARCHAR(100) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL,
          phone VARCHAR(20),
          location TEXT,
          logo_url VARCHAR(500),
          status ENUM('active', 'suspended', 'deleted') DEFAULT 'active',
          created_at TIMESTAMP NULL ,
          updated_at TIMESTAMP NULL  ,
          INDEX idx_subdomain (subdomain),
          INDEX idx_email (email)
        )
      `);
      console.log('✅ Tenants table created');
      
      console.log('🎉 Migrations completed!');
    } catch (error) {
      console.error('❌ Migration error:', error);
      process.exit(1);
    } finally {
      connection.end();
    }
  });
}

function query(connection, sql) {
  return new Promise((resolve, reject) => {
    connection.query(sql, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

runMigrations();