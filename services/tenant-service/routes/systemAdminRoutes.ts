import { Router } from 'express';
import { SystemAdminController } from '../controllers/systemAdminController';

const router = Router();
const controller = new SystemAdminController();

// ─── System Admin Routes ────────────────────────────────────────────
// These routes are for the system administrator to manage all tenants

// Dashboard stats
router.get('/dashboard', controller.getDashboardStats.bind(controller));

// Tenant management
router.get('/tenants', controller.getAllTenants.bind(controller));
router.get('/tenants/:tenantId', controller.getTenantDetails.bind(controller));

// Tenant actions
router.post('/tenants/:tenantId/suspend', controller.suspendTenant.bind(controller));
router.post('/tenants/:tenantId/activate', controller.activateTenant.bind(controller));
router.post('/tenants/:tenantId/stop', controller.stopTenant.bind(controller));

// Subscription management
router.put('/tenants/:tenantId/subscription', controller.updateSubscription.bind(controller));

export default router;