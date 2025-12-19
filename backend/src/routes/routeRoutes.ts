import { Router } from 'express';
import {
  createRoute,
  createRouteValidation,
  getMyRoutes,
  getRoute,
  updateRouteStatus,
  completeRouteStop,
  optimizeRoute,
} from '../controllers/routeController';
import { authenticate } from '../middleware/auth';
import { gigLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(gigLimiter);

router.post('/', createRouteValidation, createRoute);
router.post('/optimize', optimizeRoute);
router.get('/', getMyRoutes);
router.get('/:id', getRoute);
router.patch('/:id/status', updateRouteStatus);
router.patch('/stops/:id/complete', completeRouteStop);

export default router;
