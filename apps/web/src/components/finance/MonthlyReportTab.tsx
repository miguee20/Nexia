'use client';

import { useCallback, useEffect, useState } from 'react';
import { Download, Printer, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from '@/components/finance/StatCard';
import { financeService, MonthlyReport } from '@/services/finance.service';
import { MONTH_NAMES, formatDate, formatMoney, getApiErrorMessage } from '@/lib/format';

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function MonthlyReportTab() {
  const now = new Date();
  const [mes, setMes] = useState(String(now.getMonth() + 1));
  const [anio, setAnio] = useState(String(now.getFullYear()));
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [loading, setLoading] = useState(false);

  const anioValid = /^\d{4}$/.test(anio);

  const load = useCallback(async () => {
    if (!/^\d{4}$/.test(anio)) return;
    setLoading(true);
    try {
      setReport(await financeService.getMonthlyReport(Number(mes), Number(anio)));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo generar el reporte'));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const exportCsv = () => {
    if (!report) return;
    const header = ['Fecha conciliación', 'Propiedad', 'Concepto', 'Monto'];
    const rows = report.pagos_conciliados.map((p) => [
      formatDate(p.fecha_revision),
      p.propiedad_identificador,
      p.concepto,
      p.monto,
    ]);
    const summary = [
      ['Periodo', `${MONTH_NAMES[report.mes - 1]} ${report.anio}`],
      ['Total emitido', report.total_emitido],
      ['Total recaudado', report.total_recaudado],
      ['Saldo en mora', report.monto_mora],
      ['Eficiencia de cobro (%)', report.tasa_recaudacion],
    ];
    const csv = [
      ...summary.map((r) => r.map(csvCell).join(',')),
      '',
      header.map(csvCell).join(','),
      ...rows.map((r) => r.map((c) => csvCell(String(c))).join(',')),
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-financiero-${report.anio}-${String(report.mes).padStart(2, '0')}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    toast.success('Reporte exportado a CSV.');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end print:hidden">
        <div className="sm:w-48">
          <Label className="text-xs text-zinc-500">Mes</Label>
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger className="h-11 sm:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTH_NAMES.map((name, idx) => (
                <SelectItem key={name} value={String(idx + 1)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:w-28">
          <Label htmlFor="report-anio" className="text-xs text-zinc-500">Año</Label>
          <Input
            id="report-anio"
            inputMode="numeric"
            maxLength={4}
            value={anio}
            onChange={(e) => setAnio(e.target.value.replace(/\D/g, ''))}
            className="h-11 tabular-nums sm:h-9"
          />
        </div>
        <Button className="h-11 sm:h-9" disabled={!anioValid || loading} onClick={load}>
          <RefreshCw className="h-4 w-4" /> {loading ? 'Actualizando…' : 'Actualizar'}
        </Button>
        <div className="flex gap-2 sm:ml-auto">
          <Button variant="outline" className="h-11 flex-1 sm:h-9 sm:flex-none" disabled={!report} onClick={exportCsv}>
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
          <Button variant="outline" className="h-11 flex-1 sm:h-9 sm:flex-none" disabled={!report} onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
        </div>
      </div>

      {report && (
        <>
          <h2 className="text-sm font-medium text-zinc-900">
            Reporte de {MONTH_NAMES[report.mes - 1]} <span className="tabular-nums">{report.anio}</span>
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Recaudado" value={formatMoney(report.total_recaudado)} hint="Pagos conciliados en el periodo" />
            <StatCard label="Emitido" value={formatMoney(report.total_emitido)} hint="Cuotas emitidas en el periodo" />
            <StatCard label="Saldo en mora" value={formatMoney(report.monto_mora)} hint="Cuotas vencidas sin saldar" />
            <StatCard label="Eficiencia de cobro" value={`${report.tasa_recaudacion}%`} hint="Recaudado / emitido" />
          </div>

          <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Propiedad</TableHead>
                  <TableHead className="hidden sm:table-cell">Concepto</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.pagos_conciliados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-10 text-center text-sm text-zinc-500">
                      No hay pagos conciliados en este periodo.
                    </TableCell>
                  </TableRow>
                ) : (
                  report.pagos_conciliados.map((p) => (
                    <TableRow key={p.pago_id}>
                      <TableCell className="text-zinc-700 tabular-nums">{formatDate(p.fecha_revision)}</TableCell>
                      <TableCell className="font-medium text-zinc-900">{p.propiedad_identificador}</TableCell>
                      <TableCell className="hidden text-zinc-700 sm:table-cell">{p.concepto}</TableCell>
                      <TableCell className="text-right text-zinc-900 tabular-nums">{formatMoney(p.monto)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
