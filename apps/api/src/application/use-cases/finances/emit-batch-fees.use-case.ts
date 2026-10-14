import { ICuotaRepository } from '../../../domain/interfaces/cuota.repository.interface';
import { IPropertyRepository } from '../../../domain/interfaces/property.repository.interface';
import { ITenantRepository } from '../../../domain/interfaces/tenant.repository.interface';
import { NotFoundError } from '../../../domain/errors';
import { DuplicateFeePeriodError, TenantConfigMissingError } from '../../../domain/errors/fee.errors';
import { parsePositiveMoney, Decimal } from '../../../domain/value-objects/money';
import { EmitBatchFeesDTO } from '../../dtos/fee.dto';

export class EmitBatchFeesUseCase {
  constructor(
    private readonly cuotaRepository: ICuotaRepository,
    private readonly propertyRepository: IPropertyRepository,
    private readonly tenantRepository: ITenantRepository
  ) {}

  async execute(
    condominio_id: string,
    dto: EmitBatchFeesDTO,
    now: Date = new Date()
  ): Promise<{ created: number; skipped: number; mes: number; anio: number }> {
    const tenant = await this.tenantRepository.findById(condominio_id);
    if (!tenant) throw new NotFoundError('Condominio no encontrado');
    const config = tenant.configuracion || {};

    const rawAmount = dto.monto_override ?? config.monto_cuota_base;
    if (rawAmount === undefined || rawAmount === null) {
      throw new TenantConfigMissingError('monto_cuota_base no configurado');
    }
    let monto: Decimal;
    try {
      monto = parsePositiveMoney(rawAmount);
    } catch {
      throw new TenantConfigMissingError('monto_cuota_base debe ser mayor a cero');
    }

    const mes = dto.mes ?? now.getUTCMonth() + 1;
    const anio = dto.anio ?? now.getUTCFullYear();

    let fechaVencimiento: Date;
    if (dto.fecha_vencimiento) {
      fechaVencimiento = new Date(dto.fecha_vencimiento);
    } else {
      const diaCorte = config.dia_corte_cuota;
      if (!diaCorte) throw new TenantConfigMissingError('dia_corte_cuota no configurado');
      fechaVencimiento = new Date(Date.UTC(anio, mes - 1, Number(diaCorte)));
    }

    const { data: properties } = await this.propertyRepository.findAllByCondominio(condominio_id, {
      estado: 'OCUPADA',
    });
    if (properties.length === 0) {
      return { created: 0, skipped: 0, mes, anio };
    }

    // Period window [first day of month, first day of next month) in UTC
    const periodoInicio = new Date(Date.UTC(anio, mes - 1, 1));
    const periodoFin = new Date(Date.UTC(anio, mes, 1));

    const alreadyIssued = new Set(
      await this.cuotaRepository.findPropertyIdsWithConcept(condominio_id, dto.concepto, periodoInicio, periodoFin)
    );
    const pending = properties.filter((p) => !alreadyIssued.has(p.id));

    if (pending.length === 0) {
      throw new DuplicateFeePeriodError();
    }

    const result = await this.cuotaRepository.createBatch(
      pending.map((p) => ({
        condominio_id,
        propiedad_id: p.id,
        concepto: dto.concepto,
        monto_original: monto,
        monto_recargo: new Decimal(0),
        fecha_emision: periodoInicio,
        fecha_vencimiento: fechaVencimiento,
        estado: 'PENDIENTE',
      }))
    );

    return { created: result.count, skipped: properties.length - pending.length, mes, anio };
  }
}
