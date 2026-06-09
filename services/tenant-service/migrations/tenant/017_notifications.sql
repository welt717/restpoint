-- =====================================================
-- Migration: 017_notifications
-- Description: Simple notification system for mortuary services
-- Database-Per-Tenant: NO tenant_slug needed (each tenant has own DB)
-- =====================================================

-- =====================================================
-- 1. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `deceased_id` VARCHAR(50) NOT NULL COMMENT 'Reference to deceased record',
  `type` VARCHAR(50) NOT NULL COMMENT 'Notification type: new_body, autopsy_done, dispatch_created, body_dispatched, balance_update',
  `message` TEXT NOT NULL COMMENT 'Notification message content',
  `is_read` BOOLEAN DEFAULT FALSE COMMENT 'Has notification been read',
  `read_at` TIMESTAMP NULL COMMENT 'When notification was read',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  INDEX `idx_deceased_id` (`deceased_id`),
  INDEX `idx_type` (`type`),
  INDEX `idx_is_read` (`is_read`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_deceased_read` (`deceased_id`, `is_read`),
  
  FOREIGN KEY (`deceased_id`) REFERENCES `deceased`(`deceased_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Simple notifications for mortuary services';

-- =====================================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_notifications_unread ON notifications(is_read, created_at DESC);
CREATE INDEX idx_notifications_type_created ON notifications(type, created_at);

-- =====================================================
-- 3. CREATE VIEWS FOR REPORTING
-- =====================================================

-- View for unread notifications
CREATE OR REPLACE VIEW `unread_notifications_view` AS
SELECT 
    n.id,
    n.deceased_id,
    d.full_name as deceased_name,
    n.type,
    n.message,
    n.created_at
FROM notifications n
LEFT JOIN deceased d ON n.deceased_id = d.deceased_id
WHERE n.is_read = FALSE
ORDER BY n.created_at DESC;

-- View for notification summary by type
CREATE OR REPLACE VIEW `notification_summary_by_type` AS
SELECT 
    type,
    COUNT(*) as total_count,
    SUM(CASE WHEN is_read = TRUE THEN 1 ELSE 0 END) as read_count,
    SUM(CASE WHEN is_read = FALSE THEN 1 ELSE 0 END) as unread_count,
    DATE(MIN(created_at)) as first_notification,
    DATE(MAX(created_at)) as last_notification
FROM notifications
GROUP BY type
ORDER BY total_count DESC;

-- View for recent notifications
CREATE OR REPLACE VIEW `recent_notifications_view` AS
SELECT 
    n.id,
    n.deceased_id,
    d.full_name as deceased_name,
    n.type,
    n.message,
    n.is_read,
    n.created_at
FROM notifications n
LEFT JOIN deceased d ON n.deceased_id = d.deceased_id
ORDER BY n.created_at DESC
LIMIT 100;

-- =====================================================
-- 4. STORED PROCEDURES
-- =====================================================
DELIMITER $$

-- Procedure to clean old notifications
CREATE PROCEDURE `cleanup_old_notifications`(IN days_to_keep INT)
BEGIN
    DECLARE cleanup_date DATE;
    SET cleanup_date = DATE_SUB(CURDATE(), INTERVAL days_to_keep DAY);
    
    DELETE FROM notifications 
    WHERE created_at < cleanup_date 
      AND is_read = TRUE;
    
    SELECT ROW_COUNT() as notifications_deleted;
END$$

-- Procedure to mark notifications as read by deceased
CREATE PROCEDURE `mark_deceased_notifications_read`(
    IN p_deceased_id VARCHAR(50)
)
BEGIN
    UPDATE notifications 
    SET is_read = TRUE, 
        read_at = NOW()
    WHERE deceased_id = p_deceased_id 
      AND is_read = FALSE;
    
    SELECT ROW_COUNT() as notifications_marked_read;
END$$

-- Procedure to get notifications by type
CREATE PROCEDURE `get_notifications_by_type`(
    IN p_type VARCHAR(50),
    IN p_limit INT
)
BEGIN
    SELECT 
        n.*,
        d.full_name as deceased_name
    FROM notifications n
    LEFT JOIN deceased d ON n.deceased_id = d.deceased_id
    WHERE n.type = p_type
    ORDER BY n.created_at DESC
    LIMIT p_limit;
END$$

DELIMITER ;

-- =====================================================
-- Migration Complete
-- =====================================================