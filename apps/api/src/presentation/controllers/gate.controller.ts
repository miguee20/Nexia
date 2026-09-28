import { Response, NextFunction } from 'express';
import { GenerateVisitPassUseCase } from '../../application/use-cases/gate/generate-visit-pass.use-case';
import { ValidateQRUseCase } from '../../application/use-cases/gate/validate-qr.use-case';
import { CreateDeliveryAlertUseCase } from '../../application/use-cases/gate/create-delivery-alert.use-case';
import { ListActiveDeliveryAlertsUseCase } from '../../application/use-cases/gate/list-active-delivery-alerts.use-case';
import { ListMyActiveDeliveryAlertsUseCase } from '../../application/use-cases/gate/list-my-active-delivery-alerts.use-case';
import { ListMyVisitPassesUseCase } from '../../application/use-cases/gate/list-my-visit-passes.use-case';
import { RegisterEntryUseCase } from '../../application/use-cases/gate/register-entry.use-case';
import { RegisterExitUseCase } from '../../application/use-cases/gate/register-exit.use-case';
import { ManualEntryUseCase } from '../../application/use-cases/gate/manual-entry.use-case';
import { RegisterDeliveryUseCase } from '../../application/use-cases/gate/register-delivery.use-case';
import { GetPropertyContactUseCase } from '../../application/use-cases/gate/get-property-contact.use-case';
import { RegisterCallVerificationUseCase } from '../../application/use-cases/gate/register-call-verification.use-case';
import { SearchAuthorizedVehicleUseCase } from '../../application/use-cases/gate/search-authorized-vehicle.use-case';
import { GetGateLogsUseCase } from '../../application/use-cases/gate/get-gate-logs.use-case';
import { ExportGateLogsCsvUseCase } from '../../application/use-cases/gate/export-gate-logs-csv.use-case';
import { PrismaVisitPassRepository } from '../../infrastructure/database/prisma/visit-pass.repository';
import { PrismaDeliveryAlertRepository } from '../../infrastructure/database/prisma/delivery-alert.repository';
import { PrismaCuotaRepository } from '../../infrastructure/database/prisma/cuota.repository';
import { PrismaGateLogRepository } from '../../infrastructure/database/prisma/gate-log.repository';
import { PrismaPropertyContactRepository } from '../../infrastructure/database/prisma/property-contact.repository';
import { PrismaVehicleVerificationRepository } from '../../infrastructure/database/prisma/vehicle-verification.repository';
import { PrismaTenantRepository } from '../../infrastructure/database/prisma/repositories/PrismaTenantRepository';
import { QRCryptoService } from '../../infrastructure/gate/qr-crypto.service';
import { GenerateVisitPassSchema, CreateDeliveryAlertSchema, ValidateQRSchema } from '../../application/dtos/gate.dto';
import { RegisterEntrySchema, RegisterExitSchema, ManualEntrySchema, RegisterDeliveryEntrySchema, RegisterCallVerificationSchema, GateLogFilterSchema } from '../../application/dtos/gate-log.dto';
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
  
  private registerEntryUseCase: RegisterEntryUseCase;
  private registerExitUseCase: RegisterExitUseCase;
  private manualEntryUseCase: ManualEntryUseCase;
  private registerDeliveryUseCase: RegisterDeliveryUseCase;
  private getPropertyContactUseCase: GetPropertyContactUseCase;
  private registerCallVerificationUseCase: RegisterCallVerificationUseCase;
  private searchAuthorizedVehicleUseCase: SearchAuthorizedVehicleUseCase;
  private getGateLogsUseCase: GetGateLogsUseCase;
  private exportGateLogsCsvUseCase: ExportGateLogsCsvUseCase;

  constructor() {
    const visitPassRepo = new PrismaVisitPassRepository(prisma);
    const deliveryAlertRepo = new PrismaDeliveryAlertRepository(prisma);
    const cuotaRepo = new PrismaCuotaRepository(prisma);
    const tenantRepo = new PrismaTenantRepository();
    const gateLogRepo = new PrismaGateLogRepository(prisma);
    const propertyContactRepo = new PrismaPropertyContactRepository(prisma);
    const vehicleVerificationRepo = new PrismaVehicleVerificationRepository(prisma);
    const qrCryptoService = new QRCryptoService();

    this.generateVisitPassUseCase = new GenerateVisitPassUseCase(visitPassRepo, tenantRepo, qrCryptoService);
    this.validateQRUseCase = new ValidateQRUseCase(visitPassRepo, tenantRepo, cuotaRepo, qrCryptoService);
    this.createDeliveryAlertUseCase = new CreateDeliveryAlertUseCase(deliveryAlertRepo, tenantRepo);
    this.listActiveDeliveryAlertsUseCase = new ListActiveDeliveryAlertsUseCase(deliveryAlertRepo);
    this.listMyActiveDeliveryAlertsUseCase = new ListMyActiveDeliveryAlertsUseCase(deliveryAlertRepo);
    this.listMyVisitPassesUseCase = new ListMyVisitPassesUseCase(visitPassRepo);
    
    this.registerEntryUseCase = new RegisterEntryUseCase(gateLogRepo, visitPassRepo);
    this.registerExitUseCase = new RegisterExitUseCase(gateLogRepo);
    this.manualEntryUseCase = new ManualEntryUseCase(gateLogRepo);
    this.registerDeliveryUseCase = new RegisterDeliveryUseCase(gateLogRepo, deliveryAlertRepo);
    this.getPropertyContactUseCase = new GetPropertyContactUseCase(propertyContactRepo);
    this.registerCallVerificationUseCase = new RegisterCallVerificationUseCase(gateLogRepo);
    this.searchAuthorizedVehicleUseCase = new SearchAuthorizedVehicleUseCase(vehicleVerificationRepo);
    this.getGateLogsUseCase = new GetGateLogsUseCase(gateLogRepo);
    this.exportGateLogsCsvUseCase = new ExportGateLogsCsvUseCase(gateLogRepo);
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

  registerEntry = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { condominioId, userId } = req.user!;
      const dto = RegisterEntrySchema.parse(req.body);
      const log = await this.registerEntryUseCase.execute(condominioId, userId, dto);
      res.status(201).json(log);
    } catch (error) {
      next(error);
    }
  };

  registerExit = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { condominioId } = req.user!;
      const dto = RegisterExitSchema.parse(req.body);
      const log = await this.registerExitUseCase.execute(condominioId, dto);
      res.json(log);
    } catch (error) {
      next(error);
    }
  };

  manualEntry = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { condominioId, userId } = req.user!;
      const dto = ManualEntrySchema.parse(req.body);
      const log = await this.manualEntryUseCase.execute(condominioId, userId, dto);
      res.status(201).json(log);
    } catch (error) {
      next(error);
    }
  };

  registerDeliveryEntry = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { condominioId, userId } = req.user!;
      const id = req.params.id as string;
      const dto = RegisterDeliveryEntrySchema.parse({ ...req.body, alerta_id: id });
      const log = await this.registerDeliveryUseCase.execute(condominioId, userId, dto);
      res.status(201).json(log);
    } catch (error) {
      next(error);
    }
  };

  getPropertyContact = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { condominioId } = req.user!;
      const id = req.params.id as string;
      const contact = await this.getPropertyContactUseCase.execute(condominioId, id);
      res.json(contact);
    } catch (error) {
      next(error);
    }
  };

  registerCallVerification = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { condominioId, userId } = req.user!;
      const dto = RegisterCallVerificationSchema.parse(req.body);
      const log = await this.registerCallVerificationUseCase.execute(condominioId, userId, dto);
      res.status(201).json(log);
    } catch (error) {
      next(error);
    }
  };

  searchVehicle = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { condominioId } = req.user!;
      const query = req.query.q;
      if (!query || typeof query !== 'string') throw new Error('Se requiere el parámetro q válido');
      const result = await this.searchAuthorizedVehicleUseCase.execute(condominioId, query);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getLogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { condominioId } = req.user!;
      const filters = GateLogFilterSchema.parse(req.query);
      const result = await this.getGateLogsUseCase.execute(condominioId, filters);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  exportLogsCsv = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { condominioId } = req.user!;
      const filters = GateLogFilterSchema.omit({ page: true, limit: true }).parse(req.query);
      const csv = await this.exportGateLogsCsvUseCase.execute(condominioId, filters);
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="bitacora.csv"');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  };
}
