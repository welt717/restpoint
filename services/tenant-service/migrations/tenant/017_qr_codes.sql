-- =====================================================
-- Migration: 017_qr_codes
-- Description: QR code storage for deceased persons
-- Database-Per-Tenant: NO tenant_slug needed (each tenant has own DB)
-- =====================================================

-- =====================================================
-- 1. ADD QR CODE COLUMNS TO DECEASED TABLE
-- =====================================================
ALTER TABLE `deceased` 
ADD COLUMN IF NOT EXISTS `qr_code_data` TEXT COMMENT 'QR code encoded data string',
ADD COLUMN IF NOT EXISTS `qr_code_url` VARCHAR(500) COMMENT 'URL/path to QR code image',
ADD COLUMN IF NOT EXISTS `qr_code_generated` BOOLEAN DEFAULT FALSE COMMENT 'Whether QR code has been generated',
ADD COLUMN IF NOT EXISTS `qr_code_generated_at` TIMESTAMP NULL COMMENT 'When QR code was generated',
ADD COLUMN IF NOT EXISTS `qr_code_scanned_count` INT DEFAULT 0 COMMENT 'Number of times QR has been scanned',
ADD COLUMN IF NOT EXISTS `qr_code_last_scanned_at` TIMESTAMP NULL COMMENT 'Last time QR was scanned',
ADD COLUMN IF NOT EXISTS `qr_code_version` INT DEFAULT 1 COMMENT 'QR code version for updates';

-- =====================================================
-- 2. QR CODE SCAN LOGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `qr_scan_logs` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `deceased_id` VARCHAR(50) NOT NULL COMMENT 'Reference to deceased',
  `scanned_by` INT COMMENT 'User ID who scanned the QR code',
  `scanned_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `ip_address` VARCHAR(45) COMMENT 'IP address of scanner',
  `user_agent` TEXT COMMENT 'Browser/device user agent',
  `location` VARCHAR(255) COMMENT 'Geolocation if available',
  `device_info` JSON COMMENT 'Additional device information',
  `scan_success` BOOLEAN DEFAULT TRUE,
  `error_message` TEXT,
  
  PRIMARY KEY (`id`),
  INDEX `idx_deceased_id` (`deceased_id`),
  INDEX `idx_scanned_by` (`scanned_by`),
  INDEX `idx_scanned_at` (`scanned_at`),
  INDEX `idx_scan_success` (`scan_success`),
  
  FOREIGN KEY (`deceased_id`) REFERENCES `deceased`(`deceased_id`) ON DELETE CASCADE,
  FOREIGN KEY (`scanned_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Logs of QR code scans';

-- =====================================================
-- 3. QR CODE TEMPLATES TABLE (Optional for customization)
-- =====================================================
CREATE TABLE IF NOT EXISTS `qr_templates` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `template_name` VARCHAR(100) NOT NULL,
  `template_data` TEXT NOT NULL COMMENT 'JSON template configuration',
  `width` INT DEFAULT 400,
  `margin` INT DEFAULT 2,
  `error_correction` ENUM('L', 'M', 'Q', 'H') DEFAULT 'H',
  `color_dark` VARCHAR(20) DEFAULT '#000000',
  `color_light` VARCHAR(20) DEFAULT '#ffffff',
  `include_logo` BOOLEAN DEFAULT FALSE,
  `logo_path` VARCHAR(500),
  `is_default` BOOLEAN DEFAULT FALSE,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  INDEX `idx_is_default` (`is_default`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='QR code templates for customization';

-- =====================================================
-- 4. INSERT DEFAULT QR TEMPLATE
-- =====================================================
INSERT IGNORE INTO `qr_templates` (`template_name`, `is_default`, `template_data`, `width`, `margin`) VALUES 
('Default Template', TRUE, '{"format":"professional","show_logo":false,"show_border":true}', 600, 4);

-- =====================================================
-- 5. CREATE TRIGGER FOR AUTO-UPDATING SCAN COUNT
-- =====================================================
DELIMITER $$

CREATE TRIGGER `update_qr_scan_count`
AFTER INSERT ON `qr_scan_logs`
FOR EACH ROW
BEGIN
    UPDATE deceased 
    SET 
        qr_code_scanned_count = qr_code_scanned_count + 1,
        qr_code_last_scanned_at = NEW.scanned_at
    WHERE deceased_id = NEW.deceased_id;
END$$

DELIMITER ;

-- =====================================================
-- 6. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_deceased_qr_generated ON deceased(qr_code_generated, qr_code_generated_at);
CREATE INDEX idx_deceased_qr_scanned ON deceased(qr_code_scanned_count, qr_code_last_scanned_at);
CREATE INDEX idx_qr_scans_deceased_date ON qr_scan_logs(deceased_id, scanned_at);
CREATE INDEX idx_qr_scans_success ON qr_scan_logs(scan_success, scanned_at);

-- =====================================================
-- 7. CREATE VIEWS FOR QR CODE REPORTING
-- =====================================================

-- View for QR code generation status
CREATE OR REPLACE VIEW `qr_generation_status` AS
SELECT 
    deceased_id,
    full_name,
    qr_code_generated,
    qr_code_generated_at,
    qr_code_scanned_count,
    qr_code_last_scanned_at,
    CASE 
        WHEN qr_code_generated = FALSE THEN 'Not Generated'
        WHEN qr_code_scanned_count = 0 THEN 'Generated - Not Scanned'
        ELSE 'Generated - Scanned'
    END as qr_status
FROM deceased
WHERE qr_code_generated = TRUE OR qr_code_generated IS NOT NULL
ORDER BY qr_code_generated_at DESC;

-- View for QR scan analytics
CREATE OR REPLACE VIEW `qr_scan_analytics` AS
SELECT 
    d.deceased_id,
    d.full_name,
    COUNT(l.id) as total_scans,
    COUNT(DISTINCT l.scanned_by) as unique_scanners,
    MIN(l.scanned_at) as first_scan,
    MAX(l.scanned_at) as last_scan,
    SUM(CASE WHEN l.scan_success = TRUE THEN 1 ELSE 0 END) as successful_scans,
    SUM(CASE WHEN l.scan_success = FALSE THEN 1 ELSE 0 END) as failed_scans
FROM deceased d
LEFT JOIN qr_scan_logs l ON d.deceased_id = l.deceased_id
GROUP BY d.deceased_id, d.full_name
HAVING total_scans > 0
ORDER BY total_scans DESC;

-- View for daily QR scan activity
CREATE OR REPLACE VIEW `daily_qr_scan_activity` AS
SELECT 
    DATE(scanned_at) as scan_date,
    COUNT(*) as total_scans,
    COUNT(DISTINCT deceased_id) as unique_deceased,
    COUNT(DISTINCT scanned_by) as unique_users,
    SUM(CASE WHEN scan_success = TRUE THEN 1 ELSE 0 END) as successful_scans
FROM qr_scan_logs
GROUP BY DATE(scanned_at)
ORDER BY scan_date DESC;

-- =====================================================
-- 8. STORED PROCEDURES FOR QR MANAGEMENT
-- =====================================================

-- Procedure to generate QR code for deceased
CREATE PROCEDURE `generate_deceased_qr`(
    IN p_deceased_id VARCHAR(50),
    IN p_generated_by INT
)
BEGIN
    DECLARE v_current_version INT;
    
    -- Get current version
    SELECT COALESCE(qr_code_version, 0) INTO v_current_version 
    FROM deceased WHERE deceased_id = p_deceased_id;
    
    -- Update QR generation info
    UPDATE deceased 
    SET 
        qr_code_generated = TRUE,
        qr_code_generated_at = NOW(),
        qr_code_version = v_current_version + 1
    WHERE deceased_id = p_deceased_id;
    
    -- Log the generation
    INSERT INTO qr_scan_logs (deceased_id, scanned_by, scan_success, device_info)
    VALUES (p_deceased_id, p_generated_by, TRUE, JSON_OBJECT('action', 'qr_generated'));
    
    SELECT ROW_COUNT() as qr_generated;
END$$

-- Procedure to get QR data for deceased
CREATE PROCEDURE `get_qr_data_for_deceased`(
    IN p_deceased_id VARCHAR(50)
)
BEGIN
    SELECT 
        deceased_id,
        full_name,
        date_of_birth,
        date_of_death,
        cause_of_death,
        place_of_death,
        gender,
        county,
        status,
        date_registered,
        qr_code_version,
        qr_code_generated_at,
        qr_code_scanned_count,
        qr_code_last_scanned_at
    FROM deceased
    WHERE deceased_id = p_deceased_id;
END$$

-- Procedure to record QR scan
CREATE PROCEDURE `record_qr_scan`(
    IN p_deceased_id VARCHAR(50),
    IN p_scanned_by INT,
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT,
    IN p_location VARCHAR(255),
    IN p_device_info JSON
)
BEGIN
    -- Insert scan log
    INSERT INTO qr_scan_logs (
        deceased_id, 
        scanned_by, 
        ip_address, 
        user_agent, 
        location, 
        device_info,
        scan_success
    ) VALUES (
        p_deceased_id,
        p_scanned_by,
        p_ip_address,
        p_user_agent,
        p_location,
        p_device_info,
        TRUE
    );
    
    -- Get updated scan count
    SELECT 
        deceased_id,
        full_name,
        qr_code_scanned_count,
        qr_code_last_scanned_at
    FROM deceased
    WHERE deceased_id = p_deceased_id;
END$$

-- Procedure to regenerate QR code
CREATE PROCEDURE `regenerate_qr_code`(
    IN p_deceased_id VARCHAR(50),
    IN p_generated_by INT
)
BEGIN
    DECLARE v_current_version INT;
    
    SELECT qr_code_version INTO v_current_version 
    FROM deceased WHERE deceased_id = p_deceased_id;
    
    UPDATE deceased 
    SET 
        qr_code_generated_at = NOW(),
        qr_code_version = v_current_version + 1,
        qr_code_scanned_count = 0,
        qr_code_last_scanned_at = NULL
    WHERE deceased_id = p_deceased_id;
    
    INSERT INTO qr_scan_logs (deceased_id, scanned_by, scan_success, device_info)
    VALUES (p_deceased_id, p_generated_by, TRUE, JSON_OBJECT('action', 'qr_regenerated'));
    
    SELECT 'QR Code Regenerated Successfully' as message;
END$$

-- Procedure to cleanup old QR logs
CREATE PROCEDURE `cleanup_old_qr_logs`(IN days_to_keep INT)
BEGIN
    DECLARE cleanup_date DATE;
    SET cleanup_date = DATE_SUB(CURDATE(), INTERVAL days_to_keep DAY);
    
    DELETE FROM qr_scan_logs 
    WHERE scanned_at < cleanup_date;
    
    SELECT ROW_COUNT() as logs_deleted;
END$$

DELIMITER ;

-- =====================================================
-- 9. FUNCTION TO GET QR SCAN STATISTICS
-- =====================================================
DELIMITER $$

CREATE FUNCTION `get_qr_scan_stats`(p_deceased_id VARCHAR(50))
RETURNS JSON
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE result JSON;
    
    SELECT JSON_OBJECT(
        'total_scans', COUNT(*),
        'unique_scanners', COUNT(DISTINCT scanned_by),
        'first_scan', MIN(scanned_at),
        'last_scan', MAX(scanned_at),
        'avg_scans_per_day', ROUND(COUNT(*) / GREATEST(DATEDIFF(MAX(scanned_at), MIN(scanned_at)), 1), 2)
    ) INTO result
    FROM qr_scan_logs
    WHERE deceased_id = p_deceased_id AND scan_success = TRUE;
    
    RETURN COALESCE(result, JSON_OBJECT('total_scans', 0));
END$$

DELIMITER ;

-- =====================================================
-- Migration Complete
-- =====================================================