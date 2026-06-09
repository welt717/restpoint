-- Multi-Tenant Migration: Create charge settings table
-- Version: 003_charge_settings
-- Stores billing rates and settings for each deceased

CREATE TABLE IF NOT EXISTS `charge_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `deceased_id` VARCHAR(100) NOT NULL,
  `tenant_slug` VARCHAR(100) NOT NULL,
  `rate_profile` ENUM('standard', 'premium', 'economy') DEFAULT 'standard',
  `currency` VARCHAR(3) DEFAULT 'KES',
  `charge_type` ENUM('daily', 'hourly') DEFAULT 'daily',
  `daily_rate` DECIMAL(10, 2) NOT NULL DEFAULT 3000.00,
  `hourly_rate` DECIMAL(10, 2) NOT NULL DEFAULT 125.00,
  `usd_rate` DECIMAL(10, 2) NOT NULL DEFAULT 130.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` BOOLEAN DEFAULT FALSE,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_charge_settings_per_deceased` (`tenant_slug`, `deceased_id`),
  INDEX `idx_tenant_deceased` (`tenant_slug`, `deceased_id`),
  INDEX `idx_created_at` (`created_at`),
  
  FOREIGN KEY (`tenant_slug`) REFERENCES `tenants`(`tenant_slug`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Charge settings for each deceased with tenant isolation';
