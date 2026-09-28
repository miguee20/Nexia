import { IVisitPassRepository } from '../../../domain/interfaces/visit-pass.repository.interface';
import { ITenantRepository } from '../../../domain/interfaces/tenant.repository.interface';
import { ICuotaRepository } from '../../../domain/interfaces/cuota.repository.interface';
import { IQRCryptoService } from '../../../domain/interfaces/qr-crypto.service.interface';

export class ValidateQRUseCase {
  constructor(
    private readonly visitPassRepository: IVisitPassRepository,
    private readonly tenantRepository: ITenantRepository,
    private readonly cuotaRepository: ICuotaRepository,
    private readonly cryptoService: IQRCryptoService
  ) {}

  async execute(qrToken: string, condominioId: string) {
    const payload = this.cryptoService.verifyToken(qrToken);
    
    if (!payload || payload.condominioId !== condominioId) {
      return { estado: 'INVALIDO', mensaje: 'Firma criptográfica inválida o token adulterado' };
    }

    const pass = await this.visitPassRepository.findByToken(qrToken, condominioId);
    
    if (!pass) {
      return { estado: 'INVALIDO', mensaje: 'Pase no encontrado' };
    }

    if (pass.estado === 'UTILIZADO') {
      return { estado: 'USADO', mensaje: 'El pase ya fue utilizado' };
    }

    if (pass.estado === 'CANCELADO') {
      return { estado: 'INVALIDO', mensaje: 'El pase fue cancelado' };
    }

    if (new Date() > new Date(pass.fecha_expiracion)) {
      return { estado: 'EXPIRADO', mensaje: 'El pase ha expirado' };
    }

    const tenant = await this.tenantRepository.findById(condominioId);
    const config = tenant?.configuracion || {};

    if (config.bloquear_visitas_morosos) {
      const mesesParaMoroso = config.meses_para_moroso || 2;
      const dateLimit = new Date();
      dateLimit.setMonth(dateLimit.getMonth() - mesesParaMoroso);

      const hasOverdue = await this.cuotaRepository.hasOverdueFees(pass.propiedad_id, condominioId, dateLimit);
      
      if (hasOverdue) {
        return { 
          estado: 'ANFITRION_MOROSO', 
          mensaje: 'Residente con suspensión de privilegios. Contacte a Administración.',
          pass 
        };
      }
    }

    return { estado: 'VALIDO', pass };
  }
}
