import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';

const router = Router();
const authController = new AuthController();

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);

export { router as authRouter };
