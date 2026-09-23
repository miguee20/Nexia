import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { RegisterVehicleUseCase, ListVehiclesByPropertyUseCase } from '../../application/use-cases/vehicles';
import { CreateVehicleSchema } from '../../application/dtos/vehicle.dto';
import { PrismaVehicleRepository } from '../../infrastructure/database/prisma/repositories/PrismaVehicleRepository';
import { PrismaPropertyRepository } from '../../infrastructure/database/prisma/repositories/PrismaPropertyRepository';
import { PrismaTenantRepository } from '../../infrastructure/database/prisma/repositories/PrismaTenantRepository';
import { PrismaMarbeteRepository } from '../../infrastructure/database/prisma/repositories/PrismaMarbeteRepository';
import { IssueMarbeteUseCase } from '../../application/use-cases/marbetes/issue-marbete.use-case';

export class VehicleController {
  private registerUseCase: RegisterVehicleUseCase;
  private listUseCase: ListVehiclesByPropertyUseCase;

  constructor() {
    const vehicleRepo = new PrismaVehicleRepository();
    const propertyRepo = new PrismaPropertyRepository();
    const tenantRepo = new PrismaTenantRepository();
    const marbeteRepo = new PrismaMarbeteRepository();
    
    const issueMarbeteUseCase = new IssueMarbeteUseCase(marbeteRepo, vehicleRepo, tenantRepo);
    
    this.registerUseCase = new RegisterVehicleUseCase(vehicleRepo, propertyRepo, tenantRepo, issueMarbeteUseCase);
    this.listUseCase = new ListVehiclesByPropertyUseCase(vehicleRepo, propertyRepo);
  }

  register = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const propiedadId = req.params.id as string;
      const condominioId = req.user!.condominioId;
      const dto = CreateVehicleSchema.parse(req.body);
      const vehicle = await this.registerUseCase.execute(propiedadId, condominioId, dto);
      res.status(201).json(vehicle);
    } catch (error) {
      next(error);
    }
  };

  listByProperty = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const propiedadId = req.params.id as string;
      const condominioId = req.user!.condominioId;
      const vehicles = await this.listUseCase.execute(propiedadId, condominioId);
      res.status(200).json(vehicles);
    } catch (error) {
      next(error);
    }
  };
}
