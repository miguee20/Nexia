import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { IssueMarbeteUseCase, CancelMarbeteUseCase, SearchMarbeteByCodeUseCase, ListMarbetesByPropertyUseCase } from '../../application/use-cases/marbetes';
import { IssueMarbeteSchema } from '../../application/dtos/marbete.dto';
import { PrismaMarbeteRepository } from '../../infrastructure/database/prisma/repositories/PrismaMarbeteRepository';
import { PrismaVehicleRepository } from '../../infrastructure/database/prisma/repositories/PrismaVehicleRepository';
import { PrismaTenantRepository } from '../../infrastructure/database/prisma/repositories/PrismaTenantRepository';
import { PrismaPropertyRepository } from '../../infrastructure/database/prisma/repositories/PrismaPropertyRepository';

export class MarbeteController {
  private issueUseCase: IssueMarbeteUseCase;
  private cancelUseCase: CancelMarbeteUseCase;
  private searchUseCase: SearchMarbeteByCodeUseCase;
  private listByPropertyUseCase: ListMarbetesByPropertyUseCase;

  constructor() {
    const marbeteRepo = new PrismaMarbeteRepository();
    const vehicleRepo = new PrismaVehicleRepository();
    const tenantRepo = new PrismaTenantRepository();
    const propertyRepo = new PrismaPropertyRepository();

    this.issueUseCase = new IssueMarbeteUseCase(marbeteRepo, vehicleRepo, tenantRepo);
    this.cancelUseCase = new CancelMarbeteUseCase(marbeteRepo);
    this.searchUseCase = new SearchMarbeteByCodeUseCase(marbeteRepo);
    this.listByPropertyUseCase = new ListMarbetesByPropertyUseCase(marbeteRepo, propertyRepo);
  }

  issue = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vehiculoId = req.params.id as string;
      const condominioId = req.user!.condominioId;
      const dto = IssueMarbeteSchema.parse({ vehiculo_id: vehiculoId, ...req.body });
      const marbete = await this.issueUseCase.execute(condominioId, dto);
      res.status(201).json(marbete);
    } catch (error) {
      next(error);
    }
  };

  listByProperty = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const propiedadId = req.params.id as string;
      const condominioId = req.user!.condominioId;
      const marbetes = await this.listByPropertyUseCase.execute(propiedadId, condominioId);
      res.status(200).json(marbetes);
    } catch (error) {
      next(error);
    }
  };

  cancel = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const condominioId = req.user!.condominioId;
      const marbete = await this.cancelUseCase.execute(id, condominioId);
      res.status(200).json(marbete);
    } catch (error) {
      next(error);
    }
  };

  searchByCode = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const code = req.params.code as string;
      const condominioId = req.user!.condominioId;
      const result = await this.searchUseCase.execute(code, condominioId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
