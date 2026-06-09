-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key)
);

-- Insert default settings
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES 
    ('organization_name', ''),
    ('organization_logo', ''),
    ('organization_email', ''),
    ('organization_phone', ''),
    ('organization_address', ''),
    ('currency', 'KES'),
    ('timezone', 'Africa/Nairobi'),
    ('date_format', 'YYYY-MM-DD'),
    ('time_format', '24h');