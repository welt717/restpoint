import { Router } from 'express';
import { OnboardingController } from '../controllers/onboardingController';
import { upload } from '../config/multer';
import { validateOnboarding, validateLogin } from '../middlewares/validationMiddleware';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();
const onboardingController = new OnboardingController();

// Public routes
router.post(
  '/organization',
  upload.single('logo'),
  validateOnboarding,
  onboardingController.createOrganization.bind(onboardingController)
);

router.post(
  '/login',
  validateLogin,
  onboardingController.login.bind(onboardingController)
);

router.post(
  '/logout',
  authenticateToken,
  onboardingController.logout.bind(onboardingController)
);

router.get(
  '/organization',
  authenticateToken,
  onboardingController.getOrganization.bind(onboardingController)
);

export default router;