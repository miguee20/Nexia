import { Router } from 'express';
import { PaymentController } from '../controllers/PaymentController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { tenantMiddleware } from '../middlewares/tenantMiddleware';
import { rbacMiddleware } from '../middlewares/rbacMiddleware';

const router = Router();
const paymentController = new PaymentController();

const admin = rbacMiddleware(['ADMIN_CONDOMINIO']);
const adminOrResident = rbacMiddleware(['RESIDENTE', 'ADMIN_CONDOMINIO']);

router.use(authMiddleware);
router.use(tenantMiddleware);

router.post('/payments', adminOrResident, paymentController.submit);
router.get('/payments/pending', admin, paymentController.listPending);
router.post('/payments/:id/approve', admin, paymentController.approve);
router.post('/payments/:id/reject', admin, paymentController.reject);
router.get('/payments/:id/receipt', adminOrResident, paymentController.receipt);
// Express 5 syntax for an optional path segment
router.get('/account-statement{/:propiedadId}', adminOrResident, paymentController.accountStatement);
router.get('/reports/monthly', admin, paymentController.monthlyReport);

export default router;
