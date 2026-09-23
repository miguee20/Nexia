import { describe, it, expect, vi, beforeEach } from 'vitest';
import { IssueMarbeteUseCase } from '../../../src/application/use-cases/marbetes/issue-marbete.use-case';

describe('IssueMarbeteUseCase', () => {
  let issueMarbeteUseCase: IssueMarbeteUseCase;
  let mockMarbeteRepository: any;
  let mockVehicleRepository: any;
  let mockTenantRepository: any;

  beforeEach(() => {
    mockMarbeteRepository = {
      create: vi.fn(),
      createWithExtraFee: vi.fn(),
      countActiveByProperty: vi.fn(),
    };

    mockVehicleRepository = {
      findById: vi.fn(),
    };

    mockTenantRepository = {
      findById: vi.fn(),
    };

    issueMarbeteUseCase = new IssueMarbeteUseCase(
      mockMarbeteRepository,
      mockVehicleRepository,
      mockTenantRepository
    );
  });

  it('debe emitir un marbete incluido si no excede el límite', async () => {
    const condominioId = 'condominio-1';
    const vehiculoId = 'vehiculo-1';
    
    mockVehicleRepository.findById.mockResolvedValue({
      id: vehiculoId,
      propiedad_id: 'propiedad-1',
      placa: 'P123ABC'
    });

    mockTenantRepository.findById.mockResolvedValue({
      id: condominioId,
      configuracion: {
        marbetes_incluidos_por_propiedad: 2
      }
    });

    mockMarbeteRepository.countActiveByProperty.mockResolvedValue(1); // Ya tiene 1, el límite es 2
    mockMarbeteRepository.create.mockResolvedValue({ id: 'marbete-1', es_extra: false });

    const result = await issueMarbeteUseCase.execute(condominioId, {
      vehiculo_id: vehiculoId,
      periodo: 'MENSUAL'
    });

    expect(result.es_extra).toBe(false);
    expect(mockMarbeteRepository.create).toHaveBeenCalled();
    expect(mockMarbeteRepository.createWithExtraFee).not.toHaveBeenCalled();
  });

  it('debe emitir un marbete extra y generar cuota si excede el límite', async () => {
    const condominioId = 'condominio-1';
    const vehiculoId = 'vehiculo-2';
    
    mockVehicleRepository.findById.mockResolvedValue({
      id: vehiculoId,
      propiedad_id: 'propiedad-1',
      placa: 'P999XYZ'
    });

    mockTenantRepository.findById.mockResolvedValue({
      id: condominioId,
      configuracion: {
        marbetes_incluidos_por_propiedad: 2,
        costo_marbete_extra: 75
      }
    });

    mockMarbeteRepository.countActiveByProperty.mockResolvedValue(2); // Ya tiene 2, el límite es 2
    mockMarbeteRepository.createWithExtraFee.mockResolvedValue({ id: 'marbete-2', es_extra: true });

    const result = await issueMarbeteUseCase.execute(condominioId, {
      vehiculo_id: vehiculoId,
      periodo: 'MENSUAL'
    });

    expect(result.es_extra).toBe(true);
    expect(mockMarbeteRepository.create).not.toHaveBeenCalled();
    expect(mockMarbeteRepository.createWithExtraFee).toHaveBeenCalled();
    
    const [marbeteData, cuotaData] = mockMarbeteRepository.createWithExtraFee.mock.calls[0];
    expect(marbeteData.es_extra).toBe(true);
    expect(cuotaData.monto_original).toBe(75);
    expect(cuotaData.concepto).toContain('P999XYZ');
  });
});
