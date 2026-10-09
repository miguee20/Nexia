import { PrismaClient } from '@prisma/client';
import { IPropertyContactRepository, PropertyContactEntity, PropertySuggestionEntity } from '../../../domain/interfaces/property-contact.repository.interface';

export class PrismaPropertyContactRepository implements IPropertyContactRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findContactInfo(propiedad_id: string, condominio_id: string): Promise<PropertyContactEntity | null> {
    const property = await this.prisma.propiedad.findFirst({
      where: {
        id: propiedad_id,
        condominio_id: condominio_id
      },
      include: {
        propietario: { select: { nombre_completo: true, telefono: true } },
        inquilino: { select: { nombre_completo: true, telefono: true } }
      }
    });

    if (!property) return null;

    return {
      identificador: property.identificador,
      propietario: property.propietario,
      inquilino: property.inquilino
    };
  }

  async searchByIdentifier(query: string, condominio_id: string, limit: number): Promise<PropertySuggestionEntity[]> {
    return this.prisma.propiedad.findMany({
      where: {
        condominio_id,
        ...(query ? { identificador: { contains: query, mode: 'insensitive' } } : {})
      },
      select: { id: true, identificador: true },
      orderBy: { identificador: 'asc' },
      take: limit
    });
  }
}
