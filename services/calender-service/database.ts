import mysql, { Pool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Cache for tenant database connections
const tenantPoolCache: Map<string, Pool> = new Map();

/**
 * Derive tenant database name from slug or ID
 */
export const getTenantDatabaseName = (tenantSlug: string): string => {
  // Sanitize tenant slug to create valid database name
  return `tenant_${tenantSlug.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase()}`;
};

/**
 * Get a connection pool for a specific tenant database
 * @param tenantDbName - The tenant database name
 * @returns MySQL connection pool
 */
export const getTenantPool = async (tenantDbName: string): Promise<Pool> => {
  // Return cached pool if exists
  if (tenantPoolCache.has(tenantDbName)) {
    return tenantPoolCache.get(tenantDbName)!;
  }

  const pool = await mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: tenantDbName,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });

  tenantPoolCache.set(tenantDbName, pool);
  console.log(`✅ Connected to tenant database: ${tenantDbName}`);
  return pool;
};

/**
 * Execute a query on tenant database
 */
export const executeTenantQuery = async (
  tenantDbName: string,
  query: string,
  params: any[] = []
): Promise<any> => {
  const pool = await getTenantPool(tenantDbName);
  const [result] = await pool.query(query, params);
  return result;
};

/**
 * Close all tenant connections
 */
export const closeAllTenantConnections = async (): Promise<void> => {
  for (const pool of tenantPoolCache.values()) {
    await pool.end();
  }
  tenantPoolCache.clear();
};

export default {
  getTenantDatabaseName,
  getTenantPool,
  executeTenantQuery,
  closeAllTenantConnections
};
