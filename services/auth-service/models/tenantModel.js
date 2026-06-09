const { safeQuery, safeQueryOne } = require('../config/database');

class Tenant {
  // Find tenant by slug (tenant_slug)
  static async findBySlug(slug) {
    console.log('[Tenant.findBySlug] Searching for slug:', slug);
    const result = await safeQueryOne(
      `SELECT * FROM tenants WHERE tenant_slug = ? AND status != 'deleted'`,
      [slug]
    );
    console.log('[Tenant.findBySlug] Result:', result);
    return result;
  }

  // Find tenant by email
  static async findByEmail(email) {
    console.log('[Tenant.findByEmail] Searching for email:', email);
    try {
      const result = await safeQueryOne(
        `SELECT * FROM tenants WHERE email = ? AND status != 'deleted'`,
        [email.toLowerCase()]
      );
      console.log('[Tenant.findByEmail] Result:', result);
      return result;
    } catch (error) {
      console.error('[Tenant.findByEmail] Error:', error);
      return null;
    }
  }

  // Find tenant by ID
  static async findById(tenantId) {
    console.log('[Tenant.findById] Searching for ID:', tenantId);
    const result = await safeQueryOne(
      `SELECT * FROM tenants WHERE tenant_id = ? AND status != 'deleted'`,
      [tenantId]
    );
    console.log('[Tenant.findById] Result:', result);
    return result;
  }

  // Create new tenant
  static async create(tenantData) {
    const {
      tenant_name,
      tenant_slug,
      email,
      phone = null,
      location = null,
      status = 'active'
    } = tenantData;

    const result = await safeQuery(
      `INSERT INTO tenants (tenant_name, tenant_slug, email, phone, location, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [tenant_name, tenant_slug, email.toLowerCase(), phone, location, status]
    );
    
    return result.insertId;
  }

  // Get all tenants
  static async getAll() {
    return await safeQuery(
      `SELECT tenant_id, tenant_name, tenant_slug, email, status, created_at 
       FROM tenants 
       WHERE status != 'deleted' 
       ORDER BY created_at DESC`
    );
  }

  // Update tenant status
  static async updateStatus(tenantId, status) {
    await safeQuery(
      'UPDATE tenants SET status = ?, updated_at = NOW() WHERE tenant_id = ?',
      [status, tenantId]
    );
  }

  // Update last login
  static async updateLastLogin(tenantId) {
    await safeQuery(
      'UPDATE tenants SET last_login_at = NOW() WHERE tenant_id = ?',
      [tenantId]
    );
  }
}

module.exports = Tenant;