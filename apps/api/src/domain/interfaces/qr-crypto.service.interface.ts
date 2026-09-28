export interface PayloadQR {
  passId: string;
  condominioId: string;
  expiresAt: number;
}

export interface IQRCryptoService {
  generateToken(payload: PayloadQR): string;
  verifyToken(token: string): PayloadQR | null;
}
