import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { tenantDB } from '../config/tenantDatabase';

export interface CoffinRecord {
  coffin_id: number;
  custom_id: string;
  tenant_slug: string;
  type: string;
  material: string;
  exact_price: number;
  currency: string;
  price_usd: number | null;
  exchange_rate: number | null;
  quantity: number;
  minimum_stock: number;
  supplier: string | null;
  supplier_contact: string | null;
  origin: string | null;
  color: string | null;
  size: string | null;
  description: string | null;
  category: 'locally_made' | 'imported';
  is_active: boolean;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
  is_deleted: boolean;
}

export interface CoffinImageRecord {
  image_id: number;
  coffin_id: number;
  tenant_slug: string;
  image_url: string;
  image_name: string | null;
  display_order: number;
  created_at: Date;
}

export interface CoffinUsageRecord {
  usage_id: number;
  coffin_id: number;
  tenant_slug: string;
  deceased_id: string | null;
  quantity_used: number;
  unit_price: number;
  total_price: number;
  invoice_id: string | null;
  used_at: Date;
  notes: string | null;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateCoffinDTO {
  custom_id: string;
  type: string;
  material: string;
  exact_price: number;
  currency?: string;
  quantity?: number;
  minimum_stock?: number;
  supplier?: string;
  supplier_contact?: string;
  origin?: string;
  color?: string;
  size?: string;
  description?: string;
  category?: 'locally_made' | 'imported';
  created_by?: number;
}

export interface UpdateCoffinDTO {
  type?: string;
  material?: string;
  exact_price?: number;
  quantity?: number;
  minimum_stock?: number;
  supplier?: string;
  color?: string;
  size?: string;
  description?: string;
  is_active?: boolean;
}

export class CoffinModel {
  /**
   * Create new coffin
   */
  static async create(tenantSlug: string, data: CreateCoffinDTO): Promise<CoffinRecord> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      const result = await conn.execute(
        `INSERT INTO coffins (
          custom_id, tenant_slug, type, material, exact_price, currency, quantity,
          minimum_stock, supplier, supplier_contact, origin, color, size, description,
          category, is_active, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, NOW())`,
        [
          data.custom_id, tenantSlug, data.type, data.material, data.exact_price,
          data.currency || 'KES', data.quantity || 1, data.minimum_stock || 5,
          data.supplier || null, data.supplier_contact || null, data.origin || null,
          data.color || null, data.size || null, data.description || null,
          data.category || 'locally_made', data.created_by || null
        ]
      );

      return this.getById(tenantSlug, (result[0] as ResultSetHeader).insertId);
    } finally {
      conn.release();
    }
  }

  /**
   * Get coffin by ID
   */
  static async getById(tenantSlug: string, id: number): Promise<CoffinRecord | null> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      const result = await conn.execute(
        'SELECT * FROM coffins WHERE coffin_id = ? AND tenant_slug = ? AND is_deleted = FALSE',
        [id, tenantSlug]
      );

      const rows = result[0] as CoffinRecord[];
      return rows.length > 0 ? rows[0] : null;
    } finally {
      conn.release();
    }
  }

  /**
   * Get coffin by custom ID
   */
  static async getByCustomId(tenantSlug: string, customId: string): Promise<CoffinRecord | null> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      const result = await conn.execute(
        'SELECT * FROM coffins WHERE custom_id = ? AND tenant_slug = ? AND is_deleted = FALSE',
        [customId, tenantSlug]
      );

      const rows = result[0] as CoffinRecord[];
      return rows.length > 0 ? rows[0] : null;
    } finally {
      conn.release();
    }
  }

  /**
   * Get all coffins with filters
   */
  static async getAll(tenantSlug: string, filters?: {
    category?: string;
    type?: string;
    isActive?: boolean;
    minStock?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<CoffinRecord[]> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      let query = 'SELECT * FROM coffins WHERE tenant_slug = ? AND is_deleted = FALSE';
      const params: any[] = [tenantSlug];

      if (filters?.category) {
        query += ' AND category = ?';
        params.push(filters.category);
      }

      if (filters?.type) {
        query += ' AND type LIKE ?';
        params.push(`%${filters.type}%`);
      }

      if (filters?.isActive !== undefined) {
        query += ' AND is_active = ?';
        params.push(filters.isActive);
      }

      if (filters?.minStock) {
        query += ' AND quantity <= minimum_stock';
      }

      query += ' ORDER BY created_at DESC';

      if (filters?.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      if (filters?.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }

      const result = await conn.execute(query, params);
      return result[0] as CoffinRecord[];
    } finally {
      conn.release();
    }
  }

  /**
   * Update coffin
   */
  static async update(tenantSlug: string, id: number, data: UpdateCoffinDTO): Promise<CoffinRecord | null> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      const updates: string[] = [];
      const params: any[] = [];

      if (data.type !== undefined) {
        updates.push('type = ?');
        params.push(data.type);
      }

      if (data.material !== undefined) {
        updates.push('material = ?');
        params.push(data.material);
      }

      if (data.exact_price !== undefined) {
        updates.push('exact_price = ?');
        params.push(data.exact_price);
      }

      if (data.quantity !== undefined) {
        updates.push('quantity = ?');
        params.push(data.quantity);
      }

      if (data.minimum_stock !== undefined) {
        updates.push('minimum_stock = ?');
        params.push(data.minimum_stock);
      }

      if (data.supplier !== undefined) {
        updates.push('supplier = ?');
        params.push(data.supplier);
      }

      if (data.color !== undefined) {
        updates.push('color = ?');
        params.push(data.color);
      }

      if (data.size !== undefined) {
        updates.push('size = ?');
        params.push(data.size);
      }

      if (data.description !== undefined) {
        updates.push('description = ?');
        params.push(data.description);
      }

      if (data.is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(data.is_active);
      }

      if (updates.length === 0) {
        return this.getById(tenantSlug, id);
      }

      updates.push('updated_at = NOW()');
      params.push(id, tenantSlug);

      await conn.execute(
        `UPDATE coffins SET ${updates.join(', ')} WHERE coffin_id = ? AND tenant_slug = ?`,
        params
      );

      return this.getById(tenantSlug, id);
    } finally {
      conn.release();
    }
  }

  /**
   * Delete coffin (soft delete)
   */
  static async delete(tenantSlug: string, id: number): Promise<boolean> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      const result = await conn.execute(
        'UPDATE coffins SET is_deleted = TRUE, updated_at = NOW() WHERE coffin_id = ? AND tenant_slug = ?',
        [id, tenantSlug]
      );

      return (result[0] as ResultSetHeader).affectedRows > 0;
    } finally {
      conn.release();
    }
  }

  /**
   * Reduce stock
   */
  static async useStock(tenantSlug: string, coffinId: number, quantity: number, deceasedId: string, invoiceId?: string): Promise<CoffinUsageRecord> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      const coffin = await this.getById(tenantSlug, coffinId);
      if (!coffin) {
        throw new Error('Coffin not found');
      }

      const unitPrice = coffin.exact_price;
      const totalPrice = unitPrice * quantity;

      // Record usage
      const result = await conn.execute(
        `INSERT INTO coffin_usage (
          coffin_id, tenant_slug, deceased_id, quantity_used, unit_price, total_price,
          invoice_id, used_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [coffinId, tenantSlug, deceasedId, quantity, unitPrice, totalPrice, invoiceId || null]
      );

      // Reduce stock
      await conn.execute(
        'UPDATE coffins SET quantity = quantity - ?, updated_at = NOW() WHERE coffin_id = ? AND tenant_slug = ?',
        [quantity, coffinId, tenantSlug]
      );

      return this.getUsageById(tenantSlug, (result[0] as ResultSetHeader).insertId);
    } finally {
      conn.release();
    }
  }

  /**
   * Get usage record
   */
  static async getUsageById(tenantSlug: string, usageId: number): Promise<CoffinUsageRecord> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      const result = await conn.execute(
        'SELECT * FROM coffin_usage WHERE usage_id = ? AND tenant_slug = ?',
        [usageId, tenantSlug]
      );

      const rows = result[0] as CoffinUsageRecord[];
      return rows[0];
    } finally {
      conn.release();
    }
  }

  /**
   * Get low stock coffins
   */
  static async getLowStockCoffins(tenantSlug: string): Promise<CoffinRecord[]> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      const result = await conn.execute(
        `SELECT * FROM coffins 
         WHERE tenant_slug = ? AND is_deleted = FALSE AND quantity <= minimum_stock
         ORDER BY quantity ASC`,
        [tenantSlug]
      );

      return result[0] as CoffinRecord[];
    } finally {
      conn.release();
    }
  }

  /**
   * Get sales by coffin type
   */
  static async getSalesByType(tenantSlug: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      let query = `
        SELECT
          c.type,
          COUNT(cu.usage_id) as usage_count,
          SUM(cu.quantity_used) as total_quantity,
          SUM(cu.total_price) as total_revenue,
          AVG(cu.unit_price) as avg_price
        FROM coffin_usage cu
        JOIN coffins c ON cu.coffin_id = c.coffin_id
        WHERE cu.tenant_slug = ? AND c.is_deleted = FALSE
      `;
      const params: any[] = [tenantSlug];

      if (startDate && endDate) {
        query += ' AND cu.used_at BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      query += ' GROUP BY c.type ORDER BY total_revenue DESC';

      const result = await conn.execute(query, params);
      return result[0] as any[];
    } finally {
      conn.release();
    }
  }
}

  origin?: string;
  color?: string;
  size?: string;
  category?: 'locally_made' | 'imported';
  created_by?: string;
}

export interface IAssignCoffinDTO {
  deceased_id: string;
  coffin_id: number;
  assigned_by?: string;
  assigned_date?: string;
  deceased_name: string;
}

export interface ICoffinAnalytics {
  overview: {
    total_coffins: number;
    total_in_stock: number;
    out_of_stock_count: number;
    available_types: number;
    unique_types: number;
    unique_materials: number;
    total_inventory_value: number;
  };
  by_type: any[];
  by_material: any[];
  by_category: any[];
  recent_assignments: any[];
  last_updated: string;
}