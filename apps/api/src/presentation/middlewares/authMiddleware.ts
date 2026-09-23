import { Request, Response, NextFunction } from 'express';
import { JwtService, TokenPayload } from '../../infrastructure/auth/jwt.service';
import { UnauthorizedError } from '../../domain/errors';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

export const authMiddleware = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token no proporcionado');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('Formato de token inválido');
    }

    const payload = JwtService.verifyAccessToken(token);
    
    req.user = payload;
    next();
  } catch (error) {
    next(new UnauthorizedError('Token inválido o expirado'));
  }
};
