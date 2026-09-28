import { IGateLogRepository } from '../../../domain/interfaces/gate-log.repository.interface';
import { GateLogFilterDto } from '../../dtos/gate-log.dto';

export class GetGateLogsUseCase {
  constructor(
    private readonly gateLogRepository: IGateLogRepository
  ) {}

  async execute(condominioId: string, filters: GateLogFilterDto) {
    const query: any = {};
    if (filters.fecha_desde) query.fecha_desde = new Date(filters.fecha_desde);
    if (filters.fecha_hasta) query.fecha_hasta = new Date(filters.fecha_hasta);
    if (filters.tipo_evento) query.tipo_evento = filters.tipo_evento;
    if (filters.propiedad_id) query.propiedad_id = filters.propiedad_id;
    if (filters.limit) query.limit = filters.limit;
    if (filters.page) query.offset = (filters.page - 1) * (filters.limit || 10);
    
    return this.gateLogRepository.findPaginated(condominioId, query);
  }
}
