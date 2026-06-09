const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const config = {
  host: process.env.MASTER_DB_HOST || 'localhost',
  port: parseInt(process.env.MASTER_DB_PORT || '3306'),
  user: process.env.MASTER_DB_USER || 'root',
  password: process.env.MASTER_DB_PASSWORD || 'root',
};

const DB_NAME = process.env.MASTER_DB_NAME || 'master_db';

console.log('========================================');
console.log('🚀 STARTING MIGRATION');
console.log('========================================');
console.log(`Host: ${config.host}`);
console.log(`User: ${config.user}`);
console.log(`Database: ${DB_NAME}`);
console.log('========================================\n');

// Auth plugins for GSSAPI
const authPlugins = {
  auth_gssapi_client: () => () => Buffer.from([]),
};

const connection = mysql.createConnection({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  authPlugins,
});

connection.connect((err) => {
  if (err) {
    console.error('❌ Connection failed:', err.message);
    console.error('Please check your database credentials in .env file');
    process.exit(1);
  }
  
  console.log('✅ Connected to MySQL successfully\n');
  
  // Step 1: Create database
  console.log('📦 Creating database...');
  connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``, (err) => {
    if (err) {
      console.error('❌ Failed:', err.message);
      process.exit(1);
    }
    console.log(`✅ Database '${DB_NAME}' ready\n`);
    
    // Step 2: Use database
    connection.query(`USE \`${DB_NAME}\``, (err) => {
      if (err) {
        console.error('❌ Failed to use database:', err.message);
        process.exit(1);
      }
      console.log(`📂 Using database: ${DB_NAME}\n`);
      
      // Step 3: Create tenants table
      console.log('📝 Creating tenants table...');
      
      // First, drop existing table if it has wrong schema
      console.log('🔍 Checking for existing table...');
      connection.query('SHOW COLUMNS FROM tenants', (err, columns) => {
        if (err && err.code === 'ER_NO_SUCH_TABLE') {
          // Table doesn't exist, proceed with creation
          console.log('   Table does not exist, creating new one...');
          createTablesStep();
        } else if (err) {
          console.error('❌ Error checking table:', err.message);
          process.exit(1);
        } else {
          // Table exists, check if it has tenant_slug column
          const hasColumn = columns.some(col => col.Field === 'tenant_slug');
          if (!hasColumn) {
            console.log('   Old schema detected, migrating...');
            // Drop and recreate
            connection.query('DROP TABLE tenants', (err) => {
              if (err) {
                console.error('❌ Failed to drop table:', err.message);
                process.exit(1);
              }
              console.log('   Dropped old table, creating new one...');
              createTablesStep();
            });
          } else {
            console.log('   Table exists with correct schema');
            createTablesStep();
          }
        }
      });
      
      function createTablesStep() {
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS tenants (
            tenant_id INT PRIMARY KEY AUTO_INCREMENT,
            tenant_name VARCHAR(255) NOT NULL,
            tenant_slug VARCHAR(100) NOT NULL UNIQUE,
            db_name VARCHAR(100) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            location TEXT,
            logo_url VARCHAR(500),
            status ENUM('active', 'suspended', 'deleted') DEFAULT 'active',
            subscription_status ENUM('active', 'trial', 'suspended', 'cancelled') DEFAULT 'trial',
            subscription_expires_at DATETIME,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_tenant_slug (tenant_slug),
            INDEX idx_email (email),
            INDEX idx_status (status),
            INDEX idx_subscription_status (subscription_status)
          )
        `;
        
        connection.query(createTableSQL, (err) => {
          if (err) {
            console.error('❌ Failed to create table:', err.message);
            process.exit(1);
          }
          console.log('✅ Tenants table created/verified\n');
          
          // Step 4: Verify
          console.log('🔍 Verifying...');
          connection.query('SHOW TABLES', (err, results) => {
            if (err) {
              console.error('❌ Verification failed:', err.message);
            } else {
              console.log('📋 Tables in database:');
              results.forEach(row => {
                console.log(`   - ${Object.values(row)[0]}`);
              });
            }
            
            console.log('\n========================================');
            console.log('🎉 MIGRATION COMPLETED SUCCESSFULLY!');
            console.log('========================================');
            
            connection.end();
            process.exit(0);
          });
        });
      }
    });
  });
});
