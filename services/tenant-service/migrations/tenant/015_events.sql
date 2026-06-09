-- =====================================================
-- Migration: 015_events
-- Description: Calendar events management system
-- Database-Per-Tenant: NO tenant_slug needed (each tenant has own DB)
-- =====================================================

-- =====================================================
-- 1. EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `events` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL COMMENT 'Event title',
  `description` TEXT COMMENT 'Event description/details',
  `start` TIMESTAMP NOT NULL COMMENT 'Event start date and time',
  `end` TIMESTAMP NOT NULL COMMENT 'Event end date and time',
  `category` ENUM('BURIAL', 'FUNERAL', 'VIEWING', 'EMBALMING', 'COLLECTION', 'MEETING', 'OTHER') DEFAULT 'OTHER' COMMENT 'Event category',
  `priority` ENUM('HIGH', 'MEDIUM', 'LOW') DEFAULT 'MEDIUM' COMMENT 'Event priority',
  `status` ENUM('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING' COMMENT 'Event status',
  `staff` VARCHAR(255) DEFAULT 'Unassigned' COMMENT 'Assigned staff member(s)',
  `staff_ids` TEXT COMMENT 'JSON array of staff user IDs',
  `location` VARCHAR(255) COMMENT 'Event location',
  `all_day` BOOLEAN DEFAULT FALSE COMMENT 'Is this an all-day event',
  `recurring` BOOLEAN DEFAULT FALSE COMMENT 'Is this a recurring event',
  `recurrence_rule` VARCHAR(255) COMMENT 'RRULE for recurring events',
  `parent_event_id` INT NULL COMMENT 'For recurring events - parent event ID',
  `color` VARCHAR(50) COMMENT 'Event color for calendar display',
  `reminder_minutes` INT DEFAULT 30 COMMENT 'Minutes before event to remind',
  `reminder_sent` BOOLEAN DEFAULT FALSE COMMENT 'Has reminder been sent',
  `attachments` TEXT COMMENT 'JSON array of attachment IDs',
  `notes` TEXT COMMENT 'Additional notes',
  `created_by` INT COMMENT 'User ID who created the event',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `deleted_at` TIMESTAMP NULL,
  `deleted_by` INT,
  
  PRIMARY KEY (`id`),
  INDEX `idx_start_date` (`start`),
  INDEX `idx_end_date` (`end`),
  INDEX `idx_category` (`category`),
  INDEX `idx_priority` (`priority`),
  INDEX `idx_status` (`status`),
  INDEX `idx_staff` (`staff`),
  INDEX `idx_created_by` (`created_by`),
  INDEX `idx_parent_event` (`parent_event_id`),
  INDEX `idx_start_status` (`start`, `status`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_is_deleted` (`is_deleted`),
  INDEX `idx_category_status` (`category`, `status`),
  INDEX `idx_recurring` (`recurring`),
  
  FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL,
  FOREIGN KEY (`deleted_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL,
  FOREIGN KEY (`parent_event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Calendar events for mortuary services';

-- =====================================================
-- 2. EVENT ATTENDEES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `event_attendees` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `event_id` INT NOT NULL COMMENT 'Event ID',
  `user_id` INT NOT NULL COMMENT 'Attendee user ID',
  `role` VARCHAR(100) COMMENT 'Attendee role (officiant, family, staff, etc)',
  `rsvp_status` ENUM('pending', 'accepted', 'declined', 'maybe') DEFAULT 'pending',
  `response_date` TIMESTAMP NULL COMMENT 'When they responded',
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_event_attendee` (`event_id`, `user_id`),
  INDEX `idx_event_id` (`event_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_rsvp_status` (`rsvp_status`),
  
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Event attendees and participants';

-- =====================================================
-- 3. EVENT REMINDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `event_reminders` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `event_id` INT NOT NULL,
  `reminder_time` TIMESTAMP NOT NULL COMMENT 'When to send reminder',
  `reminder_type` ENUM('email', 'sms', 'push') DEFAULT 'email',
  `sent` BOOLEAN DEFAULT FALSE,
  `sent_at` TIMESTAMP NULL,
  `recipient` VARCHAR(255) COMMENT 'Email or phone number',
  `message` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  INDEX `idx_event_id` (`event_id`),
  INDEX `idx_reminder_time` (`reminder_time`),
  INDEX `idx_sent` (`sent`),
  
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Event reminders schedule';

-- =====================================================
-- 4. EVENT CATEGORIES REFERENCE TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `event_categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `category_name` VARCHAR(100) NOT NULL UNIQUE,
  `category_code` VARCHAR(50) NOT NULL UNIQUE,
  `description` TEXT,
  `color` VARCHAR(50) DEFAULT '#3B82F6',
  `icon` VARCHAR(100),
  `is_active` BOOLEAN DEFAULT TRUE,
  `sort_order` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  INDEX `idx_category_code` (`category_code`),
  INDEX `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Reference table for event categories';

-- =====================================================
-- 5. INSERT DEFAULT EVENT CATEGORIES (REQUIRED DATA)
-- =====================================================
INSERT IGNORE INTO `event_categories` (`category_name`, `category_code`, `description`, `color`, `sort_order`) VALUES
('Burial', 'BURIAL', 'Burial ceremony event', '#8B5CF6', 1),
('Funeral', 'FUNERAL', 'Funeral service event', '#3B82F6', 2),
('Viewing', 'VIEWING', 'Body viewing event', '#10B981', 3),
('Embalming', 'EMBALMING', 'Embalming procedure', '#F59E0B', 4),
('Collection', 'COLLECTION', 'Body collection event', '#EF4444', 5),
('Meeting', 'MEETING', 'Staff or family meeting', '#6366F1', 6),
('Other', 'OTHER', 'Other types of events', '#6B7280', 7);

-- =====================================================
-- 6. EVENT LOGS TABLE (AUDIT TRAIL)
-- =====================================================
CREATE TABLE IF NOT EXISTS `event_logs` (
  `log_id` INT NOT NULL AUTO_INCREMENT,
  `event_id` INT NOT NULL,
  `action` ENUM('create', 'update', 'delete', 'status_change', 'reminder_sent') NOT NULL,
  `action_by` INT,
  `old_data` JSON COMMENT 'Previous data before update',
  `new_data` JSON COMMENT 'New data after update',
  `ip_address` VARCHAR(45),
  `user_agent` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`log_id`),
  INDEX `idx_event_id` (`event_id`),
  INDEX `idx_action` (`action`),
  INDEX `idx_action_by` (`action_by`),
  INDEX `idx_created_at` (`created_at`),
  
  FOREIGN KEY (`event_id`) REFERENCES `events`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`action_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Audit log for event changes';

-- =====================================================
-- 7. CREATE TRIGGERS FOR AUTO-LOGGING
-- =====================================================
DELIMITER $$

CREATE TRIGGER `log_event_after_insert`
AFTER INSERT ON `events`
FOR EACH ROW
BEGIN
    INSERT INTO event_logs (event_id, action, action_by, new_data)
    VALUES (NEW.id, 'create', NEW.created_by, JSON_OBJECT('title', NEW.title, 'start', NEW.start, 'end', NEW.end));
END$$

CREATE TRIGGER `log_event_after_update`
AFTER UPDATE ON `events`
FOR EACH ROW
BEGIN
    IF OLD.status != NEW.status THEN
        INSERT INTO event_logs (event_id, action, action_by, old_data, new_data)
        VALUES (NEW.id, 'status_change', NEW.created_by, 
                JSON_OBJECT('status', OLD.status), 
                JSON_OBJECT('status', NEW.status));
    ELSE
        INSERT INTO event_logs (event_id, action, action_by, old_data, new_data)
        VALUES (NEW.id, 'update', NEW.created_by, 
                JSON_OBJECT('title', OLD.title, 'start', OLD.start, 'end', OLD.end),
                JSON_OBJECT('title', NEW.title, 'start', NEW.start, 'end', NEW.end));
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_events_month_year ON events(YEAR(start), MONTH(start));
CREATE INDEX idx_events_date_range ON events(start, end);
CREATE INDEX idx_events_status_priority ON events(status, priority);
CREATE INDEX idx_event_attendees_event_user ON event_attendees(event_id, user_id);
CREATE INDEX idx_event_reminders_pending ON event_reminders(reminder_time, sent);

-- =====================================================
-- 9. CREATE VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for upcoming events
CREATE OR REPLACE VIEW `upcoming_events_view` AS
SELECT 
    e.id,
    e.title,
    e.description,
    e.start,
    e.end,
    e.category,
    e.priority,
    e.status,
    e.staff,
    e.location,
    e.color,
    DATEDIFF(e.start, NOW()) as days_until,
    CASE 
        WHEN e.start > NOW() THEN 'Upcoming'
        WHEN e.start <= NOW() AND e.end >= NOW() THEN 'In Progress'
        WHEN e.end < NOW() THEN 'Completed'
    END as event_status
FROM events e
WHERE e.start >= NOW() 
  AND e.is_deleted = FALSE
  AND e.status != 'CANCELLED'
ORDER BY e.start ASC;

-- View for today's events
CREATE OR REPLACE VIEW `today_events_view` AS
SELECT 
    e.id,
    e.title,
    e.description,
    e.start,
    e.end,
    e.category,
    e.priority,
    e.status,
    e.staff,
    e.location,
    TIME(e.start) as start_time,
    TIME(e.end) as end_time
FROM events e
WHERE DATE(e.start) = CURDATE()
  AND e.is_deleted = FALSE
  AND e.status != 'CANCELLED'
ORDER BY e.start ASC;

-- View for monthly event summary
CREATE OR REPLACE VIEW `monthly_events_summary` AS
SELECT 
    YEAR(start) as year,
    MONTH(start) as month,
    category,
    COUNT(*) as total_events,
    SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completed,
    SUM(CASE WHEN status = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
    SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled
FROM events
WHERE is_deleted = FALSE
GROUP BY YEAR(start), MONTH(start), category
ORDER BY year DESC, month DESC, category;

-- =====================================================
-- 10. STORED PROCEDURES
-- =====================================================

-- Procedure to clean up old events (archive)
DELIMITER $$

CREATE PROCEDURE `archive_old_events`(IN days_old INT)
BEGIN
    DECLARE archive_date DATE;
    SET archive_date = DATE_SUB(CURDATE(), INTERVAL days_old DAY);
    
    UPDATE events 
    SET is_deleted = TRUE, 
        deleted_at = NOW() 
    WHERE start < archive_date 
      AND is_deleted = FALSE 
      AND status = 'COMPLETED';
    
    SELECT ROW_COUNT() as events_archived;
END$$

-- Procedure to create recurring events
CREATE PROCEDURE `create_recurring_events`(
    IN p_parent_event_id INT,
    IN p_recurrence_type VARCHAR(20),
    IN p_recurrence_count INT,
    IN p_end_date DATE
)
BEGIN
    DECLARE v_counter INT DEFAULT 1;
    DECLARE v_current_start DATETIME;
    DECLARE v_current_end DATETIME;
    DECLARE v_parent_start DATETIME;
    DECLARE v_parent_end DATETIME;
    DECLARE v_parent_title VARCHAR(255);
    DECLARE v_parent_description TEXT;
    DECLARE v_parent_category ENUM('BURIAL', 'FUNERAL', 'VIEWING', 'EMBALMING', 'COLLECTION', 'MEETING', 'OTHER');
    DECLARE v_parent_priority ENUM('HIGH', 'MEDIUM', 'LOW');
    DECLARE v_parent_staff VARCHAR(255);
    
    SELECT start, end, title, description, category, priority, staff 
    INTO v_parent_start, v_parent_end, v_parent_title, v_parent_description, 
         v_parent_category, v_parent_priority, v_parent_staff
    FROM events WHERE id = p_parent_event_id;
    
    WHILE v_counter <= p_recurrence_count DO
        IF p_recurrence_type = 'daily' THEN
            SET v_current_start = DATE_ADD(v_parent_start, INTERVAL v_counter DAY);
            SET v_current_end = DATE_ADD(v_parent_end, INTERVAL v_counter DAY);
        ELSEIF p_recurrence_type = 'weekly' THEN
            SET v_current_start = DATE_ADD(v_parent_start, INTERVAL v_counter WEEK);
            SET v_current_end = DATE_ADD(v_parent_end, INTERVAL v_counter WEEK);
        ELSEIF p_recurrence_type = 'monthly' THEN
            SET v_current_start = DATE_ADD(v_parent_start, INTERVAL v_counter MONTH);
            SET v_current_end = DATE_ADD(v_parent_end, INTERVAL v_counter MONTH);
        END IF;
        
        IF p_end_date IS NULL OR DATE(v_current_start) <= p_end_date THEN
            INSERT INTO events (
                title, description, start, end, category, priority, status, 
                staff, parent_event_id, recurring, created_by
            ) VALUES (
                v_parent_title, v_parent_description, v_current_start, v_current_end,
                v_parent_category, v_parent_priority, 'PENDING', v_parent_staff,
                p_parent_event_id, FALSE, 1
            );
        END IF;
        
        SET v_counter = v_counter + 1;
    END WHILE;
END$$

DELIMITER ;

-- =====================================================
-- Migration Complete
-- =====================================================