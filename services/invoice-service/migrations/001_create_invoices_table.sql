-- Multi-Tenant Invoice Management Tables
-- Version: 001
-- Description: Create invoice and invoice items tables with tenant isolation

-- Invoices table
CREATE TABLE IF NOT EXISTS `invoices` (
  `invoice_id` INT NOT NULL AUTO_INCREMENT,
  `invoice_number` VARCHAR(50) NOT NULL COMMENT 'Unique invoice number per tenant',
  `tenant_slug` VARCHAR(100) NOT NULL COMMENT 'Tenant slug for isolation',
  `deceased_id` VARCHAR(100) NOT NULL COMMENT 'Reference to deceased',
  `service_date` TIMESTAMP NULL COMMENT 'Date of service',
  `invoice_date` TIMESTAMP NULL ,
  `due_date` TIMESTAMP NULL,
  `status` ENUM('draft', 'issued', 'paid', 'partial', 'cancelled', 'overdue') DEFAULT 'draft',
  `payment_status` ENUM('unpaid', 'partial_paid', 'paid') DEFAULT 'unpaid',
  `subtotal` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `discount` DECIMAL(15,2) DEFAULT 0,
  `tax_amount` DECIMAL(15,2) DEFAULT 0,
  `tax_rate` DECIMAL(5,2) DEFAULT 0,
  `total` DECIMAL(15,2) NOT NULL,
  `amount_paid` DECIMAL(15,2) DEFAULT 0,
  `balance_due` DECIMAL(15,2) NOT NULL,
  `currency` ENUM('KES', 'USD', 'EUR', 'GBP') DEFAULT 'KES',
  `notes` TEXT,
  `terms` TEXT,
  `issued_by` INT COMMENT 'User ID who issued invoice',
  `approved_by` INT,
  `approved_at` TIMESTAMP NULL,
  `next_of_kin_contact` VARCHAR(100),
  `next_of_kin_email` VARCHAR(255),
  `created_by` INT,
  `created_at` TIMESTAMP NULL ,
  `updated_at` TIMESTAMP NULL  ,
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `deleted_at` TIMESTAMP NULL,
  `deleted_by` INT,
  
  PRIMARY KEY (`invoice_id`),
  UNIQUE KEY `unique_invoice_number_per_tenant` (`tenant_slug`, `invoice_number`),
  INDEX `idx_tenant_slug` (`tenant_slug`),
  INDEX `idx_deceased_id` (`deceased_id`),
  INDEX `idx_invoice_number` (`invoice_number`),
  INDEX `idx_status` (`status`),
  INDEX `idx_payment_status` (`payment_status`),
  INDEX `idx_invoice_date` (`invoice_date`),
  INDEX `idx_due_date` (`due_date`),
  INDEX `idx_total` (`total`),
  INDEX `idx_is_deleted` (`is_deleted`),
  
  FOREIGN KEY (`tenant_slug`) REFERENCES `tenants`(`tenant_slug`) ON DELETE CASCADE,
  FOREIGN KEY (`deceased_id`) REFERENCES `deceased`(`deceased_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Invoices for mortuary services';

-- Invoice Line Items table
CREATE TABLE IF NOT EXISTS `invoice_items` (
  `item_id` INT NOT NULL AUTO_INCREMENT,
  `invoice_id` INT NOT NULL,
  `tenant_slug` VARCHAR(100) NOT NULL,
  `service_type` VARCHAR(100) NOT NULL COMMENT 'Type: embalming, coffin, removal, etc',
  `service_description` VARCHAR(255) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(15,2) NOT NULL,
  `total_price` DECIMAL(15,2) NOT NULL,
  `tax_rate` DECIMAL(5,2) DEFAULT 0,
  `notes` TEXT,
  `reference_id` VARCHAR(100) COMMENT 'Reference to service ID (coffin_id, etc)',
  `created_at` TIMESTAMP NULL ,
  `updated_at` TIMESTAMP NULL  ,
  
  PRIMARY KEY (`item_id`),
  INDEX `idx_invoice_id` (`invoice_id`),
  INDEX `idx_tenant_slug` (`tenant_slug`),
  INDEX `idx_service_type` (`service_type`),
  INDEX `idx_reference_id` (`reference_id`),
  
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`invoice_id`) ON DELETE CASCADE,
  FOREIGN KEY (`tenant_slug`) REFERENCES `tenants`(`tenant_slug`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Invoice line items';

-- Invoice Payments table
CREATE TABLE IF NOT EXISTS `invoice_payments` (
  `payment_id` INT NOT NULL AUTO_INCREMENT,
  `invoice_id` INT NOT NULL,
  `tenant_slug` VARCHAR(100) NOT NULL,
  `payment_date` TIMESTAMP NULL ,
  `payment_method` ENUM('cash', 'check', 'mpesa', 'bank_transfer', 'card', 'other') NOT NULL,
  `amount_paid` DECIMAL(15,2) NOT NULL,
  `reference_number` VARCHAR(100) COMMENT 'Reference number from payment provider',
  `transaction_id` VARCHAR(100) COMMENT 'Transaction ID from payment gateway',
  `notes` TEXT,
  `received_by` INT COMMENT 'User ID who received payment',
  `created_at` TIMESTAMP NULL ,
  `updated_at` TIMESTAMP NULL  ,
  
  PRIMARY KEY (`payment_id`),
  INDEX `idx_invoice_id` (`invoice_id`),
  INDEX `idx_tenant_slug` (`tenant_slug`),
  INDEX `idx_payment_date` (`payment_date`),
  INDEX `idx_payment_method` (`payment_method`),
  INDEX `idx_reference_number` (`reference_number`),
  
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`invoice_id`) ON DELETE CASCADE,
  FOREIGN KEY (`tenant_slug`) REFERENCES `tenants`(`tenant_slug`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Invoice payment records';

-- Invoice Templates table
CREATE TABLE IF NOT EXISTS `invoice_templates` (
  `template_id` INT NOT NULL AUTO_INCREMENT,
  `tenant_slug` VARCHAR(100) NOT NULL,
  `template_name` VARCHAR(255) NOT NULL,
  `template_html` LONGTEXT NOT NULL,
  `is_default` BOOLEAN DEFAULT FALSE,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_by` INT,
  `created_at` TIMESTAMP NULL ,
  `updated_at` TIMESTAMP NULL  ,
  
  PRIMARY KEY (`template_id`),
  INDEX `idx_tenant_slug` (`tenant_slug`),
  INDEX `idx_is_default` (`is_default`),
  
  FOREIGN KEY (`tenant_slug`) REFERENCES `tenants`(`tenant_slug`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Invoice HTML templates for printing/PDF';
