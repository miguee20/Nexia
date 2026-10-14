'use client';

import { useCallback, useEffect, useState } from 'react';
import { FileText, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { financeService, PendingPayment } from '@/services/finance.service';
import { formatDate, formatMoney, getApiErrorMessage } from '@/lib/format';

type Mode = 'view' | 'approve' | 'reject';

function isPdf(url: string | null): boolean {
  return !!url && url.startsWith('data:application/pdf');
}

function ComprobanteThumb({ url, size = 'sm' }: { url: string | null; size?: 'sm' | 'lg' }) {
  const box = size === 'sm' ? 'h-10 w-10' : 'h-56 w-full';
  if (!url) {
    return (
      <span className={`inline-flex ${box} items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-xs text-zinc-400`}>
        N/A
      </span>
    );
  }
  if (isPdf(url)) {
    return (
      <span className={`inline-flex ${box} items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-zinc-500`}>
        <FileText className="h-4 w-4" />
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="Comprobante de pago" className={`${box} rounded-md border border-zinc-200 bg-zinc-50 ${size === 'sm' ? 'object-cover' : 'object-contain'}`} />;
}

export function PaymentsReconciliationTab({ onChanged }: { onChanged?: () => void }) {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PendingPayment | null>(null);
  const [mode, setMode] = useState<Mode>('view');
  const [motivo, setMotivo] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPayments(await financeService.getPendingPayments());
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudieron cargar los pagos pendientes'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const close = () => {
    if (submitting) return;
    setSelected(null);
    setMode('view');
    setMotivo('');
  };

  const open = (pago: PendingPayment) => {
    setSelected(pago);
    setMode('view');
    setMotivo('');
  };

  const handleApprove = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await financeService.approvePayment(selected.id);
      toast.success('Pago aprobado y cuota actualizada.');
      setSubmitting(false);
      close();
      await load();
      onChanged?.();
    } catch (error) {
      setSubmitting(false);
      toast.error(getApiErrorMessage(error, 'No se pudo aprobar el pago'));
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      await financeService.rejectPayment(selected.id, motivo.trim());
      toast.success('Pago rechazado.');
      setSubmitting(false);
      close();
      await load();
    } catch (error) {
      setSubmitting(false);
      toast.error(getApiErrorMessage(error, 'No se pudo rechazar el pago'));
    }
  };

  const motivoValid = motivo.trim().length >= 5;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Comprobante</TableHead>
              <TableHead className="hidden sm:table-cell">Fecha</TableHead>
              <TableHead className="hidden md:table-cell">Residente</TableHead>
              <TableHead>Propiedad</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead className="hidden lg:table-cell">Referencia</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-zinc-500">
                  Cargando pagos…
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-sm text-zinc-500">
                  <span className="inline-flex items-center gap-2">
                    <Inbox className="h-4 w-4" /> No hay pagos pendientes de revisión.
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <ComprobanteThumb url={p.comprobante_url} />
                  </TableCell>
                  <TableCell className="hidden text-zinc-700 tabular-nums sm:table-cell">{formatDate(p.fecha_pago)}</TableCell>
                  <TableCell className="hidden text-zinc-700 md:table-cell">{p.residente.nombre_completo}</TableCell>
                  <TableCell className="font-medium text-zinc-900">{p.propiedad_identificador}</TableCell>
                  <TableCell className="text-right font-medium text-zinc-900 tabular-nums">{formatMoney(p.monto)}</TableCell>
                  <TableCell className="hidden text-zinc-700 tabular-nums lg:table-cell">{p.referencia_bancaria ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="h-11 sm:h-8" onClick={() => open(p)}>
                      Revisar
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Viewer */}
      <Dialog open={!!selected && mode === 'view'} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Revisar comprobante</DialogTitle>
            <DialogDescription>Verifica la boleta contra el estado bancario antes de conciliar.</DialogDescription>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {isPdf(selected.comprobante_url) && selected.comprobante_url ? (
                <a
                  href={selected.comprobante_url}
                  download="comprobante.pdf"
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-3 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                >
                  <FileText className="h-4 w-4" /> Descargar comprobante (PDF)
                </a>
              ) : (
                <ComprobanteThumb url={selected.comprobante_url} size="lg" />
              )}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-zinc-50/60 p-3 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">Residente</dt>
                  <dd className="text-zinc-900">{selected.residente.nombre_completo}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">Propiedad</dt>
                  <dd className="text-zinc-900">{selected.propiedad_identificador}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">Concepto</dt>
                  <dd className="text-zinc-900">{selected.cuota.concepto}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">Monto</dt>
                  <dd className="font-semibold text-zinc-900 tabular-nums">{formatMoney(selected.monto)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">Fecha de pago</dt>
                  <dd className="text-zinc-900 tabular-nums">{formatDate(selected.fecha_pago)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wider text-zinc-500">Referencia</dt>
                  <dd className="text-zinc-900 tabular-nums">{selected.referencia_bancaria ?? '—'}</dd>
                </div>
              </dl>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              className="h-11 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 sm:h-9"
              onClick={() => setMode('reject')}
            >
              Rechazar
            </Button>
            <Button className="h-11 sm:ml-2 sm:h-9" onClick={() => setMode('approve')}>
              Aprobar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve confirmation */}
      <Dialog open={!!selected && mode === 'approve'} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aprobar pago</DialogTitle>
            <DialogDescription>
              Se conciliará el pago de{' '}
              <span className="font-medium text-zinc-900 tabular-nums">{selected ? formatMoney(selected.monto) : ''}</span>.
              La cuota cambiará a <strong>PAGADA</strong> si cubre el saldo total (monto + recargo), o a{' '}
              <strong>PARCIAL</strong> si es un abono. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="h-11 sm:h-9" disabled={submitting} onClick={() => setMode('view')}>
              Volver
            </Button>
            <Button className="h-11 sm:ml-2 sm:h-9" disabled={submitting} onClick={handleApprove}>
              {submitting ? 'Aprobando…' : 'Confirmar aprobación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject with reason */}
      <Dialog open={!!selected && mode === 'reject'} onOpenChange={(o) => !o && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar pago</DialogTitle>
            <DialogDescription>El residente verá el motivo. La cuota mantiene su estado actual.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="motivo-rechazo">Motivo del rechazo</Label>
            <Textarea
              id="motivo-rechazo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Comprobante ilegible o monto no coincide"
            />
            <p className={`text-xs tabular-nums ${motivo.length > 0 && !motivoValid ? 'text-rose-700' : 'text-zinc-400'}`}>
              Mínimo 5 caracteres ({motivo.trim().length}/5)
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="h-11 sm:h-9" disabled={submitting} onClick={() => setMode('view')}>
              Volver
            </Button>
            <Button
              variant="outline"
              className="h-11 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 sm:ml-2 sm:h-9"
              disabled={!motivoValid || submitting}
              onClick={handleReject}
            >
              {submitting ? 'Rechazando…' : 'Confirmar rechazo'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
