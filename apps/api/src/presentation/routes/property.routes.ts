import { Router } from 'express';
import { PropertyController } from '../controllers/PropertyController';
import { VehicleController } from '../controllers/VehicleController';
import { MarbeteController } from '../controllers/MarbeteController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';

const router = Router();
const propertyController = new PropertyController();
const vehicleController = new VehicleController();
const marbeteController = new MarbeteController();

// Todas las rutas de propiedades requieren autenticación, contexto de tenant y rol de ADMIN_CONDOMINIO o SUPERADMIN
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(rbacMiddleware(['ADMIN_CONDOMINIO', 'SUPERADMIN']));

router.post('/', propertyController.create);
router.get('/', propertyController.list);
router.get('/:id', propertyController.getById);
router.patch('/:id', propertyController.update);
router.post('/:id/residents', propertyController.assignResident);

router.post('/:id/vehicles', vehicleController.register);
router.get('/:id/vehicles', vehicleController.listByProperty);
router.get('/:id/marbetes', marbeteController.listByProperty);

export default router;
