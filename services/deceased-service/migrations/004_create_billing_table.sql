-- Multi-Tenant Migration: Create billing table
-- Version: 004_billing
-- Stores billing transactions for each deceased, generated daily

CREATE TABLE IF NOT EXISTS `billing` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `billing_id` VARCHAR(100) NOT NULL UNIQUE,
  `deceased_id` VARCHAR(100) NOT NULL,
  `tenant_slug` VARCHAR(100) NOT NULL,
  `billing_date` DATE NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(3) DEFAULT 'KES',
  `charge_type` ENUM('daily', 'hourly') NOT NULL,
  `rate_used` DECIMAL(10, 2) NOT NULL,
  `status` ENUM('pending', 'due', 'overdue', 'paid', 'partial') DEFAULT 'pending',
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` BOOLEAN DEFAULT FALSE,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_billing_id` (`billing_id`),
  INDEX `idx_tenant_deceased` (`tenant_slug`, `deceased_id`),
  INDEX `idx_billing_date` (`billing_date`),
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`),
  KEY `idx_deceased_date` (`deceased_id`, `billing_date`),
  
  FOREIGN KEY (`tenant_slug`) REFERENCES `tenants`(`tenant_slug`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Billing records for each deceased with tenant isolation';
