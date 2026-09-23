import { Router } from 'express';
import { MarbeteController } from '../controllers/MarbeteController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';

const router = Router();
const marbeteController = new MarbeteController();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(rbacMiddleware(['ADMIN_CONDOMINIO', 'SUPERADMIN']));

router.post('/:id/marbetes', marbeteController.issue);

export default router;
