-- =====================================================
-- Migration: 009_invoices
-- Description: Complete invoice management system
-- Database-Per-Tenant: NO tenant_slug needed (each tenant has own DB)
-- =====================================================

-- =====================================================
-- 1. INVOICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `invoices` (
  `invoice_id` INT NOT NULL AUTO_INCREMENT,
  `invoice_number` VARCHAR(50) NOT NULL COMMENT 'Unique invoice number per tenant',
  `deceased_id` VARCHAR(50) NOT NULL COMMENT 'Reference to deceased',
  `service_date` TIMESTAMP NULL COMMENT 'Date of service',
  `invoice_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `due_date` TIMESTAMP NULL,
  `status` ENUM('draft', 'issued', 'paid', 'partial', 'cancelled', 'overdue') DEFAULT 'draft',
  `payment_status` ENUM('unpaid', 'partial_paid', 'paid') DEFAULT 'unpaid',
  `subtotal` DECIMAL(15,2) NOT NULL DEFAULT 0,
  `discount` DECIMAL(15,2) DEFAULT 0,
  `tax_amount` DECIMAL(15,2) DEFAULT 0,
  `tax_rate` DECIMAL(5,2) DEFAULT 0,
  `total` DECIMAL(15,2) NOT NULL,
  `amount_paid` DECIMAL(15,2) DEFAULT 0,
  `balance_due` DECIMAL(15,2) NOT NULL,
  `currency` ENUM('KES', 'USD', 'EUR', 'GBP') DEFAULT 'KES',
  `notes` TEXT,
  `terms` TEXT,
  `issued_by` INT COMMENT 'User ID who issued invoice',
  `approved_by` INT,
  `approved_at` TIMESTAMP NULL,
  `next_of_kin_contact` VARCHAR(100),
  `next_of_kin_email` VARCHAR(255),
  `created_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` BOOLEAN DEFAULT FALSE,
  `deleted_at` TIMESTAMP NULL,
  `deleted_by` INT,
  
  PRIMARY KEY (`invoice_id`),
  UNIQUE KEY `unique_invoice_number` (`invoice_number`),
  INDEX `idx_deceased_id` (`deceased_id`),
  INDEX `idx_invoice_number` (`invoice_number`),
  INDEX `idx_status` (`status`),
  INDEX `idx_payment_status` (`payment_status`),
  INDEX `idx_invoice_date` (`invoice_date`),
  INDEX `idx_due_date` (`due_date`),
  INDEX `idx_total` (`total`),
  INDEX `idx_balance_due` (`balance_due`),
  INDEX `idx_is_deleted` (`is_deleted`),
  INDEX `idx_created_by` (`created_by`),
  INDEX `idx_issued_by` (`issued_by`),
  
  FOREIGN KEY (`deceased_id`) REFERENCES `deceased`(`deceased_id`) ON DELETE CASCADE,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL,
  FOREIGN KEY (`issued_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL,
  FOREIGN KEY (`approved_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Invoices for mortuary services';

-- =====================================================
-- 2. INVOICE LINE ITEMS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `invoice_items` (
  `item_id` INT NOT NULL AUTO_INCREMENT,
  `invoice_id` INT NOT NULL,
  `service_type` VARCHAR(100) NOT NULL COMMENT 'Type: embalming, coffin, removal, etc',
  `service_description` VARCHAR(255) NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  `unit_price` DECIMAL(15,2) NOT NULL,
  `total_price` DECIMAL(15,2) NOT NULL,
  `tax_rate` DECIMAL(5,2) DEFAULT 0,
  `tax_amount` DECIMAL(15,2) DEFAULT 0,
  `discount_amount` DECIMAL(15,2) DEFAULT 0,
  `notes` TEXT,
  `reference_id` VARCHAR(100) COMMENT 'Reference to service ID (coffin_id, product_id, etc)',
  `reference_type` VARCHAR(50) COMMENT 'Reference table name (marketplace_products, services, etc)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`item_id`),
  INDEX `idx_invoice_id` (`invoice_id`),
  INDEX `idx_service_type` (`service_type`),
  INDEX `idx_reference_id` (`reference_id`),
  INDEX `idx_reference_type` (`reference_type`),
  
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`invoice_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Invoice line items';

-- =====================================================
-- 3. INVOICE PAYMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS `invoice_payments` (
  `payment_id` INT NOT NULL AUTO_INCREMENT,
  `invoice_id` INT NOT NULL,
  `payment_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `payment_method` ENUM('cash', 'check', 'mpesa', 'bank_transfer', 'card', 'other') NOT NULL,
  `amount_paid` DECIMAL(15,2) NOT NULL,
  `reference_number` VARCHAR(100) COMMENT 'Reference number from payment provider',
  `transaction_id` VARCHAR(100) COMMENT 'Transaction ID from payment gateway',
  `mpesa_receipt` VARCHAR(50) COMMENT 'M-Pesa receipt number',
  `check_number` VARCHAR(50) COMMENT 'Check number if payment_method is check',
  `bank_name` VARCHAR(100) COMMENT 'Bank name for bank transfers',
  `notes` TEXT,
  `received_by` INT COMMENT 'User ID who received payment',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`payment_id`),
  INDEX `idx_invoice_id` (`invoice_id`),
  INDEX `idx_payment_date` (`payment_date`),
  INDEX `idx_payment_method` (`payment_method`),
  INDEX `idx_reference_number` (`reference_number`),
  INDEX `idx_transaction_id` (`transaction_id`),
  INDEX `idx_mpesa_receipt` (`mpesa_receipt`),
  INDEX `idx_received_by` (`received_by`),
  
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`invoice_id`) ON DELETE CASCADE,
  FOREIGN KEY (`received_by`) REFERENCES `users`(`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Invoice payment records';

-- =====================================================
-- 4. CREATE TRIGGERS FOR AUTO-UPDATING INVOICE TOTALS
-- =====================================================

DELIMITER $$

-- Trigger to update invoice totals when items are added
CREATE TRIGGER `update_invoice_totals_after_insert` 
AFTER INSERT ON `invoice_items` 
FOR EACH ROW 
BEGIN
    DECLARE new_subtotal DECIMAL(15,2);
    DECLARE new_total DECIMAL(15,2);
    DECLARE new_balance DECIMAL(15,2);
    
    SELECT SUM(total_price) INTO new_subtotal 
    FROM invoice_items WHERE invoice_id = NEW.invoice_id;
    
    SET new_total = new_subtotal - (SELECT discount FROM invoices WHERE invoice_id = NEW.invoice_id) 
                    + (SELECT tax_amount FROM invoices WHERE invoice_id = NEW.invoice_id);
    
    SET new_balance = new_total - (SELECT amount_paid FROM invoices WHERE invoice_id = NEW.invoice_id);
    
    UPDATE invoices 
    SET 
        subtotal = new_subtotal,
        total = new_total,
        balance_due = new_balance
    WHERE invoice_id = NEW.invoice_id;
END$$

-- Trigger to update invoice totals when items are updated
CREATE TRIGGER `update_invoice_totals_after_update` 
AFTER UPDATE ON `invoice_items` 
FOR EACH ROW 
BEGIN
    DECLARE new_subtotal DECIMAL(15,2);
    DECLARE new_total DECIMAL(15,2);
    DECLARE new_balance DECIMAL(15,2);
    
    SELECT SUM(total_price) INTO new_subtotal 
    FROM invoice_items WHERE invoice_id = NEW.invoice_id;
    
    SET new_total = new_subtotal - (SELECT discount FROM invoices WHERE invoice_id = NEW.invoice_id) 
                    + (SELECT tax_amount FROM invoices WHERE invoice_id = NEW.invoice_id);
    
    SET new_balance = new_total - (SELECT amount_paid FROM invoices WHERE invoice_id = NEW.invoice_id);
    
    UPDATE invoices 
    SET 
        subtotal = new_subtotal,
        total = new_total,
        balance_due = new_balance
    WHERE invoice_id = NEW.invoice_id;
END$$

-- Trigger to update invoice totals when items are deleted
CREATE TRIGGER `update_invoice_totals_after_delete` 
AFTER DELETE ON `invoice_items` 
FOR EACH ROW 
BEGIN
    DECLARE new_subtotal DECIMAL(15,2);
    DECLARE new_total DECIMAL(15,2);
    DECLARE new_balance DECIMAL(15,2);
    
    SELECT COALESCE(SUM(total_price), 0) INTO new_subtotal 
    FROM invoice_items WHERE invoice_id = OLD.invoice_id;
    
    SET new_total = new_subtotal - (SELECT discount FROM invoices WHERE invoice_id = OLD.invoice_id) 
                    + (SELECT tax_amount FROM invoices WHERE invoice_id = OLD.invoice_id);
    
    SET new_balance = new_total - (SELECT amount_paid FROM invoices WHERE invoice_id = OLD.invoice_id);
    
    UPDATE invoices 
    SET 
        subtotal = new_subtotal,
        total = new_total,
        balance_due = new_balance
    WHERE invoice_id = OLD.invoice_id;
END$$

-- Trigger to update payment status when payments are made
CREATE TRIGGER `update_invoice_payment_status_after_insert` 
AFTER INSERT ON `invoice_payments` 
FOR EACH ROW 
BEGIN
    DECLARE total_paid DECIMAL(15,2);
    DECLARE invoice_total DECIMAL(15,2);
    
    SELECT SUM(amount_paid) INTO total_paid 
    FROM invoice_payments WHERE invoice_id = NEW.invoice_id;
    
    SELECT total INTO invoice_total 
    FROM invoices WHERE invoice_id = NEW.invoice_id;
    
    UPDATE invoices 
    SET 
        amount_paid = total_paid,
        balance_due = invoice_total - total_paid,
        payment_status = CASE 
            WHEN total_paid >= invoice_total THEN 'paid'
            WHEN total_paid > 0 AND total_paid < invoice_total THEN 'partial_paid'
            ELSE 'unpaid'
        END,
        status = CASE 
            WHEN total_paid >= invoice_total THEN 'paid'
            ELSE status
        END
    WHERE invoice_id = NEW.invoice_id;
END$$

-- Trigger to update payment status when payments are updated
CREATE TRIGGER `update_invoice_payment_status_after_update` 
AFTER UPDATE ON `invoice_payments` 
FOR EACH ROW 
BEGIN
    DECLARE total_paid DECIMAL(15,2);
    DECLARE invoice_total DECIMAL(15,2);
    
    SELECT SUM(amount_paid) INTO total_paid 
    FROM invoice_payments WHERE invoice_id = NEW.invoice_id;
    
    SELECT total INTO invoice_total 
    FROM invoices WHERE invoice_id = NEW.invoice_id;
    
    UPDATE invoices 
    SET 
        amount_paid = total_paid,
        balance_due = invoice_total - total_paid,
        payment_status = CASE 
            WHEN total_paid >= invoice_total THEN 'paid'
            WHEN total_paid > 0 AND total_paid < invoice_total THEN 'partial_paid'
            ELSE 'unpaid'
        END,
        status = CASE 
            WHEN total_paid >= invoice_total THEN 'paid'
            ELSE status
        END
    WHERE invoice_id = NEW.invoice_id;
END$$

-- Trigger to update payment status when payments are deleted
CREATE TRIGGER `update_invoice_payment_status_after_delete` 
AFTER DELETE ON `invoice_payments` 
FOR EACH ROW 
BEGIN
    DECLARE total_paid DECIMAL(15,2);
    DECLARE invoice_total DECIMAL(15,2);
    
    SELECT COALESCE(SUM(amount_paid), 0) INTO total_paid 
    FROM invoice_payments WHERE invoice_id = OLD.invoice_id;
    
    SELECT total INTO invoice_total 
    FROM invoices WHERE invoice_id = OLD.invoice_id;
    
    UPDATE invoices 
    SET 
        amount_paid = total_paid,
        balance_due = invoice_total - total_paid,
        payment_status = CASE 
            WHEN total_paid >= invoice_total THEN 'paid'
            WHEN total_paid > 0 AND total_paid < invoice_total THEN 'partial_paid'
            ELSE 'unpaid'
        END,
        status = CASE 
            WHEN total_paid >= invoice_total THEN 'paid'
            ELSE status
        END
    WHERE invoice_id = OLD.invoice_id;
END$$

DELIMITER ;

-- =====================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_invoices_status_date ON invoices(status, invoice_date);
CREATE INDEX idx_invoices_payment_status ON invoices(payment_status, balance_due);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id, service_type);
CREATE INDEX idx_invoice_payments_invoice_date ON invoice_payments(invoice_id, payment_date);
CREATE INDEX idx_invoice_payments_method_date ON invoice_payments(payment_method, payment_date);

-- =====================================================
-- 6. CREATE VIEW FOR INVOICE SUMMARY
-- =====================================================
CREATE OR REPLACE VIEW `invoice_summary_view` AS
SELECT 
    i.invoice_id,
    i.invoice_number,
    i.deceased_id,
    d.full_name as deceased_name,
    i.invoice_date,
    i.due_date,
    i.status,
    i.payment_status,
    i.subtotal,
    i.discount,
    i.tax_amount,
    i.total,
    i.amount_paid,
    i.balance_due,
    i.currency,
    i.notes,
    COUNT(DISTINCT it.item_id) as total_items,
    COUNT(DISTINCT ip.payment_id) as payment_count,
    MAX(ip.payment_date) as last_payment_date,
    u.full_name as issued_by_name,
    creator.full_name as created_by_name
FROM invoices i
LEFT JOIN deceased d ON i.deceased_id = d.deceased_id
LEFT JOIN invoice_items it ON i.invoice_id = it.invoice_id
LEFT JOIN invoice_payments ip ON i.invoice_id = ip.invoice_id
LEFT JOIN users u ON i.issued_by = u.user_id
LEFT JOIN users creator ON i.created_by = creator.user_id
WHERE i.is_deleted = FALSE
GROUP BY i.invoice_id;

-- =====================================================
-- Migration Complete
-- =====================================================