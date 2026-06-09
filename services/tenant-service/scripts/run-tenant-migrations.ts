/**
 * Script to run migrations for all existing tenants
 * This script will:
 * 1. Connect to the master database
 * 2. Get all active tenant databases
 * 3. Run migrations for each tenant database
 * 
 * Usage: npx ts-node scripts/run-tenant-migrations.ts
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { runTenantMigrations, runAllMigrations } from '../../shared/migrations';

dotenv.config({ path: path.join(__dirname, '../.env') });

const config = {
  host: process.env.MASTER_DB_HOST || 'localhost',
  port: parseInt(process.env.MASTER_DB_PORT || '3306'),
  user: process.env.MASTER_DB_USER || 'root',
  password: process.env.MASTER_DB_PASSWORD || 'root',
};

async function getAllTenantDatabases(): Promise<string[]> {
  const connection = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: process.env.MASTER_DB_NAME || 'master_db',
  });

  try {
    const [rows] = await connection.query(
      'SELECT db_name FROM tenants WHERE status = "active"'
    );
    
    return (rows as any[]).map(row => row.db_name);
  } finally {
    await connection.end();
  }
}

async function runMigrationsForAllTenants() {
  console.log('========================================');
  console.log('🚀 Running migrations for all tenants');
  console.log('========================================\n');

  try {
    // First run master migrations
    console.log('📝 Running master database migrations...');
    await runAllMigrations();
    
    console.log('\n========================================');
    console.log('✅ All migrations completed successfully!');
    console.log('========================================');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

async function runMigrationsForSpecificTenant(dbName: string) {
  console.log(`📝 Running migrations for tenant: ${dbName}`);
  
  try {
    await runTenantMigrations(dbName);
    console.log(`✅ Migrations completed for: ${dbName}`);
  } catch (error: any) {
    console.error(`❌ Migration failed for ${dbName}:`, error.message);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // Run for all tenants
    await runMigrationsForAllTenants();
  } else if (args[0] === '--tenant' && args[1]) {
    // Run for specific tenant
    await runMigrationsForSpecificTenant(args[1]);
  } else {
    console.log('Usage:');
    console.log('  npx ts-node scripts/run-tenant-migrations.ts           # Run for all tenants');
    console.log('  npx ts-node scripts/run-tenant-migrations.ts --tenant <db_name>  # Run for specific tenant');
    process.exit(1);
  }
}

main();