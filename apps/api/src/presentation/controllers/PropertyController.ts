import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { CreatePropertyUseCase, ListPropertiesUseCase, GetPropertyByIdUseCase, UpdatePropertyUseCase, AssignResidentUseCase } from '../../application/use-cases/properties';
import { CreatePropertySchema, UpdatePropertySchema, AssignResidentSchema } from '../../application/dtos/property.dto';
import { PrismaPropertyRepository } from '../../infrastructure/database/prisma/repositories/PrismaPropertyRepository';

export class PropertyController {
  private createUseCase: CreatePropertyUseCase;
  private listUseCase: ListPropertiesUseCase;
  private getByIdUseCase: GetPropertyByIdUseCase;
  private updateUseCase: UpdatePropertyUseCase;
  private assignResidentUseCase: AssignResidentUseCase;

  constructor() {
    const repo = new PrismaPropertyRepository();
    this.createUseCase = new CreatePropertyUseCase(repo);
    this.listUseCase = new ListPropertiesUseCase(repo);
    this.getByIdUseCase = new GetPropertyByIdUseCase(repo);
    this.updateUseCase = new UpdatePropertyUseCase(repo);
    this.assignResidentUseCase = new AssignResidentUseCase(repo);
  }

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = CreatePropertySchema.parse(req.body);
      const condominioId = req.user!.condominioId;
      const property = await this.createUseCase.execute(condominioId, dto);
      res.status(201).json(property);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const condominioId = req.user!.condominioId;
      const { tipo, estado, limit, offset } = req.query;
      const filters: any = {};
      if (tipo !== undefined) filters.tipo = tipo as string;
      if (estado !== undefined) filters.estado = estado as string;
      if (limit !== undefined) filters.limit = Number(limit);
      if (offset !== undefined) filters.offset = Number(offset);
      
      const result = await this.listUseCase.execute(condominioId, filters);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const condominioId = req.user!.condominioId;
      const property = await this.getByIdUseCase.execute(id, condominioId);
      res.status(200).json(property);
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const condominioId = req.user!.condominioId;
      const dto = UpdatePropertySchema.parse(req.body);
      const property = await this.updateUseCase.execute(id, condominioId, dto);
      res.status(200).json(property);
    } catch (error) {
      next(error);
    }
  };

  assignResident = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.params.id as string;
      const condominioId = req.user!.condominioId;
      const dto = AssignResidentSchema.parse(req.body);
      const property = await this.assignResidentUseCase.execute(id, condominioId, dto);
      res.status(200).json(property);
    } catch (error) {
      next(error);
    }
  };
}
