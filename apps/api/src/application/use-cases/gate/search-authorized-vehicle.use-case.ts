import { IVehicleVerificationRepository } from '../../../domain/interfaces/vehicle-verification.repository.interface';

export class SearchAuthorizedVehicleUseCase {
  constructor(
    private readonly vehicleVerificationRepository: IVehicleVerificationRepository
  ) {}

  async execute(condominioId: string, query: string) {
    const vehicle = await this.vehicleVerificationRepository.findByPlacaOrMarbete(query, condominioId);
    if (!vehicle) {
      return { autorizado: false, mensaje: 'Vehículo no encontrado' };
    }

    if (vehicle.marbete && vehicle.marbete.estado === 'VENCIDO') {
      return { autorizado: false, mensaje: 'Marbete vencido. Residentes con mora.', vehiculo: vehicle };
    }
    
    if (vehicle.marbete && vehicle.marbete.estado === 'CANCELADO') {
      return { autorizado: false, mensaje: 'Marbete cancelado.', vehiculo: vehicle };
    }

    return { autorizado: true, vehiculo: vehicle };
  }
}
