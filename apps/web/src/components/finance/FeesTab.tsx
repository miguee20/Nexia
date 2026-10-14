'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CuotaStatusBadge } from '@/components/finance/StatusBadges';
import { financeService, Cuota, EstadoCuota } from '@/services/finance.service';
import { propertyService } from '@/services/property.service';
import { MONTH_NAMES, formatDate, formatMoney, getApiErrorMessage } from '@/lib/format';

export interface PropertyOption {
  id: string;
  identificador: string;
}

const ALL = '__all__';
const PAGE_SIZE = 10;
const MONEY_RE = /^\d+(\.\d{1,2})?$/;

function isPositiveMoney(value: string): boolean {
  return MONEY_RE.test(value.trim()) && /[1-9]/.test(value);
}

export function FeesTab({ properties }: { properties: PropertyOption[] }) {
  const now = new Date();
  const mes = now.getMonth() + 1;
  const anio = now.getFullYear();
  const mesLabel = `${MONTH_NAMES[mes - 1]} ${anio}`;

  // ----- history -----
  const [fees, setFees] = useState<Cuota[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [estado, setEstado] = useState<string>(ALL);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const propertyMap = useMemo(() => new Map(properties.map((p) => [p.id, p.identificador])), [properties]);

  const loadFees = useCallback(async () => {
    setLoading(true);
    try {
      const res = await financeService.listFees({
        ...(estado !== ALL && { estado: estado as EstadoCuota }),
        ...(desde && { fecha_desde: desde }),
        ...(hasta && { fecha_hasta: hasta }),
        limit: PAGE_SIZE,
        offset,
      });
      setFees(res.data);
      setTotal(res.total);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo cargar el historial de cuotas'));
    } finally {
      setLoading(false);
    }
  }, [estado, desde, hasta, offset]);

  useEffect(() => {
    void loadFees();
  }, [loadFees]);

  // ----- batch emission -----
  const [batchOpen, setBatchOpen] = useState(false);
  const [batchConcepto, setBatchConcepto] = useState(`Cuota de mantenimiento ${mesLabel}`);
  const [batchOverride, setBatchOverride] = useState('');
  const [occupiedCount, setOccupiedCount] = useState<number | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);

  const batchConceptoValid = batchConcepto.trim().length >= 3;
  const batchOverrideValid = batchOverride.trim() === '' || isPositiveMoney(batchOverride);

  const openBatch = async () => {
    setBatchOpen(true);
    setOccupiedCount(null);
    try {
      const res = await propertyService.list({ estado: 'OCUPADA' });
      setOccupiedCount(res.total ?? res.data?.length ?? 0);
    } catch {
      setOccupiedCount(null);
    }
  };

  const submitBatch = async () => {
    setBatchBusy(true);
    try {
      const result = await financeService.emitBatchFees({
        mes,
        anio,
        concepto: batchConcepto.trim(),
        ...(batchOverride.trim() && { monto_override: batchOverride.trim() }),
      });
      toast.success(
        `Se emitieron ${result.created} cuotas${result.skipped ? ` (${result.skipped} ya existían y se omitieron)` : ''}.`
      );
      setBatchOpen(false);
      setOffset(0);
      await loadFees();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudieron emitir las cuotas'));
    } finally {
      setBatchBusy(false);
    }
  };

  // ----- individual emission -----
  const [indOpen, setIndOpen] = useState(false);
  const [indProp, setIndProp] = useState('');
  const [indConcepto, setIndConcepto] = useState('');
  const [indMonto, setIndMonto] = useState('');
  const [indVence, setIndVence] = useState('');
  const [indBusy, setIndBusy] = useState(false);

  const indValid =
    !!indProp && indConcepto.trim().length >= 3 && isPositiveMoney(indMonto) && /^\d{4}-\d{2}-\d{2}$/.test(indVence);

  const submitIndividual = async () => {
    setIndBusy(true);
    try {
      await financeService.emitIndividualFee({
        propiedad_id: indProp,
        concepto: indConcepto.trim(),
        monto: indMonto.trim(),
        fecha_vencimiento: indVence,
      });
      toast.success('Cuota emitida correctamente.');
      setIndOpen(false);
      setIndProp('');
      setIndConcepto('');
      setIndMonto('');
      setIndVence('');
      setOffset(0);
      await loadFees();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo emitir la cuota'));
    } finally {
      setIndBusy(false);
    }
  };

  // ----- late fees -----
  const [lateOpen, setLateOpen] = useState(false);
  const [lateBusy, setLateBusy] = useState(false);

  const submitLateFees = async () => {
    setLateBusy(true);
    try {
      const res = await financeService.applyLateFees();
      toast.success(
        res.updated > 0
          ? `Recargo aplicado a ${res.updated} cuotas vencidas.`
          : 'No hay cuotas pendientes con fecha vencida.'
      );
      setLateOpen(false);
      await loadFees();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudieron aplicar los recargos'));
    } finally {
      setLateBusy(false);
    }
  };

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-xs sm:p-5">
          <h2 className="text-sm font-medium text-zinc-900">Emisión masiva mensual</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Genera la cuota base del condominio para todas las propiedades ocupadas.
          </p>
          <p className="mt-4 text-xs font-medium uppercase tracking-wider text-zinc-500">Periodo</p>
          <p className="text-lg font-semibold text-zinc-900 tabular-nums">{mesLabel}</p>
          <Button className="mt-4 h-11 w-full sm:h-9 sm:w-auto" onClick={openBatch}>
            Emitir Cuotas del Mes
          </Button>
        </section>

        <section className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-xs sm:p-5">
          <h2 className="text-sm font-medium text-zinc-900">Cobros individuales y recargos</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Emite multas o cobros extraordinarios a una propiedad, o ejecuta el recargo por mora según la política del condominio.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" className="h-11 sm:h-9" onClick={() => setIndOpen(true)}>
              Emitir cuota individual
            </Button>
            <Button variant="outline" className="h-11 sm:h-9" onClick={() => setLateOpen(true)}>
              Aplicar Recargos por Mora
            </Button>
          </div>
        </section>
      </div>

      <section className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="sm:w-48">
            <Label className="text-xs text-zinc-500">Estado</Label>
            <Select
              value={estado}
              onValueChange={(v) => {
                setEstado(v);
                setOffset(0);
              }}
            >
              <SelectTrigger className="h-11 sm:h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                <SelectItem value="PENDIENTE">Pendiente</SelectItem>
                <SelectItem value="VENCIDA">Vencida</SelectItem>
                <SelectItem value="PARCIAL">Pago parcial</SelectItem>
                <SelectItem value="PAGADA">Pagada</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="fees-desde" className="text-xs text-zinc-500">Vence desde</Label>
            <Input
              id="fees-desde"
              type="date"
              className="h-11 tabular-nums sm:h-9"
              value={desde}
              onChange={(e) => {
                setDesde(e.target.value);
                setOffset(0);
              }}
            />
          </div>
          <div>
            <Label htmlFor="fees-hasta" className="text-xs text-zinc-500">Vence hasta</Label>
            <Input
              id="fees-hasta"
              type="date"
              className="h-11 tabular-nums sm:h-9"
              value={hasta}
              onChange={(e) => {
                setHasta(e.target.value);
                setOffset(0);
              }}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Propiedad</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead className="hidden sm:table-cell">Vence</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead className="hidden md:table-cell text-right">Recargo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-zinc-500">
                    Cargando cuotas…
                  </TableCell>
                </TableRow>
              ) : fees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-zinc-500">
                    No hay cuotas que coincidan con los filtros.
                  </TableCell>
                </TableRow>
              ) : (
                fees.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium text-zinc-900">{propertyMap.get(f.propiedad_id) ?? '—'}</TableCell>
                    <TableCell className="text-zinc-700">{f.concepto}</TableCell>
                    <TableCell className="hidden text-zinc-700 tabular-nums sm:table-cell">{formatDate(f.fecha_vencimiento)}</TableCell>
                    <TableCell className="text-right text-zinc-900 tabular-nums">{formatMoney(f.monto_original)}</TableCell>
                    <TableCell className="hidden text-right text-zinc-700 tabular-nums md:table-cell">{formatMoney(f.monto_recargo)}</TableCell>
                    <TableCell>
                      <CuotaStatusBadge estado={f.estado} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm text-zinc-500">
          <span className="tabular-nums">
            Página {page} de {pages} · {total} cuotas
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-11 sm:h-8"
              disabled={offset === 0 || loading}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-11 sm:h-8"
              disabled={offset + PAGE_SIZE >= total || loading}
              onClick={() => setOffset(offset + PAGE_SIZE)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </section>

      {/* Batch confirmation */}
      <Dialog open={batchOpen} onOpenChange={(o) => !batchBusy && setBatchOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emitir cuotas de {mesLabel}</DialogTitle>
            <DialogDescription>
              {occupiedCount === null
                ? 'Se cargará la cuota base a todas las propiedades ocupadas.'
                : `Se cargará la cuota a ${occupiedCount} propiedades ocupadas. Las que ya tengan este concepto en el mes se omiten.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="batch-concepto">Concepto</Label>
              <Input id="batch-concepto" value={batchConcepto} onChange={(e) => setBatchConcepto(e.target.value)} className="h-11 sm:h-9" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="batch-monto">Monto distinto a la cuota base (opcional)</Label>
              <Input
                id="batch-monto"
                inputMode="decimal"
                placeholder="Usar la cuota base configurada"
                value={batchOverride}
                onChange={(e) => setBatchOverride(e.target.value)}
                className="h-11 tabular-nums sm:h-9"
              />
              {!batchOverrideValid && <p className="text-xs text-rose-700">Monto positivo con máximo 2 decimales.</p>}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="h-11 sm:h-9" disabled={batchBusy} onClick={() => setBatchOpen(false)}>
              Cancelar
            </Button>
            <Button className="h-11 sm:ml-2 sm:h-9" disabled={batchBusy || !batchConceptoValid || !batchOverrideValid} onClick={submitBatch}>
              {batchBusy ? 'Emitiendo…' : 'Confirmar emisión'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Individual */}
      <Dialog open={indOpen} onOpenChange={(o) => !indBusy && setIndOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Emitir cuota individual</DialogTitle>
            <DialogDescription>Para multas o cobros extraordinarios a una propiedad.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Propiedad</Label>
              <Select value={indProp} onValueChange={setIndProp}>
                <SelectTrigger className="h-11 sm:h-9">
                  <SelectValue placeholder="Selecciona una propiedad" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.identificador}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ind-concepto">Concepto</Label>
              <Input id="ind-concepto" value={indConcepto} onChange={(e) => setIndConcepto(e.target.value)} className="h-11 sm:h-9" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="ind-monto">Monto</Label>
                <Input id="ind-monto" inputMode="decimal" placeholder="0.00" value={indMonto} onChange={(e) => setIndMonto(e.target.value)} className="h-11 tabular-nums sm:h-9" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ind-vence">Fecha de vencimiento</Label>
                <Input id="ind-vence" type="date" value={indVence} onChange={(e) => setIndVence(e.target.value)} className="h-11 tabular-nums sm:h-9" />
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="h-11 sm:h-9" disabled={indBusy} onClick={() => setIndOpen(false)}>
              Cancelar
            </Button>
            <Button className="h-11 sm:ml-2 sm:h-9" disabled={!indValid || indBusy} onClick={submitIndividual}>
              {indBusy ? 'Emitiendo…' : 'Emitir cuota'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Late fees confirmation */}
      <Dialog open={lateOpen} onOpenChange={(o) => !lateBusy && setLateOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aplicar recargos por mora</DialogTitle>
            <DialogDescription>
              Las cuotas pendientes con fecha de vencimiento anterior a hoy recibirán el porcentaje de recargo configurado
              por el condominio y pasarán a estado VENCIDA.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="h-11 sm:h-9" disabled={lateBusy} onClick={() => setLateOpen(false)}>
              Cancelar
            </Button>
            <Button className="h-11 sm:ml-2 sm:h-9" disabled={lateBusy} onClick={submitLateFees}>
              {lateBusy ? 'Aplicando…' : 'Aplicar recargos'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
