import { Request, Response, NextFunction } from 'express';
import { LoginUseCase } from '../../application/use-cases/auth/LoginUseCase';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/RefreshTokenUseCase';
import { LoginSchema } from '../../application/dtos/auth.dto';
import { PrismaUserRepository } from '../../infrastructure/database/prisma/UserRepository';

export class AuthController {
  private loginUseCase: LoginUseCase;
  private refreshTokenUseCase: RefreshTokenUseCase;

  constructor() {
    const userRepository = new PrismaUserRepository();
    this.loginUseCase = new LoginUseCase(userRepository);
    this.refreshTokenUseCase = new RefreshTokenUseCase(userRepository);
  }

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto = LoginSchema.parse(req.body);
      const result = await this.loginUseCase.execute(dto);

      // Set refresh token in HTTP-only cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.status(200).json({
        accessToken: result.accessToken,
        user: result.user
      });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) {
        res.status(401).json({ error: 'Unauthorized', message: 'No refresh token provided' });
        return;
      }

      const result = await this.refreshTokenUseCase.execute(refreshToken);

      res.status(200).json({
        accessToken: result.accessToken
      });
    } catch (error) {
      next(error);
    }
  };
}
