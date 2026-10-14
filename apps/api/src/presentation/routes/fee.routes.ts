import { Router } from 'express';
import { FeeController } from '../controllers/FeeController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';

const router = Router();
const feeController = new FeeController();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(rbacMiddleware(['ADMIN_CONDOMINIO']));

router.post('/individual', feeController.emitIndividual);
router.post('/batch', feeController.emitBatch);
router.post('/apply-late-fees', feeController.applyLateFees);
router.get('/traffic-light', feeController.trafficLight);
router.get('/', feeController.list);

export default router;
