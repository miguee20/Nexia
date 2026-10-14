'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatCard } from '@/components/finance/StatCard';
import { SemaforoBadge } from '@/components/finance/StatusBadges';
import { financeService, TrafficLightItem } from '@/services/finance.service';
import { formatMoney, getApiErrorMessage } from '@/lib/format';

export function DelinquencyTab() {
  const [items, setItems] = useState<TrafficLightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await financeService.getDelinquencyTrafficLight());
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'No se pudo cargar el semáforo de morosidad'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(
    () => ({
      AL_DIA: items.filter((i) => i.semaforo === 'AL_DIA').length,
      ALERTA_1_MES: items.filter((i) => i.semaforo === 'ALERTA_1_MES').length,
      MOROSO: items.filter((i) => i.semaforo === 'MOROSO').length,
    }),
    [items]
  );

  const filtered = items.filter((i) => i.identificador.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Al día" indicator="bg-emerald-500" value={counts.AL_DIA} hint="0 cuotas vencidas" />
        <StatCard label="1 mes vencido" indicator="bg-amber-500" value={counts.ALERTA_1_MES} hint="Alerta temprana" />
        <StatCard label="Morosos" indicator="bg-rose-500" value={counts.MOROSO} hint="2 o más meses vencidos" />
      </div>

      <div className="relative w-full sm:max-w-sm">
        <Search className="absolute left-2.5 top-3.5 h-4 w-4 text-zinc-400 sm:top-[10px]" />
        <Input
          placeholder="Buscar por identificador..."
          className="h-11 pl-8 text-sm sm:h-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Propiedad</TableHead>
              <TableHead>Semáforo</TableHead>
              <TableHead className="hidden sm:table-cell text-right">Cuotas vencidas</TableHead>
              <TableHead className="hidden md:table-cell text-right">Cuotas pendientes</TableHead>
              <TableHead className="text-right">Balance adeudado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-zinc-500">
                  Cargando…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-zinc-500">
                  No se encontraron propiedades.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((i) => (
                <TableRow key={i.propiedad_id}>
                  <TableCell className="font-medium text-zinc-900">{i.identificador}</TableCell>
                  <TableCell>
                    <SemaforoBadge semaforo={i.semaforo} />
                  </TableCell>
                  <TableCell className="hidden text-right text-zinc-700 tabular-nums sm:table-cell">{i.cuotas_vencidas}</TableCell>
                  <TableCell className="hidden text-right text-zinc-700 tabular-nums md:table-cell">{i.cuotas_pendientes}</TableCell>
                  <TableCell className="text-right font-medium text-zinc-900 tabular-nums">{formatMoney(i.balance_adeudado)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
