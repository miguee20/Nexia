import { Request, Response, NextFunction } from 'express';
import { DomainError } from '../../domain/errors';
import { z } from 'zod';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`[Error] ${err.name}: ${err.message}`);

  if (err instanceof z.ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      details: err.issues
    });
    return;
  }

  if (err instanceof DomainError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message
    });
    return;
  }

  res.status(500).json({
    error: 'InternalServerError',
    message: 'Ocurrió un error interno en el servidor'
  });
};
