-- =====================================================
-- Migration: 016_body_checkout
-- Description: Body checkout management system for mortuary
-- Database-Per-Tenant: NO tenant_slug needed (each tenant has own DB)
-- =====================================================

-- =====================================================
-- 1. BODY CHECKOUT TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `body_checkout` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `checkout_id` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique checkout identifier',
  `deceased_id` VARCHAR(50) NOT NULL COMMENT 'Reference to deceased record',
  `checkout_type` ENUM('burial', 'cremation', 'transfer', 'release', 'autopsy') NOT NULL COMMENT 'Type of checkout',
  `checkout_status` ENUM('pending', 'approved', 'completed', 'cancelled', 'rejected') DEFAULT 'pending' COMMENT 'Checkout status',
  `requested_by` INT COMMENT 'User ID who requested checkout',
  `requested_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `approved_by` INT COMMENT 'User ID who approved checkout',
  `approved_at` TIMESTAMP NULL,
  `completed_by` INT COMMENT 'User ID who completed checkout',
  `completed_at` TIMESTAMP NULL,
  `cancelled_by` INT,
  `cancelled_at` TIMESTAMP NULL,
  `cancellation_reason` TEXT,
  
  -- Checkout details
  `checkout_date` TIMESTAMP NOT NULL COMMENT 'Date/time of checkout',
  `release_to` VARCHAR(255) NOT NULL COMMENT 'Person/organization receiving the body',
  `release_to_relationship` VARCHAR(100) COMMENT 'Relationship to deceased',
  `release_to_contact` VARCHAR(50) COMMENT 'Contact number of receiver',
  `release_to_id_number` VARCHAR(50) COMMENT 'ID number of receiver',
  `release_to_id_copy_path` VARCHAR(500) COMMENT 'Path to ID copy file',
  
  -- Transfer details (if checkout_type = 'transfer')
  `transfer_to_facility` VARCHAR(255) COMMENT 'Facility name for transfer',
  `transfer_to_address` TEXT COMMENT 'Transfer facility address',
  `transfer_reason` TEXT COMMENT 'Reason for transfer',
  `transfer_vehicle_number` VARCHAR(100) COMMENT 'Vehicle number used for transfer',
  `transfer_attendant_name` VARCHAR(255) COMMENT 'Name of attendant',
  `transfer_attendant_contact` VARCHAR(50) COMMENT 'Contact of attendant',
  
  -- Burial details (if checkout_type = 'burial')
  `burial_plot_number` VARCHAR(100) COMMENT 'Burial plot number',
  `burial_cemetery` VARCHAR(255) COMMENT 'Cemetery name',
  `burial_date` DATE COMMENT 'Date of burial',
  `burial_officiant` VARCHAR(255) COMMENT 'Name of officiant',
  
  -- Cremation details (if checkout_type = 'cremation')
  `cremation_authorization_number` VARCHAR(100) COMMENT 'Cremation authorization number',
  `cremation_facility` VARCHAR(255) COMMENT 'Cremation facility name',
  `cremation_date` DATE COMMENT 'Date of cremation',
  `urn_number` VARCHAR(100) COMMENT 'Urn identification number',
  `ashes_returned_to` VARCHAR(255) COMMENT 'Person who received ashes',
  
  -- Autopsy details (if checkout_type = 'autopsy')
  `autopsy_authorized_by` VARCHAR(255) COMMENT 'Who authorized autopsy',
  `autopsy_facility` VARCHAR(255) COMMENT 'Facility performing autopsy',
  `autopsy_reason` TEXT COMMENT 'Reason for autopsy',
  `autopsy_results` TEXT COMMENT 'Autopsy results',
  
  -- Documentation
  `checkout_authorization_doc` VARCHAR(500) COMMENT 'Path to authorization document',
  `identification_doc` VARCHAR(500) COMMENT 'Path to identification document',
  `police_clearance_doc` VARCHAR(500) COMMENT 'Path to police clearance',
  `court_order_doc` VARCHAR(500) COMMENT 'Path to court order if applicable',
  `additional_docs` TEXT COMMENT 'JSON array of additional document paths',
  
  -- Financial
  `checkout_fee` DECIMAL(15,2) DEFAULT 0 COMMENT 'Fee for checkout service',
  `payment_status` ENUM('unpaid', 'partial', 'paid', 'waived') DEFAULT 'unpaid',
  `payment_reference` VARCHAR(100) COMMENT 'Payment reference number',
  `invoice_id` INT COMMENT 'Reference to invoice',
  
  -- Tracking
  `qr_code` VARCHAR(255) COMMENT 'QR code for tracking',
  `tracking_number` VARCHAR(100) UNIQUE COMMENT 'Unique tracking number',
  
  -- System fields
  `notes` TEXT COMMENT 'Additional notes',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `deleted_at` TIMESTAMP NULL,
  `deleted_by` INT,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_checkout_id` (`checkout_id`),
  UNIQUE KEY `unique_tracking_number` (`tracking_number`),
  INDEX `idx_deceased_id` (`deceased_id`),
  INDEX `idx_checkout_status` (`checkout_status`),
  INDEX `idx_checkout_type` (`checkout_type`),
  INDEX `idx_checkout_date` (`checkout_date`),
  INDEX `idx_requested_by` (`requested_by`),
  INDEX `idx_approved_by` (`approved_by`),
  INDEX `idx_release_to` (`release_to`),
  INDEX `idx_payment_status` (`payment_status`),
  INDEX `idx_is_deleted` (`is_deleted`),
  INDEX `idx_status_date` (`checkout_status`, `checkout_date`),
  
  FOREIGN KEY (`deceased_id`) REFERENCES `deceased`(`deceased_id`) ON DELETE CASCADE,
  FOREIGN KEY (`requested_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL,
  FOREIGN KEY (`approved_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL,
  FOREIGN KEY (`completed_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL,
  FOREIGN KEY (`cancelled_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL,
  FOREIGN KEY (`deleted_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`invoice_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Body checkout tracking for mortuary';

-- =====================================================
-- 2. CHECKOUT APPROVAL WORKFLOW TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `checkout_approvals` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `checkout_id` VARCHAR(50) NOT NULL,
  `approval_level` INT NOT NULL COMMENT 'Approval level (1,2,3)',
  `approval_role` VARCHAR(100) COMMENT 'Role required for approval',
  `approved_by` INT,
  `approved_at` TIMESTAMP NULL,
  `approval_status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `rejection_reason` TEXT,
  `comments` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  INDEX `idx_checkout_id` (`checkout_id`),
  INDEX `idx_approval_status` (`approval_status`),
  INDEX `idx_approved_by` (`approved_by`),
  
  FOREIGN KEY (`checkout_id`) REFERENCES `body_checkout`(`checkout_id`) ON DELETE CASCADE,
  FOREIGN KEY (`approved_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Multi-level approval workflow for checkouts';

-- =====================================================
-- 3. CHECKOUT DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `checkout_documents` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `checkout_id` VARCHAR(50) NOT NULL,
  `document_type` VARCHAR(100) NOT NULL,
  `document_name` VARCHAR(255) NOT NULL,
  `document_path` VARCHAR(500) NOT NULL,
  `file_size` BIGINT DEFAULT 0,
  `mime_type` VARCHAR(100),
  `uploaded_by` INT,
  `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `is_verified` BOOLEAN DEFAULT FALSE,
  `verified_by` INT,
  `verified_at` TIMESTAMP NULL,
  `notes` TEXT,
  
  PRIMARY KEY (`id`),
  INDEX `idx_checkout_id` (`checkout_id`),
  INDEX `idx_document_type` (`document_type`),
  
  FOREIGN KEY (`checkout_id`) REFERENCES `body_checkout`(`checkout_id`) ON DELETE CASCADE,
  FOREIGN KEY (`uploaded_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL,
  FOREIGN KEY (`verified_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Documents attached to checkout';

-- =====================================================
-- 4. CHECKOUT AUDIT LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `checkout_audit_log` (
  `log_id` INT NOT NULL AUTO_INCREMENT,
  `checkout_id` VARCHAR(50) NOT NULL,
  `action` ENUM('create', 'update', 'approve', 'reject', 'complete', 'cancel', 'delete', 'view') NOT NULL,
  `action_by` INT,
  `action_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `old_data` JSON,
  `new_data` JSON,
  `ip_address` VARCHAR(45),
  `user_agent` TEXT,
  `notes` TEXT,
  
  PRIMARY KEY (`log_id`),
  INDEX `idx_checkout_id` (`checkout_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_action_by` (`action_by`),
  INDEX `idx_action_at` (`action_at`),
  
  FOREIGN KEY (`checkout_id`) REFERENCES `body_checkout`(`checkout_id`) ON DELETE CASCADE,
  FOREIGN KEY (`action_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit log for checkout actions';

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_checkout_status_date ON body_checkout(checkout_status, checkout_date);
CREATE INDEX idx_checkout_type_status ON body_checkout(checkout_type, checkout_status);
CREATE INDEX idx_checkout_release_to ON body_checkout(release_to);
CREATE INDEX idx_checkout_date_range ON body_checkout(checkout_date);
CREATE INDEX idx_checkout_payment ON body_checkout(payment_status, checkout_status);
CREATE INDEX idx_checkout_tracking ON body_checkout(tracking_number);
CREATE INDEX idx_approvals_checkout_level ON checkout_approvals(checkout_id, approval_level);
CREATE INDEX idx_audit_checkout_action ON checkout_audit_log(checkout_id, action, action_at);

-- =====================================================
-- 6. CREATE TRIGGERS FOR AUTO-LOGGING
-- =====================================================
DELIMITER $$

CREATE TRIGGER `log_checkout_after_insert`
AFTER INSERT ON `body_checkout`
FOR EACH ROW
BEGIN
    INSERT INTO checkout_audit_log (checkout_id, action, action_by, new_data)
    VALUES (NEW.checkout_id, 'create', NEW.requested_by, 
            JSON_OBJECT('checkout_type', NEW.checkout_type, 'checkout_date', NEW.checkout_date));
END$$

CREATE TRIGGER `log_checkout_after_update`
AFTER UPDATE ON `body_checkout`
FOR EACH ROW
BEGIN
    IF OLD.checkout_status != NEW.checkout_status THEN
        INSERT INTO checkout_audit_log (checkout_id, action, action_by, old_data, new_data)
        VALUES (NEW.checkout_id, CONCAT('status_', NEW.checkout_status), NEW.approved_by,
                JSON_OBJECT('old_status', OLD.checkout_status),
                JSON_OBJECT('new_status', NEW.checkout_status));
    ELSE
        INSERT INTO checkout_audit_log (checkout_id, action, action_by, old_data, new_data)
        VALUES (NEW.checkout_id, 'update', NEW.approved_by,
                JSON_OBJECT('updated_at', NOW()),
                JSON_OBJECT('checkout_date', NEW.checkout_date, 'release_to', NEW.release_to));
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- 7. CREATE VIEWS FOR REPORTING
-- =====================================================

-- View for pending checkouts
CREATE OR REPLACE VIEW `pending_checkouts_view` AS
SELECT 
    bc.id,
    bc.checkout_id,
    bc.deceased_id,
    d.full_name as deceased_name,
    bc.checkout_type,
    bc.checkout_status,
    bc.checkout_date,
    bc.release_to,
    bc.requested_by,
    u.full_name as requested_by_name,
    bc.requested_at,
    DATEDIFF(NOW(), bc.requested_at) as days_pending
FROM body_checkout bc
LEFT JOIN deceased d ON bc.deceased_id = d.deceased_id
LEFT JOIN users u ON bc.requested_by = u.user_id
WHERE bc.checkout_status = 'pending'
  AND bc.is_deleted = FALSE
ORDER BY bc.requested_at ASC;

-- View for checkout summary
CREATE OR REPLACE VIEW `checkout_summary_view` AS
SELECT 
    bc.checkout_id,
    bc.deceased_id,
    d.full_name as deceased_name,
    bc.checkout_type,
    bc.checkout_status,
    bc.checkout_date,
    bc.release_to,
    bc.payment_status,
    bc.checkout_fee,
    u1.full_name as requested_by,
    u2.full_name as approved_by,
    bc.approved_at,
    u3.full_name as completed_by,
    bc.completed_at,
    TIMESTAMPDIFF(HOUR, bc.requested_at, bc.completed_at) as hours_to_complete
FROM body_checkout bc
LEFT JOIN deceased d ON bc.deceased_id = d.deceased_id
LEFT JOIN users u1 ON bc.requested_by = u1.user_id
LEFT JOIN users u2 ON bc.approved_by = u2.user_id
LEFT JOIN users u3 ON bc.completed_by = u3.user_id
WHERE bc.is_deleted = FALSE
ORDER BY bc.checkout_date DESC;

-- View for daily checkout stats
CREATE OR REPLACE VIEW `daily_checkout_stats` AS
SELECT 
    DATE(checkout_date) as checkout_day,
    checkout_type,
    COUNT(*) as total_checkouts,
    SUM(CASE WHEN checkout_status = 'completed' THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN checkout_status = 'pending' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN checkout_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
    SUM(checkout_fee) as total_fees,
    SUM(CASE WHEN payment_status = 'paid' THEN checkout_fee ELSE 0 END) as fees_collected
FROM body_checkout
WHERE is_deleted = FALSE
GROUP BY DATE(checkout_date), checkout_type
ORDER BY checkout_day DESC, checkout_type;

-- =====================================================
-- 8. STORED PROCEDURES
-- =====================================================

-- Procedure to generate unique checkout ID
DELIMITER $$

CREATE PROCEDURE `generate_checkout_id`(
    OUT p_checkout_id VARCHAR(50)
)
BEGIN
    DECLARE v_prefix VARCHAR(10);
    DECLARE v_number INT;
    DECLARE v_exists INT DEFAULT 1;
    
    SET v_prefix = 'CHK';
    SET v_number = FLOOR(RAND() * 900000) + 100000;
    SET p_checkout_id = CONCAT(v_prefix, '-', v_number, '-', DATE_FORMAT(NOW(), '%Y%m%d'));
    
    WHILE v_exists > 0 DO
        SELECT COUNT(*) INTO v_exists FROM body_checkout WHERE checkout_id = p_checkout_id;
        IF v_exists > 0 THEN
            SET v_number = FLOOR(RAND() * 900000) + 100000;
            SET p_checkout_id = CONCAT(v_prefix, '-', v_number, '-', DATE_FORMAT(NOW(), '%Y%m%d'));
        END IF;
    END WHILE;
END$$

-- Procedure to generate tracking number
CREATE PROCEDURE `generate_tracking_number`(
    OUT p_tracking_number VARCHAR(50)
)
BEGIN
    SET p_tracking_number = CONCAT('TRK', UUID_SHORT());
END$$

-- Procedure to approve checkout
CREATE PROCEDURE `approve_checkout`(
    IN p_checkout_id VARCHAR(50),
    IN p_approved_by INT,
    IN p_approval_level INT
)
BEGIN
    DECLARE v_current_level INT;
    
    SELECT MAX(approval_level) INTO v_current_level 
    FROM checkout_approvals 
    WHERE checkout_id = p_checkout_id AND approval_status = 'approved';
    
    IF v_current_level IS NULL THEN
        SET v_current_level = 0;
    END IF;
    
    IF p_approval_level = v_current_level + 1 THEN
        UPDATE checkout_approvals 
        SET approval_status = 'approved',
            approved_by = p_approved_by,
            approved_at = NOW()
        WHERE checkout_id = p_checkout_id 
          AND approval_level = p_approval_level;
        
        -- Check if all approvals done
        IF NOT EXISTS (
            SELECT 1 FROM checkout_approvals 
            WHERE checkout_id = p_checkout_id AND approval_status = 'pending'
        ) THEN
            UPDATE body_checkout 
            SET checkout_status = 'approved',
                approved_by = p_approved_by,
                approved_at = NOW()
            WHERE checkout_id = p_checkout_id;
        END IF;
    ELSE
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid approval level order';
    END IF;
END$$

-- Procedure to complete checkout
CREATE PROCEDURE `complete_checkout`(
    IN p_checkout_id VARCHAR(50),
    IN p_completed_by INT
)
BEGIN
    UPDATE body_checkout 
    SET checkout_status = 'completed',
        completed_by = p_completed_by,
        completed_at = NOW()
    WHERE checkout_id = p_checkout_id
      AND checkout_status = 'approved';
    
    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Checkout not found or not approved';
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- Migration Complete
-- =====================================================