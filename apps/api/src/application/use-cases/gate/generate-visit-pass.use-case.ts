import { IVisitPassRepository } from '../../../domain/interfaces/visit-pass.repository.interface';
import { ITenantRepository } from '../../../domain/interfaces/tenant.repository.interface';
import { IQRCryptoService } from '../../../domain/interfaces/qr-crypto.service.interface';
import { GenerateVisitPassDto } from '../../dtos/gate.dto';
import { randomUUID } from 'crypto';

export class GenerateVisitPassUseCase {
  constructor(
    private readonly visitPassRepository: IVisitPassRepository,
    private readonly tenantRepository: ITenantRepository,
    private readonly cryptoService: IQRCryptoService
  ) {}

  async execute(condominioId: string, residenteId: string, propiedadId: string, data: GenerateVisitPassDto) {
    const tenant = await this.tenantRepository.findById(condominioId);
    if (!tenant) throw new Error('Condominio no encontrado');

    const config = tenant.configuracion || {};
    const vigenciaHoras = config.vigencia_pase_qr_horas || 8;

    let fechaExpiracion = new Date();
    
    // Si mandan fecha de llegada, la expiración es a partir de esa fecha. Si no, a partir de ahora.
    if (data.fecha_llegada) {
      fechaExpiracion = new Date(data.fecha_llegada);
    }
    fechaExpiracion.setHours(fechaExpiracion.getHours() + vigenciaHoras);

    // Generar el token
    const payload = {
      passId: randomUUID(), // Usamos un UUID aleatorio como identificador único dentro del token
      condominioId,
      expiresAt: fechaExpiracion.getTime(),
    };
    const qrToken = this.cryptoService.generateToken(payload);

    const visitPass = await this.visitPassRepository.create({
      condominio_id: condominioId,
      residente_id: residenteId,
      propiedad_id: propiedadId,
      nombre_visitante: data.nombre_visitante,
      motivo: data.motivo,
      qr_token: qrToken,
      fecha_expiracion: fechaExpiracion,
    });

    return {
      visitPass,
      qrToken,
    };
  }
}
