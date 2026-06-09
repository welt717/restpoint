/**
 * Migration: Create Memorial Platform Tables
 * 
 * Creates tables for:
 * - memorial_pages: Public memorial page data
 * - condolences: Visitor condolence messages
 * - virtual_candles: Virtual candle lighting
 * - memories_tributes: Visitor memories and tributes
 */

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Memorial Pages Table
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS memorial_pages (
      id INT PRIMARY KEY AUTO_INCREMENT,
      tenant_id INT NOT NULL,
      deceased_id INT NOT NULL,
      slug VARCHAR(255) NOT NULL UNIQUE,
      biography TEXT NULL,
      family_message TEXT NULL,
      tribute_message TEXT NULL,
      funeral_details JSON NULL,
      burial_details JSON NULL,
      gallery JSON NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP NULL ,
      updated_at TIMESTAMP NULL  ,
      INDEX idx_tenant_slug (tenant_id, slug),
      INDEX idx_deceased (deceased_id),
      FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (deceased_id) REFERENCES deceased(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Condolences Table
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS condolences (
      id INT PRIMARY KEY AUTO_INCREMENT,
      tenant_id INT NOT NULL,
      memorial_id INT NOT NULL,
      visitor_name VARCHAR(255) NOT NULL,
      visitor_email VARCHAR(255) NULL,
      message TEXT NOT NULL,
      is_approved BOOLEAN DEFAULT FALSE,
      is_flagged BOOLEAN DEFAULT FALSE,
      ip_address VARCHAR(45) NULL,
      created_at TIMESTAMP NULL ,
      updated_at TIMESTAMP NULL  ,
      INDEX idx_memorial_approved (memorial_id, is_approved),
      INDEX idx_created_at (created_at),
      FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (memorial_id) REFERENCES memorial_pages(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Virtual Candles Table
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS virtual_candles (
      id INT PRIMARY KEY AUTO_INCREMENT,
      tenant_id INT NOT NULL,
      memorial_id INT NOT NULL,
      visitor_name VARCHAR(255) NULL DEFAULT 'Anonymous',
      visitor_email VARCHAR(255) NULL,
      message TEXT NULL,
      ip_address VARCHAR(45) NULL,
      lit_at TIMESTAMP NULL ,
      INDEX idx_memorial (memorial_id),
      FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (memorial_id) REFERENCES memorial_pages(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Memories & Tributes Table
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS memories_tributes (
      id INT PRIMARY KEY AUTO_INCREMENT,
      tenant_id INT NOT NULL,
      memorial_id INT NOT NULL,
      visitor_name VARCHAR(255) NOT NULL,
      visitor_email VARCHAR(255) NULL,
      message TEXT NULL,
      media_url VARCHAR(500) NULL,
      media_type ENUM('photo', 'video', 'text') DEFAULT 'text',
      is_approved BOOLEAN DEFAULT FALSE,
      is_flagged BOOLEAN DEFAULT FALSE,
      ip_address VARCHAR(45) NULL,
      created_at TIMESTAMP NULL ,
      updated_at TIMESTAMP NULL  ,
      INDEX idx_memorial_approved (memorial_id, is_approved),
      INDEX idx_created_at (created_at),
      FOREIGN KEY (tenant_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (memorial_id) REFERENCES memorial_pages(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TABLE IF EXISTS memories_tributes');
  await knex.raw('DROP TABLE IF EXISTS virtual_candles');
  await knex.raw('DROP TABLE IF EXISTS condolences');
  await knex.raw('DROP TABLE IF EXISTS memorial_pages');
}