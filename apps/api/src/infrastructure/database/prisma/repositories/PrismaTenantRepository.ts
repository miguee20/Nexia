import { PrismaClient } from '@prisma/client';
import { ITenantRepository, TenantEntity } from '../../../../domain/interfaces/tenant.repository.interface';

const prisma = new PrismaClient();

export class PrismaTenantRepository implements ITenantRepository {
  async create(data: { nombre: string; direccion: string; configuracion: any }): Promise<TenantEntity> {
    const tenant = await prisma.condominio.create({
      data: {
        nombre: data.nombre,
        direccion: data.direccion,
        configuracion: data.configuracion,
      }
    });
    return this.mapToEntity(tenant);
  }

  async findAll(): Promise<TenantEntity[]> {
    const tenants = await prisma.condominio.findMany({
      where: { activo: true }
    });
    return tenants.map(this.mapToEntity);
  }

  async findById(id: string): Promise<TenantEntity | null> {
    const tenant = await prisma.condominio.findUnique({
      where: { id }
    });
    return tenant ? this.mapToEntity(tenant) : null;
  }

  async updateConfig(id: string, configuracion: any): Promise<TenantEntity> {
    const tenant = await prisma.condominio.update({
      where: { id },
      data: { configuracion }
    });
    return this.mapToEntity(tenant);
  }

  private mapToEntity(prismaTenant: any): TenantEntity {
    return {
      id: prismaTenant.id,
      nombre: prismaTenant.nombre,
      direccion: prismaTenant.direccion,
      logo_url: prismaTenant.logo_url,
      configuracion: prismaTenant.configuracion,
      activo: prismaTenant.activo,
    };
  }
}
