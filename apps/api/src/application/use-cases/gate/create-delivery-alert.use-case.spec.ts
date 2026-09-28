import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateDeliveryAlertUseCase } from './create-delivery-alert.use-case';
import { IDeliveryAlertRepository } from '../../../domain/interfaces/delivery-alert.repository.interface';
import { ITenantRepository } from '../../../domain/interfaces/tenant.repository.interface';

describe('CreateDeliveryAlertUseCase', () => {
  let createDeliveryAlertUseCase: CreateDeliveryAlertUseCase;
  let deliveryAlertRepository: any;
  let tenantRepository: any;

  beforeEach(() => {
    deliveryAlertRepository = {
      create: vi.fn(),
    };
    tenantRepository = {
      findById: vi.fn(),
    };

    createDeliveryAlertUseCase = new CreateDeliveryAlertUseCase(
      deliveryAlertRepository as IDeliveryAlertRepository,
      tenantRepository as ITenantRepository
    );
  });

  it('debe calcular la expiración según la vigencia configurable (ej. 2 horas)', async () => {
    tenantRepository.findById.mockResolvedValue({
      configuracion: { vigencia_alerta_delivery_horas: 2 }
    });

    deliveryAlertRepository.create.mockImplementation((data: any) => Promise.resolve(data));

    const result = await createDeliveryAlertUseCase.execute('condo-1', 'res-1', 'prop-1', {
      descripcion: 'Pizza'
    });

    const diffHours = (result.fecha_expiracion.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    expect(diffHours).toBeCloseTo(2, 1);
  });

  it('debe usar 2 horas por defecto si no hay configuración', async () => {
    tenantRepository.findById.mockResolvedValue({
      configuracion: {}
    });

    deliveryAlertRepository.create.mockImplementation((data: any) => Promise.resolve(data));

    const result = await createDeliveryAlertUseCase.execute('condo-1', 'res-1', 'prop-1', {
      descripcion: 'Burger'
    });

    const diffHours = (result.fecha_expiracion.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    expect(diffHours).toBeCloseTo(2, 1);
  });
});
