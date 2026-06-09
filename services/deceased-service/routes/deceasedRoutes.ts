import { Router } from 'express';
import {
    registerDeceased,
    getAllDeceased,
    getDeceasedById,
    updateDeceased,
    exportDeceasedToExcel,
    deleteDeceased,
    getDeceasedStats
} from '../controllers/deceasedControl';


const router = Router();

// Deceased routes
router.post('/api/v1/restpoint/deceased/register-deceased', registerDeceased);
router.get('/api/v1/restpoint/deceased/deceased-all', getAllDeceased);
router.get('/api/v1/restpoint/deceased/deceased-id', getDeceasedById);
router.get('/api/v1/restpoint/deceased/deceased-id/:id', getDeceasedById);
router.put('/api/v1/restpoint/deceased/update-deceased/:id', updateDeceased);
router.delete('/api/v1/restpoint/deceased/delete-deceased/:id', deleteDeceased);
router.get('/api/v1/restpoint/deceased/stats', getDeceasedStats);
router.get('/api/v1/restpoint/deceased/export-excel', exportDeceasedToExcel);  // ADD THIS LINE

// Also support shorter routes
router.post('/register-deceased', registerDeceased);
router.get('/deceased-all', getAllDeceased);
router.get('/deceased-id', getDeceasedById);
router.get('/deceased-id/:id', getDeceasedById);
router.put('/update-deceased/:id', updateDeceased);
router.delete('/delete-deceased/:id', deleteDeceased);
router.get('/stats', getDeceasedStats);
router.get('/export-excel', exportDeceasedToExcel);  // ADD THIS LINE

export default router;