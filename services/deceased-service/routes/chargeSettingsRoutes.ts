import { Router } from 'express';
import {
    getChargeSettings,
    updateChargeSettings,
    getBillingSummary,
    recalculateBalance
} from '../controllers/chargeSettingsController';

const router = Router();

// Charge Settings routes - Full paths
router.get('/api/v1/restpoint/deceased/charge-settings', getChargeSettings);
router.put('/api/v1/restpoint/deceased/charge-settings/:id', updateChargeSettings);
router.get('/api/v1/restpoint/deceased/billing-summary/:id', getBillingSummary);
router.post('/api/v1/restpoint/deceased/charge-settings/:id/recalculate', recalculateBalance);

// Short paths (without full API prefix)
router.get('/charge-settings', getChargeSettings);
router.put('/charge-settings/:id', updateChargeSettings);
router.get('/billing-summary/:id', getBillingSummary);
router.post('/charge-settings/:id/recalculate', recalculateBalance);

export default router;