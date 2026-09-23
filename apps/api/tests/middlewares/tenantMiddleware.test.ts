import { describe, it, expect, vi } from 'vitest';
import { tenantMiddleware } from '../../src/presentation/middlewares/tenantMiddleware';
import { ForbiddenError } from '../../src/domain/errors';
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../src/presentation/middlewares/authMiddleware';

describe('tenantMiddleware', () => {
  it('debe permitir acceso si el condominioId coincide con el token', () => {
    const req = {
      user: {
        userId: 'user-1',
        condominioId: 'condo-1',
        rol: 'RESIDENTE',
      },
      headers: {},
      params: { condominioId: 'condo-1' },
      body: {}
    } as unknown as AuthenticatedRequest;

    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    tenantMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(); // Called without error
  });

  it('debe bloquear acceso si el condominioId no coincide con el token (aislamiento cruzado)', () => {
    const req = {
      user: {
        userId: 'user-1',
        condominioId: 'condo-1', // user belongs to condo-1
        rol: 'RESIDENTE',
      },
      headers: {
        'x-tenant-id': 'condo-2' // trying to access condo-2
      },
      params: {},
      body: {}
    } as unknown as AuthenticatedRequest;

    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    tenantMiddleware(req, res, next);
    
    // next should be called with an error
    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenError));
  });

  it('debe permitir acceso cruzado si el rol es SUPERADMIN', () => {
    const req = {
      user: {
        userId: 'super-admin',
        condominioId: 'condo-1',
        rol: 'SUPERADMIN',
      },
      headers: {
        'x-tenant-id': 'condo-2'
      },
      params: {},
      body: {}
    } as unknown as AuthenticatedRequest;

    const res = {} as Response;
    const next = vi.fn() as NextFunction;

    tenantMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(); // Called without error
  });
});
