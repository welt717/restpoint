-- Multi-Tenant Extra Charges Management Tables
-- Version: 001
-- Description: Create extra charges and audit tables with tenant isolation

-- Extra Charges table
CREATE TABLE IF NOT EXISTS `extra_charges` (
  `charge_id` INT NOT NULL AUTO_INCREMENT,
  `tenant_slug` VARCHAR(100) NOT NULL COMMENT 'Tenant slug for isolation',
  `deceased_id` VARCHAR(100) NOT NULL COMMENT 'Reference to deceased',
  `charge_type` VARCHAR(100) NOT NULL COMMENT 'Type of charge (transport, extra-embalming, storage, etc)',
  `amount` DECIMAL(15,2) NOT NULL COMMENT 'Charge amount',
  `currency` ENUM('KES', 'USD', 'EUR', 'GBP') DEFAULT 'KES' COMMENT 'Currency',
  `service_date` TIMESTAMP NULL COMMENT 'When service was provided',
  `requested_by` VARCHAR(100) COMMENT 'Staff who requested charge',
  `status` ENUM('pending', 'approved', 'invoiced', 'paid', 'rejected', 'cancelled') DEFAULT 'pending',
  `approval_status` ENUM('not_required', 'pending', 'approved', 'rejected') DEFAULT 'not_required',
  `approved_by` INT COMMENT 'Manager who approved',
  `approved_at` TIMESTAMP NULL COMMENT 'When charge was approved',
  `invoice_id` VARCHAR(100) COMMENT 'Associated invoice',
  `notes` TEXT,
  `rejection_reason` TEXT COMMENT 'Reason for rejection',
  `created_by` INT COMMENT 'User who created record',
  `created_at` TIMESTAMP NULL ,
  `updated_at` TIMESTAMP NULL  ,
  `is_deleted` BOOLEAN DEFAULT FALSE,
  
  PRIMARY KEY (`charge_id`),
  INDEX `idx_tenant_slug` (`tenant_slug`),
  INDEX `idx_deceased_id` (`deceased_id`),
  INDEX `idx_charge_type` (`charge_type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_approval_status` (`approval_status`),
  INDEX `idx_service_date` (`service_date`),
  INDEX `idx_invoice_id` (`invoice_id`),
  INDEX `idx_created_at` (`created_at`),
  
  FOREIGN KEY (`tenant_slug`) REFERENCES `tenants`(`tenant_slug`) ON DELETE CASCADE,
  FOREIGN KEY (`deceased_id`) REFERENCES `deceased`(`deceased_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Extra charges for mortuary services';

-- Charge Types Catalog
CREATE TABLE IF NOT EXISTS `charge_types` (
  `type_id` INT NOT NULL AUTO_INCREMENT,
  `tenant_slug` VARCHAR(100) NOT NULL,
  `charge_type` VARCHAR(100) NOT NULL,
  `description` TEXT,
  `default_amount` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `requires_approval` BOOLEAN DEFAULT FALSE,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP NULL ,
  `updated_at` TIMESTAMP NULL  ,
  
  PRIMARY KEY (`type_id`),
  UNIQUE KEY `unique_charge_type_per_tenant` (`tenant_slug`, `charge_type`),
  INDEX `idx_tenant_slug` (`tenant_slug`),
  INDEX `idx_is_active` (`is_active`),
  
  FOREIGN KEY (`tenant_slug`) REFERENCES `tenants`(`tenant_slug`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Catalog of extra charge types';

-- Charge Approvals Audit table
CREATE TABLE IF NOT EXISTS `charge_approvals` (
  `approval_id` INT NOT NULL AUTO_INCREMENT,
  `charge_id` INT NOT NULL,
  `tenant_slug` VARCHAR(100) NOT NULL,
  `approved_by` INT NOT NULL COMMENT 'Manager user ID',
  `approval_status` ENUM('approved', 'rejected', 'pending_review') NOT NULL,
  `comments` TEXT,
  `approval_date` TIMESTAMP NULL ,
  
  PRIMARY KEY (`approval_id`),
  INDEX `idx_charge_id` (`charge_id`),
  INDEX `idx_tenant_slug` (`tenant_slug`),
  INDEX `idx_approval_date` (`approval_date`),
  
  FOREIGN KEY (`charge_id`) REFERENCES `extra_charges`(`charge_id`) ON DELETE CASCADE,
  FOREIGN KEY (`tenant_slug`) REFERENCES `tenants`(`tenant_slug`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit trail for charge approvals';
