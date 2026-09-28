import { PrismaClient, EstadoMarbete } from '@prisma/client';
import { IVehicleVerificationRepository, VehicleVerificationEntity } from '../../../domain/interfaces/vehicle-verification.repository.interface';

export class PrismaVehicleVerificationRepository implements IVehicleVerificationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByPlacaOrMarbete(query: string, condominio_id: string): Promise<VehicleVerificationEntity | null> {
    const vehicle = await this.prisma.vehiculo.findFirst({
      where: {
        condominio_id,
        OR: [
          { placa: { equals: query, mode: 'insensitive' } },
          { marbetes: { some: { codigo: { equals: query, mode: 'insensitive' } } } }
        ]
      },
      include: {
        propiedad: { select: { identificador: true } },
        marbetes: {
          where: {
            estado: { in: [EstadoMarbete.ACTIVO, EstadoMarbete.VENCIDO, EstadoMarbete.CANCELADO] }
          },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!vehicle) return null;

    return {
      id: vehicle.id,
      placa: vehicle.placa,
      marca: vehicle.marca,
      color: vehicle.color,
      propiedad: { identificador: vehicle.propiedad.identificador },
      marbete: vehicle.marbetes[0] ? {
        codigo: vehicle.marbetes[0].codigo,
        estado: vehicle.marbetes[0].estado
      } : null
    };
  }
}
