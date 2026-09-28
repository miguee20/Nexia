import { Response, NextFunction } from 'express';
import { GenerateVisitPassUseCase } from '../../application/use-cases/gate/generate-visit-pass.use-case';
import { ValidateQRUseCase } from '../../application/use-cases/gate/validate-qr.use-case';
import { CreateDeliveryAlertUseCase } from '../../application/use-cases/gate/create-delivery-alert.use-case';
import { ListActiveDeliveryAlertsUseCase } from '../../application/use-cases/gate/list-active-delivery-alerts.use-case';
import { ListMyActiveDeliveryAlertsUseCase } from '../../application/use-cases/gate/list-my-active-delivery-alerts.use-case';
import { ListMyVisitPassesUseCase } from '../../application/use-cases/gate/list-my-visit-passes.use-case';
import { PrismaVisitPassRepository } from '../../infrastructure/database/prisma/visit-pass.repository';
import { PrismaDeliveryAlertRepository } from '../../infrastructure/database/prisma/delivery-alert.repository';
import { PrismaCuotaRepository } from '../../infrastructure/database/prisma/cuota.repository';
import { PrismaTenantRepository } from '../../infrastructure/database/prisma/repositories/PrismaTenantRepository';
import { QRCryptoService } from '../../infrastructure/gate/qr-crypto.service';
import { GenerateVisitPassSchema, CreateDeliveryAlertSchema, ValidateQRSchema } from '../../application/dtos/gate.dto';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

const prisma = new PrismaClient();

export class GateController {
  private generateVisitPassUseCase: GenerateVisitPassUseCase;
  private validateQRUseCase: ValidateQRUseCase;
  private createDeliveryAlertUseCase: CreateDeliveryAlertUseCase;
  private listActiveDeliveryAlertsUseCase: ListActiveDeliveryAlertsUseCase;
  private listMyActiveDeliveryAlertsUseCase: ListMyActiveDeliveryAlertsUseCase;
  private listMyVisitPassesUseCase: ListMyVisitPassesUseCase;

  constructor() {
    const visitPassRepo = new PrismaVisitPassRepository(prisma);
    const deliveryAlertRepo = new PrismaDeliveryAlertRepository(prisma);
    const cuotaRepo = new PrismaCuotaRepository(prisma);
    const tenantRepo = new PrismaTenantRepository();
    const qrCryptoService = new QRCryptoService();

    this.generateVisitPassUseCase = new GenerateVisitPassUseCase(visitPassRepo, tenantRepo, qrCryptoService);
    this.validateQRUseCase = new ValidateQRUseCase(visitPassRepo, tenantRepo, cuotaRepo, qrCryptoService);
    this.createDeliveryAlertUseCase = new CreateDeliveryAlertUseCase(deliveryAlertRepo, tenantRepo);
    this.listActiveDeliveryAlertsUseCase = new ListActiveDeliveryAlertsUseCase(deliveryAlertRepo);
    this.listMyActiveDeliveryAlertsUseCase = new ListMyActiveDeliveryAlertsUseCase(deliveryAlertRepo);
    this.listMyVisitPassesUseCase = new ListMyVisitPassesUseCase(visitPassRepo);
  }

  private async getUserPropertyId(userId: string): Promise<string> {
    const user = await prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        propiedadesPropietario: true,
        propiedadesInquilino: true,
      }
    });
    
    if (!user) throw new Error('Usuario no encontrado');
    
    const prop = user.propiedadesInquilino[0] || user.propiedadesPropietario[0];
    if (!prop) throw new Error('El residente no tiene propiedades asignadas');
    
    return prop.id;
  }

  generateVisitPass = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = GenerateVisitPassSchema.parse(req.body);
      const { condominioId, userId } = req.user!;
      const propiedadId = req.body.propiedad_id || await this.getUserPropertyId(userId);

      const result = await this.generateVisitPassUseCase.execute(condominioId, userId, propiedadId, dto);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  listMyVisitPasses = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { condominioId, userId } = req.user!;
      const passes = await this.listMyVisitPassesUseCase.execute(userId, condominioId);
      res.json(passes);
    } catch (error) {
      next(error);
    }
  };

  validateQR = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = ValidateQRSchema.parse(req.body);
      const { condominioId } = req.user!;
      const result = await this.validateQRUseCase.execute(dto.qr_token, condominioId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  createDeliveryAlert = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateDeliveryAlertSchema.parse(req.body);
      const { condominioId, userId } = req.user!;
      const propiedadId = req.body.propiedad_id || await this.getUserPropertyId(userId);
      const alert = await this.createDeliveryAlertUseCase.execute(condominioId, userId, propiedadId, dto);
      res.status(201).json(alert);
    } catch (error) {
      next(error);
    }
  };

  listMyDeliveryAlerts = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { condominioId, userId } = req.user!;
      const alerts = await this.listMyActiveDeliveryAlertsUseCase.execute(userId, condominioId);
      res.json(alerts);
    } catch (error) {
      next(error);
    }
  };

  listActiveDeliveryAlerts = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { condominioId } = req.user!;
      const alerts = await this.listActiveDeliveryAlertsUseCase.execute(condominioId);
      res.json(alerts);
    } catch (error) {
      next(error);
    }
  };
}
