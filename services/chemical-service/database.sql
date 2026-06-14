-- ============================================
-- Chemical Management - Database Tables
-- Per-tenant chemical tracking
-- ============================================

-- Chemicals / Products in stock
CREATE TABLE IF NOT EXISTS chemicals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) DEFAULT 'embalming',
  unit VARCHAR(50) NOT NULL DEFAULT 'liters',
  current_stock DECIMAL(10,2) NOT NULL DEFAULT 0,
  min_stock_level DECIMAL(10,2) DEFAULT 0,
  unit_cost DECIMAL(10,2) DEFAULT 0,
  supplier VARCHAR(255) DEFAULT NULL,
  batch_number VARCHAR(100) DEFAULT NULL,
  expiry_date DATE DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_chemicals_category (category),
  INDEX idx_chemicals_active (is_active)
);

-- Stock transactions (received, consumed, adjusted)
CREATE TABLE IF NOT EXISTS chemical_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chemical_id INT NOT NULL,
  transaction_type ENUM('received', 'consumed', 'adjusted', 'wasted') NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL DEFAULT 'liters',
  previous_stock DECIMAL(10,2) NOT NULL,
  new_stock DECIMAL(10,2) NOT NULL,
  reference_type VARCHAR(50) DEFAULT NULL,
  reference_id INT DEFAULT NULL,
  performed_by INT DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chemical_id) REFERENCES chemicals(id) ON DELETE CASCADE,
  INDEX idx_transactions_chemical (chemical_id),
  INDEX idx_transactions_type (transaction_type),
  INDEX idx_transactions_date (created_at)
);

-- Chemical usage per deceased
CREATE TABLE IF NOT EXISTS deceased_chemical_usage (
  id INT AUTO_INCREMENT PRIMARY KEY,
  deceased_id INT NOT NULL,
  chemical_id INT NOT NULL,
  quantity_used DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) NOT NULL DEFAULT 'liters',
  transaction_id INT DEFAULT NULL,
  used_by INT DEFAULT NULL,
  usage_notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chemical_id) REFERENCES chemicals(id) ON DELETE CASCADE,
  FOREIGN KEY (transaction_id) REFERENCES chemical_transactions(id) ON DELETE SET NULL,
  INDEX idx_usage_deceased (deceased_id),
  INDEX idx_usage_chemical (chemical_id),
  INDEX idx_usage_date (created_at)
);

-- Low stock alerts configuration
CREATE TABLE IF NOT EXISTS chemical_alerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  chemical_id INT NOT NULL,
  alert_threshold DECIMAL(10,2) DEFAULT NULL,
  is_triggered TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chemical_id) REFERENCES chemicals(id) ON DELETE CASCADE,
  UNIQUE KEY uk_chemical_alert (chemical_id)
);