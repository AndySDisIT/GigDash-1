import { Router } from 'express';
import { register, registerValidation, login, loginValidation } from '../controllers/authController';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);

export default router;
