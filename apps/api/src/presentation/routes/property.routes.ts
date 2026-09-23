import { Router } from 'express';
import { PropertyController } from '../controllers/PropertyController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';

const router = Router();
const propertyController = new PropertyController();

// Todas las rutas de propiedades requieren autenticación, contexto de tenant y rol de ADMIN_CONDOMINIO o SUPERADMIN
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(rbacMiddleware(['ADMIN_CONDOMINIO', 'SUPERADMIN']));

router.post('/', propertyController.create);
router.get('/', propertyController.list);
router.get('/:id', propertyController.getById);
router.patch('/:id', propertyController.update);
router.post('/:id/residents', propertyController.assignResident);

export default router;
