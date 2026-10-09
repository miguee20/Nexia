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
router.get('/vehicles/search', rbacMiddleware(['GUARDIA', 'ADMIN_CONDOMINIO', 'SUPERADMIN']), gateController.searchVehicle);
router.post('/entries', rbacMiddleware(['GUARDIA', 'ADMIN_CONDOMINIO', 'SUPERADMIN']), gateController.registerEntry);
router.post('/entries/manual', rbacMiddleware(['GUARDIA', 'ADMIN_CONDOMINIO', 'SUPERADMIN']), gateController.manualEntry);
router.post('/exits', rbacMiddleware(['GUARDIA', 'ADMIN_CONDOMINIO', 'SUPERADMIN']), gateController.registerExit);
router.post('/deliveries/:id/entry', rbacMiddleware(['GUARDIA', 'ADMIN_CONDOMINIO', 'SUPERADMIN']), gateController.registerDeliveryEntry);
router.get('/properties/search', rbacMiddleware(['GUARDIA', 'ADMIN_CONDOMINIO', 'SUPERADMIN']), gateController.searchProperties);
router.get('/properties/:id/contact', rbacMiddleware(['GUARDIA', 'ADMIN_CONDOMINIO', 'SUPERADMIN']), gateController.getPropertyContact);
router.post('/call-verifications', rbacMiddleware(['GUARDIA', 'ADMIN_CONDOMINIO', 'SUPERADMIN']), gateController.registerCallVerification);

// Rutas de administración
router.get('/logs', rbacMiddleware(['ADMIN_CONDOMINIO', 'SUPERADMIN']), gateController.getLogs);
router.get('/logs/export/csv', rbacMiddleware(['ADMIN_CONDOMINIO', 'SUPERADMIN']), gateController.exportLogsCsv);

export default router;
