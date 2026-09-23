import { PrismaClient, TipoVehiculo } from '@prisma/client';
import { IVehicleRepository, VehicleEntity } from '../../../../domain/interfaces/vehicle.repository.interface';

const prisma = new PrismaClient();

export class PrismaVehicleRepository implements IVehicleRepository {
  async create(data: Omit<VehicleEntity, 'id'>): Promise<VehicleEntity> {
    const vehicle = await prisma.vehiculo.create({
      data: {
        condominio_id: data.condominio_id,
        propiedad_id: data.propiedad_id,
        placa: data.placa,
        marca: data.marca,
        color: data.color,
        modelo: data.modelo,
        tipo: data.tipo as TipoVehiculo,
      }
    });
    return this.mapToEntity(vehicle);
  }

  async findById(id: string, condominio_id: string): Promise<VehicleEntity | null> {
    const vehicle = await prisma.vehiculo.findFirst({
      where: { id, condominio_id }
    });
    return vehicle ? this.mapToEntity(vehicle) : null;
  }

  async findByPlaca(placa: string, condominio_id: string): Promise<VehicleEntity | null> {
    const vehicle = await prisma.vehiculo.findUnique({
      where: {
        condominio_id_placa: {
          condominio_id,
          placa
        }
      }
    });
    return vehicle ? this.mapToEntity(vehicle) : null;
  }

  async findAllByProperty(propiedad_id: string, condominio_id: string): Promise<VehicleEntity[]> {
    const vehicles = await prisma.vehiculo.findMany({
      where: { propiedad_id, condominio_id },
      orderBy: { createdAt: 'desc' }
    });
    return vehicles.map(this.mapToEntity.bind(this));
  }

  private mapToEntity(prismaVehicle: any): VehicleEntity {
    return {
      id: prismaVehicle.id,
      condominio_id: prismaVehicle.condominio_id,
      propiedad_id: prismaVehicle.propiedad_id,
      placa: prismaVehicle.placa,
      marca: prismaVehicle.marca,
      color: prismaVehicle.color,
      modelo: prismaVehicle.modelo,
      tipo: prismaVehicle.tipo,
    };
  }
}
