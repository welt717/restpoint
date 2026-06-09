const { executeQuery } = require('../config/database');

const migrations = [
  // ==================== DECEASED TABLE ====================
  {
    name: '001_create_deceased_table',
    up: `
      CREATE TABLE IF NOT EXISTS deceased (
        deceased_id VARCHAR(50) PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        admission_number VARCHAR(100) UNIQUE,
        email VARCHAR(255),
        phone_number VARCHAR(20),
        date_of_death TIMESTAMP NULL,
        date_admitted TIMESTAMP NULL ,
        cause_of_death TEXT,
        status ENUM('active', 'pending', 'completed', 'archived') DEFAULT 'active',
        total_mortuary_charge DECIMAL(10, 2) DEFAULT 0,
        coffin_status VARCHAR(50),
        dispatch_date TIMESTAMP NULL,
        created_at TIMESTAMP NULL ,
        updated_at TIMESTAMP NULL  ,
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `
  },

  // ==================== NEXT OF KIN TABLE ====================
  {
    name: '002_create_next_of_kin_table',
    up: `
      CREATE TABLE IF NOT EXISTS next_of_kin (
        id INT AUTO_INCREMENT PRIMARY KEY,
        deceased_id VARCHAR(50) NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        relationship VARCHAR(100),
        contact VARCHAR(20),
        email VARCHAR(255),
        created_at TIMESTAMP NULL ,
        FOREIGN KEY (deceased_id) REFERENCES deceased(deceased_id) ON DELETE CASCADE,
        INDEX idx_deceased_id (deceased_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `
  },

  // ==================== PORTAL SESSIONS TABLE ====================
  {
    name: '003_create_portal_sessions_table',
    up: `
      CREATE TABLE IF NOT EXISTS portal_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        deceased_id VARCHAR(50) NOT NULL,
        session_token VARCHAR(500),
        logged_in_at TIMESTAMP NULL ,
        last_activity TIMESTAMP NULL ,
        ip_address VARCHAR(50),
        user_agent VARCHAR(500),
        active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP NULL ,
        FOREIGN KEY (deceased_id) REFERENCES deceased(deceased_id) ON DELETE CASCADE,
        INDEX idx_deceased_id (deceased_id),
        INDEX idx_active (active)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `
  },

  // ==================== MARKETPLACE PRODUCTS TABLE ====================
  {
    name: '004_create_marketplace_products_table',
    up: `
      CREATE TABLE IF NOT EXISTS marketplace_products (
        product_id INT AUTO_INCREMENT PRIMARY KEY,
        deceased_id VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category ENUM('caskets', 'flowers', 'services', 'urns', 'other') DEFAULT 'other',
        price DECIMAL(10, 2) NOT NULL,
        quantity_available INT DEFAULT 0,
        image_url VARCHAR(500),
        status ENUM('available', 'unavailable', 'discontinued') DEFAULT 'available',
        created_at TIMESTAMP NULL ,
        updated_at TIMESTAMP NULL  ,
        FOREIGN KEY (deceased_id) REFERENCES deceased(deceased_id) ON DELETE CASCADE,
        INDEX idx_deceased_id (deceased_id),
        INDEX idx_category (category),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `
  },

  // ==================== SHOPPING CART TABLE ====================
  {
    name: '005_create_shopping_cart_table',
    up: `
      CREATE TABLE IF NOT EXISTS shopping_cart (
        cart_id INT AUTO_INCREMENT PRIMARY KEY,
        deceased_id VARCHAR(50) NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        added_at TIMESTAMP NULL ,
        FOREIGN KEY (deceased_id) REFERENCES deceased(deceased_id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES marketplace_products(product_id) ON DELETE CASCADE,
        INDEX idx_deceased_id (deceased_id),
        UNIQUE KEY uk_deceased_product (deceased_id, product_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `
  },

  // ==================== ORDERS TABLE ====================
  {
    name: '006_create_orders_table',
    up: `
      CREATE TABLE IF NOT EXISTS orders (
        order_id INT AUTO_INCREMENT PRIMARY KEY,
        deceased_id VARCHAR(50) NOT NULL,
        order_number VARCHAR(50) UNIQUE,
        total_amount DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'confirmed', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
        payment_status ENUM('unpaid', 'partial', 'paid', 'refunded') DEFAULT 'unpaid',
        order_date TIMESTAMP NULL ,
        completion_date TIMESTAMP NULL,
        notes TEXT,
        created_at TIMESTAMP NULL ,
        updated_at TIMESTAMP NULL  ,
        FOREIGN KEY (deceased_id) REFERENCES deceased(deceased_id) ON DELETE CASCADE,
        INDEX idx_deceased_id (deceased_id),
        INDEX idx_status (status),
        INDEX idx_order_date (order_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `
  },

  // ==================== ORDER ITEMS TABLE ====================
  {
    name: '007_create_order_items_table',
    up: `
      CREATE TABLE IF NOT EXISTS order_items (
        item_id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(255),
        quantity INT NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP NULL ,
        FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES marketplace_products(product_id),
        INDEX idx_order_id (order_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `
  },

  // ==================== INVOICES TABLE ====================
  {
    name: '008_create_invoices_table',
    up: `
      CREATE TABLE IF NOT EXISTS invoices (
        invoice_id INT AUTO_INCREMENT PRIMARY KEY,
        deceased_id VARCHAR(50) NOT NULL,
        order_id INT,
        invoice_number VARCHAR(50) UNIQUE,
        amount DECIMAL(10, 2) NOT NULL,
        status ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
        issue_date TIMESTAMP NULL ,
        due_date TIMESTAMP NULL,
        paid_date TIMESTAMP NULL,
        notes TEXT,
        created_at TIMESTAMP NULL ,
        updated_at TIMESTAMP NULL  ,
        FOREIGN KEY (deceased_id) REFERENCES deceased(deceased_id) ON DELETE CASCADE,
        FOREIGN KEY (order_id) REFERENCES orders(order_id),
        INDEX idx_deceased_id (deceased_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `
  },

  // ==================== PAYMENTS TABLE ====================
  {
    name: '009_create_payments_table',
    up: `
      CREATE TABLE IF NOT EXISTS payments (
        payment_id INT AUTO_INCREMENT PRIMARY KEY,
        deceased_id VARCHAR(50) NOT NULL,
        invoice_id INT,
        amount DECIMAL(10, 2) NOT NULL,
        payment_method ENUM('cash', 'card', 'bank_transfer', 'mobile_money', 'check') DEFAULT 'cash',
        payment_date TIMESTAMP NULL ,
        reference_number VARCHAR(100),
        status ENUM('pending', 'confirmed', 'failed', 'refunded') DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP NULL ,
        FOREIGN KEY (deceased_id) REFERENCES deceased(deceased_id) ON DELETE CASCADE,
        FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id),
        INDEX idx_deceased_id (deceased_id),
        INDEX idx_payment_date (payment_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `
  },

  // ==================== DOCUMENTS TABLE ====================
  {
    name: '010_create_documents_table',
    up: `
      CREATE TABLE IF NOT EXISTS documents (
        document_id INT AUTO_INCREMENT PRIMARY KEY,
        deceased_id VARCHAR(50) NOT NULL,
        document_type VARCHAR(100),
        file_name VARCHAR(255),
        file_path VARCHAR(500),
        file_size INT,
        uploaded_by VARCHAR(255),
        status ENUM('pending', 'approved', 'rejected', 'archived') DEFAULT 'pending',
        uploaded_at TIMESTAMP NULL ,
        created_at TIMESTAMP NULL ,
        FOREIGN KEY (deceased_id) REFERENCES deceased(deceased_id) ON DELETE CASCADE,
        INDEX idx_deceased_id (deceased_id),
        INDEX idx_document_type (document_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `
  },

  // ==================== PORTAL TRACKING TABLE ====================
  {
    name: '011_create_portal_tracking_table',
    up: `
      CREATE TABLE IF NOT EXISTS portal_tracking (
        id INT AUTO_INCREMENT PRIMARY KEY,
        deceased_id VARCHAR(50) NOT NULL,
        status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
        remarks TEXT,
        last_updated TIMESTAMP NULL  ,
        FOREIGN KEY (deceased_id) REFERENCES deceased(deceased_id) ON DELETE CASCADE,
        UNIQUE KEY uk_deceased_id (deceased_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `
  },

  // ==================== MIGRATIONS TABLE ====================
  {
    name: '012_create_migrations_table',
    up: `
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        migration_name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP NULL 
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `
  }
];

const runMigrations = async () => {
  try {
    console.log('\n🔄 Starting database migrations...\n');

    // Get executed migrations
    const executedMigrations = await executeQuery(
      'SELECT migration_name FROM migrations'
    ).catch(() => []);

    const executedNames = executedMigrations.map(m => m.migration_name);

    let executedCount = 0;

    for (const migration of migrations) {
      if (executedNames.includes(migration.name)) {
        console.log(`✓ Skipped (already executed): ${migration.name}`);
        continue;
      }

      try {
        await executeQuery(migration.up);
        await executeQuery(
          'INSERT INTO migrations (migration_name) VALUES (?)',
          [migration.name]
        );
        console.log(`✓ Executed: ${migration.name}`);
        executedCount++;
      } catch (error) {
        console.error(`✗ Failed: ${migration.name}`);
        console.error(`  Error: ${error.message}`);
        throw error;
      }
    }

    console.log(`\n✓ Migrations completed! ${executedCount} new migrations executed.\n`);
  } catch (error) {
    console.error('\n✗ Migration failed:', error.message);
    process.exit(1);
  }
};

module.exports = {
  migrations,
  runMigrations
};
