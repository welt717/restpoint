-- Multi-Tenant Coffin Management Tables
-- Version: 001
-- Description: Create coffin management tables with tenant isolation
-- Fixed: Uses tenant_slug instead of generic tenant_id

-- Coffins table with tenant support
CREATE TABLE IF NOT EXISTS `coffins` (
  `coffin_id` INT NOT NULL AUTO_INCREMENT,
  `custom_id` VARCHAR(100) NOT NULL COMMENT 'User-friendly custom ID',
  `tenant_slug` VARCHAR(100) NOT NULL COMMENT 'Tenant slug for isolation',
  `type` VARCHAR(255) NOT NULL COMMENT 'Coffin type/model',
  `material` VARCHAR(255) NOT NULL COMMENT 'Material type',
  `exact_price` DECIMAL(15,2) NOT NULL COMMENT 'Price in local currency',
  `currency` ENUM('KES', 'USD', 'EUR', 'GBP') DEFAULT 'KES' COMMENT 'Currency',
  `price_usd` DECIMAL(15,2) DEFAULT NULL COMMENT 'Price in USD',
  `exchange_rate` DECIMAL(10,4) DEFAULT NULL COMMENT 'Exchange rate used',
  `quantity` INT DEFAULT 1 COMMENT 'Stock quantity',
  `minimum_stock` INT DEFAULT 5 COMMENT 'Minimum stock level for alerts',
  `supplier` VARCHAR(255) DEFAULT NULL COMMENT 'Supplier name',
  `supplier_contact` VARCHAR(100) DEFAULT NULL COMMENT 'Supplier contact',
  `origin` VARCHAR(255) DEFAULT NULL COMMENT 'Country of origin',
  `color` VARCHAR(100) DEFAULT NULL COMMENT 'Color',
  `size` VARCHAR(100) DEFAULT NULL COMMENT 'Size description',
  `description` TEXT COMMENT 'Full description',
  `category` ENUM('locally_made', 'imported') DEFAULT 'locally_made',
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_by` INT DEFAULT NULL COMMENT 'User who created',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` BOOLEAN DEFAULT FALSE,
  
  PRIMARY KEY (`coffin_id`),
  UNIQUE KEY `unique_custom_id_per_tenant` (`tenant_slug`, `custom_id`),
  INDEX `idx_tenant_id` (`tenant_slug`),
  INDEX `idx_type` (`type`),
  INDEX `idx_category` (`category`),
  INDEX `idx_quantity` (`quantity`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_created_at` (`created_at`),
  
  FOREIGN KEY (`tenant_slug`) REFERENCES `tenants`(`tenant_slug`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Coffins with tenant isolation';

-- Coffin Images table with tenant isolation
CREATE TABLE IF NOT EXISTS `coffin_images` (
  `image_id` INT NOT NULL AUTO_INCREMENT,
  `coffin_id` INT NOT NULL,
  `tenant_slug` VARCHAR(100) NOT NULL,
  `image_url` VARCHAR(500) NOT NULL,
  `image_name` VARCHAR(255),
  `display_order` INT DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`image_id`),
  INDEX `idx_coffin_id` (`coffin_id`),
  INDEX `idx_tenant_id` (`tenant_slug`),
  INDEX `idx_created_at` (`created_at`),
  
  FOREIGN KEY (`coffin_id`) REFERENCES `coffins`(`coffin_id`) ON DELETE CASCADE,
  FOREIGN KEY (`tenant_slug`) REFERENCES `tenants`(`tenant_slug`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Coffin images with tenant isolation';

-- Coffin Purchases/Usage table for tracking sales
CREATE TABLE IF NOT EXISTS `coffin_usage` (
  `usage_id` INT NOT NULL AUTO_INCREMENT,
  `coffin_id` INT NOT NULL,
  `tenant_slug` VARCHAR(100) NOT NULL,
  `deceased_id` VARCHAR(100),
  `quantity_used` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(15,2) NOT NULL,
  `total_price` DECIMAL(15,2) NOT NULL,
  `invoice_id` VARCHAR(100),
  `used_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes` TEXT,
  `created_by` INT,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`usage_id`),
  INDEX `idx_coffin_id` (`coffin_id`),
  INDEX `idx_tenant_slug` (`tenant_slug`),
  INDEX `idx_deceased_id` (`deceased_id`),
  INDEX `idx_invoice_id` (`invoice_id`),
  INDEX `idx_used_at` (`used_at`),
  
  FOREIGN KEY (`coffin_id`) REFERENCES `coffins`(`coffin_id`) ON DELETE CASCADE,
  FOREIGN KEY (`tenant_slug`) REFERENCES `tenants`(`tenant_slug`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Coffin usage tracking for invoicing';

-- Deceased Coffin Assignment table with tenant isolation
CREATE TABLE IF NOT EXISTS `deceased_coffin` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `deceased_id` VARCHAR(100) NOT NULL,
  `coffin_id` INT NOT NULL,
  `tenant_id` VARCHAR(50) NOT NULL,
  `assigned_by_username` VARCHAR(100) DEFAULT NULL,
  `assigned_date` DATE NOT NULL,
  `rfid` VARCHAR(100) UNIQUE COMMENT 'RFID tag for tracking',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  INDEX `idx_deceased_id` (`deceased_id`),
  INDEX `idx_coffin_id` (`coffin_id`),
  INDEX `idx_tenant_id` (`tenant_id`),
  INDEX `idx_assigned_date` (`assigned_date`),
  UNIQUE KEY `unique_deceased_coffin` (`deceased_id`, `coffin_id`),
  FOREIGN KEY (`coffin_id`) REFERENCES `coffins`(`coffin_id`) ON DELETE RESTRICT,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`slug`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert some default coffin types
INSERT IGNORE INTO `coffins` (custom_id, tenant_id, type, material, exact_price, currency, price_usd, exchange_rate, quantity, category) VALUES
('COF-STD-001', 'system_shared', 'Standard Wooden', 'Pine Wood', 25000, 'KES', 166.67, 150, 10, 'locally_made'),
('COF-PRM-001', 'system_shared', 'Premium Oak', 'Oak Wood', 75000, 'KES', 500.00, 150, 5, 'imported'),
('COF-DLX-001', 'system_shared', 'Deluxe Velvet', 'Velvet with Wood', 120000, 'KES', 800.00, 150, 3, 'imported');