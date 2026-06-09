import { Router, Request, Response, NextFunction } from 'express';
import {
  nextOfKinRegister,
  getNextOfKinByDeceasedId,
  updateNextOfKin,
  deleteNextOfKin,
  markAsNotified
} from '../controllers/nextOfKinController';

const router = Router();

// Simple authentication middleware stub
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Implement proper authentication
  // For now, attach a mock user to the request
  (req as any).user = { userId: 'system', role: 'admin' };
  next();
};

// All routes use authentication middleware
router.use(authenticate);

// Next of Kin routes
router.post('/next-of-kin', nextOfKinRegister);
router.get('/next-of-kin', getNextOfKinByDeceasedId);
router.put('/next-of-kin/:id', updateNextOfKin);
router.delete('/next-of-kin/:id', deleteNextOfKin);
router.patch('/next-of-kin/:id/notify', markAsNotified);

module.exports = router;
