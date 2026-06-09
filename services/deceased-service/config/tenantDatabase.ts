/**
 * Tenant database configuration wrapper
 * Re-exports from shared config for backward compatibility
 */
import { getTenantDB, safeTenantQuery, safeTenantExecute } from '@montezuma/shared-config';

// Create a wrapper class/object that matches the expected interface
export const tenantDB = {
  async getConnection(tenantSlug: string) {
    const pool = await getTenantDB(tenantSlug);
    return {
      async execute(sql: string, params: any[]) {
        const [rows] = await pool.query(sql, params);
        return [rows];
      },
      release() {
        // Connection is managed by the pool
      }
    };
  }
};

export { safeTenantQuery, safeTenantExecute };