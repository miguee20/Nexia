import { Request, Response, NextFunction } from 'express';
import { CreateTenantUseCase } from '../../application/use-cases/tenants/CreateTenantUseCase';
import { ListTenantsUseCase } from '../../application/use-cases/tenants/ListTenantsUseCase';
import { UpdateTenantConfigUseCase } from '../../application/use-cases/tenants/UpdateTenantConfigUseCase';
import { CreateTenantSchema, UpdateTenantConfigSchema } from '../../application/dtos/tenant.dto';
import { PrismaTenantRepository } from '../../infrastructure/database/prisma/repositories/PrismaTenantRepository';

export class TenantController {
  private createUseCase: CreateTenantUseCase;
  private listUseCase: ListTenantsUseCase;
  private updateConfigUseCase: UpdateTenantConfigUseCase;

  constructor() {
    const repo = new PrismaTenantRepository();
    this.createUseCase = new CreateTenantUseCase(repo);
    this.listUseCase = new ListTenantsUseCase(repo);
    this.updateConfigUseCase = new UpdateTenantConfigUseCase(repo);
  }

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreateTenantSchema.parse(req.body);
      const tenant = await this.createUseCase.execute(dto);
      res.status(201).json(tenant);
    } catch (error) {
      next(error);
    }
  };

  list = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenants = await this.listUseCase.execute();
      res.status(200).json(tenants);
    } catch (error) {
      next(error);
    }
  };

  updateConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const dto = UpdateTenantConfigSchema.parse(req.body);
      const tenant = await this.updateConfigUseCase.execute(id, dto);
      res.status(200).json(tenant);
    } catch (error) {
      next(error);
    }
  };
}
