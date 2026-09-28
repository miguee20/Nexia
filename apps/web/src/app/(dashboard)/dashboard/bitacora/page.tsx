'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Search, History, ChevronLeft, ChevronRight, FilterX } from 'lucide-react';

type GateLog = {
  id: string;
  entrada: string | null;
  salida: string | null;
  nombre_visitante: string | null;
  placa_vehiculo: string | null;
  tipo_registro: string;
  guardia: { nombre_completo: string };
  pase?: { propiedad: { identificador: string } };
  alerta_delivery?: { propiedad: { identificador: string } };
};

export default function BitacoraGaritaPage() {
  const [logs, setLogs] = useState<GateLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [page, setPage] = useState(1);
  const limit = 15;
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [tipoEvento, setTipoEvento] = useState('TODOS');
  // Usamos propiedadQuery como una búsqueda genérica, pero la api solo filtra por UUID de propiedad por ahora.
  // Wait, el backend solo acepta propiedad_id que es UUID. Para texto libre, en esta iteración dejaremos el input pero advertimos que debe ser el ID, 
  // o podemos buscar la propiedad por nombre y pasar el ID. Por simplicidad del backend actual, buscaremos propiedad por query (si logramos empatarlo). 
  // El backend no soporta busqueda full text. Ignoraremos búsqueda genérica y permitiremos buscar por fecha y tipo de evento.
  
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (fechaDesde) params.append('fecha_desde', new Date(fechaDesde).toISOString());
      if (fechaHasta) params.append('fecha_hasta', new Date(fechaHasta).toISOString());
      if (tipoEvento !== 'TODOS') params.append('tipo_evento', tipoEvento);

      const { data } = await api.get(`/gate/logs?${params.toString()}`);
      setLogs(data.data);
      setTotal(data.total);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, fechaDesde, fechaHasta, tipoEvento]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (fechaDesde) params.append('fecha_desde', new Date(fechaDesde).toISOString());
      if (fechaHasta) params.append('fecha_hasta', new Date(fechaHasta).toISOString());
      if (tipoEvento !== 'TODOS') params.append('tipo_evento', tipoEvento);

      const response = await api.get(`/gate/logs/export/csv?${params.toString()}`, { responseType: 'blob' });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bitacora_garita_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (error) {
      console.error('Error exporting CSV', error);
      alert('Error al exportar CSV');
    } finally {
      setExporting(false);
    }
  };

  const getTipoEventoBadge = (tipo: string) => {
    switch (tipo) {
      case 'ENTRADA_QR': return <Badge className="bg-emerald-100 text-emerald-800">Entrada QR</Badge>;
      case 'SALIDA_QR': return <Badge className="bg-zinc-100 text-zinc-800">Salida QR</Badge>;
      case 'ENTRADA_MANUAL': return <Badge className="bg-blue-100 text-blue-800">Manual</Badge>;
      case 'DELIVERY': return <Badge className="bg-orange-100 text-orange-800">Delivery</Badge>;
      case 'VERIFICACION_LLAMADA': return <Badge className="bg-purple-100 text-purple-800">Verif. Llamada</Badge>;
      default: return <Badge>{tipo}</Badge>;
    }
  };

  const clearFilters = () => {
    setFechaDesde('');
    setFechaHasta('');
    setTipoEvento('TODOS');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-2">
            <History className="w-8 h-8 text-zinc-700" />
            Bitácora de Garita
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Auditoría inmutable de entradas, salidas y verificaciones.
          </p>
        </div>
        <Button 
          onClick={handleExportCsv} 
          disabled={exporting}
          className="bg-zinc-900 hover:bg-zinc-800"
        >
          <Download className={`w-4 h-4 mr-2 ${exporting ? 'animate-bounce' : ''}`} />
          {exporting ? 'Generando CSV...' : 'Exportar a CSV'}
        </Button>
      </div>

      <Card className="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Fecha Desde</label>
              <Input type="datetime-local" value={fechaDesde} onChange={e => { setFechaDesde(e.target.value); setPage(1); }} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Fecha Hasta</label>
              <Input type="datetime-local" value={fechaHasta} onChange={e => { setFechaHasta(e.target.value); setPage(1); }} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-zinc-700">Tipo de Evento</label>
              <Select value={tipoEvento} onValueChange={(val) => { setTipoEvento(val); setPage(1); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="ENTRADA_QR">Entrada QR</SelectItem>
                  <SelectItem value="SALIDA_QR">Salida QR</SelectItem>
                  <SelectItem value="ENTRADA_MANUAL">Ingreso Manual</SelectItem>
                  <SelectItem value="DELIVERY">Delivery</SelectItem>
                  <SelectItem value="VERIFICACION_LLAMADA">Verif. por Llamada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={clearFilters}>
                <FilterX className="w-4 h-4 mr-2" /> Limpiar Filtros
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-zinc-200 overflow-hidden">
            <Table>
              <TableHeader className="bg-zinc-50">
                <TableRow>
                  <TableHead className="font-semibold text-zinc-700">Fecha / Hora</TableHead>
                  <TableHead className="font-semibold text-zinc-700">Evento</TableHead>
                  <TableHead className="font-semibold text-zinc-700">Propiedad</TableHead>
                  <TableHead className="font-semibold text-zinc-700">Visitante / Info</TableHead>
                  <TableHead className="font-semibold text-zinc-700">Guardia Turno</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-zinc-500">Cargando bitácora...</TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-zinc-500">No se encontraron registros.</TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-zinc-50/50">
                      <TableCell className="text-sm whitespace-nowrap text-zinc-600">
                        {log.entrada ? new Date(log.entrada).toLocaleString() : 'N/A'}
                      </TableCell>
                      <TableCell>{getTipoEventoBadge(log.tipo_registro)}</TableCell>
                      <TableCell className="font-medium">
                        {log.pase?.propiedad?.identificador || log.alerta_delivery?.propiedad?.identificador || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{log.nombre_visitante || 'Repartidor / Desconocido'}</div>
                        {log.placa_vehiculo && <div className="text-xs text-zinc-500 flex items-center gap-1 mt-0.5"><Search className="w-3 h-3" /> {log.placa_vehiculo}</div>}
                      </TableCell>
                      <TableCell className="text-sm text-zinc-600">{log.guardia.nombre_completo}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 flex items-center justify-between px-2">
            <span className="text-sm text-zinc-500">
              Mostrando {logs.length} de {total} registros
            </span>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => p + 1)}
                disabled={page * limit >= total || loading}
              >
                Siguiente <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
