import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ValidateQRUseCase } from './validate-qr.use-case';
import { IVisitPassRepository } from '../../../domain/interfaces/visit-pass.repository.interface';
import { ITenantRepository } from '../../../domain/interfaces/tenant.repository.interface';
import { ICuotaRepository } from '../../../domain/interfaces/cuota.repository.interface';
import { IQRCryptoService } from '../../../domain/interfaces/qr-crypto.service.interface';

describe('ValidateQRUseCase', () => {
  let validateQRUseCase: ValidateQRUseCase;
  let visitPassRepository: any;
  let tenantRepository: any;
  let cuotaRepository: any;
  let cryptoService: any;

  beforeEach(() => {
    visitPassRepository = {
      findByToken: vi.fn(),
    };
    tenantRepository = {
      findById: vi.fn(),
    };
    cuotaRepository = {
      hasOverdueFees: vi.fn(),
    };
    cryptoService = {
      verifyToken: vi.fn(),
    };

    validateQRUseCase = new ValidateQRUseCase(
      visitPassRepository as IVisitPassRepository,
      tenantRepository as ITenantRepository,
      cuotaRepository as ICuotaRepository,
      cryptoService as IQRCryptoService
    );
  });

  it('debe rechazar si la firma es inválida o el token fue adulterado', async () => {
    cryptoService.verifyToken.mockReturnValue(null);
    const result = await validateQRUseCase.execute('invalid-token', 'condominio-1');
    expect(result.estado).toBe('INVALIDO');
    expect(result.mensaje).toContain('inválida');
  });

  it('debe retornar VALIDO (verde) si el pase está correcto', async () => {
    cryptoService.verifyToken.mockReturnValue({ condominioId: 'condominio-1', expiresAt: Date.now() + 10000 });
    visitPassRepository.findByToken.mockResolvedValue({
      estado: 'ACTIVO',
      fecha_expiracion: new Date(Date.now() + 10000),
      propiedad_id: 'prop-1'
    });
    tenantRepository.findById.mockResolvedValue({
      configuracion: { bloquear_visitas_morosos: false }
    });

    const result = await validateQRUseCase.execute('valid-token', 'condominio-1');
    expect(result.estado).toBe('VALIDO');
  });

  it('debe rechazar (rojo) si el pase ha expirado', async () => {
    cryptoService.verifyToken.mockReturnValue({ condominioId: 'condominio-1', expiresAt: Date.now() - 10000 });
    visitPassRepository.findByToken.mockResolvedValue({
      estado: 'ACTIVO',
      fecha_expiracion: new Date(Date.now() - 10000),
      propiedad_id: 'prop-1'
    });

    const result = await validateQRUseCase.execute('expired-token', 'condominio-1');
    expect(result.estado).toBe('EXPIRADO');
  });

  it('debe rechazar (rojo) si el pase ya fue usado', async () => {
    cryptoService.verifyToken.mockReturnValue({ condominioId: 'condominio-1', expiresAt: Date.now() + 10000 });
    visitPassRepository.findByToken.mockResolvedValue({
      estado: 'UTILIZADO',
      fecha_expiracion: new Date(Date.now() + 10000),
      propiedad_id: 'prop-1'
    });

    const result = await validateQRUseCase.execute('used-token', 'condominio-1');
    expect(result.estado).toBe('USADO');
  });

  it('debe retornar ANFITRION_MOROSO (amarillo) si residente tiene mora y política está activa', async () => {
    cryptoService.verifyToken.mockReturnValue({ condominioId: 'condominio-1', expiresAt: Date.now() + 10000 });
    visitPassRepository.findByToken.mockResolvedValue({
      estado: 'ACTIVO',
      fecha_expiracion: new Date(Date.now() + 10000),
      propiedad_id: 'prop-1'
    });
    tenantRepository.findById.mockResolvedValue({
      configuracion: { bloquear_visitas_morosos: true, meses_para_moroso: 2 }
    });
    cuotaRepository.hasOverdueFees.mockResolvedValue(true);

    const result = await validateQRUseCase.execute('valid-token', 'condominio-1');
    expect(result.estado).toBe('ANFITRION_MOROSO');
    expect(result.mensaje).toContain('suspensión');
  });
});
