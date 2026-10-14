import { describe, it, expect, vi } from 'vitest';
import { GetMonthlyReportUseCase } from './get-monthly-report.use-case';
import { Decimal } from '../../../domain/value-objects/money';

describe('GetMonthlyReportUseCase', () => {
  const build = (emitido: string, recaudado: string) => {
    const repo: any = {
      getMonthlyReport: vi.fn().mockResolvedValue({
        total_emitido: new Decimal(emitido),
        total_recaudado: new Decimal(recaudado),
        monto_mora: new Decimal('250.00'),
        pagos_conciliados: [],
      }),
    };
    return { repo, useCase: new GetMonthlyReportUseCase(repo) };
  };

  it('computes the collection rate with exact decimals', async () => {
    const { repo, useCase } = build('3000.00', '2000.00');
    const report = await useCase.execute('tenant-a', { mes: 10, anio: 2026 });
    expect(repo.getMonthlyReport).toHaveBeenCalledWith('tenant-a', 10, 2026);
    expect(report.tasa_recaudacion.toFixed(2)).toBe('66.67');
    expect(report.monto_mora.toFixed(2)).toBe('250.00');
  });

  it('returns 0% when nothing was issued', async () => {
    const { useCase } = build('0', '0');
    const report = await useCase.execute('tenant-a', { mes: 1, anio: 2026 });
    expect(report.tasa_recaudacion.toFixed(2)).toBe('0.00');
  });
});
