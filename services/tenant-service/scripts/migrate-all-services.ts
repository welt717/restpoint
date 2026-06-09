/**
 * @file apps/tenant-service/scripts/migrate-all-services.ts
 * PRODUCTION-READY: Batch Migrate All Tenants
 * 
 * Usage:
 * - npm run migrate:all              # Migrate all active tenants
 * - npm run migrate:all -- --force   # Force re-run all migrations
 * - npm run migrate:all -- --verbose # Show detailed logs
 * 
 * This script:
 * 1. Connects to master database
 * 2. Gets all active tenants
 * 3. Runs ALL service migrations for each tenant
 * 4. Reports results
 */

import dotenv from 'dotenv';
import path from 'path';
import mysql from 'mysql2/promise';
import { MigrationService } from '../../shared/services/migration-service';
import { ALL_SERVICE_MIGRATIONS } from '../../shared/services/all-service-migrations';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const MASTER_CONFIG = {
  host: process.env.MASTER_DB_HOST || 'localhost',
  port: parseInt(process.env.MASTER_DB_PORT || '3306'),
  user: process.env.MASTER_DB_USER || 'root',
  password: process.env.MASTER_DB_PASSWORD || 'root',
  database: process.env.MASTER_DB_NAME || 'master_db',
};

interface CommandOptions {
  force: boolean;
  verbose: boolean;
  tenantDb?: string;
}

class TenantMigrationRunner {
  private migrationService: MigrationService;
  private masterConnection?: mysql.Pool;
  private options: CommandOptions;

  constructor(options: CommandOptions = { force: false, verbose: false }) {
    this.options = options;
    this.migrationService = new MigrationService();
  }

  async initialize(): Promise<void> {
    this.masterConnection = mysql.createPool({
      ...MASTER_CONFIG,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    await this.migrationService.initializeMasterConnection(MASTER_CONFIG);
    this.log('✅ Initialized migration system');
  }

  async getMigrationStats(dbName: string): Promise<{ executed: number; total: number }> {
    if (!this.masterConnection) throw new Error('Not initialized');

    try {
      const connection = await mysql.createConnection({
        ...MASTER_CONFIG,
        database: dbName,
      });

      const [rows] = await connection.query(
        'SELECT COUNT(*) as count FROM migrations'
      );

      await connection.end();
      return {
        executed: (rows as any[])[0]?.count || 0,
        total: ALL_SERVICE_MIGRATIONS.length,
      };
    } catch {
      return { executed: 0, total: ALL_SERVICE_MIGRATIONS.length };
    }
  }

  async migrateSpecificTenant(dbName: string): Promise<void> {
    this.log(`\n${'='.repeat(60)}`);
    this.log(`🔄 Migrating: ${dbName}`);
    this.log(`${'='.repeat(60)}`);

    try {
      const result = await this.migrationService.runTenantMigrations(
        dbName,
        ALL_SERVICE_MIGRATIONS,
        {
          host: MASTER_CONFIG.host,
          port: MASTER_CONFIG.port,
          user: MASTER_CONFIG.user,
          password: MASTER_CONFIG.password,
        }
      );

      const stats = await this.getMigrationStats(dbName);

      if (result.success) {
        this.log(`✅ SUCCESS: ${result.migrationsRun.length} migrations executed`);
        this.log(`📊 Status: ${stats.executed}/${stats.total} migrations completed`);
      } else {
        this.log(`⚠️  PARTIAL: ${result.migrationsRun.length} migrations executed`);
        if (result.errors.length > 0) {
          this.log('Errors:');
          result.errors.forEach((error) => this.log(`  - ${error}`));
        }
      }
    } catch (error: any) {
      this.log(`❌ FAILED: ${error.message}`);
      throw error;
    }
  }

  async migrateAllTenants(): Promise<void> {
    if (!this.masterConnection) throw new Error('Not initialized');

    this.log('\n' + '='.repeat(60));
    this.log('🚀 BATCH MIGRATION: All Active Tenants');
    this.log('='.repeat(60));

    try {
      // Get all active tenants
      const [tenants] = await this.masterConnection.query(
        'SELECT tenant_id, tenant_slug, db_name FROM tenants WHERE status = "active" ORDER BY created_at ASC'
      );

      const tenantList = tenants as Array<{ tenant_id: number; tenant_slug: string; db_name: string }>;

      if (tenantList.length === 0) {
        this.log('⚠️  No active tenants found');
        return;
      }

      this.log(`📋 Found ${tenantList.length} active tenant(s)\n`);

      const results = {
        successful: 0,
        partial: 0,
        failed: 0,
        details: [] as any[],
      };

      // Migrate each tenant
      for (const tenant of tenantList) {
        try {
          await this.migrateSpecificTenant(tenant.db_name);

          const stats = await this.getMigrationStats(tenant.db_name);
          if (stats.executed === stats.total) {
            results.successful++;
          } else {
            results.partial++;
          }

          results.details.push({
            slug: tenant.tenant_slug,
            db: tenant.db_name,
            status: stats.executed === stats.total ? 'success' : 'partial',
            migrations: stats.executed,
          });
        } catch (error: any) {
          results.failed++;
          results.details.push({
            slug: tenant.tenant_slug,
            db: tenant.db_name,
            status: 'failed',
            error: error.message,
          });
        }
      }

      // Print summary
      this.printSummary(results);
    } catch (error: any) {
      this.log(`❌ Batch migration failed: ${error.message}`);
      throw error;
    }
  }

  private printSummary(results: any): void {
    this.log('\n' + '='.repeat(60));
    this.log('📊 MIGRATION SUMMARY');
    this.log('='.repeat(60));

    this.log(`✅ Successful: ${results.successful}`);
    this.log(`⚠️  Partial:    ${results.partial}`);
    this.log(`❌ Failed:     ${results.failed}`);
    this.log(`📈 Total:      ${results.details.length}`);

    if (this.options.verbose && results.details.length > 0) {
      this.log('\nDetails:');
      results.details.forEach((detail: any) => {
        const status =
          detail.status === 'success'
            ? '✅'
            : detail.status === 'partial'
              ? '⚠️ '
              : '❌';
        this.log(`  ${status} ${detail.slug}: ${detail.migrations || 0}/${ALL_SERVICE_MIGRATIONS.length}`);
        if (detail.error) {
          this.log(`     Error: ${detail.error}`);
        }
      });
    }

    this.log('\n' + '='.repeat(60));
  }

  private log(message: string): void {
    console.log(message);
  }

  async close(): Promise<void> {
    await this.migrationService.close();
    if (this.masterConnection) {
      await this.masterConnection.end();
    }
    this.log('\n🔌 Migration runner closed');
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  const options: CommandOptions = {
    force: args.includes('--force'),
    verbose: args.includes('--verbose'),
    tenantDb: undefined,
  };

  // Check for specific tenant
  const tenantIndex = args.indexOf('--tenant');
  if (tenantIndex !== -1 && args[tenantIndex + 1]) {
    options.tenantDb = args[tenantIndex + 1];
  }

  const runner = new TenantMigrationRunner(options);

  try {
    await runner.initialize();

    if (options.tenantDb) {
      await runner.migrateSpecificTenant(options.tenantDb);
    } else {
      await runner.migrateAllTenants();
    }

    console.log('\n🎉 Migration completed!');
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await runner.close();
  }
}

main();
