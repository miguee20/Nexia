import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { ForbiddenError } from '../../domain/errors';

export const tenantMiddleware = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ForbiddenError('Acceso denegado: Usuario no autenticado');
    }

    // Usually, the requested tenant id comes from a header like x-tenant-id or from the route params
    // For Nexia, as per PRD: "Ningún endpoint devuelve datos fuera del tenant del usuario autenticado"
    // So we just ensure the user has a condominioId and we use it as context.
    
    const requestedTenantId = req.headers['x-tenant-id'] || req.params.condominioId || req.body.condominio_id;

    // SuperAdmin might not be bound to a single tenant in some contexts, but let's stick to the rule for now:
    if (req.user.rol !== 'SUPERADMIN' && requestedTenantId && requestedTenantId !== req.user.condominioId) {
       throw new ForbiddenError('Acceso denegado: Violación de aislamiento de tenant');
    }

    next();
  } catch (error) {
    next(error);
  }
};
