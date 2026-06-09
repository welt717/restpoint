exports.up = async function(knex) {
  await knex.schema.createTable('users', (table) => {
    table.increments('user_id').primary();
    table.integer('tenant_id').unsigned().notNullable();
    table.string('email', 255).notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('name', 100).notNullable();
    table.enum('role', ['super_admin', 'tenant_admin', 'user']).defaultTo('user');
    table.boolean('is_active').defaultTo(true);
    table.timestamp('last_login_at').nullable();
    table.timestamp('created_at');
    table.timestamp('updated_at');
    table.timestamp('deleted_at').nullable();
    
    // Unique constraint: same email cannot be used twice in the same tenant
    table.unique(['tenant_id', 'email']);
    
    // Foreign key
    table.foreign('tenant_id').references('tenants.tenant_id').onDelete('CASCADE');
    
    // Indexes for faster queries
    table.index(['tenant_id', 'email']);
    table.index(['tenant_id', 'role']);
    table.index(['email']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTable('users');
};