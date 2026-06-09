-- Create search_logs table for tracking search activities
CREATE TABLE IF NOT EXISTS search_logs (
  search_log_id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  user_id INT,
  query VARCHAR(255) NOT NULL,
  result_count INT DEFAULT 0,
  response_time_ms INT,
  created_at TIMESTAMP NULL ,
  
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
);

-- Create search_index table for optimized searches
CREATE TABLE IF NOT EXISTS search_index (
  search_index_id INT PRIMARY KEY AUTO_INCREMENT,
  tenant_id INT NOT NULL,
  module_name VARCHAR(50) NOT NULL,
  record_id INT NOT NULL,
  search_text VARCHAR(500),
  indexed_at TIMESTAMP NULL  ,
  
  UNIQUE KEY unique_record (tenant_id, module_name, record_id),
  INDEX idx_tenant_module (tenant_id, module_name),
  FULLTEXT INDEX ft_search_text (search_text),
  FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) ON DELETE CASCADE
);

-- Add indexes to existing tables for faster searching
ALTER TABLE deceased ADD FULLTEXT INDEX ft_deceased_search (deceased_id, admission_number, national_id);
ALTER TABLE documents ADD FULLTEXT INDEX ft_documents_search (title, file_name);
ALTER TABLE invoices ADD FULLTEXT INDEX ft_invoices_search (invoice_number);
ALTER TABLE users ADD FULLTEXT INDEX ft_users_search (email, name);
