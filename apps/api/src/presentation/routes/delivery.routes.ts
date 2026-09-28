import { Router } from 'express';
import { GateController } from '../controllers/gate.controller';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';

const router = Router();
const gateController = new GateController();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(rbacMiddleware(['RESIDENTE', 'ADMIN_CONDOMINIO', 'SUPERADMIN']));

router.post('/', gateController.createDeliveryAlert);
router.get('/my', gateController.listMyDeliveryAlerts);

export default router;
