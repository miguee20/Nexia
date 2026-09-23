import { Router } from 'express';
import { MarbeteController } from '../controllers/MarbeteController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';

const router = Router();
const marbeteController = new MarbeteController();

router.use(authMiddleware);
router.use(tenantMiddleware);

// Endpoint general de marbetes (ej: cancelar)
router.patch('/:id/cancel', rbacMiddleware(['ADMIN_CONDOMINIO', 'SUPERADMIN']), marbeteController.cancel);

export default router;
