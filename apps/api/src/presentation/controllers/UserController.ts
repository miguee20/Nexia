import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UserController {
  listResidents = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const condominioId = req.user!.condominioId;
      const residents = await prisma.usuario.findMany({
        where: { condominio_id: condominioId, rol: 'RESIDENTE' },
        select: { id: true, nombre_completo: true, email: true }
      });
      res.status(200).json(residents);
    } catch (error) {
      next(error);
    }
  };
}
