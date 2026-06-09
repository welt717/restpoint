import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// This pool connects to MySQL SERVER (without selecting a database)
// to create new tenant databases
let rootPool: mysql.Pool | null = null;

export const getRootPool = async (): Promise<mysql.Pool> => {
  if (!rootPool) {
    rootPool = await mysql.createPool({
      host: process.env.DB_HOST || 'localhost',  // Changed from mariadb to localhost
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      waitForConnections: true,
      connectionLimit: 5,  // Lower limit for admin operations
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    });
    console.log('✅ Root database pool created (for creating tenant databases)');
  }
  return rootPool;
};

// Create a connection pool for a SPECIFIC tenant database
export const getTenantPool = async (tenantDbName: string): Promise<mysql.Pool> => {
  const pool = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',  // Changed from mariadb to localhost
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: tenantDbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });
  console.log(`✅ Connected to tenant database: ${tenantDbName}`);
  return pool;
};

// Create a new tenant database with all tables
export const createTenantDatabase = async (tenantDbName: string): Promise<void> => {
  const rootPool = await getRootPool();
  
  try {
    // Create the database
    await rootPool.query(`CREATE DATABASE IF NOT EXISTS \`${tenantDbName}\``);
    console.log(`✅ Database created: ${tenantDbName}`);
    
    // Connect to the new database and create tables
    const tenantPool = await getTenantPool(tenantDbName);
    
    // Create all tables for the tenant
    await tenantPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role ENUM('admin', 'manager', 'staff', 'user') DEFAULT 'user',
        is_active BOOLEAN DEFAULT TRUE,
        is_verified BOOLEAN DEFAULT FALSE,
        last_login_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_email (email)
      )
    `);
    
    await tenantPool.query(`
      CREATE TABLE IF NOT EXISTS deceased (
        deceased_id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        age INT,
        gender ENUM('Male', 'Female', 'Other'),
        date_of_birth DATE,
        date_of_death DATE NOT NULL,
        cause_of_death TEXT,
        id_number VARCHAR(50),
        religion VARCHAR(100),
        burial_location TEXT,
        burial_date DATE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
        INDEX idx_name (full_name),
        INDEX idx_date_of_death (date_of_death)
      )
    `);
    
    await tenantPool.query(`
      CREATE TABLE IF NOT EXISTS funeral_arrangements (
        arrangement_id INT AUTO_INCREMENT PRIMARY KEY,
        deceased_id INT NOT NULL,
        arrangement_type ENUM('burial', 'cremation', 'memorial') DEFAULT 'burial',
        funeral_date DATE,
        funeral_location TEXT,
        clergy_name VARCHAR(255),
        special_instructions TEXT,
        status ENUM('pending', 'confirmed', 'completed', 'cancelled') DEFAULT 'pending',
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (deceased_id) REFERENCES deceased(deceased_id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
      )
    `);
    
    await tenantPool.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token VARCHAR(500) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        INDEX idx_token (token(255))
      )
    `);
    
    await tenantPool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Insert default settings
    await tenantPool.query(`
      INSERT IGNORE INTO settings (setting_key, setting_value) VALUES 
      ('organization_name', ''),
      ('organization_logo', ''),
      ('currency', 'KES'),
      ('timezone', 'Africa/Nairobi'),
      ('date_format', 'YYYY-MM-DD')
    `);
    
    console.log(`✅ All tables created in: ${tenantDbName}`);
    await tenantPool.end();
    
  } catch (error) {
    console.error(`❌ Failed to create tenant database ${tenantDbName}:`, error);
    throw error;
  }
};

// Initialize function (optional - not really needed without master DB)
export const initDatabase = async (): Promise<void> => {
  console.log('✅ No master database - each tenant gets their own database');
  console.log(`📊 MySQL host: ${process.env.DB_HOST || 'localhost'}`);
  
  // Test root connection
  const rootPool = await getRootPool();
  await rootPool.query('SELECT 1');
  console.log('✅ MySQL server connection successful');
};

export default { getRootPool, getTenantPool, createTenantDatabase, initDatabase };