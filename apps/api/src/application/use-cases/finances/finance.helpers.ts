import { Decimal } from '../../../domain/value-objects/money';
import { CuotaEntity } from '../../../domain/interfaces/cuota.repository.interface';

export interface Actor {
  userId: string;
  rol: string;
}

/** Total owed on a fee before payments: monto_original + monto_recargo. */
export function feeTotal(cuota: Pick<CuotaEntity, 'monto_original' | 'monto_recargo'>): Decimal {
  return new Decimal(cuota.monto_original).plus(cuota.monto_recargo);
}
