import type { Knex } from 'knex';

/**
 * Migration for individual tenant database schema
 * This creates the base tables that each tenant's dedicated database will have
 */

export async function up(knex: Knex): Promise<void> {
  // Users table in tenant database
  await knex.schema.createTableIfNotExists('users', (table) => {
    table.increments('user_id').primary();
    table.string('email', 255).notNullable().unique();
    table.string('password_hash', 255).notNullable();
    table.string('full_name', 100).notNullable();
    table.string('phone', 20);
    table.enum('role', ['admin', 'manager', 'staff']).defaultTo('staff');
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_verified').defaultTo(false);
    table.timestamp('last_login_at');
    table.timestamps(true, true);

    // Indexes
    table.index('email');
    table.index('role');
  });

  // Refresh tokens table
  await knex.schema.createTableIfNotExists('refresh_tokens', (table) => {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('users.user_id').onDelete('CASCADE');
    table.text('token').notNullable();
    table.text('user_agent');
    table.string('ip_address', 45);
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    table.timestamp('expires_at').notNullable();
    table.timestamp('revoked_at');

    // Indexes
    table.index('user_id');
    table.index(['token', 'is_active']);
  });

  // Mortuary settings table
  await knex.schema.createTableIfNotExists('mortuary_settings', (table) => {
    table.increments('id').primary();
    table.string('setting_key', 100).notNullable().unique();
    table.text('setting_value');
    table.timestamps(true, true);
  });

  // Deceased records table
  await knex.schema.createTableIfNotExists('deceased', (table) => {
    table.increments('deceased_id').primary();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.date('date_of_birth');
    table.date('date_of_death').notNullable();
    table.enum('gender', ['M', 'F', 'Other']);
    table.text('deceased_photo_url');
    table.text('cause_of_death');
    table.string('public_deceased_id', 50).unique(); // For public links (dec_x8j4k91n format)
    table.boolean('is_published').defaultTo(false); // Can family access this record?
    table.integer('user_id').references('users.user_id').onDelete('SET NULL');
    table.timestamps(true, true);

    // Indexes
    table.index('public_deceased_id');
    table.index('date_of_death');
    table.index('is_published');
  });

  // Next of kin table
  await knex.schema.createTableIfNotExists('next_of_kin', (table) => {
    table.increments('id').primary();
    table.integer('deceased_id').notNullable().references('deceased.deceased_id').onDelete('CASCADE');
    table.string('name', 100).notNullable();
    table.string('phone', 20);
    table.string('email', 255);
    table.string('relationship', 50);
    table.timestamps(true, true);

    // Indexes
    table.index('deceased_id');
  });

  return;
}

export async function down(knex: Knex): Promise<void> {
  // Drop in reverse order due to foreign keys
  await knex.schema.dropTableIfExists('next_of_kin');
  await knex.schema.dropTableIfExists('deceased');
  await knex.schema.dropTableIfExists('mortuary_settings');
  await knex.schema.dropTableIfExists('refresh_tokens');
  await knex.schema.dropTableIfExists('users');
}
