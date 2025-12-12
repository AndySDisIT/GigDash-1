import { Router } from 'express';
import { register, registerValidation, login, loginValidation } from '../controllers/authController';

const router = Router();

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);

export default router;
