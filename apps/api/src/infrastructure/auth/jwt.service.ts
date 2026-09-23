import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  condominioId: string;
  rol: string;
}

export class JwtService {
  private static getAccessSecret(): string {
    return process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_do_not_use_in_prod';
  }

  private static getRefreshSecret(): string {
    return process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_do_not_use_in_prod';
  }

  static generateAccessToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.getAccessSecret(), { expiresIn: '15m' });
  }

  static generateRefreshToken(payload: TokenPayload): string {
    return jwt.sign(payload, this.getRefreshSecret(), { expiresIn: '7d' });
  }

  static verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, this.getAccessSecret()) as TokenPayload;
  }

  static verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, this.getRefreshSecret()) as TokenPayload;
  }
}
