import { IMarbeteRepository } from '../../../domain/interfaces/marbete.repository.interface';
import { NotFoundError } from '../../../domain/errors';

export class SearchMarbeteByCodeUseCase {
  constructor(private readonly marbeteRepository: IMarbeteRepository) {}

  async execute(codigo: string, condominio_id: string) {
    const marbete = await this.marbeteRepository.findByCode(codigo, condominio_id);
    if (!marbete) {
      throw new NotFoundError('Marbete no encontrado');
    }

    // La lógica de solvencia se puede inferir si el repositorio devuelve los datos de la propiedad
    // o las cuotas vencidas.
    let solvencia = true;
    if (marbete.propiedad && marbete.propiedad.cuotas) {
      const cuotasVencidas = marbete.propiedad.cuotas.filter((c: any) => c.estado === 'VENCIDA');
      solvencia = cuotasVencidas.length === 0;
    }

    return {
      marbete,
      solvente: solvencia
    };
  }
}
