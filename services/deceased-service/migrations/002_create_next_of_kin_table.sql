-- Migration: Create next_of_kin table
-- Version: 002
-- Description: Create next_of_kin table for managing deceased persons' next of kin
-- Fixed: Added tenant_slug for multi-tenancy

CREATE TABLE IF NOT EXISTS `next_of_kin` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `deceased_id` VARCHAR(100) NOT NULL COMMENT 'Reference to deceased table',
  `tenant_slug` VARCHAR(100) NOT NULL COMMENT 'Tenant slug for isolation',
  `full_name` VARCHAR(255) NOT NULL COMMENT 'Full name of next of kin',
  `relationship` VARCHAR(100) NOT NULL COMMENT 'Relationship to deceased (e.g., Spouse, Child, Parent, Sibling)',
  `contact` VARCHAR(50) NOT NULL COMMENT 'Phone number contact',
  `email` VARCHAR(255) DEFAULT NULL COMMENT 'Email address for notifications',
  `is_primary` BOOLEAN DEFAULT FALSE COMMENT 'Is this the primary next of kin',
  `is_notified` BOOLEAN DEFAULT FALSE COMMENT 'Has been notified about death',
  `notified_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'When notification was sent',
  `address` TEXT DEFAULT NULL COMMENT 'Physical address',
  `alternative_contact` VARCHAR(50) DEFAULT NULL COMMENT 'Alternative phone number',
  `created_by` VARCHAR(100) DEFAULT NULL COMMENT 'User who created the record',
  `created_at` TIMESTAMP NULL  COMMENT 'Record creation TIMESTAMP NULL',
  `updated_at` TIMESTAMP NULL   COMMENT 'Last update TIMESTAMP NULL',
  `is_deleted` BOOLEAN DEFAULT FALSE COMMENT 'Soft delete flag',
  `deleted_at` TIMESTAMP NULL DEFAULT NULL COMMENT 'Soft delete TIMESTAMP NULL',
  `deleted_by` VARCHAR(100) DEFAULT NULL COMMENT 'User who deleted the record',
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_primary_kin_per_deceased` (`deceased_id`, `tenant_slug`, `is_primary`),
  INDEX `idx_tenant_deceased_id` (`tenant_slug`, `deceased_id`),
  INDEX `idx_full_name` (`full_name`),
  INDEX `idx_contact` (`contact`),
  INDEX `idx_relationship` (`relationship`),
  INDEX `idx_is_primary` (`is_primary`),
  INDEX `idx_is_notified` (`is_notified`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_is_deleted` (`is_deleted`),
  
  FOREIGN KEY (`deceased_id`) REFERENCES `deceased`(`deceased_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`tenant_slug`) REFERENCES `tenants`(`tenant_slug`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Next of kin records for deceased persons';