import { Request, Response } from 'express';
import { DateTime } from 'luxon';
import crypto from 'crypto';
import axios from 'axios';
import { lookupTenantDatabase, safeTenantExecute, safeTenantQuery } from '../../shared/dbConfig';
import ExcelExportService from '../services/excelExportService';
import mysql from 'mysql2/promise';

interface TenantRequest extends Request {
    tenantSlug?: string;
}

const nowNairobi = (): string => {
    return DateTime.now().setZone('Africa/Nairobi').toFormat('yyyy-MM-dd HH:mm:ss');
};

const nowMs = (): number => {
    return DateTime.now().toMillis();
};

const logError = (error: any, context: string) => {
    console.error(`❌ Error in ${context}:`, {
        message: error?.message || 'Unknown error',
        stack: error?.stack,
        timestamp: nowNairobi()
    });
};

const generateUniqueDeceasedId = (fullName: string, tenantSlug: string): string => {
    const tenantPrefix = tenantSlug.substring(0, 3).toUpperCase();
    const namePart = fullName.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '');
    const timestamp = nowMs().toString().slice(-6);
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${tenantPrefix}-${namePart}-${timestamp}-${random}`;
};

// Ensure deceased table exists in tenant database
const ensureDeceasedTable = async (dbName: string, tenantSlug: string): Promise<void> => {
    const createTableSQL = `
        CREATE TABLE IF NOT EXISTS deceased (
            id INT AUTO_INCREMENT PRIMARY KEY,
            deceased_id VARCHAR(100) UNIQUE NOT NULL,
            admission_number VARCHAR(100),
            cause_of_death TEXT,
            date_admitted DATETIME,
            date_of_birth DATE,
            date_of_death DATE,
            date_registered DATETIME,
            full_name VARCHAR(255) NOT NULL,
            gender VARCHAR(20),
            place_of_death VARCHAR(255),
            county VARCHAR(100),
            national_id VARCHAR(50),
            created_at DATETIME,
            location TEXT,
            portal_slug VARCHAR(255) UNIQUE,
            created_by INT,
            status VARCHAR(50) DEFAULT 'active',
            total_mortuary_charge DECIMAL(10,2),
            currency VARCHAR(3) DEFAULT 'KES',
            burial_type VARCHAR(50),
            dispatch_date DATE,
            extra_charges_amount DECIMAL(10,2) DEFAULT 0,
            next_of_kin_count INT DEFAULT 0,
            is_embalmed BOOLEAN DEFAULT FALSE,
            INDEX idx_deceased_id (deceased_id),
            INDEX idx_full_name (full_name),
            INDEX idx_date_registered (date_registered),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;
    
    try {
        await safeTenantExecute(dbName, createTableSQL, []);
        console.log(`✅ Deceased table ensured for tenant: ${tenantSlug} in database: ${dbName}`);
    } catch (error) {
        console.error(`❌ Failed to create deceased table for tenant ${tenantSlug}:`, error);
        throw error;
    }
};

/**
 * Register a new deceased person
 * POST /api/v1/restpoint/deceased/register-deceased
 */
export const registerDeceased = async (req: TenantRequest, res: Response): Promise<Response> => {
    const tenantSlug = req.headers['x-tenant-slug'] as string || req.tenantSlug;
    
    console.log('📝 Register deceased request received');
    console.log('🏢 Tenant slug:', tenantSlug);
    console.log('📦 Request body:', req.body);

    if (!tenantSlug || tenantSlug === 'system_shared') {
        return res.status(400).json({ 
            success: false, 
            message: 'Valid tenant required. Please provide x-tenant-slug header' 
        });
    }

    try {
        const {
            full_name,
            cause_of_death,
            date_of_birth,
            date_of_death,
            gender,
            place_of_death,
            county,
            location,
            national_id,
            admission_number,
            date_admitted,
            registered_by
        } = req.body;

        const missingFields: string[] = [];
        if (!full_name) missingFields.push('full_name');
        if (!date_of_birth) missingFields.push('date_of_birth');
        if (!date_of_death) missingFields.push('date_of_death');
        if (!gender) missingFields.push('gender');
        if (!county) missingFields.push('county');
        if (!national_id) missingFields.push('national_id');

        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing required fields: ${missingFields.join(', ')}`
            });
        }

        console.log(`🔍 Looking up database for tenant slug: ${tenantSlug}`);
        const dbName = await lookupTenantDatabase(tenantSlug);
        
        if (!dbName) {
            console.error(`❌ No database found for tenant: ${tenantSlug}`);
            return res.status(404).json({
                success: false,
                message: `No database configured for tenant: ${tenantSlug}. Please onboard the tenant first.`
            });
        }
        
        console.log(`✅ Found database: ${dbName}`);

        await ensureDeceasedTable(dbName, tenantSlug);

        const deceased_id = generateUniqueDeceasedId(full_name, tenantSlug);
        const portal_slug = `${tenantSlug}-${full_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${crypto.randomBytes(3).toString('hex')}`;
        const now = nowNairobi();
        const admissionNum = admission_number || `ADM-${Date.now()}`;
        const admittedDate = date_admitted || now;

        console.log(`📝 Inserting deceased record with ID: ${deceased_id}`);

        const insertQuery = `
            INSERT INTO deceased (
                deceased_id, admission_number, cause_of_death, date_admitted,
                date_of_birth, date_of_death, date_registered, full_name, gender,
                place_of_death, county, national_id, created_at, location, portal_slug, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await safeTenantExecute(dbName, insertQuery, [
            deceased_id,
            admissionNum,
            cause_of_death || 'Pending',
            admittedDate,
            date_of_birth,
            date_of_death,
            now,
            full_name,
            gender,
            place_of_death || 'Not specified',
            county,
            national_id,
            now,
            location || null,
            portal_slug,
            null
        ]);

        console.log(`✅ Deceased registered successfully. Insert ID: ${result.insertId}`);

        // Create notification for new deceased registration
        try {
            const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8111';
            await axios.post(`${notificationServiceUrl}/api/v1/restpoint/notification/notifications`, {
                deceased_id,
                type: 'new_body',
                message: `New body registered: ${full_name} (ID: ${deceased_id})`
            }, {
                headers: {
                    'x-tenant-slug': tenantSlug,
                    'Content-Type': 'application/json'
                }
            }).catch(err => {
                console.warn('⚠️ Could not create notification:', err.message);
            });
        } catch (notifError) {
            console.warn('⚠️ Notification creation failed:', notifError);
            // Don't fail the registration if notification fails
        }

        return res.status(201).json({
            success: true,
            message: 'Deceased registered successfully',
            data: {
                id: result.insertId,
                deceased_id,
                portal_slug,
                full_name,
                tenant: tenantSlug,
                admission_number: admissionNum
            }
        });

    } catch (error: any) {
        console.error('❌ Error in registerDeceased:', error);
        logError(error, 'registerDeceased');
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get all deceased records for a tenant
 * GET /api/v1/restpoint/deceased/deceased-all
 */
export const getAllDeceased = async (req: TenantRequest, res: Response): Promise<Response> => {
    const tenantSlug = req.headers['x-tenant-slug'] as string || req.tenantSlug;

    console.log('📋 Get all deceased request for tenant:', tenantSlug);

    if (!tenantSlug || tenantSlug === 'system_shared') {
        return res.status(400).json({ 
            success: false, 
            message: 'Valid tenant required. Please provide x-tenant-slug header' 
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

        const { search = '', page = '1', limit = '50' } = req.query;
        const pageNum = Math.max(1, parseInt(page as string));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
        const offset = (pageNum - 1) * limitNum;

        let whereClause = 'WHERE 1=1';
        let params: any[] = [];

        if (search && typeof search === 'string') {
            whereClause += ' AND (full_name LIKE ? OR deceased_id LIKE ? OR national_id LIKE ?)';
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern);
        }

        const countQuery = `SELECT COUNT(*) as total FROM deceased ${whereClause}`;
        const countResult = await safeTenantQuery(dbName, countQuery, params);
        const total = (countResult as any)[0]?.total || 0;

        const selectQuery = `
            SELECT 
                id, deceased_id, full_name, date_of_death, date_of_birth,
                gender, county, status, place_of_death, date_admitted,
                date_registered, portal_slug, national_id, cause_of_death, location,
                admission_number, total_mortuary_charge, currency, burial_type,
                extra_charges_amount, next_of_kin_count, is_embalmed
            FROM deceased
            ${whereClause}
            ORDER BY date_registered DESC, id DESC
            LIMIT ? OFFSET ?
        `;

        const records = await safeTenantQuery(dbName, selectQuery, [...params, limitNum, offset]);

        return res.status(200).json({
            success: true,
            message: 'Deceased records fetched successfully',
            data: records,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages: Math.ceil(total / limitNum)
            }
        });

    } catch (error: any) {
        console.error('❌ Error in getAllDeceased:', error);
        logError(error, 'getAllDeceased');
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};

/**
 * Get deceased record by ID (supports both numeric id and string deceased_id)
 * GET /api/v1/restpoint/deceased/deceased-id/:id
 */
export const getDeceasedById = async (req: TenantRequest, res: Response): Promise<Response> => {
    const tenantSlug = req.headers['x-tenant-slug'] as string || req.tenantSlug;
    const rawId = req.params.id || req.query.id;
    const id = (() => {
        if (Array.isArray(rawId)) {
            return rawId.length > 0 ? String(rawId[0]) : '';
        }
        if (typeof rawId === 'string') {
            return rawId;
        }
        if (rawId != null) {
            return String(rawId);
        }
        return '';
    })();

    console.log(`📋 Get deceased by ID: ${id} for tenant: ${tenantSlug}`);

    if (!id || !tenantSlug) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid request: tenant and id required' 
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

        let deceased = null;
        const isNumeric = /^\d+$/.test(id);
        
        if (isNumeric) {
            console.log(`🔍 Searching by numeric ID: ${id}`);
            const selectQuery = `
                SELECT 
                    id, deceased_id, full_name, date_of_death, date_of_birth,
                    gender, county, status, place_of_death, date_admitted,
                    date_registered, portal_slug, national_id, cause_of_death, location,
                    admission_number, total_mortuary_charge, currency,
                    burial_type, dispatch_date, created_at,
                    extra_charges_amount, next_of_kin_count, is_embalmed
                FROM deceased
                WHERE id = ?
            `;
            const records = await safeTenantQuery(dbName, selectQuery, [parseInt(id)]);
            if (records && records.length > 0) deceased = records[0];
        } else {
            console.log(`🔍 Searching by deceased_id: ${id}`);
            const selectQuery = `
                SELECT 
                    id, deceased_id, full_name, date_of_death, date_of_birth,
                    gender, county, status, place_of_death, date_admitted,
                    date_registered, portal_slug, national_id, cause_of_death, location,
                    admission_number, total_mortuary_charge, currency,
                    burial_type, dispatch_date, created_at,
                    extra_charges_amount, next_of_kin_count, is_embalmed
                FROM deceased
                WHERE deceased_id = ?
            `;
            const records = await safeTenantQuery(dbName, selectQuery, [id]);
            if (records && records.length > 0) deceased = records[0];
        }

        if (!deceased) {
            console.log(`❌ No record found for: ${id}`);
            return res.status(404).json({
                success: false,
                message: 'Deceased record not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Deceased record fetched successfully',
            data: deceased
        });

    } catch (error: any) {
        console.error('❌ Error in getDeceasedById:', error);
        logError(error, 'getDeceasedById');
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error'
        });
    }
};

/**
 * Update deceased record
 * PUT /api/v1/restpoint/deceased/update-deceased/:id
 */
export const updateDeceased = async (req: TenantRequest, res: Response): Promise<Response> => {
    const tenantSlug = req.headers['x-tenant-slug'] as string || req.tenantSlug;
    const { id } = req.params;

    if (!id || !tenantSlug) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid request' 
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
        const allowedFields = [
            'full_name', 'cause_of_death', 'location', 'status', 
            'burial_location', 'burial_date', 'total_mortuary_charge',
            'extra_charges_amount', 'is_embalmed', 'dispatch_date'
        ];
        
        const fields: string[] = [];
        const values: any[] = [];

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                fields.push(`${field} = ?`);
                values.push(updates[field]);
            }
        }

        if (fields.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'No fields to update' 
            });
        }

        values.push(id);
        const updateQuery = `UPDATE deceased SET ${fields.join(', ')} WHERE id = ?`;
        await safeTenantExecute(dbName, updateQuery, values);

        return res.status(200).json({
            success: true,
            message: 'Deceased record updated successfully'
        });

    } catch (error: any) {
        console.error('❌ Error in updateDeceased:', error);
        logError(error, 'updateDeceased');
        return res.status(500).json({ 
            success: false, 
            message: 'Internal Server Error' 
        });
    }
};

/**
 * Delete deceased record
 * DELETE /api/v1/restpoint/deceased/delete-deceased/:id
 */
export const deleteDeceased = async (req: TenantRequest, res: Response): Promise<Response> => {
    const tenantSlug = req.headers['x-tenant-slug'] as string || req.tenantSlug;
    const { id } = req.params;

    if (!id || !tenantSlug) {
        return res.status(400).json({ 
            success: false, 
            message: 'Invalid request' 
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

        const deleteQuery = `DELETE FROM deceased WHERE id = ?`;
        const result = await safeTenantExecute(dbName, deleteQuery, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Deceased record not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Deceased record deleted successfully'
        });

    } catch (error: any) {
        console.error('❌ Error in deleteDeceased:', error);
        logError(error, 'deleteDeceased');
        return res.status(500).json({ 
            success: false, 
            message: 'Internal Server Error' 
        });
    }
};

/**
 * Get deceased statistics for dashboard
 * GET /api/v1/restpoint/deceased/stats
 */
export const getDeceasedStats = async (req: TenantRequest, res: Response): Promise<Response> => {
    const tenantSlug = req.headers['x-tenant-slug'] as string || req.tenantSlug;

    if (!tenantSlug) {
        return res.status(400).json({ 
            success: false, 
            message: 'Valid tenant required' 
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

        const statsQuery = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN gender = 'Male' THEN 1 ELSE 0 END) as male,
                SUM(CASE WHEN gender = 'Female' THEN 1 ELSE 0 END) as female,
                SUM(CASE WHEN status = 'dispatched' THEN 1 ELSE 0 END) as dispatched,
                SUM(CASE WHEN is_embalmed = 1 THEN 1 ELSE 0 END) as embalmed,
                SUM(CASE WHEN next_of_kin_count > 0 THEN 1 ELSE 0 END) as has_next_of_kin,
                COUNT(DISTINCT county) as counties,
                SUM(total_mortuary_charge) as total_charges,
                SUM(extra_charges_amount) as total_extra_charges
            FROM deceased
        `;

        const result = await safeTenantQuery(dbName, statsQuery, []);
        const stats = (result as any[])[0];

        return res.status(200).json({
            success: true,
            message: 'Statistics fetched successfully',
            data: stats
        });

    } catch (error: any) {
        console.error('❌ Error in getDeceasedStats:', error);
        logError(error, 'getDeceasedStats');
        return res.status(500).json({ 
            success: false, 
            message: 'Internal Server Error' 
        });
    }
};

/**
 * Export deceased records to Excel
 * GET /api/v1/restpoint/deceased/export-excel
 */
export const exportDeceasedToExcel = async (req: TenantRequest, res: Response): Promise<Response> => {
    const tenantSlug = req.headers['x-tenant-slug'] as string || req.tenantSlug;
    
    console.log('📊 Export deceased records to Excel for tenant:', tenantSlug);

    if (!tenantSlug || tenantSlug === 'system_shared') {
        return res.status(400).json({ 
            success: false, 
            message: 'Valid tenant required. Please provide x-tenant-slug header' 
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

        // Get tenant name from tracking DB
        let tenantName = tenantSlug;
        const trackingConn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: 'tenant_tracking'
        });
        
        try {
            const [tenants] = await trackingConn.execute(
                'SELECT tenant_name FROM tenants WHERE tenant_slug = ?',
                [tenantSlug]
            );
            if (tenants && (tenants as any[]).length > 0) {
                tenantName = (tenants as any[])[0].tenant_name;
            }
        } catch (err) {
            console.warn('Could not fetch tenant name:', err);
        }
        await trackingConn.end();

        const { period = 'all', startDate, endDate } = req.query;
        
        // Build query with date filters
        let whereClause = 'WHERE 1=1';
        let params: any[] = [];
        
        if (period === 'custom' && startDate && endDate) {
            whereClause += ' AND date_registered BETWEEN ? AND ?';
            params.push(startDate, endDate);
        } else if (period === 'thisMonth') {
            const start = DateTime.now().startOf('month').toFormat('yyyy-MM-dd');
            const end = DateTime.now().endOf('month').toFormat('yyyy-MM-dd');
            whereClause += ' AND date_registered BETWEEN ? AND ?';
            params.push(start, end);
        } else if (period === 'thisYear') {
            const start = DateTime.now().startOf('year').toFormat('yyyy-MM-dd');
            const end = DateTime.now().endOf('year').toFormat('yyyy-MM-dd');
            whereClause += ' AND date_registered BETWEEN ? AND ?';
            params.push(start, end);
        }
        
        // Get records
        const selectQuery = `
            SELECT 
                id, deceased_id, admission_number, full_name, gender,
                date_of_birth, date_of_death, date_admitted, date_registered,
                cause_of_death, place_of_death, county, location, national_id,
                status, total_mortuary_charge, currency, burial_type, dispatch_date,
                extra_charges_amount, next_of_kin_count, is_embalmed
            FROM deceased
            ${whereClause}
            ORDER BY date_registered DESC
        `;
        
        const records = await safeTenantQuery(dbName, selectQuery, params);
        
        // Calculate period label
        let periodLabel = 'All Records';
        if (period === 'thisMonth') periodLabel = `${DateTime.now().toFormat('MMMM yyyy')}`;
        else if (period === 'thisYear') periodLabel = `Year ${DateTime.now().toFormat('yyyy')}`;
        else if (period === 'custom' && startDate && endDate) {
            periodLabel = `${DateTime.fromISO(startDate as string).toFormat('dd/MM/yyyy')} - ${DateTime.fromISO(endDate as string).toFormat('dd/MM/yyyy')}`;
        }
        
        // Get Excel export service
        const excelService = ExcelExportService.getInstance();
        const theme = excelService.getTenantTheme(tenantSlug);
        theme.companyName = tenantName;
        
        // Generate Excel
        const exportResult = await excelService.generateDeceasedReport(records, {
            period: period as any,
            startDate: startDate as string,
            endDate: endDate as string,
            tenantTheme: theme,
            format: 'xlsx'
        });
        
        const filename = `${tenantSlug}_deceased_report_${DateTime.now().toFormat('yyyyMMdd_HHmmss')}.xlsx`;
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', exportResult.buffer.length);
        
        return res.send(exportResult.buffer);
        
    } catch (error: any) {
        console.error('❌ Error in exportDeceasedToExcel:', error);
        logError(error, 'exportDeceasedToExcel');
        return res.status(500).json({
            success: false,
            message: 'Internal Server Error',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Export all controllers
export default {
    registerDeceased,
    getAllDeceased,
    getDeceasedById,
    updateDeceased,
    deleteDeceased,
    getDeceasedStats,
    exportDeceasedToExcel
};