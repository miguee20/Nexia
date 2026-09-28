import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExportGateLogsCsvUseCase } from './export-gate-logs-csv.use-case';
import { IGateLogRepository } from '../../../domain/interfaces/gate-log.repository.interface';

describe('ExportGateLogsCsvUseCase', () => {
  let exportGateLogsCsvUseCase: ExportGateLogsCsvUseCase;
  let gateLogRepository: any;

  beforeEach(() => {
    gateLogRepository = {
      findAllStream: vi.fn(),
    };
    exportGateLogsCsvUseCase = new ExportGateLogsCsvUseCase(gateLogRepository as IGateLogRepository);
  });

  it('debe generar csv con cabeceras y filas correspondientes', async () => {
    gateLogRepository.findAllStream.mockResolvedValue([
      {
        id: 'log-1',
        entrada: new Date('2023-01-01T10:00:00Z'),
        salida: null,
        nombre_visitante: 'Juan',
        placa_vehiculo: 'ABC',
        tipo_registro: 'ENTRADA_QR',
        guardia: { nombre_completo: 'Guardia 1' },
        pase: { propiedad: { identificador: 'A-1' } }
      }
    ]);

    const result = await exportGateLogsCsvUseCase.execute('condo-1', {});
    const lines = result.split('\n');
    
    expect(lines.length).toBe(2); // header + 1 row
    expect(lines[0]).toBe('Fecha/Hora Entrada,Fecha/Hora Salida,Visitante/Repartidor,Placa,Propiedad Destino,Tipo Evento,Guardia,ID Registro');
    expect(lines[1]).toContain('Juan');
    expect(lines[1]).toContain('A-1');
    expect(lines[1]).toContain('Guardia 1');
  });
});
