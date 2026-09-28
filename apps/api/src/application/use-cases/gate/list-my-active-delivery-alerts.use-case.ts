import { IDeliveryAlertRepository } from '../../../domain/interfaces/delivery-alert.repository.interface';

export class ListMyActiveDeliveryAlertsUseCase {
  constructor(
    private readonly deliveryAlertRepository: IDeliveryAlertRepository
  ) {}

  async execute(residenteId: string, condominioId: string) {
    return this.deliveryAlertRepository.findActiveByResident(residenteId, condominioId);
  }
}
