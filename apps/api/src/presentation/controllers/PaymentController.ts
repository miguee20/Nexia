import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import {
  SubmitPaymentUseCase,
  ApprovePaymentUseCase,
  RejectPaymentUseCase,
  GetAccountStatementUseCase,
  GenerateReceiptPdfUseCase,
  GetMonthlyReportUseCase,
} from '../../application/use-cases/finances';
import {
  SubmitPaymentSchema,
  RejectPaymentSchema,
  MonthlyReportQuerySchema,
} from '../../application/dtos/payment.dto';
import { prisma } from '../../infrastructure/database/prisma/client';
import { PrismaCuotaRepository } from '../../infrastructure/database/prisma/cuota.repository';
import { PrismaPagoRepository } from '../../infrastructure/database/prisma/pago.repository';
import { PrismaPropertyRepository } from '../../infrastructure/database/prisma/repositories/PrismaPropertyRepository';
import { ReceiptGeneratorService } from '../../infrastructure/pdf/receipt-generator.service';

export class PaymentController {
  private submitUseCase: SubmitPaymentUseCase;
  private approveUseCase: ApprovePaymentUseCase;
  private rejectUseCase: RejectPaymentUseCase;
  private statementUseCase: GetAccountStatementUseCase;
  private receiptUseCase: GenerateReceiptPdfUseCase;
  private monthlyReportUseCase: GetMonthlyReportUseCase;
  private pagoRepo: PrismaPagoRepository;

  constructor() {
    const cuotaRepo = new PrismaCuotaRepository(prisma);
    this.pagoRepo = new PrismaPagoRepository(prisma);
    const propertyRepo = new PrismaPropertyRepository();

    this.submitUseCase = new SubmitPaymentUseCase(this.pagoRepo, cuotaRepo, propertyRepo);
    this.approveUseCase = new ApprovePaymentUseCase(this.pagoRepo, cuotaRepo);
    this.rejectUseCase = new RejectPaymentUseCase(this.pagoRepo);
    this.statementUseCase = new GetAccountStatementUseCase(this.pagoRepo, propertyRepo);
    this.receiptUseCase = new GenerateReceiptPdfUseCase(this.pagoRepo, new ReceiptGeneratorService());
    this.monthlyReportUseCase = new GetMonthlyReportUseCase(this.pagoRepo);
  }

  submit = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = SubmitPaymentSchema.parse(req.body);
      const { condominioId, userId, rol } = req.user!;
      const pago = await this.submitUseCase.execute(condominioId, { userId, rol }, dto);
      res.status(201).json(pago);
    } catch (error) {
      next(error);
    }
  };

  listPending = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pagos = await this.pagoRepo.listPending(req.user!.condominioId);
      res.status(200).json(pagos);
    } catch (error) {
      next(error);
    }
  };

  approve = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const pago = await this.approveUseCase.execute(
        req.user!.condominioId,
        req.user!.userId,
        req.params.id as string
      );
      res.status(200).json(pago);
    } catch (error) {
      next(error);
    }
  };

  reject = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = RejectPaymentSchema.parse(req.body);
      const pago = await this.rejectUseCase.execute(
        req.user!.condominioId,
        req.user!.userId,
        req.params.id as string,
        dto
      );
      res.status(200).json(pago);
    } catch (error) {
      next(error);
    }
  };

  accountStatement = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { condominioId, userId, rol } = req.user!;
      const propiedadId = req.params.propiedadId as string | undefined;
      const result = await this.statementUseCase.execute(condominioId, { userId, rol }, propiedadId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  receipt = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { condominioId, userId, rol } = req.user!;
      const { buffer, folio } = await this.receiptUseCase.execute(
        condominioId,
        { userId, rol },
        req.params.id as string
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${folio}.pdf"`);
      res.setHeader('Content-Length', buffer.length);
      res.status(200).send(buffer);
    } catch (error) {
      next(error);
    }
  };

  monthlyReport = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = MonthlyReportQuerySchema.parse(req.query);
      const report = await this.monthlyReportUseCase.execute(req.user!.condominioId, query);
      res.status(200).json(report);
    } catch (error) {
      next(error);
    }
  };
}
