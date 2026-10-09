import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CancelVisitPassUseCase } from './cancel-visit-pass.use-case';
import { IVisitPassRepository } from '../../../domain/interfaces/visit-pass.repository.interface';

describe('CancelVisitPassUseCase', () => {
  let cancelVisitPassUseCase: CancelVisitPassUseCase;
  let visitPassRepository: any;

  beforeEach(() => {
    visitPassRepository = {
      findById: vi.fn(),
      updateState: vi.fn(),
    };
    cancelVisitPassUseCase = new CancelVisitPassUseCase(visitPassRepository as IVisitPassRepository);
  });

  it('debe cancelar exitosamente un pase activo perteneciente al residente', async () => {
    visitPassRepository.findById.mockResolvedValue({
      id: 'pass-1',
      residente_id: 'user-1',
      condominio_id: 'condo-1',
      estado: 'ACTIVO',
    });
    visitPassRepository.updateState.mockResolvedValue({
      id: 'pass-1',
      estado: 'CANCELADO',
    });

    const result = await cancelVisitPassUseCase.execute('pass-1', 'user-1', 'condo-1', 'RESIDENTE');

    expect(visitPassRepository.updateState).toHaveBeenCalledWith('pass-1', 'condo-1', 'CANCELADO');
    expect(result.estado).toBe('CANCELADO');
  });

  it('debe lanzar error si el pase pertenece a otro residente', async () => {
    visitPassRepository.findById.mockResolvedValue({
      id: 'pass-1',
      residente_id: 'other-user',
      condominio_id: 'condo-1',
      estado: 'ACTIVO',
    });

    await expect(
      cancelVisitPassUseCase.execute('pass-1', 'user-1', 'condo-1', 'RESIDENTE')
    ).rejects.toThrow('No tienes permisos para cancelar este pase');
  });

  it('debe lanzar error si el pase ya fue utilizado', async () => {
    visitPassRepository.findById.mockResolvedValue({
      id: 'pass-1',
      residente_id: 'user-1',
      condominio_id: 'condo-1',
      estado: 'UTILIZADO',
    });

    await expect(
      cancelVisitPassUseCase.execute('pass-1', 'user-1', 'condo-1', 'RESIDENTE')
    ).rejects.toThrow('No se puede cancelar un pase que ya fue utilizado');
  });
});
