import { IVisitPassRepository } from '../../../domain/interfaces/visit-pass.repository.interface';

export class CancelVisitPassUseCase {
  constructor(
    private readonly visitPassRepository: IVisitPassRepository
  ) {}

  async execute(passId: string, userId: string, condominioId: string, userRole: string) {
    const pass = await this.visitPassRepository.findById(passId, condominioId);
    if (!pass) {
      throw new Error('Pase de visita no encontrado');
    }

    if (userRole === 'RESIDENTE' && pass.residente_id !== userId) {
      throw new Error('No tienes permisos para cancelar este pase');
    }

    if (pass.estado === 'UTILIZADO') {
      throw new Error('No se puede cancelar un pase que ya fue utilizado');
    }

    if (pass.estado === 'CANCELADO') {
      throw new Error('El pase ya se encuentra cancelado');
    }

    return this.visitPassRepository.updateState(passId, condominioId, 'CANCELADO');
  }
}
