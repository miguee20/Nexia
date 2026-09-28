import { Router } from 'express';
import { UserController } from '../controllers/UserController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';

const router = Router();
const userController = new UserController();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/residents', userController.listResidents);

export default router;
