import * as crypto from 'crypto';
import { IQRCryptoService, PayloadQR } from '../../domain/interfaces/qr-crypto.service.interface';

export class QRCryptoService implements IQRCryptoService {
  private readonly secret: string;

  constructor() {
    this.secret = process.env.QR_HMAC_SECRET || 'default_secret_key_for_dev_only';
  }

  generateToken(payload: PayloadQR): string {
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = this.sign(payloadBase64);
    return `${payloadBase64}.${signature}`;
  }

  verifyToken(token: string): PayloadQR | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 2) return null;

      const payloadBase64 = parts[0];
      const signature = parts[1];
      if (!payloadBase64 || !signature) return null;

      const expectedSignature = this.sign(payloadBase64);

      if (crypto.timingSafeEqual(Buffer.from(signature, 'base64url'), Buffer.from(expectedSignature, 'base64url'))) {
        const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf8');
        return JSON.parse(payloadJson) as PayloadQR;
      }
      
      return null;
    } catch (e) {
      return null;
    }
  }

  private sign(data: string): string {
    const hmac = crypto.createHmac('sha256', this.secret);
    hmac.update(data);
    return hmac.digest('base64url');
  }
}
