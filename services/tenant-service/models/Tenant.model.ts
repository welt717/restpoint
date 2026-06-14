import bcrypt  from 'bcryptjs';
import mysql from 'mysql2/promise';
import slugify from 'slugify';

export interface RegisterTenantData {
    tenant_name: string;
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    location?: string;
    country?: string;
    branches?: Array<{
        branch_name: string;
        branch_location: string;
        branch_phone: string;
        branch_email: string;
    }>;
}

export interface Tenant {
    tenant_id: number;
    tenant_name: string;
    tenant_slug: string;
    db_name: string;
    email: string;
    phone: string | null;
    location: string | null;
    country: string | null;
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
        });
        
    }
    return serverConnection;
}

function generateSlug(tenantName: string): string {
    const slugifyFn = typeof slugify === 'function' ? slugify : (slugify as any).default;
    return slugifyFn(tenantName, {
        lower: true,
        strict: true,
        remove: /[*+~.()'"!:@]/g,
        trim: true
    });
}

async function createCompleteTenantDatabase(
    tenantName: string, 
    subdomain: string, 
    email: string, 
    password_hash: string, 
    full_name: string, 
    phone: string | null,
    country: string | null,
    branches: Array<{branch_name: string; branch_location: string; branch_phone: string; branch_email: string}> | undefined
): Promise<{ dbName: string }> {
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
    
    // Step 3: Create all tables with branches, base charges, marketplace
    await tenantConn.query(`
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            phone VARCHAR(20),
            role ENUM('admin', 'manager', 'staff', 'user') DEFAULT 'user',
            branch_id INT,
            is_active BOOLEAN DEFAULT TRUE,
            is_verified BOOLEAN DEFAULT FALSE,
            last_login_at TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_email (email)
        );
        
        -- Branches table
        CREATE TABLE IF NOT EXISTS branches (
            branch_id INT AUTO_INCREMENT PRIMARY KEY,
            branch_name VARCHAR(255) NOT NULL,
            branch_location TEXT,
            branch_phone VARCHAR(20),
            branch_email VARCHAR(255),
            branch_slug VARCHAR(255) UNIQUE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
        
        -- Mortuary settings table
        CREATE TABLE IF NOT EXISTS mortuary_settings (
            id INT AUTO_INCREMENT PRIMARY KEY,
            setting_key VARCHAR(100) NOT NULL UNIQUE,
            setting_value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
        
        -- Base charges table (tenant-wide defaults)
        CREATE TABLE IF NOT EXISTS base_charges (
            charge_id INT AUTO_INCREMENT PRIMARY KEY,
            charge_name VARCHAR(255) NOT NULL,
            charge_description TEXT,
            amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            charge_category ENUM('collection', 'storage', 'embalming', 'documentation', 'transport', 'casket', 'burial', 'cremation', 'other') DEFAULT 'other',
            is_mandatory BOOLEAN DEFAULT FALSE,
            is_percentage BOOLEAN DEFAULT FALSE,
            tax_percentage DECIMAL(5,2) DEFAULT 0.00,
            branch_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE SET NULL,
            INDEX idx_category (charge_category)
        );
        
        -- Deceased table (with branch_id)
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
            branch_id INT,
            next_of_kin_name VARCHAR(255),
            next_of_kin_phone VARCHAR(20),
            next_of_kin_relationship VARCHAR(100),
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
            FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE SET NULL,
            INDEX idx_name (full_name),
            INDEX idx_date_of_death (date_of_death),
            INDEX idx_branch (branch_id),
            INDEX idx_nok_phone (next_of_kin_phone)
        );
        
        -- Individual charge overrides per deceased
        CREATE TABLE IF NOT EXISTS charge_overrides (
            override_id INT AUTO_INCREMENT PRIMARY KEY,
            deceased_id INT NOT NULL,
            charge_id INT NOT NULL,
            override_amount DECIMAL(12,2),
            is_waived BOOLEAN DEFAULT FALSE,
            notes TEXT,
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (deceased_id) REFERENCES deceased(deceased_id) ON DELETE CASCADE,
            FOREIGN KEY (charge_id) REFERENCES base_charges(charge_id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
            UNIQUE KEY unique_deceased_charge (deceased_id, charge_id)
        );
        
        -- Marketplace products (per tenant listing)
        CREATE TABLE IF NOT EXISTS marketplace_products (
            product_id INT AUTO_INCREMENT PRIMARY KEY,
            product_name VARCHAR(255) NOT NULL,
            description TEXT,
            price DECIMAL(12,2) NOT NULL,
            category ENUM('flowers', 'catering', 'keepsakes', 'caskets', 'transport', 'clothing', 'music', 'photography', 'other') DEFAULT 'other',
            stock_quantity INT DEFAULT 0,
            is_available BOOLEAN DEFAULT TRUE,
            image_url VARCHAR(500),
            branch_id INT,
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE SET NULL,
            FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
            INDEX idx_category (category),
            INDEX idx_available (is_available)
        );
        
        -- Marketplace orders (real-time)
        CREATE TABLE IF NOT EXISTS marketplace_orders (
            order_id INT AUTO_INCREMENT PRIMARY KEY,
            deceased_id INT,
            customer_name VARCHAR(255) NOT NULL,
            customer_phone VARCHAR(20) NOT NULL,
            customer_email VARCHAR(255),
            delivery_branch_id INT,
            order_status ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled') DEFAULT 'pending',
            total_amount DECIMAL(12,2) DEFAULT 0.00,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (deceased_id) REFERENCES deceased(deceased_id) ON DELETE SET NULL,
            FOREIGN KEY (delivery_branch_id) REFERENCES branches(branch_id) ON DELETE SET NULL,
            INDEX idx_status (order_status),
            INDEX idx_customer_phone (customer_phone),
            INDEX idx_created (created_at)
        );
        
        -- Marketplace order items
        CREATE TABLE IF NOT EXISTS marketplace_order_items (
            item_id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL DEFAULT 1,
            unit_price DECIMAL(12,2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (order_id) REFERENCES marketplace_orders(order_id) ON DELETE CASCADE,
            FOREIGN KEY (product_id) REFERENCES marketplace_products(product_id) ON DELETE CASCADE
        );
        
        -- Chemicals / Products in stock (Chemical Management Module)
        CREATE TABLE IF NOT EXISTS chemicals (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100) DEFAULT 'embalming',
            unit VARCHAR(50) NOT NULL DEFAULT 'liters',
            current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
            min_stock_level DECIMAL(10,2) DEFAULT 0,
            unit_cost DECIMAL(10,2) DEFAULT 0,
            supplier VARCHAR(255) DEFAULT NULL,
            batch_number VARCHAR(100) DEFAULT NULL,
            expiry_date DATE DEFAULT NULL,
            notes TEXT DEFAULT NULL,
            is_active TINYINT(1) DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_chemicals_category (category),
            INDEX idx_chemicals_active (is_active)
        );
        
        -- Stock transactions (received, consumed, adjusted)
        CREATE TABLE IF NOT EXISTS chemical_transactions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            chemical_id INT NOT NULL,
            transaction_type ENUM('received', 'consumed', 'adjusted', 'wasted') NOT NULL,
            quantity DECIMAL(10,2) NOT NULL,
            unit VARCHAR(50) NOT NULL DEFAULT 'liters',
            previous_stock DECIMAL(10,2) NOT NULL,
            new_stock DECIMAL(10,2) NOT NULL,
            reference_type VARCHAR(50) DEFAULT NULL,
            reference_id INT DEFAULT NULL,
            performed_by INT DEFAULT NULL,
            notes TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chemical_id) REFERENCES chemicals(id) ON DELETE CASCADE,
            INDEX idx_transactions_chemical (chemical_id),
            INDEX idx_transactions_type (transaction_type),
            INDEX idx_transactions_date (created_at)
        );
        
        -- Chemical usage per deceased
        CREATE TABLE IF NOT EXISTS deceased_chemical_usage (
            id INT AUTO_INCREMENT PRIMARY KEY,
            deceased_id INT NOT NULL,
            chemical_id INT NOT NULL,
            quantity_used DECIMAL(10,2) NOT NULL,
            unit VARCHAR(50) NOT NULL DEFAULT 'liters',
            transaction_id INT DEFAULT NULL,
            used_by INT DEFAULT NULL,
            usage_notes TEXT DEFAULT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chemical_id) REFERENCES chemicals(id) ON DELETE CASCADE,
            FOREIGN KEY (transaction_id) REFERENCES chemical_transactions(id) ON DELETE SET NULL,
            INDEX idx_usage_deceased (deceased_id),
            INDEX idx_usage_chemical (chemical_id),
            INDEX idx_usage_date (created_at)
        );
        
        -- Low stock alerts configuration
        CREATE TABLE IF NOT EXISTS chemical_alerts (
            id INT AUTO_INCREMENT PRIMARY KEY,
            chemical_id INT NOT NULL,
            alert_threshold DECIMAL(10,2) DEFAULT NULL,
            is_triggered TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chemical_id) REFERENCES chemicals(id) ON DELETE CASCADE,
            UNIQUE KEY uk_chemical_alert (chemical_id)
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
        ('country', ?),
        ('timezone', 'Africa/Nairobi'),
        ('currency', 'KES'),
        ('date_format', 'YYYY-MM-DD'),
        ('time_format', '24h')
    `, [tenantName, subdomain, country || 'Kenya']);
    
    console.log(`✅ Default settings inserted`);
    
    // Step 5: Create admin user
    await tenantConn.query(`
        INSERT INTO users (email, password_hash, full_name, phone, role, is_verified, is_active)
        VALUES (?, ?, ?, ?, 'admin', 1, 1)
    `, [email, password_hash, full_name, phone]);
    
    console.log(`✅ Admin user created`);
    
    // Step 6: Insert branches if provided
    if (branches && branches.length > 0) {
        const branchInsertPromises = branches.map(async (branch) => {
            const branchSlug = generateSlug(branch.branch_name);
            await tenantConn.query(
                `INSERT INTO branches (branch_name, branch_location, branch_phone, branch_email, branch_slug, is_active) 
                 VALUES (?, ?, ?, ?, ?, 1)`,
                [branch.branch_name, branch.branch_location, branch.branch_phone, branch.branch_email, branchSlug]
            );
        });
        await Promise.all(branchInsertPromises);
        console.log(`✅ ${branches.length} branches created`);
    } else {
        // Create a default branch
        await tenantConn.query(
            `INSERT INTO branches (branch_name, branch_location, branch_phone, branch_email, branch_slug, is_active) 
             VALUES (?, ?, ?, ?, ?, 1)`,
            [tenantName, 'Main Location', phone || '', email, 'main-branch']
        );
        console.log(`✅ Default branch created`);
    }
    
    // Step 7: Skip default charges - tenants set them in Settings page
    console.log(`ℹ️ No default charges seeded - tenant will configure in Settings`);
    
    // Step 8: Log the activity
    await tenantConn.query(`
        INSERT INTO activity_logs (user_id, action, details)
        VALUES (1, 'TENANT_CREATED', ?)
    `, [`Tenant database ${dbName} created with admin user ${email}, ${branches?.length || 1} branches`]);
    
    await tenantConn.end();
    
    console.log(`✅ Complete tenant database setup finished for: ${dbName}`);
    console.log(`✅ Branches: ${branches?.length || 1}`);
    
    return { dbName };
}

export class TenantModel {
    static async registerTenant(data: RegisterTenantData): Promise<{ tenant: Tenant; token: string }> {
        const { tenant_name, email, password, full_name, phone, location, country, branches } = data;
        
        const subdomain = generateSlug(tenant_name);
        const password_hash = await bcrypt.hash(password, 10);
        
        const serverConn = await getServerConnection();
        
        // Step 1: Create the tenants tracking table if it doesn't exist
        await serverConn.query(`
            CREATE DATABASE IF NOT EXISTS tenant_tracking
        `);
        
        // Update tenants table to include country
        const [columns] = await serverConn.query(
            `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
             WHERE TABLE_SCHEMA = 'tenant_tracking' AND TABLE_NAME = 'tenants' AND COLUMN_NAME = 'country'`
        );
        
        if (!Array.isArray(columns) || columns.length === 0) {
            try {
                await serverConn.query(
                    `ALTER TABLE tenant_tracking.tenants ADD COLUMN country VARCHAR(100) NULL AFTER location`
                );
            } catch (e) {
                // Column might already exist
            }
        }
        
        await serverConn.query(`
            CREATE TABLE IF NOT EXISTS tenant_tracking.tenants (
                tenant_id INT PRIMARY KEY AUTO_INCREMENT,
                tenant_name VARCHAR(255) NOT NULL,
                tenant_slug VARCHAR(255) UNIQUE NOT NULL,
                db_name VARCHAR(255) UNIQUE NOT NULL,
                email VARCHAR(255) NOT NULL,
                phone VARCHAR(50),
                location TEXT,
                country VARCHAR(100),
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
            phone || null,
            country || null,
            branches
        );
        
        // Step 4: Register tenant in tracking table
        const [result] = await serverConn.query(
            `INSERT INTO tenant_tracking.tenants (tenant_name, tenant_slug, db_name, email, phone, location, country, status, subscription_status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 'trial')`,
            [tenant_name, subdomain, dbName, email, phone || null, location || null, country || null]
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
            await initializeUploadsDirectory();
            const folderResult = await createTenantFolders(subdomain);
            if (folderResult.success) {
                console.log(`📂 Tenant folders created: ${JSON.stringify(folderResult.paths)}`);
            }
        } catch (folderError: any) {
            console.warn(`⚠️ Could not create tenant folders: ${folderError.message}`);
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
        console.log(`🌍 Country: ${country || 'Not specified'}`);
        console.log(`🏢 Branches: ${branches?.length || 1}`);
        
        return { tenant: tenant as Tenant, token };
    }
    
    // ─── Branch Operations ───────────────────────────────────────────────
    
    static async getBranches(tenantDbName: string): Promise<any[]> {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: tenantDbName
        });
        
        try {
            const [rows] = await conn.query(
                'SELECT * FROM branches WHERE is_active = TRUE ORDER BY branch_name'
            );
            return rows as any[];
        } finally {
            await conn.end();
        }
    }
    
    static async addBranch(tenantDbName: string, branch: {
        branch_name: string;
        branch_location: string;
        branch_phone: string;
        branch_email: string;
    }): Promise<any> {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: tenantDbName
        });
        
        try {
            const branchSlug = generateSlug(branch.branch_name) + '-' + Date.now();
            const [result] = await conn.query(
                `INSERT INTO branches (branch_name, branch_location, branch_phone, branch_email, branch_slug, is_active) 
                 VALUES (?, ?, ?, ?, ?, 1)`,
                [branch.branch_name, branch.branch_location, branch.branch_phone, branch.branch_email, branchSlug]
            );
            return (result as any).insertId;
        } finally {
            await conn.end();
        }
    }
    
    // ─── Base Charges Operations ──────────────────────────────────────────
    
    static async getBaseCharges(tenantDbName: string): Promise<any[]> {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: tenantDbName
        });
        
        try {
            const [rows] = await conn.query(
                'SELECT bc.*, b.branch_name FROM base_charges bc LEFT JOIN branches b ON bc.branch_id = b.branch_id ORDER BY bc.charge_category'
            );
            return rows as any[];
        } finally {
            await conn.end();
        }
    }
    
    static async upsertBaseCharge(tenantDbName: string, charge: {
        charge_id?: number;
        charge_name: string;
        charge_description: string;
        amount: number;
        charge_category: string;
        is_mandatory: boolean;
        branch_id?: number | null;
    }): Promise<any> {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: tenantDbName
        });
        
        try {
            if (charge.charge_id) {
                await conn.query(
                    `UPDATE base_charges SET charge_name=?, charge_description=?, amount=?, charge_category=?, is_mandatory=?, branch_id=? WHERE charge_id=?`,
                    [charge.charge_name, charge.charge_description, charge.amount, charge.charge_category, charge.is_mandatory, charge.branch_id || null, charge.charge_id]
                );
                return charge.charge_id;
            } else {
                const [result] = await conn.query(
                    `INSERT INTO base_charges (charge_name, charge_description, amount, charge_category, is_mandatory, branch_id) VALUES (?, ?, ?, ?, ?, ?)`,
                    [charge.charge_name, charge.charge_description, charge.amount, charge.charge_category, charge.is_mandatory, charge.branch_id || null]
                );
                return (result as any).insertId;
            }
        } finally {
            await conn.end();
        }
    }
    
    // ─── Marketplace Operations ───────────────────────────────────────────
    
    static async getMarketplaceProducts(tenantDbName: string): Promise<any[]> {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: tenantDbName
        });
        
        try {
            const [rows] = await conn.query(
                'SELECT mp.*, b.branch_name FROM marketplace_products mp LEFT JOIN branches b ON mp.branch_id = b.branch_id WHERE mp.is_available = TRUE ORDER BY mp.created_at DESC'
            );
            return rows as any[];
        } finally {
            await conn.end();
        }
    }
    
    static async createOrder(tenantDbName: string, order: {
        customer_name: string;
        customer_phone: string;
        customer_email?: string;
        deceased_id?: number;
        delivery_branch_id?: number;
        items: Array<{ product_id: number; quantity: number; unit_price: number }>;
        notes?: string;
    }): Promise<number> {
        const conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: tenantDbName
        });
        
        try {
            const totalAmount = order.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
            
            const [result] = await conn.query(
                `INSERT INTO marketplace_orders (customer_name, customer_phone, customer_email, deceased_id, delivery_branch_id, total_amount, notes, order_status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
                [order.customer_name, order.customer_phone, order.customer_email || null, order.deceased_id || null, order.delivery_branch_id || null, totalAmount, order.notes || null]
            );
            
            const orderId = (result as any).insertId;
            
            for (const item of order.items) {
                await conn.query(
                    `INSERT INTO marketplace_order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)`,
                    [orderId, item.product_id, item.quantity, item.unit_price]
                );
            }
            
            return orderId;
        } finally {
            await conn.end();
        }
    }
    
    // ─── Existing Methods ─────────────────────────────────────────────────
    
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
            'SELECT tenant_id, tenant_name, tenant_slug, email, country, status, created_at FROM tenant_tracking.tenants ORDER BY created_at DESC'
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
    
    // ─── Portal Login: Find deceased by phone → detect branch/tenant ─────
    
    static async findDeceasedByPhone(phone: string): Promise<{
        tenant: Tenant;
        deceased: any;
        branch: any;
    } | null> {
        // Search across all tenant databases
        const allTenants = await this.getAllTenants();
        
        for (const tenant of allTenants) {
            try {
                const conn = await mysql.createConnection({
                    host: process.env.DB_HOST || 'localhost',
                    port: parseInt(process.env.DB_PORT || '3306'),
                    user: process.env.DB_USER || 'root',
                    password: process.env.DB_PASSWORD || '',
                    database: tenant.db_name
                });
                
                const [rows] = await conn.query(
                    `SELECT d.*, b.branch_name, b.branch_location, b.branch_phone 
                     FROM deceased d 
                     LEFT JOIN branches b ON d.branch_id = b.branch_id 
                     WHERE d.next_of_kin_phone = ? 
                     LIMIT 1`,
                    [phone]
                );
                
                await conn.end();
                
                const deceasedArray = rows as any[];
                if (deceasedArray.length > 0) {
                    const deceased = deceasedArray[0];
                    
                    // Get branch info
                    let branch = null;
                    if (deceased.branch_id) {
                        const branchConn = await mysql.createConnection({
                            host: process.env.DB_HOST || 'localhost',
                            port: parseInt(process.env.DB_PORT || '3306'),
                            user: process.env.DB_USER || 'root',
                            password: process.env.DB_PASSWORD || '',
                            database: tenant.db_name
                        });
                        const [branchRows] = await branchConn.query(
                            'SELECT * FROM branches WHERE branch_id = ?',
                            [deceased.branch_id]
                        );
                        await branchConn.end();
                        branch = (branchRows as any[])[0] || null;
                    }
                    
                    return { tenant, deceased, branch };
                }
            } catch (err) {
                continue; // Try next tenant
            }
        }
        
        return null;
    }
}