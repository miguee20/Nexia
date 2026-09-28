import { PrismaClient, EstadoCuota } from '@prisma/client';
import { ICuotaRepository } from '../../../domain/interfaces/cuota.repository.interface';

export class PrismaCuotaRepository implements ICuotaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async hasOverdueFees(propiedad_id: string, condominio_id: string, dateLimit: Date): Promise<boolean> {
    const overdueCount = await this.prisma.cuota.count({
      where: {
        propiedad_id,
        condominio_id,
        estado: {
          in: [EstadoCuota.PENDIENTE, EstadoCuota.VENCIDA, EstadoCuota.PARCIAL]
        },
        fecha_vencimiento: {
          lte: dateLimit
        }
      }
    });

    return overdueCount > 0;
  }
}
