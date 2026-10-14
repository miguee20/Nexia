'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Download, Info, Paperclip } from 'lucide-react';
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
import { CuotaStatusBadge, PagoStatusBadge } from '@/components/finance/StatusBadges';
import { financeService, AccountStatement, Pago } from '@/services/finance.service';
import { formatDate, formatMoney, getApiErrorMessage, todayInputValue } from '@/lib/format';

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
const MONEY_RE = /^\d+(\.\d{1,2})?$/;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

export default function MisCuotasPage() {
  const [statement, setStatement] = useState<AccountStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      setStatement(await financeService.getAccountStatement());
    } catch (error) {
      setStatement(null);
      setErrorMsg(getApiErrorMessage(error, 'No se pudo cargar tu estado de cuenta'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cuotaById = useMemo(() => new Map((statement?.cuotas ?? []).map((c) => [c.id, c])), [statement]);
  const payable = useMemo(() => (statement?.cuotas ?? []).filter((c) => c.estado !== 'PAGADA'), [statement]);
  const pendingReviewCuotas = useMemo(
    () => new Set((statement?.pagos ?? []).filter((p) => p.estado === 'PENDIENTE_REVISION').map((p) => p.cuota_id)),
    [statement]
  );

  // Pending/overdue first, then paid; by due date
  const sortedCuotas = useMemo(() => {
    const rank = (estado: string) => (estado === 'PAGADA' ? 1 : 0);
    return [...(statement?.cuotas ?? [])].sort(
      (a, b) => rank(a.estado) - rank(b.estado) || a.fecha_vencimiento.localeCompare(b.fecha_vencimiento)
    );
  }, [statement]);

  // ----- submit payment dialog -----
  const [payOpen, setPayOpen] = useState(false);
  const [cuotaId, setCuotaId] = useState('');
  const [monto, setMonto] = useState('');
  const [referencia, setReferencia] = useState('');
  const [fechaPago, setFechaPago] = useState(todayInputValue());
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setCuotaId('');
    setMonto('');
    setReferencia('');
    setFechaPago(todayInputValue());
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const openPay = (preselect?: string) => {
    resetForm();
    const first = preselect ?? payable[0]?.id ?? '';
    if (first) {
      setCuotaId(first);
      setMonto(cuotaById.get(first)?.saldo ?? '');
    }
    setPayOpen(true);
  };

  const onSelectCuota = (id: string) => {
    setCuotaId(id);
    setMonto(cuotaById.get(id)?.saldo ?? '');
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] ?? null;
    if (!selected) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (!ACCEPTED_TYPES.includes(selected.type)) {
      toast.error('Formato no permitido. Usa PNG, JPG, WEBP o PDF.');
      e.target.value = '';
      return;
    }
    if (selected.size > MAX_FILE_BYTES) {
      toast.error('El archivo supera el máximo de 4 MB.');
      e.target.value = '';
      return;
    }
    setFile(selected);
    setPreview(selected.type.startsWith('image/') ? await readAsDataUrl(selected) : null);
  };

  const montoValid = MONEY_RE.test(monto.trim()) && /[1-9]/.test(monto);
  const referenciaValid = referencia.trim() === '' || referencia.trim().length >= 3;
  const formValid = !!cuotaId && montoValid && referenciaValid && !!fechaPago && !!file;

  const submitPayment = async () => {
    if (!file) return;
    setBusy(true);
    try {
      const comprobante = await readAsDataUrl(file);
      await financeService.submitPayment({
        cuota_id: cuotaId,
        monto: monto.trim(),
        ...(referencia.trim() && { referencia_bancaria: referencia.trim() }),
        comprobante_url: comprobante,
        fecha_pago: fechaPago,
      });
      toast.success('Comprobante enviado. Quedó en revisión por la administración.');
      setPayOpen(false);
      resetForm();
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo registrar el pago'));
    } finally {
      setBusy(false);
    }
  };

  // ----- rejection reason / receipt -----
  const [reasonPago, setReasonPago] = useState<Pago | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadReceipt = async (pagoId: string) => {
    setDownloading(pagoId);
    try {
      await financeService.downloadReceiptPdf(pagoId);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo descargar el recibo'));
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return <p className="py-10 text-center text-sm text-zinc-500">Cargando tu estado de cuenta…</p>;
  }

  if (!statement) {
    return (
      <div className="space-y-2 py-10 text-center">
        <p className="text-sm font-medium text-zinc-900">Estado de cuenta no disponible</p>
        <p className="text-sm text-zinc-500">{errorMsg}</p>
        <Button variant="outline" className="h-11 sm:h-9" onClick={load}>
          Reintentar
        </Button>
      </div>
    );
  }

  const { resumen } = statement;
  const pendientes = resumen.cuotas_emitidas - resumen.cuotas_pagadas;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 md:text-2xl">Mis Cuotas</h1>
        <p className="text-sm text-zinc-500">
          Estado de cuenta de <span className="font-medium text-zinc-700">{statement.propiedad.identificador}</span>.
        </p>
      </div>

      {/* Balance */}
      <section className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-xs sm:p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Balance total adeudado</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 tabular-nums">
          {formatMoney(resumen.balance_adeudado)}
        </p>
        <p className="mt-1 text-sm text-zinc-500 tabular-nums">
          {pendientes} {pendientes === 1 ? 'cuota pendiente' : 'cuotas pendientes'} · {resumen.cuotas_vencidas}{' '}
          {resumen.cuotas_vencidas === 1 ? 'vencida' : 'vencidas'} · {resumen.cuotas_pagadas} pagadas
        </p>
        <Button className="mt-4 h-11 w-full sm:h-9 sm:w-auto" disabled={payable.length === 0} onClick={() => openPay()}>
          Registrar Pago
        </Button>
      </section>

      {/* Fees */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-900">Cuotas</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Concepto</TableHead>
                <TableHead className="hidden sm:table-cell">Vence</TableHead>
                <TableHead className="hidden md:table-cell text-right">Recargo</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCuotas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-zinc-500">
                    Aún no tienes cuotas emitidas.
                  </TableCell>
                </TableRow>
              ) : (
                sortedCuotas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-zinc-900">
                      <span className="font-medium">{c.concepto}</span>
                      <span className="block text-xs text-zinc-500 tabular-nums sm:hidden">Vence {formatDate(c.fecha_vencimiento)}</span>
                    </TableCell>
                    <TableCell className="hidden text-zinc-700 tabular-nums sm:table-cell">{formatDate(c.fecha_vencimiento)}</TableCell>
                    <TableCell className="hidden text-right text-zinc-700 tabular-nums md:table-cell">{formatMoney(c.monto_recargo)}</TableCell>
                    <TableCell className="text-right font-medium text-zinc-900 tabular-nums">{formatMoney(c.saldo)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <CuotaStatusBadge estado={c.estado} />
                        {pendingReviewCuotas.has(c.id) && <PagoStatusBadge estado="PENDIENTE_REVISION" />}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Payments */}
      <section className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-900">Historial de pagos y recibos</h2>
        <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-xs">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead className="hidden sm:table-cell">Concepto</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statement.pagos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-sm text-zinc-500">
                    Todavía no has registrado pagos.
                  </TableCell>
                </TableRow>
              ) : (
                statement.pagos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-zinc-700 tabular-nums">{formatDate(p.fecha_pago)}</TableCell>
                    <TableCell className="hidden text-zinc-700 sm:table-cell">{cuotaById.get(p.cuota_id)?.concepto ?? '—'}</TableCell>
                    <TableCell className="text-right font-medium text-zinc-900 tabular-nums">{formatMoney(p.monto)}</TableCell>
                    <TableCell>
                      <PagoStatusBadge estado={p.estado} />
                    </TableCell>
                    <TableCell className="text-right">
                      {p.estado === 'RECHAZADO' && (
                        <Button variant="ghost" size="sm" className="h-11 sm:h-8" onClick={() => setReasonPago(p)}>
                          <Info className="h-4 w-4" /> Ver motivo
                        </Button>
                      )}
                      {p.estado === 'APROBADO' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-11 sm:h-8"
                          disabled={downloading === p.id}
                          onClick={() => downloadReceipt(p.id)}
                        >
                          <Download className="h-4 w-4" /> {downloading === p.id ? 'Descargando…' : 'Recibo'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Register payment */}
      <Dialog open={payOpen} onOpenChange={(o) => !busy && setPayOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar pago</DialogTitle>
            <DialogDescription>
              Sube tu comprobante bancario. La administración lo revisará y conciliará.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Cuota a pagar</Label>
              <Select value={cuotaId} onValueChange={onSelectCuota}>
                <SelectTrigger className="h-11 sm:h-9">
                  <SelectValue placeholder="Selecciona una cuota" />
                </SelectTrigger>
                <SelectContent>
                  {payable.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.concepto} · {formatMoney(c.saldo)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="pay-monto">Monto pagado</Label>
                <Input id="pay-monto" inputMode="decimal" value={monto} onChange={(e) => setMonto(e.target.value)} className="h-11 tabular-nums sm:h-9" />
                {monto !== '' && !montoValid && <p className="text-xs text-rose-700">Monto positivo con máximo 2 decimales.</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pay-fecha">Fecha de pago</Label>
                <Input id="pay-fecha" type="date" value={fechaPago} max={todayInputValue()} onChange={(e) => setFechaPago(e.target.value)} className="h-11 tabular-nums sm:h-9" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-ref">Número de referencia bancaria</Label>
              <Input id="pay-ref" value={referencia} onChange={(e) => setReferencia(e.target.value)} className="h-11 tabular-nums sm:h-9" />
              {!referenciaValid && <p className="text-xs text-rose-700">Mínimo 3 caracteres.</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pay-file">Comprobante (PNG, JPG, WEBP o PDF · máx. 4 MB)</Label>
              <Input id="pay-file" ref={fileRef} type="file" accept={ACCEPTED_TYPES.join(',')} onChange={onFileChange} className="h-auto min-h-11 py-2 sm:h-9 sm:py-1" />
              {file && (
                <p className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
                  <Paperclip className="h-3.5 w-3.5" /> {file.name}
                </p>
              )}
              {preview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Vista previa del comprobante" className="mt-1 max-h-40 w-full rounded-md border border-zinc-200 bg-zinc-50 object-contain" />
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="h-11 sm:h-9" disabled={busy} onClick={() => setPayOpen(false)}>
              Cancelar
            </Button>
            <Button className="h-11 sm:ml-2 sm:h-9" disabled={!formValid || busy} onClick={submitPayment}>
              {busy ? 'Enviando…' : 'Enviar comprobante'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection reason */}
      <Dialog open={!!reasonPago} onOpenChange={(o) => !o && setReasonPago(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motivo del rechazo</DialogTitle>
            <DialogDescription>
              Pago de <span className="tabular-nums">{reasonPago ? formatMoney(reasonPago.monto) : ''}</span> del{' '}
              <span className="tabular-nums">{reasonPago ? formatDate(reasonPago.fecha_pago) : ''}</span>.
            </DialogDescription>
          </DialogHeader>
          <p className="rounded-lg border border-rose-200/60 bg-rose-50 p-3 text-sm text-rose-700">
            {reasonPago?.motivo_rechazo ?? 'Sin motivo registrado.'}
          </p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" className="h-11 sm:h-9" onClick={() => setReasonPago(null)}>
              Cerrar
            </Button>
            <Button
              className="h-11 sm:ml-2 sm:h-9"
              disabled={payable.length === 0}
              onClick={() => {
                const cuota = reasonPago?.cuota_id;
                setReasonPago(null);
                openPay(cuota && cuotaById.get(cuota)?.estado !== 'PAGADA' ? cuota : undefined);
              }}
            >
              Registrar nuevo pago
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
