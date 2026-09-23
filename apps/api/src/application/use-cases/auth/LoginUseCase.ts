import { IUserRepository } from '../../../domain/interfaces/IUserRepository';
import { HashService } from '../../../infrastructure/auth/hash.service';
import { JwtService } from '../../../infrastructure/auth/jwt.service';
import { UnauthorizedError, ForbiddenError } from '../../../domain/errors';
import { LoginDTO, LoginResponseDTO } from '../../dtos/auth.dto';

export class LoginUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(dto: LoginDTO): Promise<LoginResponseDTO> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    if (!user.activo) {
      throw new ForbiddenError('Usuario inactivo');
    }

    if (user.condominio && !user.condominio.activo) {
      throw new ForbiddenError('Condominio inactivo');
    }

    const isPasswordValid = await HashService.compare(dto.password, user.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Credenciales inválidas');
    }

    const payload = {
      userId: user.id,
      condominioId: user.condominio_id,
      rol: user.rol,
    };

    const accessToken = JwtService.generateAccessToken(payload);
    const refreshToken = JwtService.generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nombre_completo: user.nombre_completo,
        rol: user.rol,
        condominio_id: user.condominio_id,
      }
    };
  }
}
