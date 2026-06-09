import { Router } from 'express';
import {
    getCharges,
    addCharge,
    updateCharge,
    deleteCharge
} from '../controllers/chargesControl';

const router = Router();

// Charges routes - Full paths
router.get('/api/v1/restpoint/deceased/charges/:deceased_id', getCharges);
router.post('/api/v1/restpoint/deceased/charges', addCharge);
router.put('/api/v1/restpoint/deceased/charges/:id', updateCharge);
router.delete('/api/v1/restpoint/deceased/charges/:id', deleteCharge);

// Short paths
router.get('/charges/:deceased_id', getCharges);
router.post('/charges', addCharge);
router.put('/charges/:id', updateCharge);
router.delete('/charges/:id', deleteCharge);

export default router;
