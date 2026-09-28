import { PrismaClient, EstadoAlerta } from '@prisma/client';
import { IDeliveryAlertRepository, DeliveryAlertEntity, DeliveryAlertWithRelations } from '../../../domain/interfaces/delivery-alert.repository.interface';

export class PrismaDeliveryAlertRepository implements IDeliveryAlertRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: Omit<DeliveryAlertEntity, 'id' | 'fecha_creacion' | 'estado'>): Promise<DeliveryAlertEntity> {
    const created = await this.prisma.alertaDelivery.create({
      data: {
        condominio_id: data.condominio_id,
        residente_id: data.residente_id,
        propiedad_id: data.propiedad_id,
        descripcion: data.descripcion,
        nombre_repartidor: data.nombre_repartidor,
        fecha_expiracion: data.fecha_expiracion,
      },
    });

    return created;
  }

  async findActiveByCondominio(condominio_id: string): Promise<DeliveryAlertWithRelations[]> {
    const alerts = await this.prisma.alertaDelivery.findMany({
      where: {
        condominio_id,
        estado: EstadoAlerta.ACTIVA,
        fecha_expiracion: {
          gt: new Date()
        }
      },
      include: {
        propiedad: {
          select: { identificador: true }
        },
        residente: {
          select: { nombre_completo: true }
        }
      },
      orderBy: {
        fecha_creacion: 'asc'
      }
    });

    return alerts as DeliveryAlertWithRelations[];
  }

  async findActiveByResident(residente_id: string, condominio_id: string): Promise<DeliveryAlertWithRelations[]> {
    const alerts = await this.prisma.alertaDelivery.findMany({
      where: {
        residente_id,
        condominio_id,
        estado: EstadoAlerta.ACTIVA,
        fecha_expiracion: {
          gt: new Date()
        }
      },
      include: {
        propiedad: {
          select: { identificador: true }
        },
        residente: {
          select: { nombre_completo: true }
        }
      },
      orderBy: {
        fecha_creacion: 'desc'
      }
    });

    return alerts as DeliveryAlertWithRelations[];
  }

  async updateState(id: string, condominio_id: string, estado: 'COMPLETADA' | 'EXPIRADA' | 'CANCELADA'): Promise<DeliveryAlertEntity> {
    const updated = await this.prisma.alertaDelivery.update({
      where: { id, condominio_id },
      data: { estado: estado as EstadoAlerta },
    });

    return updated;
  }
}
