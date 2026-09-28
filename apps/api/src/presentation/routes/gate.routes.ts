import { Router } from 'express';
import { MarbeteController } from '../controllers/MarbeteController';
import { GateController } from '../controllers/gate.controller';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';

const router = Router();
const marbeteController = new MarbeteController();
const gateController = new GateController();

router.use(authMiddleware);
router.use(tenantMiddleware);

// Rutas exclusivas de Guardia (y Admins)
router.post('/validate-qr', rbacMiddleware(['GUARDIA', 'ADMIN_CONDOMINIO', 'SUPERADMIN']), gateController.validateQR);
router.get('/deliveries/active', rbacMiddleware(['GUARDIA', 'ADMIN_CONDOMINIO', 'SUPERADMIN']), gateController.listActiveDeliveryAlerts);
router.get('/search-marbete/:code', rbacMiddleware(['GUARDIA', 'ADMIN_CONDOMINIO', 'SUPERADMIN']), marbeteController.searchByCode);

export default router;
