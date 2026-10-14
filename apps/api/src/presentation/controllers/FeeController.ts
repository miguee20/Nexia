import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import {
  EmitIndividualFeeUseCase,
  EmitBatchFeesUseCase,
  ApplyLateFeesUseCase,
  GetDelinquencyTrafficLightUseCase,
  ListFeesUseCase,
} from '../../application/use-cases/finances';
import {
  EmitIndividualFeeSchema,
  EmitBatchFeesSchema,
  ApplyLateFeesSchema,
  ListFeesQuerySchema,
} from '../../application/dtos/fee.dto';
import { prisma } from '../../infrastructure/database/prisma/client';
import { PrismaCuotaRepository } from '../../infrastructure/database/prisma/cuota.repository';
import { PrismaPropertyRepository } from '../../infrastructure/database/prisma/repositories/PrismaPropertyRepository';
import { PrismaTenantRepository } from '../../infrastructure/database/prisma/repositories/PrismaTenantRepository';

export class FeeController {
  private emitIndividualUseCase: EmitIndividualFeeUseCase;
  private emitBatchUseCase: EmitBatchFeesUseCase;
  private applyLateFeesUseCase: ApplyLateFeesUseCase;
  private trafficLightUseCase: GetDelinquencyTrafficLightUseCase;
  private listFeesUseCase: ListFeesUseCase;

  constructor() {
    const cuotaRepo = new PrismaCuotaRepository(prisma);
    const propertyRepo = new PrismaPropertyRepository();
    const tenantRepo = new PrismaTenantRepository();

    this.emitIndividualUseCase = new EmitIndividualFeeUseCase(cuotaRepo, propertyRepo);
    this.emitBatchUseCase = new EmitBatchFeesUseCase(cuotaRepo, propertyRepo, tenantRepo);
    this.applyLateFeesUseCase = new ApplyLateFeesUseCase(cuotaRepo, tenantRepo);
    this.trafficLightUseCase = new GetDelinquencyTrafficLightUseCase(cuotaRepo, tenantRepo);
    this.listFeesUseCase = new ListFeesUseCase(cuotaRepo);
  }

  emitIndividual = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = EmitIndividualFeeSchema.parse(req.body);
      const cuota = await this.emitIndividualUseCase.execute(req.user!.condominioId, dto);
      res.status(201).json(cuota);
    } catch (error) {
      next(error);
    }
  };

  emitBatch = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = EmitBatchFeesSchema.parse(req.body);
      const result = await this.emitBatchUseCase.execute(req.user!.condominioId, dto);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  applyLateFees = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = ApplyLateFeesSchema.parse(req.body ?? {});
      const result = await this.applyLateFeesUseCase.execute(req.user!.condominioId, dto);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  trafficLight = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.trafficLightUseCase.execute(req.user!.condominioId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = ListFeesQuerySchema.parse(req.query);
      const result = await this.listFeesUseCase.execute(req.user!.condominioId, query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
