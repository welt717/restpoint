import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { tenantDB } from '../config/tenantDatabase';

export interface ExtraChargeRecord {
  charge_id: number;
  tenant_slug: string;
  deceased_id: string;
  charge_type: string;
  amount: number;
  currency: string;
  service_date: Date;
  requested_by: string | null;
  status: 'pending' | 'approved' | 'invoiced' | 'paid' | 'rejected' | 'cancelled';
  approval_status: 'not_required' | 'pending' | 'approved' | 'rejected';
  approved_by: number | null;
  approved_at: Date | null;
  invoice_id: string | null;
  notes: string | null;
  rejection_reason: string | null;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
  is_deleted: boolean;
}

export interface ChargeTypeRecord {
  type_id: number;
  tenant_slug: string;
  charge_type: string;
  description: string | null;
  default_amount: number;
  requires_approval: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateExtraChargeDTO {
  deceased_id: string;
  charge_type: string;
  amount: number;
  currency?: string;
  service_date?: Date;
  requested_by?: string;
  notes?: string;
  created_by?: number;
}

export interface ApproveChargeDTO {
  approved_by: number;
  comments?: string;
}

export interface RejectChargeDTO {
  approved_by: number;
  rejection_reason: string;
}

export class ExtraChargeModel {
  /**
   * Create new extra charge
   */
  static async create(tenantSlug: string, data: CreateExtraChargeDTO): Promise<ExtraChargeRecord> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      // Get charge type to check if approval required
      const chargeType = await this.getChargeType(tenantSlug, data.charge_type);
      const requiresApproval = chargeType?.requires_approval || false;
      const approvalStatus = requiresApproval ? 'pending' : 'not_required';
      const status = requiresApproval ? 'pending' : 'approved';

      const result = await conn.execute(
        `INSERT INTO extra_charges (
          tenant_slug, deceased_id, charge_type, amount, currency, service_date,
          requested_by, status, approval_status, notes, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          tenantSlug, data.deceased_id, data.charge_type, data.amount,
          data.currency || 'KES', data.service_date || new Date(),
          data.requested_by || null, status, approvalStatus, data.notes || null, data.created_by || null
        ]
      );

      return this.getById(tenantSlug, (result[0] as ResultSetHeader).insertId);
    } finally {
      conn.release();
    }
  }

  /**
   * Get charge by ID
   */
  static async getById(tenantSlug: string, id: number): Promise<ExtraChargeRecord | null> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      const result = await conn.execute(
        'SELECT * FROM extra_charges WHERE charge_id = ? AND tenant_slug = ? AND is_deleted = FALSE',
        [id, tenantSlug]
      );

      const rows = result[0] as ExtraChargeRecord[];
      return rows.length > 0 ? rows[0] : null;
    } finally {
      conn.release();
    }
  }

  /**
   * Get all charges for a deceased
   */
  static async getByDeceasedId(tenantSlug: string, deceasedId: string, includeDeleted = false): Promise<ExtraChargeRecord[]> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      const whereClause = includeDeleted ? '' : ' AND is_deleted = FALSE';
      const result = await conn.execute(
        `SELECT * FROM extra_charges 
         WHERE deceased_id = ? AND tenant_slug = ?${whereClause}
         ORDER BY service_date DESC`,
        [deceasedId, tenantSlug]
      );

      return result[0] as ExtraChargeRecord[];
    } finally {
      conn.release();
    }
  }

  /**
   * Get pending charges for approval
   */
  static async getPending(tenantSlug: string, limit = 50, offset = 0): Promise<ExtraChargeRecord[]> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      const result = await conn.execute(
        `SELECT * FROM extra_charges 
         WHERE tenant_slug = ? AND approval_status = 'pending' AND is_deleted = FALSE
         ORDER BY service_date ASC
         LIMIT ? OFFSET ?`,
        [tenantSlug, limit, offset]
      );

      return result[0] as ExtraChargeRecord[];
    } finally {
      conn.release();
    }
  }

  /**
   * Get charges by status
   */
  static async getByStatus(tenantSlug: string, status: string, limit = 50, offset = 0): Promise<ExtraChargeRecord[]> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      const result = await conn.execute(
        `SELECT * FROM extra_charges 
         WHERE tenant_slug = ? AND status = ? AND is_deleted = FALSE
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [tenantSlug, status, limit, offset]
      );

      return result[0] as ExtraChargeRecord[];
    } finally {
      conn.release();
    }
  }

  /**
   * Approve charge
   */
  static async approve(tenantSlug: string, chargeId: number, data: ApproveChargeDTO): Promise<ExtraChargeRecord | null> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      // Update charge
      await conn.execute(
        `UPDATE extra_charges 
         SET approval_status = 'approved', status = 'approved', approved_by = ?, approved_at = NOW(), updated_at = NOW()
         WHERE charge_id = ? AND tenant_slug = ?`,
        [data.approved_by, chargeId, tenantSlug]
      );

      // Record approval
      await conn.execute(
        `INSERT INTO charge_approvals (charge_id, tenant_slug, approved_by, approval_status, comments, approval_date)
         VALUES (?, ?, ?, 'approved', ?, NOW())`,
        [chargeId, tenantSlug, data.approved_by, data.comments || null]
      );

      return this.getById(tenantSlug, chargeId);
    } finally {
      conn.release();
    }
  }

  /**
   * Reject charge
   */
  static async reject(tenantSlug: string, chargeId: number, data: RejectChargeDTO): Promise<ExtraChargeRecord | null> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      // Update charge
      await conn.execute(
        `UPDATE extra_charges 
         SET approval_status = 'rejected', status = 'rejected', rejection_reason = ?, approved_by = ?, approved_at = NOW(), updated_at = NOW()
         WHERE charge_id = ? AND tenant_slug = ?`,
        [data.rejection_reason, data.approved_by, chargeId, tenantSlug]
      );

      // Record approval
      await conn.execute(
        `INSERT INTO charge_approvals (charge_id, tenant_slug, approved_by, approval_status, comments, approval_date)
         VALUES (?, ?, ?, 'rejected', ?, NOW())`,
        [chargeId, tenantSlug, data.approved_by, data.rejection_reason]
      );

      return this.getById(tenantSlug, chargeId);
    } finally {
      conn.release();
    }
  }

  /**
   * Link charge to invoice
   */
  static async linkToInvoice(tenantSlug: string, chargeId: number, invoiceId: string): Promise<boolean> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      const result = await conn.execute(
        `UPDATE extra_charges 
         SET invoice_id = ?, status = 'invoiced', updated_at = NOW()
         WHERE charge_id = ? AND tenant_slug = ?`,
        [invoiceId, chargeId, tenantSlug]
      );

      return (result[0] as ResultSetHeader).affectedRows > 0;
    } finally {
      conn.release();
    }
  }

  /**
   * Get total charges for deceased
   */
  static async getTotalForDeceased(tenantSlug: string, deceasedId: string): Promise<number> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      const result = await conn.execute(
        `SELECT SUM(amount) as total FROM extra_charges 
         WHERE deceased_id = ? AND tenant_slug = ? AND status IN ('approved', 'invoiced', 'paid') AND is_deleted = FALSE`,
        [deceasedId, tenantSlug]
      );

      const rows = result[0] as any[];
      return rows[0]?.total || 0;
    } finally {
      conn.release();
    }
  }

  /**
   * Get charge type
   */
  static async getChargeType(tenantSlug: string, chargeType: string): Promise<ChargeTypeRecord | null> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      const result = await conn.execute(
        'SELECT * FROM charge_types WHERE tenant_slug = ? AND charge_type = ? AND is_active = TRUE',
        [tenantSlug, chargeType]
      );

      const rows = result[0] as ChargeTypeRecord[];
      return rows.length > 0 ? rows[0] : null;
    } finally {
      conn.release();
    }
  }

  /**
   * Get all charge types
   */
  static async getChargeTypes(tenantSlug: string, activeOnly = true): Promise<ChargeTypeRecord[]> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      const whereClause = activeOnly ? ' AND is_active = TRUE' : '';
      const result = await conn.execute(
        `SELECT * FROM charge_types WHERE tenant_slug = ?${whereClause} ORDER BY charge_type ASC`,
        [tenantSlug]
      );

      return result[0] as ChargeTypeRecord[];
    } finally {
      conn.release();
    }
  }

  /**
   * Create or update charge type
   */
  static async upsertChargeType(tenantSlug: string, data: {
    charge_type: string;
    description?: string;
    default_amount?: number;
    requires_approval?: boolean;
  }): Promise<ChargeTypeRecord> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      // Check if exists
      const existing = await this.getChargeType(tenantSlug, data.charge_type);

      if (existing) {
        // Update
        await conn.execute(
          `UPDATE charge_types 
           SET description = ?, default_amount = ?, requires_approval = ?, updated_at = NOW()
           WHERE type_id = ?`,
          [data.description || null, data.default_amount || 0, data.requires_approval || false, existing.type_id]
        );
        return this.getChargeType(tenantSlug, data.charge_type);
      } else {
        // Insert
        const result = await conn.execute(
          `INSERT INTO charge_types (tenant_slug, charge_type, description, default_amount, requires_approval, created_at)
           VALUES (?, ?, ?, ?, ?, NOW())`,
          [tenantSlug, data.charge_type, data.description || null, data.default_amount || 0, data.requires_approval || false]
        );

        const typeId = (result[0] as ResultSetHeader).insertId;
        return this.getChargeType(tenantSlug, data.charge_type);
      }
    } finally {
      conn.release();
    }
  }

  /**
   * Get revenue by charge type
   */
  static async getRevenueByType(tenantSlug: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      let query = `
        SELECT
          charge_type,
          COUNT(*) as charge_count,
          SUM(amount) as total_revenue,
          AVG(amount) as avg_charge
        FROM extra_charges
        WHERE tenant_slug = ? AND status IN ('approved', 'invoiced', 'paid') AND is_deleted = FALSE
      `;
      const params: any[] = [tenantSlug];

      if (startDate && endDate) {
        query += ' AND service_date BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      query += ' GROUP BY charge_type ORDER BY total_revenue DESC';

      const result = await conn.execute(query, params);
      return result[0] as any[];
    } finally {
      conn.release();
    }
  }
}
