'use client';

import { useEffect, useState } from 'react';
import { propertyService, PropertyFilters } from '@/services/property.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Propiedades</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Nueva Propiedad</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Nueva Propiedad</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4">
                <FormField control={form.control} name="identificador" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Identificador (ej. Casa A-12)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="tipo" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
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
                    <FormLabel>Estado</FormLabel>
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
                    <FormLabel>Área m² (Opcional)</FormLabel>
                    <FormControl><Input type="number" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <Button type="submit" className="w-full">Guardar Propiedad</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input 
            placeholder="Buscar por identificador..." 
            className="pl-8" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select onValueChange={(val) => setFilters(prev => ({...prev, tipo: val === 'ALL' ? '' : val}))}>
          <SelectTrigger className="w-[180px]">
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
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Todos los estados" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los estados</SelectItem>
            <SelectItem value="OCUPADA">Ocupada</SelectItem>
            <SelectItem value="DESOCUPADA">Desocupada</SelectItem>
            <SelectItem value="EN_CONSTRUCCION">En Construcción</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-md">
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
              <TableRow><TableCell colSpan={6} className="text-center py-8">Cargando propiedades...</TableCell></TableRow>
            ) : filteredProperties.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">No se encontraron propiedades.</TableCell></TableRow>
            ) : (
              filteredProperties.map((prop) => (
                <TableRow key={prop.id}>
                  <TableCell className="font-medium">{prop.identificador}</TableCell>
                  <TableCell>{prop.tipo}</TableCell>
                  <TableCell>
                    <Badge variant={prop.estado === 'OCUPADA' ? 'default' : prop.estado === 'DESOCUPADA' ? 'secondary' : 'outline'}>
                      {prop.estado}
                    </Badge>
                  </TableCell>
                  <TableCell>{prop.propietario_id ? 'Asignado' : 'Sin asignar'}</TableCell>
                  <TableCell>{prop.inquilino_id ? 'Asignado' : 'Sin asignar'}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/propiedades/${prop.id}`)}>
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
