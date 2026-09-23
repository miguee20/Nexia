import { PrismaClient, EstadoMarbete, EstadoCuota } from '@prisma/client';
import { IMarbeteRepository, MarbeteEntity, ExtendedMarbeteEntity, CuotaData } from '../../../../domain/interfaces/marbete.repository.interface';

const prisma = new PrismaClient();

export class PrismaMarbeteRepository implements IMarbeteRepository {
  async create(data: Omit<MarbeteEntity, 'id'>): Promise<MarbeteEntity> {
    const marbete = await prisma.marbete.create({
      data: {
        condominio_id: data.condominio_id,
        propiedad_id: data.propiedad_id,
        vehiculo_id: data.vehiculo_id,
        codigo: data.codigo,
        fecha_emision: data.fecha_emision,
        fecha_vencimiento: data.fecha_vencimiento,
        es_extra: data.es_extra,
        estado: data.estado as EstadoMarbete,
      }
    });
    return this.mapToEntity(marbete);
  }

  async createWithExtraFee(marbeteData: Omit<MarbeteEntity, 'id'>, cuotaData: CuotaData): Promise<MarbeteEntity> {
    const [marbete] = await prisma.$transaction([
      prisma.marbete.create({
        data: {
          condominio_id: marbeteData.condominio_id,
          propiedad_id: marbeteData.propiedad_id,
          vehiculo_id: marbeteData.vehiculo_id,
          codigo: marbeteData.codigo,
          fecha_emision: marbeteData.fecha_emision,
          fecha_vencimiento: marbeteData.fecha_vencimiento,
          es_extra: marbeteData.es_extra,
          estado: marbeteData.estado as EstadoMarbete,
        }
      }),
      prisma.cuota.create({
        data: {
          condominio_id: cuotaData.condominio_id,
          propiedad_id: cuotaData.propiedad_id,
          concepto: cuotaData.concepto,
          monto_original: cuotaData.monto_original,
          fecha_emision: cuotaData.fecha_emision,
          fecha_vencimiento: cuotaData.fecha_vencimiento,
          estado: cuotaData.estado as EstadoCuota,
        }
      })
    ]);

    return this.mapToEntity(marbete);
  }

  async countActiveByProperty(propiedad_id: string, condominio_id: string): Promise<number> {
    return prisma.marbete.count({
      where: {
        propiedad_id,
        condominio_id,
        estado: 'ACTIVO'
      }
    });
  }

  async findByCode(codigo: string, condominio_id: string): Promise<ExtendedMarbeteEntity | null> {
    const marbete = await prisma.marbete.findUnique({
      where: {
        condominio_id_codigo: { condominio_id, codigo }
      },
      include: {
        vehiculo: true,
        propiedad: {
          include: {
            cuotas: {
              where: { estado: 'VENCIDA' }
            }
          }
        }
      }
    });
    
    if (!marbete) return null;

    const base = this.mapToEntity(marbete);
    return {
      ...base,
      vehiculo: marbete.vehiculo,
      propiedad: marbete.propiedad,
    };
  }

  async findById(id: string, condominio_id: string): Promise<MarbeteEntity | null> {
    const marbete = await prisma.marbete.findFirst({
      where: { id, condominio_id }
    });
    return marbete ? this.mapToEntity(marbete) : null;
  }

  async updateStatus(id: string, condominio_id: string, estado: string): Promise<MarbeteEntity> {
    const existing = await prisma.marbete.findFirst({ where: { id, condominio_id } });
    if (!existing) throw new Error("Marbete not found");

    const marbete = await prisma.marbete.update({
      where: { id },
      data: { estado: estado as EstadoMarbete }
    });
    return this.mapToEntity(marbete);
  }

  async findAllByProperty(propiedad_id: string, condominio_id: string): Promise<MarbeteEntity[]> {
    const marbetes = await prisma.marbete.findMany({
      where: { propiedad_id, condominio_id },
      orderBy: { createdAt: 'desc' }
    });
    return marbetes.map(this.mapToEntity.bind(this));
  }

  private mapToEntity(prismaMarbete: any): MarbeteEntity {
    return {
      id: prismaMarbete.id,
      condominio_id: prismaMarbete.condominio_id,
      propiedad_id: prismaMarbete.propiedad_id,
      vehiculo_id: prismaMarbete.vehiculo_id,
      codigo: prismaMarbete.codigo,
      fecha_emision: prismaMarbete.fecha_emision,
      fecha_vencimiento: prismaMarbete.fecha_vencimiento,
      es_extra: prismaMarbete.es_extra,
      estado: prismaMarbete.estado,
    };
  }
}
