import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ManualEntryUseCase } from './manual-entry.use-case';
import { IGateLogRepository } from '../../../domain/interfaces/gate-log.repository.interface';

describe('ManualEntryUseCase', () => {
  let manualEntryUseCase: ManualEntryUseCase;
  let gateLogRepository: any;

  beforeEach(() => {
    gateLogRepository = {
      create: vi.fn(),
    };
    manualEntryUseCase = new ManualEntryUseCase(gateLogRepository as IGateLogRepository);
  });

  it('debe registrar entrada manual con detalles concatenados en el nombre', async () => {
    gateLogRepository.create.mockImplementation((data: any) => Promise.resolve(data));

    const result = await manualEntryUseCase.execute('condo-1', 'guardia-1', {
      nombre_visitante: 'Maria',
      documento_identidad: '1234',
      motivo: 'Visita',
      propiedad_id: 'prop-1'
    });

    expect(result.tipo_registro).toBe('ENTRADA_MANUAL');
    expect(result.nombre_visitante).toBe('Maria (Visita - Doc: 1234)');
    expect(result.entrada).toBeInstanceOf(Date);
  });
});
