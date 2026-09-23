import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { ForbiddenError } from '../../domain/errors';

export const rbacMiddleware = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('Acceso denegado: Usuario no autenticado');
      }

      if (!allowedRoles.includes(req.user.rol)) {
        throw new ForbiddenError('Acceso denegado: Permisos insuficientes');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
