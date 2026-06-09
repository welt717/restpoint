import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { tenantDB } from '../config/tenantDatabase';
import { slugify } from '../utils/slugify';

export interface DeceasedRecord {
  id: number;
  deceased_id: string;
  tenant_slug: string;
  admission_number: string;
  cause_of_death: string | null;
  date_admitted: Date;
  date_of_birth: Date;
  date_of_death: Date;
  date_registered: Date;
  full_name: string;
  gender: 'Male' | 'Female' | 'Other';
  place_of_death: string;
  county: string;
  national_id: string;
  location: string | null;
  portal_slug: string | null;
  admission_status: 'admitted' | 'embalmed' | 'released' | 'buried';
  release_status: 'pending' | 'approved' | 'released';
  chamber_assigned: string | null;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
  is_deleted: boolean;
}

export interface CreateDeceasedDTO {
  full_name: string;
  national_id: string;
  date_of_birth: Date;
  date_of_death: Date;
  date_admitted: Date;
  gender: 'Male' | 'Female' | 'Other';
  place_of_death: string;
  county: string;
  cause_of_death?: string;
  admission_number: string;
  location?: string;
  created_by?: string;
}

export interface UpdateDeceasedDTO {
  cause_of_death?: string;
  location?: string;
  admission_status?: 'admitted' | 'embalmed' | 'released' | 'buried';
  release_status?: 'pending' | 'approved' | 'released';
  chamber_assigned?: string;
}

export class DeceasedModel {
  /**
   * Create a new deceased record
   */
  static async create(tenantSlug: string, data: CreateDeceasedDTO): Promise<DeceasedRecord | null> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      // Generate unique deceased_id: TENANT_YYYY_COUNT
      const year = new Date(data.date_of_death).getFullYear();
      const [countResult] = await conn.execute(
        'SELECT COUNT(*) as count FROM deceased WHERE tenant_slug = ? AND YEAR(date_of_death) = ?',
        [tenantSlug, year]
      );
      const count = (countResult as any[])[0]?.count || 0;
      const deceased_id = `${slugify(tenantSlug).toUpperCase()}_${year}_${String(count + 1).padStart(4, '0')}`;

      // Generate portal slug for public access
      const portal_slug = `${slugify(data.full_name)}_${data.national_id}`;

      const result = await conn.execute(
        `INSERT INTO deceased (
          deceased_id, tenant_slug, admission_number, cause_of_death,
          date_admitted, date_of_birth, date_of_death, date_registered,
          full_name, gender, place_of_death, county, national_id,
          location, portal_slug, admission_status, release_status, created_by, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, 'admitted', 'pending', ?, NOW())`,
        [
          deceased_id, tenantSlug, data.admission_number, data.cause_of_death || null,
          data.date_admitted, data.date_of_birth, data.date_of_death,
          data.full_name, data.gender, data.place_of_death, data.county,
          data.national_id, data.location || null, portal_slug, data.created_by || null
        ]
      );

      return this.getById(tenantSlug, (result[0] as ResultSetHeader).insertId);
    } finally {
      conn.release();
    }
  }

  /**
   * Get deceased by ID (database ID)
   */
  static async getById(tenantSlug: string, id: number): Promise<DeceasedRecord | null> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      const result = await conn.execute(
        'SELECT * FROM deceased WHERE id = ? AND tenant_slug = ? AND is_deleted = FALSE',
        [id, tenantSlug]
      );

      const rows = result[0] as DeceasedRecord[];
      return rows.length > 0 ? rows[0] : null;
    } finally {
      conn.release();
    }
  }

  /**
   * Get deceased by deceased_id (unique identifier)
   */
  static async getByDeceasedId(tenantSlug: string, deceasedId: string): Promise<DeceasedRecord | null> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      const result = await conn.execute(
        'SELECT * FROM deceased WHERE deceased_id = ? AND tenant_slug = ? AND is_deleted = FALSE',
        [deceasedId, tenantSlug]
      );

      const rows = result[0] as DeceasedRecord[];
      return rows.length > 0 ? rows[0] : null;
    } finally {
      conn.release();
    }
  }

  /**
   * Get all deceased records for a tenant
   */
  static async getAll(tenantSlug: string, filters?: {
    status?: string;
    releaseStatus?: string;
    limit?: number;
    offset?: number;
  }): Promise<DeceasedRecord[]> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      let query = 'SELECT * FROM deceased WHERE tenant_slug = ? AND is_deleted = FALSE';
      const params: any[] = [tenantSlug];

      if (filters?.status) {
        query += ' AND admission_status = ?';
        params.push(filters.status);
      }

      if (filters?.releaseStatus) {
        query += ' AND release_status = ?';
        params.push(filters.releaseStatus);
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
      return result[0] as DeceasedRecord[];
    } finally {
      conn.release();
    }
  }

  /**
   * Update deceased record
   */
  static async update(tenantSlug: string, id: number, data: UpdateDeceasedDTO): Promise<DeceasedRecord | null> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      const updates: string[] = [];
      const params: any[] = [];

      if (data.cause_of_death !== undefined) {
        updates.push('cause_of_death = ?');
        params.push(data.cause_of_death);
      }

      if (data.location !== undefined) {
        updates.push('location = ?');
        params.push(data.location);
      }

      if (data.admission_status !== undefined) {
        updates.push('admission_status = ?');
        params.push(data.admission_status);
      }

      if (data.release_status !== undefined) {
        updates.push('release_status = ?');
        params.push(data.release_status);
      }

      if (data.chamber_assigned !== undefined) {
        updates.push('chamber_assigned = ?');
        params.push(data.chamber_assigned);
      }

      if (updates.length === 0) {
        return this.getById(tenantSlug, id);
      }

      updates.push('updated_at = NOW()');
      params.push(id, tenantSlug);

      await conn.execute(
        `UPDATE deceased SET ${updates.join(', ')} WHERE id = ? AND tenant_slug = ?`,
        params
      );

      return this.getById(tenantSlug, id);
    } finally {
      conn.release();
    }
  }

  /**
   * Soft delete deceased record
   */
  static async delete(tenantSlug: string, id: number): Promise<boolean> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      const result = await conn.execute(
        'UPDATE deceased SET is_deleted = TRUE, updated_at = NOW() WHERE id = ? AND tenant_slug = ?',
        [id, tenantSlug]
      );

      return (result[0] as ResultSetHeader).affectedRows > 0;
    } finally {
      conn.release();
    }
  }

  /**
   * Get statistics for dashboard
   */
  static async getStatistics(tenantSlug: string): Promise<any> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      const result = await conn.execute(
        `SELECT
          COUNT(*) as total,
          SUM(CASE WHEN admission_status = 'admitted' THEN 1 ELSE 0 END) as admitted_count,
          SUM(CASE WHEN admission_status = 'embalmed' THEN 1 ELSE 0 END) as embalmed_count,
          SUM(CASE WHEN admission_status = 'released' THEN 1 ELSE 0 END) as released_count,
          SUM(CASE WHEN admission_status = 'buried' THEN 1 ELSE 0 END) as buried_count,
          SUM(CASE WHEN release_status = 'approved' THEN 1 ELSE 0 END) as ready_for_release,
          AVG(DATEDIFF(NOW(), date_of_death)) as avg_stay_days
        FROM deceased
        WHERE tenant_slug = ? AND is_deleted = FALSE`,
        [tenantSlug]
      );

      return (result[0] as any[])[0] || {};
    } finally {
      conn.release();
    }
  }
}
