import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add database_name column to organizations table
  await knex.raw(`
    ALTER TABLE organizations 
    ADD COLUMN database_name VARCHAR(255) NULL UNIQUE AFTER subscription_expires_at,
    ADD INDEX idx_database_name (database_name)
  `);
  
  console.log('✅ Added database_name column to organizations table');
}

export async function down(knex: Knex): Promise<void> {
  // Remove database_name column from organizations table
  await knex.raw(`
    ALTER TABLE organizations 
    DROP COLUMN database_name
  `);
  
  console.log('✅ Removed database_name column from organizations table');
}