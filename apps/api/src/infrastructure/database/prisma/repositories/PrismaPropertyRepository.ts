import { PrismaClient, Prisma, TipoPropiedad, EstadoPropiedad, TipoResidencia, RolUsuario } from '@prisma/client';
import { IPropertyRepository, PropertyEntity, ExtendedPropertyEntity, PropertyFilters } from '../../../../domain/interfaces/property.repository.interface';

const prisma = new PrismaClient();

export class PrismaPropertyRepository implements IPropertyRepository {
  async create(data: { condominio_id: string; identificador: string; tipo: string; estado: string; area_m2?: number; }): Promise<PropertyEntity> {
    const property = await prisma.propiedad.create({
      data: {
        condominio_id: data.condominio_id,
        identificador: data.identificador,
        tipo: data.tipo as TipoPropiedad,
        estado: data.estado as EstadoPropiedad,
        ...(data.area_m2 !== undefined && { area_m2: data.area_m2 }),
      }
    });
    return this.mapToEntity(property);
  }

  async findByIdAndCondominio(id: string, condominio_id: string): Promise<ExtendedPropertyEntity | null> {
    const property = await prisma.propiedad.findFirst({
      where: {
        id,
        condominio_id,
      },
      include: {
        propietario: {
          select: { id: true, nombre_completo: true, email: true, telefono: true }
        },
        inquilino: {
          select: { id: true, nombre_completo: true, email: true, telefono: true }
        },
        _count: {
          select: { vehiculos: true }
        }
      }
    });

    if (!property) {
      return null;
    }

    const base = this.mapToEntity(property);
    return {
      ...base,
      propietario: property.propietario,
      inquilino: property.inquilino,
      _count: property._count,
    };
  }

  async findByIdentificadorAndCondominio(identificador: string, condominio_id: string): Promise<PropertyEntity | null> {
    const property = await prisma.propiedad.findUnique({
      where: {
        condominio_id_identificador: {
          condominio_id,
          identificador
        }
      }
    });
    return property ? this.mapToEntity(property) : null;
  }

  async findAllByCondominio(condominio_id: string, filters?: PropertyFilters): Promise<{ data: PropertyEntity[]; total: number; }> {
    const where: Prisma.PropiedadWhereInput = { condominio_id };
    
    if (filters?.tipo) {
      where.tipo = filters.tipo as TipoPropiedad;
    }
    if (filters?.estado) {
      where.estado = filters.estado as EstadoPropiedad;
    }

    const findManyArgs: any = {
      where,
      orderBy: { identificador: 'asc' }
    };
    if (filters?.limit !== undefined) findManyArgs.take = Number(filters.limit);
    if (filters?.offset !== undefined) findManyArgs.skip = Number(filters.offset);

    const [total, properties] = await Promise.all([
      prisma.propiedad.count({ where }),
      prisma.propiedad.findMany(findManyArgs)
    ]);

    return {
      total,
      data: properties.map(this.mapToEntity.bind(this))
    };
  }

  async update(id: string, condominio_id: string, data: Partial<Omit<PropertyEntity, 'id' | 'condominio_id' | 'propietario_id' | 'inquilino_id'>>): Promise<PropertyEntity> {
    const property = await prisma.propiedad.findFirst({
      where: { id, condominio_id }
    });
    if (!property) throw new Error("Property not found");

    const updated = await prisma.propiedad.update({
      where: { id },
      data: {
        ...(data.identificador && { identificador: data.identificador }),
        ...(data.tipo && { tipo: data.tipo as TipoPropiedad }),
        ...(data.estado && { estado: data.estado as EstadoPropiedad }),
        ...(data.area_m2 !== undefined && { area_m2: data.area_m2 }),
      }
    });
    return this.mapToEntity(updated);
  }

  async assignResident(id: string, condominio_id: string, userId: string, tipoResidencia: 'PROPIETARIO' | 'INQUILINO'): Promise<PropertyEntity> {
    const property = await prisma.propiedad.findFirst({
      where: { id, condominio_id }
    });
    if (!property) throw new Error("Property not found");

    const [updatedProperty] = await prisma.$transaction([
      prisma.propiedad.update({
        where: { id },
        data: {
          ...(tipoResidencia === 'PROPIETARIO' ? { propietario_id: userId } : { inquilino_id: userId })
        }
      }),
      prisma.usuario.update({
        where: { id: userId },
        data: {
          rol: RolUsuario.RESIDENTE,
          tipo_residencia: tipoResidencia as TipoResidencia,
        }
      })
    ]);

    return this.mapToEntity(updatedProperty);
  }

  private mapToEntity(prismaProperty: any): PropertyEntity {
    return {
      id: prismaProperty.id,
      condominio_id: prismaProperty.condominio_id,
      identificador: prismaProperty.identificador,
      tipo: prismaProperty.tipo,
      estado: prismaProperty.estado,
      propietario_id: prismaProperty.propietario_id,
      inquilino_id: prismaProperty.inquilino_id,
      area_m2: prismaProperty.area_m2 ? Number(prismaProperty.area_m2) : null,
    };
  }
}
