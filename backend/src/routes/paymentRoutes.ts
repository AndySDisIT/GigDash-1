import { Router } from 'express';
import {
  createPayment,
  createPaymentValidation,
  getMyPayments,
  updatePaymentStatus,
  getPaymentStats,
} from '../controllers/paymentController';
import { authenticate } from '../middleware/auth';
import { gigLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate);
router.use(gigLimiter);

router.post('/', createPaymentValidation, createPayment);
router.get('/', getMyPayments);
router.get('/stats', getPaymentStats);
router.patch('/:id', updatePaymentStatus);

export default router;
