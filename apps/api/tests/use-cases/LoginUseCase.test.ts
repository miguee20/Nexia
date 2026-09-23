import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginUseCase } from '../../src/application/use-cases/auth/LoginUseCase';
import { IUserRepository } from '../../src/domain/interfaces/IUserRepository';
import { HashService } from '../../src/infrastructure/auth/hash.service';
import { JwtService } from '../../src/infrastructure/auth/jwt.service';
import { UnauthorizedError, ForbiddenError } from '../../src/domain/errors';

// Mock dependencies
vi.mock('../../src/infrastructure/auth/hash.service');
vi.mock('../../src/infrastructure/auth/jwt.service');

describe('LoginUseCase', () => {
  let loginUseCase: LoginUseCase;
  let mockUserRepository: vi.Mocked<IUserRepository>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRepository = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
    };
    loginUseCase = new LoginUseCase(mockUserRepository);
  });

  it('debe iniciar sesión exitosamente con credenciales válidas', async () => {
    const mockUser = {
      id: 'user-1',
      condominio_id: 'condo-1',
      email: 'test@test.com',
      password_hash: 'hashed_password',
      nombre_completo: 'Test User',
      rol: 'RESIDENTE' as const,
      activo: true,
      condominio: { activo: true },
    };

    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    vi.mocked(HashService.compare).mockResolvedValue(true);
    vi.mocked(JwtService.generateAccessToken).mockReturnValue('access_token');
    vi.mocked(JwtService.generateRefreshToken).mockReturnValue('refresh_token');

    const result = await loginUseCase.execute({ email: 'test@test.com', password: 'password123' });

    expect(result.accessToken).toBe('access_token');
    expect(result.refreshToken).toBe('refresh_token');
    expect(result.user.id).toBe('user-1');
  });

  it('debe fallar si el usuario no existe', async () => {
    mockUserRepository.findByEmail.mockResolvedValue(null);

    await expect(loginUseCase.execute({ email: 'test@test.com', password: 'password123' }))
      .rejects
      .toThrow(UnauthorizedError);
  });

  it('debe fallar si el usuario está inactivo', async () => {
    const mockUser = {
      id: 'user-1',
      condominio_id: 'condo-1',
      email: 'test@test.com',
      password_hash: 'hashed_password',
      nombre_completo: 'Test User',
      rol: 'RESIDENTE' as const,
      activo: false,
    };

    mockUserRepository.findByEmail.mockResolvedValue(mockUser);

    await expect(loginUseCase.execute({ email: 'test@test.com', password: 'password123' }))
      .rejects
      .toThrow(ForbiddenError);
  });

  it('debe fallar si la contraseña es incorrecta', async () => {
    const mockUser = {
      id: 'user-1',
      condominio_id: 'condo-1',
      email: 'test@test.com',
      password_hash: 'hashed_password',
      nombre_completo: 'Test User',
      rol: 'RESIDENTE' as const,
      activo: true,
      condominio: { activo: true },
    };

    mockUserRepository.findByEmail.mockResolvedValue(mockUser);
    vi.mocked(HashService.compare).mockResolvedValue(false);

    await expect(loginUseCase.execute({ email: 'test@test.com', password: 'wrongpassword' }))
      .rejects
      .toThrow(UnauthorizedError);
  });
});
