/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const up = function(knex) {
  return knex.schema.createTable('payments', (table) => {
    table.increments('id').primary();
    table.integer('tenant_id').unsigned().notNullable().index();
    table.string('transaction_id').unique().notNullable();
    table.string('phone_number').notNullable();
    table.decimal('amount', 15, 2).notNullable();
    table.string('payment_type').notNullable(); // subscription, service, product
    table.string('reference').nullable(); // order_id, invoice_id, etc
    table.string('status').defaultTo('pending'); // pending, completed, failed, cancelled
    table.string('receipt_number').nullable();
    table.string('mpesa_receipt').nullable(); // MpesaReceiptNumber from callback
    table.text('description').nullable();
    table.text('callback_data').nullable(); // store full callback for debugging
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export const down = function(knex) {
  return knex.schema.dropTable('payments');
};