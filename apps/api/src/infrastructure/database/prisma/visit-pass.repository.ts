import { PrismaClient, EstadoPase, MotivoVisita } from '@prisma/client';
import { IVisitPassRepository, VisitPassEntity, VisitPassWithRelations } from '../../../domain/interfaces/visit-pass.repository.interface';

export class PrismaVisitPassRepository implements IVisitPassRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: Omit<VisitPassEntity, 'id' | 'qr_token' | 'fecha_creacion' | 'estado'> & { qr_token: string }): Promise<VisitPassEntity> {
    const created = await this.prisma.paseVisita.create({
      data: {
        condominio_id: data.condominio_id,
        residente_id: data.residente_id,
        propiedad_id: data.propiedad_id,
        nombre_visitante: data.nombre_visitante,
        placa_vehiculo: data.placa_vehiculo,
        motivo: data.motivo as MotivoVisita,
        qr_token: data.qr_token,
        fecha_expiracion: data.fecha_expiracion,
      },
    });

    return created;
  }

  async findByToken(token: string, condominio_id: string): Promise<VisitPassWithRelations | null> {
    const pass = await this.prisma.paseVisita.findFirst({
      where: {
        qr_token: token,
        condominio_id: condominio_id,
      },
      include: {
        propiedad: {
          select: { identificador: true }
        },
        residente: {
          select: { nombre_completo: true }
        }
      }
    });

    return pass as VisitPassWithRelations | null;
  }

  async findById(id: string, condominio_id: string): Promise<VisitPassEntity | null> {
    const pass = await this.prisma.paseVisita.findFirst({
      where: {
        id,
        condominio_id,
      },
    });

    return pass;
  }

  async findActiveByResident(residente_id: string, condominio_id: string): Promise<VisitPassWithRelations[]> {
    const passes = await this.prisma.paseVisita.findMany({
      where: {
        residente_id,
        condominio_id,
        estado: EstadoPase.ACTIVO,
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

    return passes as VisitPassWithRelations[];
  }

  async updateState(id: string, condominio_id: string, estado: 'UTILIZADO' | 'EXPIRADO' | 'CANCELADO'): Promise<VisitPassEntity> {
    const updated = await this.prisma.paseVisita.update({
      where: { id, condominio_id },
      data: { estado: estado as EstadoPase },
    });

    return updated;
  }
}
