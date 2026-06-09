import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import slugify from 'slugify';

export interface RegisterTenantData {
    tenant_name: string;
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    location?: string;
}

export interface Tenant {
    tenant_id: number;
    tenant_name: string;
    tenant_slug: string;
    db_name: string;
    email: string;
    phone: string | null;
    location: string | null;
    logo_url: string | null;
    status: 'active' | 'suspended' | 'deleted';
    subscription_status: 'active' | 'trial' | 'suspended' | 'cancelled';
    subscription_expires_at: Date | null;
    created_at: Date;
    updated_at: Date;
}

// Connection to MariaDB server (NO DATABASE SELECTED)
let serverConnection: mysql.Connection | null = null;

async function getServerConnection(): Promise<mysql.Connection> {
    if (!serverConnection) {
        serverConnection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            // NO database selected here - just connect to MariaDB server
        });
        console.log('✅ Connected to MariaDB server (no database selected)');
    }
    return serverConnection;
}

function generateSlug(tenantName: string): string {
    return slugify(tenantName, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g,
        trim: true
    });
}

async function createCompleteTenantDatabase(tenantName: string, subdomain: string, email: string, password_hash: string, full_name: string, phone: string | null): Promise<{ dbName: string }> {
    const dbName = `mortuary_${subdomain}_${Date.now()}`.replace(/-/g, '_');
    
    console.log(`📦 Creating complete tenant database: ${dbName}`);
    
    const serverConn = await getServerConnection();
    
    // Step 1: Create the database
    await serverConn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database created: ${dbName}`);
    
    // Step 2: Connect to the new database
    const tenantConn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: dbName,
        multipleStatements: true
    });
    
    console.log(`🔄 Creating all tables in ${dbName}...`);
    
    // Step 3: Create all tables
    await tenantConn.query(`
        -- Users table
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
        );
        
        -- Mortuary settings table
        CREATE TABLE IF NOT EXISTS mortuary_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            setting_key VARCHAR(100) NOT NULL UNIQUE,
            setting_value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
        
        -- Deceased table
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
        );
        
        -- Funeral arrangements table
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
        );
        
        -- Refresh tokens table
        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            token VARCHAR(500) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
            INDEX idx_token (token(255))
        );
        
        -- Activity logs table
        CREATE TABLE IF NOT EXISTS activity_logs (
            log_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            action VARCHAR(255) NOT NULL,
            details TEXT,
            ip_address VARCHAR(45),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
            INDEX idx_created_at (created_at)
        );
    `);
    
    console.log(`✅ All tables created in ${dbName}`);
    
    // Step 4: Insert default settings
    await tenantConn.query(`
        INSERT INTO mortuary_settings (setting_key, setting_value) VALUES 
        ('mortuary_name', ?),
        ('subdomain', ?),
        ('timezone', 'Africa/Nairobi'),
        ('currency', 'KES'),
        ('date_format', 'YYYY-MM-DD'),
        ('time_format', '24h')
    `, [tenantName, subdomain]);
    
    console.log(`✅ Default settings inserted`);
    
    // Step 5: Create admin user
    await tenantConn.query(`
        INSERT INTO users (email, password_hash, full_name, phone, role, is_verified, is_active)
        VALUES (?, ?, ?, ?, 'admin', 1, 1)
    `, [email, password_hash, full_name, phone]);
    
    console.log(`✅ Admin user created`);
    
    // Step 6: Log the activity
    await tenantConn.query(`
        INSERT INTO activity_logs (user_id, action, details)
        VALUES (1, 'TENANT_CREATED', ?)
    `, [`Tenant database ${dbName} created with admin user ${email}`]);
    
    await tenantConn.end();
    
    console.log(`✅ Complete tenant database setup finished for: ${dbName}`);
    
    return { dbName };
}

export class TenantModel {
    static async registerTenant(data: RegisterTenantData): Promise<{ tenant: Tenant; token: string }> {
        const { tenant_name, email, password, full_name, phone, location } = data;
        
        const subdomain = generateSlug(tenant_name);
        const password_hash = await bcrypt.hash(password, 10);
        
        const serverConn = await getServerConnection();
        
        // Step 1: Create the tenants tracking table if it doesn't exist (in no database)
        await serverConn.query(`
            CREATE DATABASE IF NOT EXISTS tenant_tracking
        `);
        
        await serverConn.query(`
            CREATE TABLE IF NOT EXISTS tenant_tracking.tenants (
                tenant_id INT PRIMARY KEY AUTO_INCREMENT,
                tenant_name VARCHAR(255) NOT NULL,
                tenant_slug VARCHAR(255) UNIQUE NOT NULL,
                db_name VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                location TEXT,
                logo_url VARCHAR(500),
                status ENUM('active', 'suspended', 'deleted') DEFAULT 'active',
                subscription_status ENUM('active', 'trial', 'suspended', 'cancelled') DEFAULT 'trial',
                subscription_expires_at TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);
        
        // Step 2: Check if tenant slug exists
        const [existing] = await serverConn.query(
            'SELECT tenant_id FROM tenant_tracking.tenants WHERE tenant_slug = ?',
            [subdomain]
        );
        
        if (Array.isArray(existing) && existing.length > 0) {
            throw new Error('Tenant slug already exists');
        }
        
        // Step 3: Create complete tenant database with all tables
        const { dbName } = await createCompleteTenantDatabase(
            tenant_name, 
            subdomain, 
            email, 
            password_hash, 
            full_name, 
            phone || null
        );
        
        // Step 4: Register tenant in tracking table
        const [result] = await serverConn.query(
            `INSERT INTO tenant_tracking.tenants (tenant_name, tenant_slug, db_name, email, phone, location, status, subscription_status)
             VALUES (?, ?, ?, ?, ?, ?, 'active', 'trial')`,
            [tenant_name, subdomain, dbName, email, phone || null, location || null]
        );
        
        const tenantId = (result as any).insertId;
        
        // Step 5: Get the created tenant
        const [tenants] = await serverConn.query(
            'SELECT * FROM tenant_tracking.tenants WHERE tenant_id = ?',
            [tenantId]
        );
        
        const tenant = Array.isArray(tenants) && tenants.length > 0 ? tenants[0] : null;
        
        if (!tenant) {
            throw new Error('Failed to create tenant');
        }
        
        // Step 6: Create tenant folder structure for file uploads
        try {
            const { createTenantFolders, initializeUploadsDirectory } = require('../../global/services/fileStorageService');
            
            // Initialize uploads directory if needed
            await initializeUploadsDirectory();
            
            // Create tenant-specific folders
            const folderResult = await createTenantFolders(subdomain);
            if (folderResult.success) {
                console.log(`📂 Tenant folders created: ${JSON.stringify(folderResult.paths)}`);
            } else {
                console.warn(`⚠️ Failed to create tenant folders: ${folderResult.error}`);
            }
        } catch (folderError: any) {
            console.warn(`⚠️ Could not create tenant folders: ${folderError.message}`);
            // Don't fail tenant creation if folder creation fails
        }
        
        // Step 7: Generate JWT token
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            {
                userId: 1,
                tenantId: tenant.tenant_id,
                tenantSlug: tenant.tenant_slug,
                email: email,
                role: 'admin'
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );
        
        console.log(`✅ Tenant registered: ${tenant_name} (${tenant.tenant_slug})`);
        console.log(`📁 Dedicated Database: ${dbName}`);
        console.log(`🔐 Tenant ID: ${tenant.tenant_id}`);
        console.log(`📂 Upload folders initialized`);
        
        return { tenant: tenant as Tenant, token };
    }
    
    static async findBySubdomain(slug: string): Promise<Tenant | null> {
        const serverConn = await getServerConnection();
        
        const [tenants] = await serverConn.query(
            'SELECT * FROM tenant_tracking.tenants WHERE tenant_slug = ? AND status = "active"',
            [slug]
        );
        
        const tenant = Array.isArray(tenants) && tenants.length > 0 ? tenants[0] : null;
        return tenant as Tenant | null;
    }
    
    static async findById(tenantId: number): Promise<Tenant | null> {
        const serverConn = await getServerConnection();
        
        const [tenants] = await serverConn.query(
            'SELECT * FROM tenant_tracking.tenants WHERE tenant_id = ?',
            [tenantId]
        );
        
        const tenant = Array.isArray(tenants) && tenants.length > 0 ? tenants[0] : null;
        return tenant as Tenant | null;
    }
    
    static async findByEmail(email: string): Promise<Tenant | null> {
        const serverConn = await getServerConnection();
        
        const [tenants] = await serverConn.query(
            'SELECT * FROM tenant_tracking.tenants WHERE email = ? AND status = "active"',
            [email]
        );
        
        const tenant = Array.isArray(tenants) && tenants.length > 0 ? tenants[0] : null;
        return tenant as Tenant | null;
    }
    
    static async updateStatus(tenantId: number, status: 'active' | 'suspended' | 'deleted'): Promise<void> {
        const serverConn = await getServerConnection();
        
        await serverConn.query(
            'UPDATE tenant_tracking.tenants SET status = ?, updated_at = NOW() WHERE tenant_id = ?',
            [status, tenantId]
        );
    }
    
    static async getAllTenants(): Promise<Tenant[]> {
        const serverConn = await getServerConnection();
        
        const [tenants] = await serverConn.query(
            'SELECT tenant_id, tenant_name, tenant_slug, email, status, created_at FROM tenant_tracking.tenants ORDER BY created_at DESC'
        );
        
        return tenants as Tenant[];
    }
    
    static async getTenantDatabase(tenantId: number): Promise<mysql.Connection | null> {
        const tenant = await this.findById(tenantId);
        if (!tenant) return null;
        
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: tenant.db_name
        });
        
        return connection;
    }
}