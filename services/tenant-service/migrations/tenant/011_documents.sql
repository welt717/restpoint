-- =====================================================
-- Migration: 011_documents
-- Description: Document management system for deceased records
-- Database-Per-Tenant: NO tenant_slug needed (each tenant has own DB)
-- =====================================================

-- =====================================================
-- 1. DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `documents` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `deceased_id` VARCHAR(50) NOT NULL COMMENT 'Reference to deceased record (deceased_idd)',
  `document_type` VARCHAR(100) NOT NULL COMMENT 'Type of document: death_cert, id_copy, medical_report, etc',
  `file_name` VARCHAR(255) NOT NULL COMMENT 'Original file name',
  `file_path` VARCHAR(500) NOT NULL COMMENT 'Relative path to file',
  `file_size` INT DEFAULT 0 COMMENT 'File size in bytes',
  `mime_type` VARCHAR(100) NOT NULL COMMENT 'File MIME type: application/pdf, image/jpeg, etc',
  `file_hash` VARCHAR(255) COMMENT 'File hash for integrity check (optional)',
  `uploaded_by` INT COMMENT 'User ID who uploaded the document',
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'When document was uploaded',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `deleted_at` TIMESTAMP NULL,
  `deleted_by` INT COMMENT 'User ID who deleted the document',
  `notes` TEXT COMMENT 'Additional notes about the document',
  `is_verified` BOOLEAN DEFAULT FALSE COMMENT 'Is document verified by admin',
  `verified_by` INT COMMENT 'User ID who verified the document',
  `verified_at` TIMESTAMP NULL COMMENT 'When document was verified',
  `status` ENUM('pending', 'approved', 'rejected', 'archived') DEFAULT 'pending',
  `rejection_reason` TEXT COMMENT 'Reason if document was rejected',
  
  PRIMARY KEY (`id`),
  INDEX `idx_deceased_id` (`deceased_id`),
  INDEX `idx_document_type` (`document_type`),
  INDEX `idx_status` (`status`),
  INDEX `idx_uploaded_by` (`uploaded_by`),
  INDEX `idx_uploaded_at` (`uploaded_at`),
  INDEX `idx_is_deleted` (`is_deleted`),
  INDEX `idx_is_verified` (`is_verified`),
  INDEX `idx_deceased_status` (`deceased_id`, `status`),
  INDEX `idx_verified_by` (`verified_by`),
  
  FOREIGN KEY (`deceased_id`) REFERENCES `deceased`(`deceased_id`) ON DELETE CASCADE,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL,
  FOREIGN KEY (`verified_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL,
  FOREIGN KEY (`deleted_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Documents uploaded for deceased records';

-- =====================================================
-- 2. DOCUMENT TYPES REFERENCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `document_types` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `type_name` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Document type name',
  `type_code` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique code for document type',
  `description` TEXT COMMENT 'Description of document type',
  `allowed_mime_types` TEXT COMMENT 'Allowed MIME types (JSON array)',
  `max_file_size` INT DEFAULT 5242880 COMMENT 'Max file size in bytes (5MB default)',
  `is_required` BOOLEAN DEFAULT FALSE COMMENT 'Is this document required',
  `is_active` BOOLEAN DEFAULT TRUE,
  `sort_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  INDEX `idx_type_code` (`type_code`),
  INDEX `idx_is_active` (`is_active`),
  INDEX `idx_is_required` (`is_required`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Reference table for document types';

-- =====================================================
-- 3. INSERT DEFAULT DOCUMENT TYPES
-- =====================================================
INSERT IGNORE INTO `document_types` (`type_name`, `type_code`, `description`, `allowed_mime_types`, `is_required`) VALUES
('Death Certificate', 'death_cert', 'Official death certificate from authorities', '["application/pdf","image/jpeg","image/png"]', TRUE),
('ID Copy', 'id_copy', 'Copy of deceased ID or passport', '["application/pdf","image/jpeg","image/png"]', TRUE),
('Medical Report', 'medical_report', 'Medical report from hospital or doctor', '["application/pdf","image/jpeg","image/png"]', FALSE),
('Police Report', 'police_report', 'Police report for the deceased', '["application/pdf","image/jpeg","image/png"]', FALSE),
('Burial Permit', 'burial_permit', 'Burial permit from authorities', '["application/pdf","image/jpeg","image/png"]', TRUE),
('Religious Documents', 'religious_docs', 'Religious documents or requirements', '["application/pdf","image/jpeg","image/png"]', FALSE),
('Next of Kin ID', 'nok_id', 'ID copy of next of kin', '["application/pdf","image/jpeg","image/png"]', TRUE),
('Consent Form', 'consent_form', 'Signed consent form from family', '["application/pdf","image/jpeg","image/png"]', TRUE),
('Payment Receipt', 'payment_receipt', 'Receipt for mortuary services', '["application/pdf","image/jpeg","image/png"]', FALSE),
('Other', 'other', 'Other miscellaneous documents', '["application/pdf","image/jpeg","image/png"]', FALSE);

-- =====================================================
-- 4. DOCUMENT AUDIT LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `document_audit_log` (
  `audit_id` INT NOT NULL AUTO_INCREMENT,
  `document_id` INT NOT NULL COMMENT 'Reference to document',
  `action` ENUM('upload', 'view', 'download', 'update', 'delete', 'verify', 'reject') NOT NULL,
  `action_by` INT COMMENT 'User who performed action',
  `action_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `ip_address` VARCHAR(45) COMMENT 'IP address of user',
  `user_agent` TEXT COMMENT 'Browser user agent',
  `notes` TEXT COMMENT 'Additional action details',
  
  PRIMARY KEY (`audit_id`),
  INDEX `idx_document_id` (`document_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_action_by` (`action_by`),
  INDEX `idx_action_at` (`action_at`),
  
  FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`action_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit log for document actions';

-- =====================================================
-- 5. TRIGGER FOR AUTO-LOGGING DOCUMENT ACTIONS
-- =====================================================
DELIMITER $$

CREATE TRIGGER `log_document_upload_after_insert`
AFTER INSERT ON `documents`
FOR EACH ROW
BEGIN
    INSERT INTO document_audit_log (document_id, action, action_by, action_at)
    VALUES (NEW.id, 'upload', NEW.uploaded_by, NOW());
END$$

CREATE TRIGGER `log_document_verify_after_update`
AFTER UPDATE ON `documents`
FOR EACH ROW
BEGIN
    IF NEW.is_verified = 1 AND OLD.is_verified = 0 THEN
        INSERT INTO document_audit_log (document_id, action, action_by, action_at)
        VALUES (NEW.id, 'verify', NEW.verified_by, NOW());
    END IF;
    
    IF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
        INSERT INTO document_audit_log (document_id, action, action_by, action_at, notes)
        VALUES (NEW.id, 'reject', NEW.verified_by, NOW(), NEW.rejection_reason);
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_documents_deceased_status ON documents(deceased_id, status, is_deleted);
CREATE INDEX idx_documents_uploaded_at ON documents(uploaded_at DESC);
CREATE INDEX idx_documents_type_status ON documents(document_type, status);
CREATE INDEX idx_document_audit_document_action ON document_audit_log(document_id, action, action_at);
CREATE INDEX idx_document_audit_user ON document_audit_log(action_by, action_at);

-- =====================================================
-- 7. CREATE VIEW FOR DOCUMENTS SUMMARY
-- =====================================================
CREATE OR REPLACE VIEW `documents_summary_view` AS
SELECT 
    d.id,
    d.deceased_id,
    dec.full_name as deceased_name,
    d.document_type,
    dt.type_name,
    d.file_name,
    d.file_path,
    d.mime_type,
    d.file_size,
    d.status,
    d.is_verified,
    d.uploaded_by,
    u.full_name as uploaded_by_name,
    d.uploaded_at,
    d.notes,
    d.verified_by,
    verifier.full_name as verified_by_name,
    d.verified_at,
    d.rejection_reason,
    CASE 
        WHEN d.is_verified = 1 THEN 'Verified'
        WHEN d.status = 'rejected' THEN 'Rejected'
        WHEN d.status = 'pending' THEN 'Pending'
        ELSE 'Unknown'
    END as verification_status
FROM documents d
LEFT JOIN deceased dec ON d.deceased_id = dec.deceased_id
LEFT JOIN document_types dt ON d.document_type = dt.type_code
LEFT JOIN users u ON d.uploaded_by = u.user_id
LEFT JOIN users verifier ON d.verified_by = verifier.user_id
WHERE d.is_deleted = FALSE;

-- =====================================================
-- 8. STORED PROCEDURE FOR CLEANUP OLD FILES
-- =====================================================
DELIMITER $$

CREATE PROCEDURE `cleanup_deleted_documents`()
BEGIN
    -- Mark documents that have been soft deleted but no file access for 30 days
    UPDATE documents 
    SET is_deleted = TRUE, 
        deleted_at = NOW() 
    WHERE is_deleted = FALSE 
      AND deleted_at IS NULL
      AND created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
      AND file_path NOT IN (SELECT DISTINCT file_path FROM documents WHERE is_deleted = FALSE);
END$$

DELIMITER ;

-- =====================================================
-- Migration Complete
-- =====================================================