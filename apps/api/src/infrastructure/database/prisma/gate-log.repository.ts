import { PrismaClient, Prisma, TipoRegistro } from '@prisma/client';
import { IGateLogRepository, GateLogEntity, GateLogFilters, GateLogWithRelations } from '../../../domain/interfaces/gate-log.repository.interface';

export class PrismaGateLogRepository implements IGateLogRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: Omit<GateLogEntity, 'id' | 'createdAt'>): Promise<GateLogEntity> {
    const created = await this.prisma.registroGarita.create({
      data: {
        condominio_id: data.condominio_id,
        pase_id: data.pase_id,
        alerta_delivery_id: data.alerta_delivery_id,
        guardia_id: data.guardia_id,
        nombre_visitante: data.nombre_visitante,
        placa_vehiculo: data.placa_vehiculo,
        tipo_registro: data.tipo_registro as TipoRegistro,
        entrada: data.entrada,
        salida: data.salida,
      }
    });

    return created;
  }

  async updateExit(id: string, condominio_id: string, salida: Date, tipo_registro: string): Promise<GateLogEntity> {
    const updated = await this.prisma.registroGarita.update({
      where: { id, condominio_id },
      data: {
        salida,
        tipo_registro: tipo_registro as TipoRegistro
      }
    });

    return updated;
  }

  private buildWhereClause(condominio_id: string, filters: GateLogFilters): Prisma.RegistroGaritaWhereInput {
    const where: Prisma.RegistroGaritaWhereInput = { condominio_id };
    
    if (filters.fecha_desde || filters.fecha_hasta) {
      where.entrada = {};
      if (filters.fecha_desde) where.entrada.gte = filters.fecha_desde;
      if (filters.fecha_hasta) where.entrada.lte = filters.fecha_hasta;
    }

    if (filters.tipo_evento) {
      where.tipo_registro = filters.tipo_evento as TipoRegistro;
    }

    if (filters.propiedad_id) {
      where.OR = [
        { pase: { propiedad_id: filters.propiedad_id } },
        { alerta_delivery: { propiedad_id: filters.propiedad_id } }
      ];
    }

    return where;
  }

  async findPaginated(condominio_id: string, filters: GateLogFilters): Promise<{ data: GateLogWithRelations[]; total: number }> {
    const where = this.buildWhereClause(condominio_id, filters);
    
    const limit = filters.limit || 10;
    const offset = filters.offset || 0;

    const [total, data] = await Promise.all([
      this.prisma.registroGarita.count({ where }),
      this.prisma.registroGarita.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { entrada: 'desc' },
        include: {
          guardia: { select: { nombre_completo: true } },
          pase: { select: { propiedad: { select: { identificador: true } } } },
          alerta_delivery: { select: { propiedad: { select: { identificador: true } } } },
        }
      })
    ]);

    return { total, data: data as unknown as GateLogWithRelations[] };
  }

  async findAllStream(condominio_id: string, filters: Omit<GateLogFilters, 'limit' | 'offset'>): Promise<GateLogWithRelations[]> {
    const where = this.buildWhereClause(condominio_id, filters);

    const data = await this.prisma.registroGarita.findMany({
      where,
      orderBy: { entrada: 'desc' },
      include: {
        guardia: { select: { nombre_completo: true } },
        pase: { select: { propiedad: { select: { identificador: true } } } },
        alerta_delivery: { select: { propiedad: { select: { identificador: true } } } },
      }
    });

    return data as unknown as GateLogWithRelations[];
  }
}
