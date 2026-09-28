import { IVisitPassRepository } from '../../../domain/interfaces/visit-pass.repository.interface';

export class ListMyVisitPassesUseCase {
  constructor(
    private readonly visitPassRepository: IVisitPassRepository
  ) {}

  async execute(residenteId: string, condominioId: string) {
    return this.visitPassRepository.findActiveByResident(residenteId, condominioId);
  }
}
