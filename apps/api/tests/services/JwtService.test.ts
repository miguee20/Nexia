import { describe, it, expect } from 'vitest';
import { JwtService } from '../../src/infrastructure/auth/jwt.service';

describe('JwtService', () => {
  const mockPayload = {
    userId: 'user-123',
    condominioId: 'condo-123',
    rol: 'RESIDENTE'
  };

  it('debe generar y verificar un access token correctamente', () => {
    const token = JwtService.generateAccessToken(mockPayload);
    expect(token).toBeDefined();

    const decoded = JwtService.verifyAccessToken(token);
    expect(decoded.userId).toBe(mockPayload.userId);
    expect(decoded.condominioId).toBe(mockPayload.condominioId);
    expect(decoded.rol).toBe(mockPayload.rol);
  });

  it('debe generar y verificar un refresh token correctamente', () => {
    const token = JwtService.generateRefreshToken(mockPayload);
    expect(token).toBeDefined();

    const decoded = JwtService.verifyRefreshToken(token);
    expect(decoded.userId).toBe(mockPayload.userId);
    expect(decoded.condominioId).toBe(mockPayload.condominioId);
    expect(decoded.rol).toBe(mockPayload.rol);
  });

  it('debe fallar al verificar un access token falso', () => {
    expect(() => JwtService.verifyAccessToken('invalid.token.here'))
      .toThrow();
  });
});
