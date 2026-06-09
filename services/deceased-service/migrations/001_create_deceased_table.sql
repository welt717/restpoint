-- Multi-Tenant Migration: Create deceased table with tenant support
-- Version: 001_multi_tenant
-- Fixed: Uses tenant_slug instead of slug, added admission_status and release_status

CREATE TABLE IF NOT EXISTS `deceased` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `deceased_id` VARCHAR(100) NOT NULL COMMENT 'Unique identifier with tenant prefix',
  `tenant_slug` VARCHAR(100) NOT NULL COMMENT 'Tenant slug for isolation',
  `admission_number` VARCHAR(100) NOT NULL UNIQUE,
  `cause_of_death` TEXT,
  `date_admitted` TIMESTAMP NULL,
  `date_of_birth` DATE NOT NULL,
  `date_of_death` TIMESTAMP NULL,
  `date_registered` TIMESTAMP NULL,
  `full_name` VARCHAR(255) NOT NULL,
  `gender` ENUM('Male', 'Female', 'Other') NOT NULL,
  `place_of_death` VARCHAR(255) NOT NULL,
  `county` VARCHAR(100) NOT NULL,
  `national_id` VARCHAR(50) NOT NULL,
  `location` VARCHAR(255),
  `slug` VARCHAR(255),
  `admission_status` ENUM('admitted', 'embalmed', 'released', 'buried') DEFAULT 'admitted',
  `release_status` ENUM('pending', 'approved', 'released') DEFAULT 'pending',
  `chamber_assigned` VARCHAR(50),
  `created_by` VARCHAR(100),
  `created_at` TIMESTAMP NULL ,
  `updated_at` TIMESTAMP NULL  ,
  `is_deleted` BOOLEAN DEFAULT FALSE,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_deceased_id_per_tenant` (`tenant_slug`, `deceased_id`),
  UNIQUE KEY `unique_national_id_per_tenant` (`tenant_slug`, `national_id`),
  INDEX `idx_tenant_deceased` (`tenant_slug`, `deceased_id`),
  INDEX `idx_tenant_national_id` (`tenant_slug`, `national_id`),
  INDEX `idx_tenant_date_of_death` (`tenant_slug`, `date_of_death`),
  INDEX `idx_admission_status` (`admission_status`),
  INDEX `idx_release_status` (`release_status`),
  INDEX `idx_created_at` (`created_at`),
  
  FOREIGN KEY (`tenant_slug`) REFERENCES `tenants`(`tenant_slug`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Deceased persons with tenant isolation';