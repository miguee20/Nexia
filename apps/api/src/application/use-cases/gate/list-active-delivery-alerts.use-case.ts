import { IDeliveryAlertRepository } from '../../../domain/interfaces/delivery-alert.repository.interface';

export class ListActiveDeliveryAlertsUseCase {
  constructor(
    private readonly deliveryAlertRepository: IDeliveryAlertRepository
  ) {}

  async execute(condominioId: string) {
    return this.deliveryAlertRepository.findActiveByCondominio(condominioId);
  }
}
