import { Request, Response } from 'express';
import mysql from 'mysql2/promise';

// Server connection (same as Tenant.model)
let serverConnection: mysql.Connection | null = null;

async function getServerConnection(): Promise<mysql.Connection> {
    if (!serverConnection) {
        serverConnection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: parseInt(process.env.DB_PORT || '3306'),
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
        });
    }
    return serverConnection;
}

export class SystemAdminController {

    // ─── GET ALL TENANTS ─────────────────────────────────────────────
    async getAllTenants(req: Request, res: Response) {
        try {
            const conn = await getServerConnection();

            const [tenants] = await conn.query(`
                SELECT 
                    t.*,
                    (SELECT COUNT(*) FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = t.db_name) as db_exists
                FROM tenant_tracking.tenants t
                ORDER BY t.created_at DESC
            `);

            // For each tenant, get additional stats from their database
            const tenantsWithStats = await Promise.all(
                (tenants as any[]).map(async (tenant) => {
                    let stats = {
                        totalUsers: 0,
                        totalDeceased: 0,
                        totalBranches: 0,
                        totalInvoices: 0,
                        totalRevenue: 0,
                    };

                    try {
                        const tenantConn = await mysql.createConnection({
                            host: process.env.DB_HOST || 'localhost',
                            port: parseInt(process.env.DB_PORT || '3306'),
                            user: process.env.DB_USER || 'root',
                            password: process.env.DB_PASSWORD || '',
                            database: tenant.db_name,
                        });

                        // Get user count
                        const [users] = await tenantConn.query('SELECT COUNT(*) as count FROM users');
                        stats.totalUsers = (users as any[])[0]?.count || 0;

                        // Get deceased count
                        const [deceased] = await tenantConn.query('SELECT COUNT(*) as count FROM deceased');
                        stats.totalDeceased = (deceased as any[])[0]?.count || 0;

                        // Get branches count
                        const [branches] = await tenantConn.query('SELECT COUNT(*) as count FROM branches WHERE is_active = TRUE');
                        stats.totalBranches = (branches as any[])[0]?.count || 0;

                        // Try to get invoice stats (table may not exist)
                        try {
                            const [invoices] = await tenantConn.query('SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as total FROM invoices');
                            stats.totalInvoices = (invoices as any[])[0]?.count || 0;
                            stats.totalRevenue = (invoices as any[])[0]?.total || 0;
                        } catch (e) {
                            // invoices table may not exist
                        }

                        await tenantConn.end();
                    } catch (err) {
                        // Tenant database might not exist
                    }

                    return {
                        ...tenant,
                        stats,
                    };
                })
            );

            res.json({
                success: true,
                data: tenantsWithStats,
                total: tenantsWithStats.length,
            });
        } catch (error: any) {
            console.error('Error fetching tenants:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch tenants',
                error: error.message,
            });
        }
    }

    // ─── GET TENANT DETAILS ──────────────────────────────────────────
    async getTenantDetails(req: Request, res: Response) {
        try {
            const { tenantId } = req.params;
            const conn = await getServerConnection();

            const [tenants] = await conn.query(
                'SELECT * FROM tenant_tracking.tenants WHERE tenant_id = ?',
                [tenantId]
            );

            if (!Array.isArray(tenants) || tenants.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Tenant not found',
                });
            }

            const tenant = tenants[0] as any;

            // Get detailed stats from tenant database
            let stats: any = {};
            try {
                const tenantConn = await mysql.createConnection({
                    host: process.env.DB_HOST || 'localhost',
                    port: parseInt(process.env.DB_PORT || '3306'),
                    user: process.env.DB_USER || 'root',
                    password: process.env.DB_PASSWORD || '',
                    database: tenant.db_name,
                });

                const [users] = await tenantConn.query('SELECT user_id, email, full_name, role, is_active, created_at FROM users ORDER BY created_at DESC');
                const [deceased] = await tenantConn.query('SELECT COUNT(*) as count FROM deceased');
                const [branches] = await tenantConn.query('SELECT * FROM branches ORDER BY branch_name');
                
                let invoices: any = { total: 0, revenue: 0 };
                try {
                    const [invResult] = await tenantConn.query('SELECT COUNT(*) as total, COALESCE(SUM(total_amount), 0) as revenue FROM invoices');
                    invoices = (invResult as any[])[0] || invoices;
                } catch (e) {}

                stats = {
                    users,
                    totalDeceased: (deceased as any[])[0]?.count || 0,
                    branches,
                    totalInvoices: invoices.total,
                    totalRevenue: invoices.revenue,
                };

                await tenantConn.end();
            } catch (err) {
                stats = { users: [], totalDeceased: 0, branches: [], totalInvoices: 0, totalRevenue: 0 };
            }

            res.json({
                success: true,
                data: {
                    ...tenant,
                    stats,
                },
            });
        } catch (error: any) {
            console.error('Error fetching tenant details:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch tenant details',
                error: error.message,
            });
        }
    }

    // ─── SUSPEND TENANT ──────────────────────────────────────────────
    async suspendTenant(req: Request, res: Response) {
        try {
            const { tenantId } = req.params;
            const conn = await getServerConnection();

            // Update tenant status
            await conn.query(
                `UPDATE tenant_tracking.tenants 
                 SET status = 'suspended', subscription_status = 'suspended', updated_at = NOW() 
                 WHERE tenant_id = ?`,
                [tenantId]
            );

            // Deactivate all users in the tenant database
            const [tenants] = await conn.query(
                'SELECT db_name FROM tenant_tracking.tenants WHERE tenant_id = ?',
                [tenantId]
            );

            if (Array.isArray(tenants) && tenants.length > 0) {
                const tenant = tenants[0] as any;
                try {
                    const tenantConn = await mysql.createConnection({
                        host: process.env.DB_HOST || 'localhost',
                        port: parseInt(process.env.DB_PORT || '3306'),
                        user: process.env.DB_USER || 'root',
                        password: process.env.DB_PASSWORD || '',
                        database: tenant.db_name,
                    });
                    await tenantConn.query('UPDATE users SET is_active = FALSE');
                    await tenantConn.end();
                } catch (e) {
                    console.warn('Could not deactivate users:', e);
                }
            }

            res.json({
                success: true,
                message: 'Tenant suspended successfully',
            });
        } catch (error: any) {
            console.error('Error suspending tenant:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to suspend tenant',
                error: error.message,
            });
        }
    }

    // ─── ACTIVATE TENANT ─────────────────────────────────────────────
    async activateTenant(req: Request, res: Response) {
        try {
            const { tenantId } = req.params;
            const conn = await getServerConnection();

            // Update tenant status
            await conn.query(
                `UPDATE tenant_tracking.tenants 
                 SET status = 'active', subscription_status = 'active', updated_at = NOW() 
                 WHERE tenant_id = ?`,
                [tenantId]
            );

            // Reactivate all users in the tenant database
            const [tenants] = await conn.query(
                'SELECT db_name FROM tenant_tracking.tenants WHERE tenant_id = ?',
                [tenantId]
            );

            if (Array.isArray(tenants) && tenants.length > 0) {
                const tenant = tenants[0] as any;
                try {
                    const tenantConn = await mysql.createConnection({
                        host: process.env.DB_HOST || 'localhost',
                        port: parseInt(process.env.DB_PORT || '3306'),
                        user: process.env.DB_USER || 'root',
                        password: process.env.DB_PASSWORD || '',
                        database: tenant.db_name,
                    });
                    await tenantConn.query('UPDATE users SET is_active = TRUE');
                    await tenantConn.end();
                } catch (e) {
                    console.warn('Could not reactivate users:', e);
                }
            }

            res.json({
                success: true,
                message: 'Tenant activated successfully',
            });
        } catch (error: any) {
            console.error('Error activating tenant:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to activate tenant',
                error: error.message,
            });
        }
    }

    // ─── STOP/DELETE TENANT ──────────────────────────────────────────
    async stopTenant(req: Request, res: Response) {
        try {
            const { tenantId } = req.params;
            const conn = await getServerConnection();

            // Soft delete - mark as deleted
            await conn.query(
                `UPDATE tenant_tracking.tenants 
                 SET status = 'deleted', subscription_status = 'cancelled', updated_at = NOW() 
                 WHERE tenant_id = ?`,
                [tenantId]
            );

            // Deactivate all users
            const [tenants] = await conn.query(
                'SELECT db_name FROM tenant_tracking.tenants WHERE tenant_id = ?',
                [tenantId]
            );

            if (Array.isArray(tenants) && tenants.length > 0) {
                const tenant = tenants[0] as any;
                try {
                    const tenantConn = await mysql.createConnection({
                        host: process.env.DB_HOST || 'localhost',
                        port: parseInt(process.env.DB_PORT || '3306'),
                        user: process.env.DB_USER || 'root',
                        password: process.env.DB_PASSWORD || '',
                        database: tenant.db_name,
                    });
                    await tenantConn.query('UPDATE users SET is_active = FALSE');
                    await tenantConn.end();
                } catch (e) {
                    console.warn('Could not deactivate users:', e);
                }
            }

            res.json({
                success: true,
                message: 'Tenant stopped (soft-deleted) successfully',
            });
        } catch (error: any) {
            console.error('Error stopping tenant:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to stop tenant',
                error: error.message,
            });
        }
    }

    // ─── UPDATE SUBSCRIPTION ─────────────────────────────────────────
    async updateSubscription(req: Request, res: Response) {
        try {
            const { tenantId } = req.params;
            const { subscription_status, subscription_expires_at } = req.body;
            const conn = await getServerConnection();

            const validStatuses = ['active', 'trial', 'suspended', 'cancelled'];
            if (!validStatuses.includes(subscription_status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid subscription status',
                });
            }

            await conn.query(
                `UPDATE tenant_tracking.tenants 
                 SET subscription_status = ?, subscription_expires_at = ?, updated_at = NOW() 
                 WHERE tenant_id = ?`,
                [subscription_status, subscription_expires_at || null, tenantId]
            );

            res.json({
                success: true,
                message: 'Subscription updated successfully',
            });
        } catch (error: any) {
            console.error('Error updating subscription:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update subscription',
                error: error.message,
            });
        }
    }

    // ─── GET SYSTEM DASHBOARD STATS ──────────────────────────────────
    async getDashboardStats(req: Request, res: Response) {
        try {
            const conn = await getServerConnection();

            // Get all tenants
            const [tenants] = await conn.query(
                'SELECT * FROM tenant_tracking.tenants ORDER BY created_at DESC'
            );

            const allTenants = tenants as any[];

            const totalTenants = allTenants.length;
            const activeTenants = allTenants.filter(t => t.status === 'active').length;
            const suspendedTenants = allTenants.filter(t => t.status === 'suspended').length;
            const deletedTenants = allTenants.filter(t => t.status === 'deleted').length;

            const activeSubscriptions = allTenants.filter(t => t.subscription_status === 'active').length;
            const trialSubscriptions = allTenants.filter(t => t.subscription_status === 'trial').length;
            const suspendedSubscriptions = allTenants.filter(t => t.subscription_status === 'suspended').length;
            const cancelledSubscriptions = allTenants.filter(t => t.subscription_status === 'cancelled').length;

            // Calculate total revenue across all tenants
            let totalRevenue = 0;
            let totalUsers = 0;
            let totalDeceased = 0;

            for (const tenant of allTenants) {
                if (tenant.status === 'deleted') continue;
                try {
                    const tenantConn = await mysql.createConnection({
                        host: process.env.DB_HOST || 'localhost',
                        port: parseInt(process.env.DB_PORT || '3306'),
                        user: process.env.DB_USER || 'root',
                        password: process.env.DB_PASSWORD || '',
                        database: tenant.db_name,
                    });

                    try {
                        const [users] = await tenantConn.query('SELECT COUNT(*) as count FROM users');
                        totalUsers += (users as any[])[0]?.count || 0;
                    } catch (e) {}

                    try {
                        const [deceased] = await tenantConn.query('SELECT COUNT(*) as count FROM deceased');
                        totalDeceased += (deceased as any[])[0]?.count || 0;
                    } catch (e) {}

                    try {
                        const [invoices] = await tenantConn.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM invoices');
                        totalRevenue += (invoices as any[])[0]?.total || 0;
                    } catch (e) {}

                    await tenantConn.end();
                } catch (e) {
                    // Skip if tenant DB doesn't exist
                }
            }

            // Recent tenants (last 10)
            const recentTenants = allTenants.slice(0, 10);

            res.json({
                success: true,
                data: {
                    overview: {
                        totalTenants,
                        activeTenants,
                        suspendedTenants,
                        deletedTenants,
                        totalRevenue,
                        totalUsers,
                        totalDeceased,
                    },
                    subscriptions: {
                        active: activeSubscriptions,
                        trial: trialSubscriptions,
                        suspended: suspendedSubscriptions,
                        cancelled: cancelledSubscriptions,
                    },
                    recentTenants,
                },
            });
        } catch (error: any) {
            console.error('Error fetching dashboard stats:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch dashboard stats',
                error: error.message,
            });
        }
    }
}