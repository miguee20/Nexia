import { IGateLogRepository } from '../../../domain/interfaces/gate-log.repository.interface';
import { GateLogFilterDto } from '../../dtos/gate-log.dto';

export class ExportGateLogsCsvUseCase {
  constructor(
    private readonly gateLogRepository: IGateLogRepository
  ) {}

  async execute(condominioId: string, filters: Omit<GateLogFilterDto, 'limit' | 'page'>) {
    const query: any = {};
    if (filters.fecha_desde) query.fecha_desde = new Date(filters.fecha_desde);
    if (filters.fecha_hasta) query.fecha_hasta = new Date(filters.fecha_hasta);
    if (filters.tipo_evento) query.tipo_evento = filters.tipo_evento;
    if (filters.propiedad_id) query.propiedad_id = filters.propiedad_id;

    const logs = await this.gateLogRepository.findAllStream(condominioId, query);

    const headers = ['Fecha/Hora Entrada', 'Fecha/Hora Salida', 'Visitante/Repartidor', 'Placa', 'Propiedad Destino', 'Tipo Evento', 'Guardia', 'ID Registro'];
    
    const rows = logs.map(log => {
      const entrada = log.entrada ? new Date(log.entrada).toLocaleString() : '';
      const salida = log.salida ? new Date(log.salida).toLocaleString() : '';
      const visitante = log.nombre_visitante || log.pase?.nombre_visitante || log.alerta_delivery?.nombre_repartidor || '';
      const placa = log.placa_vehiculo || log.pase?.placa_vehiculo || '';
      
      let propiedad = 'N/A';
      if (log.pase?.propiedad?.identificador) {
        propiedad = log.pase.propiedad.identificador;
      } else if (log.alerta_delivery?.propiedad?.identificador) {
        propiedad = log.alerta_delivery.propiedad.identificador;
      }

      return [
        `"${entrada}"`,
        `"${salida}"`,
        `"${visitante}"`,
        `"${placa}"`,
        `"${propiedad}"`,
        `"${log.tipo_registro}"`,
        `"${log.guardia.nombre_completo}"`,
        `"${log.id}"`
      ].join(',');
    });

    return '\uFEFF' + [headers.join(','), ...rows].join('\n');
  }
}
