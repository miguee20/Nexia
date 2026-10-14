import { ICuotaRepository, CuotaEntity, FeeFilters } from '../../../domain/interfaces/cuota.repository.interface';
import { ListFeesQueryDTO } from '../../dtos/fee.dto';

export class ListFeesUseCase {
  constructor(private readonly cuotaRepository: ICuotaRepository) {}

  async execute(
    condominio_id: string,
    query: ListFeesQueryDTO
  ): Promise<{ data: CuotaEntity[]; total: number; limit: number; offset: number }> {
    const filters: FeeFilters = {
      ...(query.propiedad_id && { propiedad_id: query.propiedad_id }),
      ...(query.estado && { estado: query.estado }),
      ...(query.fecha_desde && { fecha_desde: new Date(query.fecha_desde) }),
      ...(query.fecha_hasta && { fecha_hasta: new Date(query.fecha_hasta) }),
    };

    const [data, total] = await Promise.all([
      this.cuotaRepository.listFees(condominio_id, filters, { limit: query.limit, offset: query.offset }),
      this.cuotaRepository.countFees(condominio_id, filters),
    ]);

    return { data, total, limit: query.limit, offset: query.offset };
  }
}
