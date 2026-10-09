'use client';

import { useEffect, useState } from 'react';
import { propertyService, PropertyFilters } from '@/services/property.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Plus, Search, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';

const propertySchema = z.object({
  identificador: z.string().min(1, 'Identificador es requerido'),
  tipo: z.enum(['CASA', 'APARTAMENTO', 'LOTE', 'LOCAL_COMERCIAL']),
  estado: z.enum(['OCUPADA', 'DESOCUPADA', 'EN_CONSTRUCCION']),
  area_m2: z.string(),
});

export default function PropiedadesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<PropertyFilters>({});
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof propertySchema>>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      identificador: '',
      tipo: 'CASA',
      estado: 'DESOCUPADA',
      area_m2: '',
    },
  });

  const loadProperties = async () => {
    setLoading(true);
    try {
      const res = await propertyService.list(filters);
      setProperties(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [filters]);

  const filteredProperties = properties.filter(p => 
    p.identificador.toLowerCase().includes(search.toLowerCase())
  );

  const onSubmitCreate = async (values: z.infer<typeof propertySchema>) => {
    try {
      await propertyService.create({
        ...values,
        area_m2: values.area_m2 ? Number(values.area_m2) : undefined
      });
      setIsCreateOpen(false);
      form.reset();
      loadProperties();
      toast.success('Propiedad creada exitosamente.');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Error al crear la propiedad');
    }
  };

  // ---------- KPI computations (derived from already-loaded state, zero API calls) ----------
  const totalProperties = properties.length;
  const occupiedCount = properties.filter(p => p.estado === 'OCUPADA').length;
  const occupancyRate = totalProperties > 0 ? Math.round((occupiedCount / totalProperties) * 100) : 0;
  const totalVehicles = properties.reduce((acc: number, p: Record<string, unknown>) => acc + (Array.isArray(p.vehiculos) ? (p.vehiculos as unknown[]).length : 0), 0);

  // ---------- Semantic status badge helper ----------
  const statusBadge = (estado: string) => {
    const map: Record<string, string> = {
      OCUPADA: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
      ACTIVO: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
      DESOCUPADA: 'bg-zinc-100 text-zinc-600 border border-zinc-200',
      EN_CONSTRUCCION: 'bg-amber-50 text-amber-700 border border-amber-200/60',
      EN_MORA: 'bg-rose-50 text-rose-700 border border-rose-200/60',
      VENCIDO: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    };
    const cls = map[estado] || 'bg-zinc-100 text-zinc-600 border border-zinc-200';
    return (
      <span className={`inline-flex items-center font-medium text-xs px-2 py-0.5 rounded-md ${cls}`}>
        {estado}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Total Propiedades</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 tabular-nums">{totalProperties}</p>
          <p className="mt-1 text-xs text-zinc-400">Registradas en el condominio</p>
        </div>
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Ocupación</p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-semibold tracking-tight text-zinc-900 tabular-nums">{occupancyRate}%</p>
            <span className="text-xs font-medium text-emerald-700 tabular-nums">{occupiedCount}/{totalProperties}</span>
          </div>
          <p className="mt-1 text-xs text-zinc-400">Propiedades ocupadas</p>
        </div>
        <div className="rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Vehículos Autorizados</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900 tabular-nums">{totalVehicles}</p>
          <p className="mt-1 text-xs text-zinc-400">Marbetes vigentes</p>
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900">Propiedades</h1>
        <p className="text-sm text-zinc-500">Directorio de unidades, ocupación y asignaciones.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-[10px] h-4 w-4 text-zinc-400" />
          <Input 
            placeholder="Buscar por identificador..." 
            className="h-9 pl-8 text-sm" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select onValueChange={(val) => setFilters(prev => ({...prev, tipo: val === 'ALL' ? '' : val}))}>
          <SelectTrigger className="h-9 w-[170px] text-sm">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los tipos</SelectItem>
            <SelectItem value="CASA">Casa</SelectItem>
            <SelectItem value="APARTAMENTO">Apartamento</SelectItem>
            <SelectItem value="LOTE">Lote</SelectItem>
            <SelectItem value="LOCAL_COMERCIAL">Local Comercial</SelectItem>
          </SelectContent>
        </Select>
        <Select onValueChange={(val) => setFilters(prev => ({...prev, estado: val === 'ALL' ? '' : val}))}>
          <SelectTrigger className="h-9 w-[170px] text-sm">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            <SelectItem value="OCUPADA">Ocupada</SelectItem>
            <SelectItem value="DESOCUPADA">Desocupada</SelectItem>
            <SelectItem value="EN_CONSTRUCCION">En Construcción</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto">
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="h-9 bg-zinc-900 text-white hover:bg-zinc-800"><Plus className="mr-1.5 h-4 w-4" />Nueva Propiedad</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nueva Propiedad</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-5">
                <FormField control={form.control} name="identificador" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-zinc-700">Identificador (ej. Casa A-12)</FormLabel>
                    <FormControl><Input className="h-9 text-sm" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="tipo" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-zinc-700">Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Seleccione un tipo" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="CASA">Casa</SelectItem>
                        <SelectItem value="APARTAMENTO">Apartamento</SelectItem>
                        <SelectItem value="LOTE">Lote</SelectItem>
                        <SelectItem value="LOCAL_COMERCIAL">Local Comercial</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="estado" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-zinc-700">Estado</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Seleccione estado" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="OCUPADA">Ocupada</SelectItem>
                        <SelectItem value="DESOCUPADA">Desocupada</SelectItem>
                        <SelectItem value="EN_CONSTRUCCION">En Construcción</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="area_m2" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-zinc-700">Área m² (Opcional)</FormLabel>
                    <FormControl><Input type="number" className="h-9 text-sm" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="h-9 w-full">Guardar Propiedad</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Identificador</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Propietario</TableHead>
              <TableHead>Inquilino</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-zinc-500">Cargando propiedades...</TableCell></TableRow>
            ) : filteredProperties.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-zinc-500">No se encontraron propiedades.</TableCell></TableRow>
            ) : (
              filteredProperties.map((prop) => (
                <TableRow key={prop.id}>
                  <TableCell className="font-medium text-zinc-900 tabular-nums">{prop.identificador}</TableCell>
                  <TableCell>{prop.tipo}</TableCell>
                  <TableCell>
                    {statusBadge(prop.estado)}
                  </TableCell>
                  <TableCell>{prop.propietario_id ? 'Asignado' : 'Sin asignar'}</TableCell>
                  <TableCell>{prop.inquilino_id ? 'Asignado' : 'Sin asignar'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/dashboard/propiedades/${prop.id}`)}>
                          <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
