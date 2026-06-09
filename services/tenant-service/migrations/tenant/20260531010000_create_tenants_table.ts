import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS organizations (
      id CHAR(36) PRIMARY KEY,
      slug VARCHAR(255) NOT NULL UNIQUE,
      organization_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      location VARCHAR(255) NOT NULL,
      logo_url VARCHAR(500) NULL,
      logo_public_id VARCHAR(255) NULL,
      terms_accepted BOOLEAN DEFAULT TRUE,
      is_active BOOLEAN DEFAULT TRUE,
      subscription_plan ENUM('basic',  'free' ,  'premium') DEFAULT 'basic',
      subscription_status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
      subscription_expires_at TIMESTAMP NULL,
      created_at TIMESTAMP NULL,
      updated_at TIMESTAMP NULL,
      INDEX idx_slug (slug),
      INDEX idx_email (email),
      INDEX idx_organization_name (organization_name),
      INDEX idx_subscription_status (subscription_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP TABLE IF EXISTS organizations`);
}