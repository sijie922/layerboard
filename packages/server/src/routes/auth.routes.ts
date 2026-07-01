import { Router } from 'express';
import { register, login } from '../controllers/auth.controller.js';
import { validateBody, registerSchema, loginSchema } from '../middleware/validation.middleware.js';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);

export default router;
