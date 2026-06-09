import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  /**
   * Master database tenants table
   * Stores organization metadata and multi-tenant registration
   */
  return knex.schema.createTableIfNotExists('tenants', (table) => {
    table.increments('tenant_id').primary();
    table.string('tenant_name', 255).notNullable();
    table.string('tenant_slug', 100).notNullable().unique();
    table.string('db_name', 100).notNullable().unique();
    table.string('email', 255).notNullable();
    table.string('phone', 20);
    table.text('location');
    table.string('logo_url', 500);
    table.enum('status', ['active', 'suspended', 'deleted']).defaultTo('active');
    table.enum('subscription_status', ['active', 'trial', 'suspended', 'cancelled']).defaultTo('trial');
    table.timestamp('subscription_expires_at');
    table.timestamps(true, true);

    // Indexes for performance
    table.index('tenant_slug');
    table.index('email');
    table.index('status');
    table.index('subscription_status');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('tenants');
}
