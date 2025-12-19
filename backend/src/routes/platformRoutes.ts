import { Router } from 'express';
import {
  getPlatforms,
  getPlatform,
  connectPlatform,
  connectPlatformValidation,
  getMyPlatforms,
  disconnectPlatform,
} from '../controllers/platformController';
import { authenticate } from '../middleware/auth';
import { gigLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(gigLimiter);

router.get('/', getPlatforms);
router.get('/my', getMyPlatforms);
router.get('/:id', getPlatform);
router.post('/connect', connectPlatformValidation, connectPlatform);
router.delete('/disconnect/:id', disconnectPlatform);

export default router;
