import { Router } from 'express';
import multer from 'multer';
import * as coffinController from '../services/coffinService';
import { authenticateToken } from '../../global/middlewares/AuthMiddleware';
import { tenantMiddleware } from '../../global/middlewares/tenantMiddleware';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// Apply tenant and auth middleware
router.use(tenantMiddleware);
router.use(authenticateToken);

// Coffin CRUD
router.post('/', upload.array('images', 10), coffinController.createCoffin);
router.get('/', coffinController.getAllCoffins);
router.get('/:id', coffinController.getCoffinById);
router.put('/:id', upload.array('images', 10), coffinController.updateCoffin);
router.delete('/:id', coffinController.deleteCoffin);

// Assignments
router.post('/assign', coffinController.assignCoffin);

// Analytics
router.get('/analytics/dashboard', coffinController.getCoffinAnalytics);

// Health
router.get('/health', coffinController.healthCheck);

export default router;