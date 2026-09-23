import { IUserRepository } from '../../../domain/interfaces/IUserRepository';
import { JwtService } from '../../../infrastructure/auth/jwt.service';
import { UnauthorizedError, ForbiddenError } from '../../../domain/errors';
import { RefreshTokenResponseDTO } from '../../dtos/auth.dto';

export class RefreshTokenUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(refreshToken: string): Promise<RefreshTokenResponseDTO> {
    try {
      const payload = JwtService.verifyRefreshToken(refreshToken);

      const user = await this.userRepository.findById(payload.userId);
      if (!user) {
        throw new UnauthorizedError('Usuario no encontrado');
      }

      if (!user.activo) {
        throw new ForbiddenError('Usuario inactivo');
      }

      if (user.condominio && !user.condominio.activo) {
        throw new ForbiddenError('Condominio inactivo');
      }

      const newAccessToken = JwtService.generateAccessToken({
        userId: user.id,
        condominioId: user.condominio_id,
        rol: user.rol,
      });

      return {
        accessToken: newAccessToken
      };
    } catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new UnauthorizedError('Token de refresco inválido o expirado');
    }
  }
}
