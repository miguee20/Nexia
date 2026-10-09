'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { propertyService } from '@/services/property.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ArrowLeft, Plus, Ban, Tag } from 'lucide-react';
import { toast } from 'sonner';

const vehicleSchema = z.object({
  placa: z.string().min(1, 'La placa es requerida'),
  marca: z.string().min(1, 'La marca es requerida'),
  color: z.string().min(1, 'El color es requerido'),
  modelo: z.string(),
  tipo: z.enum(['SEDAN', 'PICKUP', 'MOTO']),
});

const assignSchema = z.object({
  userId: z.string().min(1, 'Debe seleccionar un usuario'),
  tipo_residencia: z.enum(['PROPIETARIO', 'INQUILINO']),
});

export default function PropertyDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { id } = resolvedParams;
  const router = useRouter();
  
  const [property, setProperty] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [marbetes, setMarbetes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isVehicleOpen, setIsVehicleOpen] = useState(false);

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [availableResidents, setAvailableResidents] = useState<any[]>([]);
  const [marbeteToCancel, setMarbeteToCancel] = useState<string | null>(null);

  const vehicleForm = useForm<z.infer<typeof vehicleSchema>>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { placa: '', marca: '', color: '', modelo: '', tipo: 'SEDAN' },
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [propRes, vehRes, marbRes, resRes] = await Promise.all([
        propertyService.getById(id),
        propertyService.listVehicles(id),
        propertyService.listMarbetes(id),
        propertyService.listAvailableResidents(),
      ]);
      setProperty(propRes);
      setVehicles(vehRes);
      setMarbetes(marbRes);
      setAvailableResidents(resRes);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const assignForm = useForm<z.infer<typeof assignSchema>>({
    resolver: zodResolver(assignSchema),
    defaultValues: { userId: '', tipo_residencia: 'INQUILINO' },
  });

  const onSubmitAssign = async (values: z.infer<typeof assignSchema>) => {
    try {
      await propertyService.assignResident(id, values.userId, values.tipo_residencia);
      setIsAssignOpen(false);
      assignForm.reset();
      loadData();
      toast.success('Residente asignado exitosamente.');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Error al asignar residente');
    }
  };

  const onSubmitVehicle = async (values: z.infer<typeof vehicleSchema>) => {
    try {
      await propertyService.registerVehicle(id, values);
      setIsVehicleOpen(false);
      vehicleForm.reset();
      loadData();
      toast.success('Vehículo registrado exitosamente.');
    } catch (error) {
      console.error(error);
      toast.error('Error registrando vehículo (tal vez la placa ya existe).');
    }
  };

  const confirmCancelMarbete = async () => {
    if (!marbeteToCancel) return;
    try {
      await propertyService.cancelMarbete(marbeteToCancel);
      toast.success('Marbete cancelado exitosamente.');
      setMarbeteToCancel(null);
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Error al cancelar el marbete.');
    }
  };

  const handleIssueMarbete = async (vehiculoId: string) => {
    try {
      await propertyService.issueMarbete(vehiculoId, 'MENSUAL');
      toast.success('Marbete emitido exitosamente.');
      loadData();
    } catch (error) {
      console.error(error);
      toast.error('Error al emitir el marbete.');
    }
  };

  if (loading) return <div className="p-6">Cargando detalles...</div>;
  if (!property) return <div className="p-6">Propiedad no encontrada</div>;

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-xs text-zinc-500">
        <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/propiedades')} className="-ml-2 h-7 gap-1 px-2 text-xs text-zinc-500 hover:text-zinc-900">
          <ArrowLeft className="h-3.5 w-3.5" /> Propiedades
        </Button>
        <span className="text-zinc-300">/</span>
        <span className="font-medium text-zinc-900 tabular-nums">{property.identificador}</span>
      </nav>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">{property.identificador}</h1>
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline">{property.tipo}</Badge>
            {(() => {
              const estadoMap: Record<string, string> = {
                OCUPADA: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
                DESOCUPADA: 'bg-zinc-100 text-zinc-600 border border-zinc-200',
                EN_CONSTRUCCION: 'bg-amber-50 text-amber-700 border border-amber-200/60',
              };
              const cls = estadoMap[property.estado] || 'bg-zinc-100 text-zinc-600 border border-zinc-200';
              return (
                <span className={`inline-flex items-center font-medium text-xs px-2 py-0.5 rounded-md ${cls}`}>
                  {property.estado}
                </span>
              );
            })()}
          </div>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="h-auto w-full justify-start gap-6 rounded-none border-b border-zinc-200/80 bg-transparent p-0">
          <TabsTrigger value="general" className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-2.5 pt-1 text-sm font-medium text-zinc-500 shadow-none data-[state=active]:border-zinc-900 data-[state=active]:bg-transparent data-[state=active]:text-zinc-900 data-[state=active]:shadow-none">Datos Generales y Residentes</TabsTrigger>
          <TabsTrigger value="vehiculos" className="rounded-none border-b-2 border-transparent bg-transparent px-0 pb-2.5 pt-1 text-sm font-medium text-zinc-500 shadow-none data-[state=active]:border-zinc-900 data-[state=active]:bg-transparent data-[state=active]:text-zinc-900 data-[state=active]:shadow-none">Vehículos y Marbetes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="mt-6 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900">Residentes Asignados</h2>
            <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm"><Plus className="mr-1.5 h-4 w-4" />Asignar Residente</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Asignar Residente</DialogTitle></DialogHeader>
                <Form {...assignForm}>
                  <form onSubmit={assignForm.handleSubmit(onSubmitAssign)} className="space-y-5">
                    <FormField control={assignForm.control} name="tipo_residencia" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-zinc-700">Rol en Propiedad</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Seleccione rol" /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="PROPIETARIO">Propietario</SelectItem>
                            <SelectItem value="INQUILINO">Inquilino</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={assignForm.control} name="userId" render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-medium text-zinc-700">Usuario (Residente)</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Seleccione un residente" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {availableResidents.map(res => (
                              <SelectItem key={res.id} value={res.id}>{res.nombre_completo} ({res.email})</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <Button type="submit" className="h-9 w-full">Asignar a Propiedad</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-xs font-medium uppercase tracking-wider text-zinc-500">Propietario</CardTitle></CardHeader>
            <CardContent>
              {property.propietario ? (
                <div>
                  <p className="text-sm font-medium text-zinc-900">{property.propietario.nombre_completo}</p>
                  <p className="text-sm text-zinc-500">{property.propietario.email}</p>
                  <p className="text-sm text-zinc-500">{property.propietario.telefono}</p>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">Sin propietario asignado.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-xs font-medium uppercase tracking-wider text-zinc-500">Inquilino</CardTitle></CardHeader>
            <CardContent>
              {property.inquilino ? (
                <div>
                  <p className="text-sm font-medium text-zinc-900">{property.inquilino.nombre_completo}</p>
                  <p className="text-sm text-zinc-500">{property.inquilino.email}</p>
                  <p className="text-sm text-zinc-500">{property.inquilino.telefono}</p>
                </div>
              ) : (
                <p className="text-sm text-zinc-500">Sin inquilino asignado.</p>
              )}
            </CardContent>
          </Card>
          </div>
        </TabsContent>

        <TabsContent value="vehiculos" className="mt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900">Vehículos Registrados</h2>
            <Dialog open={isVehicleOpen} onOpenChange={setIsVehicleOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="mr-1.5 h-4 w-4" />Registrar Vehículo</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Vehículo</DialogTitle>
                </DialogHeader>
                <Form {...vehicleForm}>
                  <form onSubmit={vehicleForm.handleSubmit(onSubmitVehicle)} className="space-y-5">
                    <FormField control={vehicleForm.control} name="placa" render={({ field }) => (
                      <FormItem><FormLabel className="text-xs font-medium text-zinc-700">Placa</FormLabel><FormControl><Input className="h-9 text-sm" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={vehicleForm.control} name="marca" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs font-medium text-zinc-700">Marca</FormLabel><FormControl><Input className="h-9 text-sm" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={vehicleForm.control} name="color" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs font-medium text-zinc-700">Color</FormLabel><FormControl><Input className="h-9 text-sm" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={vehicleForm.control} name="modelo" render={({ field }) => (
                        <FormItem><FormLabel className="text-xs font-medium text-zinc-700">Modelo (Año)</FormLabel><FormControl><Input className="h-9 text-sm" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={vehicleForm.control} name="tipo" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-medium text-zinc-700">Tipo</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="SEDAN">Sedán</SelectItem>
                              <SelectItem value="PICKUP">Pickup</SelectItem>
                              <SelectItem value="MOTO">Moto</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                    <Button type="submit" className="h-9 w-full">Guardar Vehículo</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-xs">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Placa</TableHead>
                  <TableHead>Marca / Modelo</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Marbete Asociado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-4 text-zinc-500">No hay vehículos registrados.</TableCell></TableRow>
                ) : (
                  vehicles.map((v) => {
                    const activeMarbete = marbetes.find(m => m.vehiculo_id === v.id && m.estado === 'ACTIVO');
                    return (
                      <TableRow key={v.id}>
                        <TableCell className="font-medium text-zinc-900 tabular-nums">{v.placa}</TableCell>
                        <TableCell>{v.marca} {v.modelo ? `(${v.modelo})` : ''}</TableCell>
                        <TableCell>{v.color}</TableCell>
                        <TableCell>{v.tipo}</TableCell>
                        <TableCell>
                          {activeMarbete ? (
                            <div className="flex flex-col gap-1 items-start">
                              <span className="text-sm font-medium text-zinc-900 tabular-nums">{activeMarbete.codigo}</span>
                              <div className="flex gap-1">
                                <span className="inline-flex items-center font-medium text-xs px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60">Activo</span>
                                {activeMarbete.es_extra ? <Badge variant="destructive">Extra</Badge> : <Badge variant="secondary">Incluido</Badge>}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-zinc-500">Sin marbete activo</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {activeMarbete ? (
                            <Button variant="outline" size="sm" className="text-zinc-700 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600" onClick={() => setMarbeteToCancel(activeMarbete.id)}>
                              <Ban className="w-4 h-4 mr-1" /> Cancelar
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => handleIssueMarbete(v.id)}>
                              <Tag className="w-4 h-4 mr-1" /> Emitir
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de confirmación para cancelar marbete */}
      <Dialog open={!!marbeteToCancel} onOpenChange={(open) => !open && setMarbeteToCancel(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-lg">¿Cancelar este marbete?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600 py-2">
            Esta acción revocará el marbete activo. El vehículo ya no podrá ingresar usando este identificador en garita.
          </p>
          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" onClick={() => setMarbeteToCancel(null)}>Volver</Button>
            <Button variant="destructive" onClick={confirmCancelMarbete}>Confirmar Cancelación</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
