import { ICuotaRepository, CuotaEntity } from '../../../domain/interfaces/cuota.repository.interface';
import { IPropertyRepository } from '../../../domain/interfaces/property.repository.interface';
import { NotFoundError } from '../../../domain/errors';
import { InvalidFeeAmountError } from '../../../domain/errors/fee.errors';
import { parsePositiveMoney, Decimal } from '../../../domain/value-objects/money';
import { EmitIndividualFeeDTO } from '../../dtos/fee.dto';

export class EmitIndividualFeeUseCase {
  constructor(
    private readonly cuotaRepository: ICuotaRepository,
    private readonly propertyRepository: IPropertyRepository
  ) {}

  async execute(condominio_id: string, dto: EmitIndividualFeeDTO): Promise<CuotaEntity> {
    const monto = parsePositiveMoney(dto.monto);

    const fechaVencimiento = new Date(dto.fecha_vencimiento);
    if (Number.isNaN(fechaVencimiento.getTime())) {
      throw new InvalidFeeAmountError('Fecha de vencimiento inválida');
    }

    const property = await this.propertyRepository.findByIdAndCondominio(dto.propiedad_id, condominio_id);
    if (!property) {
      throw new NotFoundError('Propiedad no encontrada');
    }

    return this.cuotaRepository.create({
      condominio_id,
      propiedad_id: property.id,
      concepto: dto.concepto,
      monto_original: monto,
      monto_recargo: new Decimal(0),
      fecha_emision: new Date(),
      fecha_vencimiento: fechaVencimiento,
      estado: 'PENDIENTE',
    });
  }
}
