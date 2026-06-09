import { Request, Response } from 'express';
import { DateTime } from 'luxon';
import { lookupTenantDatabase, safeTenantExecute, safeTenantQuery } from '../../shared/dbConfig';

interface TenantRequest extends Request {
    tenantSlug?: string;
}

const nowNairobi = (): string => {
    return DateTime.now().setZone('Africa/Nairobi').toFormat('yyyy-MM-dd HH:mm:ss');
};

// Ensure charges table exists
const ensureChargesTable = async (dbName: string): Promise<void> => {
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS charges (
            id INT AUTO_INCREMENT PRIMARY KEY,
            deceased_id VARCHAR(100) NOT NULL,
            charge_type VARCHAR(100) NOT NULL,
            description TEXT,
            amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
            currency VARCHAR(3) DEFAULT 'KES',
            is_extra BOOLEAN DEFAULT FALSE,
            charge_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            created_by INT,
            FOREIGN KEY (deceased_id) REFERENCES deceased(deceased_id) ON DELETE CASCADE,
            INDEX idx_deceased_id (deceased_id),
            INDEX idx_charge_type (charge_type),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    try {
        await safeTenantExecute(dbName, createTableSQL, []);
        console.log(`✅ Charges table ensured for database: ${dbName}`);
    } catch (error) {
        console.error(`❌ Failed to create charges table:`, error);
        throw error;
    }
};

/**
 * Get all charges for a deceased person
 * GET /api/v1/restpoint/deceased/charges/:deceased_id
 */
export const getCharges = async (req: TenantRequest, res: Response): Promise<Response> => {
    const tenantSlug = req.headers['x-tenant-slug'] as string || req.tenantSlug;
    const { deceased_id } = req.params;

    if (!deceased_id || !tenantSlug) {
        return res.status(400).json({
            success: false,
            message: 'deceased_id and tenant are required'
        });
    }

    try {
        const dbName = await lookupTenantDatabase(tenantSlug);
        if (!dbName) {
            return res.status(404).json({
                success: false,
                message: `No database configured for tenant: ${tenantSlug}`
            });
        }

        await ensureChargesTable(dbName);

        const selectQuery = `
            SELECT 
                id, deceased_id, charge_type, description, amount, currency,
                is_extra, charge_date, created_at, updated_at
            FROM charges
            WHERE deceased_id = ?
            ORDER BY created_at DESC
        `;

        const records = await safeTenantQuery(dbName, selectQuery, [deceased_id]);

        // Calculate totals
        const totalCharges = (records as any[]).reduce((sum, r) => sum + (r.amount || 0), 0);
        const extraCharges = (records as any[])
            .filter((r: any) => r.is_extra)
            .reduce((sum, r) => sum + (r.amount || 0), 0);

        return res.status(200).json({
            success: true,
            message: 'Charges fetched successfully',
            data: {
                charges: records,
                summary: {
                    total_charges: totalCharges,
                    extra_charges: extraCharges,
                    main_charges: totalCharges - extraCharges,
                    currency: records && (records as any[]).length > 0 ? (records as any[])[0].currency : 'KES'
                }
            }
        });
    } catch (error: any) {
        console.error('❌ Error in getCharges:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};

/**
 * Add a charge
 * POST /api/v1/restpoint/deceased/charges
 */
export const addCharge = async (req: TenantRequest, res: Response): Promise<Response> => {
    const tenantSlug = req.headers['x-tenant-slug'] as string || req.tenantSlug;

    if (!tenantSlug || tenantSlug === 'system_shared') {
        return res.status(400).json({
            success: false,
            message: 'Valid tenant required'
        });
    }

    try {
        const {
            deceased_id,
            charge_type,
            description,
            amount,
            currency = 'KES',
            is_extra = false
        } = req.body;

        if (!deceased_id || !charge_type || amount === undefined) {
            return res.status(400).json({
                success: false,
                message: 'deceased_id, charge_type, and amount are required'
            });
        }

        const dbName = await lookupTenantDatabase(tenantSlug);
        if (!dbName) {
            return res.status(404).json({
                success: false,
                message: `No database configured for tenant: ${tenantSlug}`
            });
        }

        await ensureChargesTable(dbName);

        const insertQuery = `
            INSERT INTO charges (
                deceased_id, charge_type, description, amount, currency, is_extra, charge_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await safeTenantExecute(dbName, insertQuery, [
            deceased_id,
            charge_type,
            description || null,
            amount,
            currency,
            is_extra ? 1 : 0,
            nowNairobi()
        ]);

        // Update total charge in deceased table
        await updateDeceasedTotalCharge(dbName, deceased_id);

        return res.status(201).json({
            success: true,
            message: 'Charge added successfully',
            data: { id: result.insertId, deceased_id }
        });
    } catch (error: any) {
        console.error('❌ Error in addCharge:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};

/**
 * Update a charge
 * PUT /api/v1/restpoint/deceased/charges/:id
 */
export const updateCharge = async (req: TenantRequest, res: Response): Promise<Response> => {
    const tenantSlug = req.headers['x-tenant-slug'] as string || req.tenantSlug;
    const { id } = req.params;

    if (!id || !tenantSlug) {
        return res.status(400).json({
            success: false,
            message: 'id and tenant are required'
        });
    }

    try {
        const dbName = await lookupTenantDatabase(tenantSlug);
        if (!dbName) {
            return res.status(404).json({
                success: false,
                message: `No database configured for tenant: ${tenantSlug}`
            });
        }

        const updates = req.body;
        const allowedFields = ['charge_type', 'description', 'amount', 'currency', 'is_extra'];
        
        const fields: string[] = [];
        const values: any[] = [];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(field === 'is_extra' ? (updates[field] ? 1 : 0) : updates[field]);
            }
        }

        if (fields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        fields.push('updated_at = ?');
        values.push(nowNairobi());
        values.push(id);

        // Get deceased_id first for later update
        const selectQuery = 'SELECT deceased_id FROM charges WHERE id = ?';
        const results = await safeTenantQuery(dbName, selectQuery, [id]);
        const deceased_id = results && (results as any[]).length > 0 ? (results as any[])[0].deceased_id : null;

        const updateQuery = `UPDATE charges SET ${fields.join(', ')} WHERE id = ?`;
        await safeTenantExecute(dbName, updateQuery, values);

        // Update total charge in deceased table
        if (deceased_id) {
            await updateDeceasedTotalCharge(dbName, deceased_id);
        }

        return res.status(200).json({
            success: true,
            message: 'Charge updated successfully'
        });
    } catch (error: any) {
        console.error('❌ Error in updateCharge:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};

/**
 * Delete a charge
 * DELETE /api/v1/restpoint/deceased/charges/:id
 */
export const deleteCharge = async (req: TenantRequest, res: Response): Promise<Response> => {
    const tenantSlug = req.headers['x-tenant-slug'] as string || req.tenantSlug;
    const { id } = req.params;

    if (!id || !tenantSlug) {
        return res.status(400).json({
            success: false,
            message: 'id and tenant are required'
        });
    }

    try {
        const dbName = await lookupTenantDatabase(tenantSlug);
        if (!dbName) {
            return res.status(404).json({
                success: false,
                message: `No database configured for tenant: ${tenantSlug}`
            });
        }

        // Get deceased_id first
        const selectQuery = 'SELECT deceased_id FROM charges WHERE id = ?';
        const results = await safeTenantQuery(dbName, selectQuery, [id]);
        const deceased_id = results && (results as any[]).length > 0 ? (results as any[])[0].deceased_id : null;

        const deleteQuery = 'DELETE FROM charges WHERE id = ?';
        await safeTenantExecute(dbName, deleteQuery, [id]);

        // Update total charge in deceased table
        if (deceased_id) {
            await updateDeceasedTotalCharge(dbName, deceased_id);
        }

        return res.status(200).json({
            success: true,
            message: 'Charge deleted successfully'
        });
    } catch (error: any) {
        console.error('❌ Error in deleteCharge:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};

// Helper function to update total charge in deceased table
const updateDeceasedTotalCharge = async (dbName: string, deceased_id: string): Promise<void> => {
    try {
        const sumQuery = `
            SELECT SUM(amount) as total, SUM(IF(is_extra=1, amount, 0)) as extra_total
            FROM charges
            WHERE deceased_id = ?
        `;
        const results = await safeTenantQuery(dbName, sumQuery, [deceased_id]);
        const totals = results && (results as any[]).length > 0 ? (results as any[])[0] : {};

        const updateQuery = `
            UPDATE deceased 
            SET total_mortuary_charge = ?, extra_charges_amount = ?
            WHERE deceased_id = ?
        `;
        await safeTenantExecute(dbName, updateQuery, [
            totals.total || 0,
            totals.extra_total || 0,
            deceased_id
        ]);
    } catch (error) {
        console.error('❌ Failed to update deceased total charge:', error);
    }
};
