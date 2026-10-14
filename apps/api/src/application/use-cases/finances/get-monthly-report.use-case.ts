import { IPagoRepository, MonthlyReportResult } from '../../../domain/interfaces/pago.repository.interface';
import { Decimal } from '../../../domain/value-objects/money';
import { MonthlyReportQueryDTO } from '../../dtos/payment.dto';

export interface MonthlyReport extends MonthlyReportResult {
  mes: number;
  anio: number;
  tasa_recaudacion: Decimal;
}

export class GetMonthlyReportUseCase {
  constructor(private readonly pagoRepository: IPagoRepository) {}

  async execute(condominio_id: string, query: MonthlyReportQueryDTO): Promise<MonthlyReport> {
    const result = await this.pagoRepository.getMonthlyReport(condominio_id, query.mes, query.anio);

    const tasa = result.total_emitido.isZero()
      ? new Decimal(0)
      : result.total_recaudado.div(result.total_emitido).mul(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    return { ...result, mes: query.mes, anio: query.anio, tasa_recaudacion: tasa };
  }
}
