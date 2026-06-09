import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { tenantDB } from '../config/tenantDatabase';

export interface InvoiceRecord {
  invoice_id: number;
  invoice_number: string;
  tenant_slug: string;
  deceased_id: string;
  service_date: Date;
  invoice_date: Date;
  due_date: Date | null;
  status: 'draft' | 'issued' | 'paid' | 'partial' | 'cancelled' | 'overdue';
  payment_status: 'unpaid' | 'partial_paid' | 'paid';
  subtotal: number;
  discount: number;
  tax_amount: number;
  tax_rate: number;
  total: number;
  amount_paid: number;
  balance_due: number;
  currency: string;
  notes: string | null;
  terms: string | null;
  issued_by: number | null;
  approved_by: number | null;
  approved_at: Date | null;
  next_of_kin_contact: string | null;
  next_of_kin_email: string | null;
  created_by: number | null;
  created_at: Date;
  updated_at: Date;
  is_deleted: boolean;
}

export interface InvoiceItemRecord {
  item_id: number;
  invoice_id: number;
  tenant_slug: string;
  service_type: string;
  service_description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  tax_rate: number;
  notes: string | null;
  reference_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateInvoiceDTO {
  deceased_id: string;
  service_date: Date;
  due_date?: Date;
  notes?: string;
  terms?: string;
  next_of_kin_contact?: string;
  next_of_kin_email?: string;
  created_by?: number;
  items: CreateInvoiceItemDTO[];
}

export interface CreateInvoiceItemDTO {
  service_type: string;
  service_description: string;
  quantity: number;
  unit_price: number;
  tax_rate?: number;
  reference_id?: string;
  notes?: string;
}

export class InvoiceModel {
  /**
   * Create new invoice
   */
  static async create(tenantSlug: string, data: CreateInvoiceDTO): Promise<InvoiceRecord> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      // Generate invoice number: INV-YYYY-XXXX
      const year = new Date().getFullYear();
      const countResult = await conn.query(
        'SELECT COUNT(*) as count FROM invoices WHERE tenant_slug = ? AND YEAR(invoice_date) = ?',
        [tenantSlug, year]
      );
      const count = (countResult[0] as any[])[0]?.count || 0;
      const invoice_number = `INV-${year}-${String(count + 1).padStart(5, '0')}`;

      // Calculate totals
      let subtotal = 0;
      let total_tax = 0;
      
      for (const item of data.items) {
        const itemTotal = item.quantity * item.unit_price;
        subtotal += itemTotal;
        total_tax += itemTotal * ((item.tax_rate || 0) / 100);
      }

      const total = subtotal + total_tax;

      const result = await conn.execute(
        `INSERT INTO invoices (
          invoice_number, tenant_slug, deceased_id, service_date, invoice_date,
          due_date, status, payment_status, subtotal, tax_amount, total,
          amount_paid, balance_due, notes, terms, next_of_kin_contact, next_of_kin_email,
          created_by, created_at
        ) VALUES (?, ?, ?, ?, NOW(), ?, 'draft', 'unpaid', ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          invoice_number, tenantSlug, data.deceased_id, data.service_date,
          data.due_date || null, subtotal, total_tax, total, total,
          data.notes || null, data.terms || null, data.next_of_kin_contact || null,
          data.next_of_kin_email || null, data.created_by || null
        ]
      );

      const invoiceId = (result[0] as ResultSetHeader).insertId;

      // Insert items
      for (const item of data.items) {
        const itemTotal = item.quantity * item.unit_price;
        await conn.execute(
          `INSERT INTO invoice_items (
            invoice_id, tenant_slug, service_type, service_description,
            quantity, unit_price, total_price, tax_rate, notes, reference_id, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            invoiceId, tenantSlug, item.service_type, item.service_description,
            item.quantity, item.unit_price, itemTotal, item.tax_rate || 0,
            item.notes || null, item.reference_id || null
          ]
        );
      }

      return this.getById(tenantSlug, invoiceId);
    } finally {
      conn.release();
    }
  }

  /**
   * Get invoice by ID
   */
  static async getById(tenantSlug: string, id: number): Promise<InvoiceRecord | null> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      const result = await conn.execute(
        'SELECT * FROM invoices WHERE invoice_id = ? AND tenant_slug = ? AND is_deleted = FALSE',
        [id, tenantSlug]
      );

      const rows = result[0] as InvoiceRecord[];
      return rows.length > 0 ? rows[0] : null;
    } finally {
      conn.release();
    }
  }

  /**
   * Get all invoices for a tenant
   */
  static async getAll(tenantSlug: string, filters?: {
    status?: string;
    paymentStatus?: string;
    deceasedId?: string;
    limit?: number;
    offset?: number;
  }): Promise<InvoiceRecord[]> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      let query = 'SELECT * FROM invoices WHERE tenant_slug = ? AND is_deleted = FALSE';
      const params: any[] = [tenantSlug];

      if (filters?.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters?.paymentStatus) {
        query += ' AND payment_status = ?';
        params.push(filters.paymentStatus);
      }

      if (filters?.deceasedId) {
        query += ' AND deceased_id = ?';
        params.push(filters.deceasedId);
      }

      query += ' ORDER BY invoice_date DESC';

      if (filters?.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      if (filters?.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }

      const result = await conn.execute(query, params);
      return result[0] as InvoiceRecord[];
    } finally {
      conn.release();
    }
  }

  /**
   * Get invoice items
   */
  static async getItems(tenantSlug: string, invoiceId: number): Promise<InvoiceItemRecord[]> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      const result = await conn.execute(
        'SELECT * FROM invoice_items WHERE invoice_id = ? AND tenant_slug = ?',
        [invoiceId, tenantSlug]
      );

      return result[0] as InvoiceItemRecord[];
    } finally {
      conn.release();
    }
  }

  /**
   * Update invoice status
   */
  static async updateStatus(
    tenantSlug: string,
    id: number,
    status: string,
    approvedBy?: number
  ): Promise<InvoiceRecord | null> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      await conn.execute(
        `UPDATE invoices SET status = ?, approved_by = ?, approved_at = NOW(), updated_at = NOW()
         WHERE invoice_id = ? AND tenant_slug = ?`,
        [status, approvedBy || null, id, tenantSlug]
      );

      return this.getById(tenantSlug, id);
    } finally {
      conn.release();
    }
  }

  /**
   * Record payment
   */
  static async recordPayment(
    tenantSlug: string,
    invoiceId: number,
    amount: number,
    paymentMethod: string,
    referenceNumber?: string,
    transactionId?: string,
    receivedBy?: number
  ): Promise<boolean> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      // Insert payment record
      await conn.execute(
        `INSERT INTO invoice_payments (
          invoice_id, tenant_slug, payment_date, payment_method,
          amount_paid, reference_number, transaction_id, received_by, created_at
        ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, NOW())`,
        [invoiceId, tenantSlug, paymentMethod, amount, referenceNumber || null, transactionId || null, receivedBy || null]
      );

      // Update invoice
      const invoice = await this.getById(tenantSlug, invoiceId);
      if (invoice) {
        const newAmountPaid = invoice.amount_paid + amount;
        const newStatus = newAmountPaid >= invoice.total ? 'paid' : 'partial';
        const newPaymentStatus = newAmountPaid >= invoice.total ? 'paid' : 'partial_paid';
        const newBalanceDue = Math.max(0, invoice.total - newAmountPaid);

        await conn.execute(
          `UPDATE invoices SET amount_paid = ?, balance_due = ?, status = ?, payment_status = ?, updated_at = NOW()
           WHERE invoice_id = ? AND tenant_slug = ?`,
          [newAmountPaid, newBalanceDue, newStatus, newPaymentStatus, invoiceId, tenantSlug]
        );
      }

      return true;
    } finally {
      conn.release();
    }
  }

  /**
   * Get revenue statistics
   */
  static async getRevenueStats(tenantSlug: string, startDate?: Date, endDate?: Date): Promise<any> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      let query = `
        SELECT
          COUNT(DISTINCT invoice_id) as total_invoices,
          SUM(total) as total_revenue,
          SUM(amount_paid) as amount_collected,
          SUM(balance_due) as amount_outstanding,
          AVG(total) as avg_invoice_amount,
          COUNT(DISTINCT deceased_id) as total_deceased,
          SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_invoices,
          SUM(CASE WHEN payment_status = 'partial_paid' THEN 1 ELSE 0 END) as partial_paid_invoices,
          SUM(CASE WHEN payment_status = 'unpaid' THEN 1 ELSE 0 END) as unpaid_invoices
        FROM invoices
        WHERE tenant_slug = ? AND is_deleted = FALSE
      `;
      const params: any[] = [tenantSlug];

      if (startDate && endDate) {
        query += ' AND invoice_date BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      const result = await conn.execute(query, params);
      return (result[0] as any[])[0] || {};
    } finally {
      conn.release();
    }
  }

  /**
   * Get revenue by service type
   */
  static async getRevenueByService(tenantSlug: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    const conn = await tenantDB.getConnection(tenantSlug);
    
    try {
      let query = `
        SELECT
          service_type,
          COUNT(*) as count,
          SUM(total_price) as total_revenue,
          AVG(unit_price) as avg_price
        FROM invoice_items ii
        JOIN invoices i ON ii.invoice_id = i.invoice_id
        WHERE ii.tenant_slug = ? AND i.is_deleted = FALSE
      `;
      const params: any[] = [tenantSlug];

      if (startDate && endDate) {
        query += ' AND i.invoice_date BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }

      query += ' GROUP BY service_type ORDER BY total_revenue DESC';

      const result = await conn.execute(query, params);
      return result[0] as any[];
    } finally {
      conn.release();
    }
  }
}
