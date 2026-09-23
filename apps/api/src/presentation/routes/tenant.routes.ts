import { Router } from 'express';
import { TenantController } from '../controllers/TenantController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';

const router = Router();
const tenantController = new TenantController();

// Use authentication and rbac middleware for all tenant routes
router.use(authMiddleware);
router.use(rbacMiddleware(['SUPERADMIN']));

router.post('/', tenantController.create);
router.get('/', tenantController.list);
router.patch('/:id/config', tenantController.updateConfig);

export { router as tenantRouter };
