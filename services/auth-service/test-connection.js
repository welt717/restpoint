require('dotenv').config();
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('========== TESTING DATABASE CONNECTION ==========');
  console.log('Host:', process.env.DB_HOST || 'localhost');
  console.log('Port:', process.env.DB_PORT || '3306');
  console.log('User:', process.env.DB_USER || 'root');
  console.log('Database:', process.env.DB_NAME || 'master_db');
  console.log('Password:', process.env.DB_PASSWORD ? '***SET***' : 'NOT SET');
  
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'master_db'
    });
    
    console.log('✅ Connected successfully!');
    
    // Test query - show tables
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📊 Tables in database:', tables.length);
    tables.forEach(t => {
      console.log(`   - ${Object.values(t)[0]}`);
    });
    
    // Check tenants table
    const [tenants] = await connection.execute('SELECT * FROM tenants');
    console.log(`\n🏢 Tenants found: ${tenants.length}`);
    tenants.forEach(t => {
      console.log(`   - ID: ${t.tenant_id}, Name: ${t.tenant_name}, Slug: ${t.tenant_slug}`);
      console.log(`     Database: ${t.db_name}`);
    });
    
    await connection.end();
    console.log('\n✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error code:', error.code);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   → Wrong username or password');
      console.error('   → Current user:', process.env.DB_USER || 'root');
      console.error('   → Try: mysql -u root -p');
    }
    if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('   → Database does not exist:', process.env.DB_NAME || 'master_db');
      console.error('   → Create it with: CREATE DATABASE master_db;');
    }
    if (error.code === 'ECONNREFUSED') {
      console.error('   → MySQL/MariaDB is not running');
      console.error('   → Start it with: net start MySQL (Windows)');
    }
  }
  console.log('================================================\n');
}

// Run the test
testConnection();