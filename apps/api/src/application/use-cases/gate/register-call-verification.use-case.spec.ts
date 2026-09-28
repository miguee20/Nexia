import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterCallVerificationUseCase } from './register-call-verification.use-case';
import { IGateLogRepository } from '../../../domain/interfaces/gate-log.repository.interface';

describe('RegisterCallVerificationUseCase', () => {
  let registerCallVerificationUseCase: RegisterCallVerificationUseCase;
  let gateLogRepository: any;

  beforeEach(() => {
    gateLogRepository = {
      create: vi.fn(),
    };
    registerCallVerificationUseCase = new RegisterCallVerificationUseCase(gateLogRepository as IGateLogRepository);
  });

  it('debe registrar verificación exitosa autorizada', async () => {
    gateLogRepository.create.mockImplementation((data: any) => Promise.resolve(data));

    const result = await registerCallVerificationUseCase.execute('condo-1', 'guardia-1', {
      propiedad_id: 'prop-1',
      nombre_visitante: 'Juan',
      telefono_contactado: '12345678',
      autorizo_ingreso: true
    });

    expect(result.tipo_registro).toBe('VERIFICACION_LLAMADA');
    expect(result.nombre_visitante).toContain('Juan - Llamada a 12345678 (AUTORIZADO)');
    expect(result.entrada).toBeInstanceOf(Date);
  });

  it('debe registrar verificación denegada sin fecha de entrada', async () => {
    gateLogRepository.create.mockImplementation((data: any) => Promise.resolve(data));

    const result = await registerCallVerificationUseCase.execute('condo-1', 'guardia-1', {
      propiedad_id: 'prop-1',
      nombre_visitante: 'Juan',
      telefono_contactado: '12345678',
      autorizo_ingreso: false
    });

    expect(result.tipo_registro).toBe('VERIFICACION_LLAMADA');
    expect(result.nombre_visitante).toContain('Juan - Llamada a 12345678 (DENEGADO)');
    expect(result.entrada).toBeNull();
  });
});
