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

const vehicleSchema = z.object({
  placa: z.string().min(1, 'La placa es requerida'),
  marca: z.string().min(1, 'La marca es requerida'),
  color: z.string().min(1, 'El color es requerido'),
  modelo: z.string(),
  tipo: z.enum(['SEDAN', 'PICKUP', 'MOTO']),
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

  const vehicleForm = useForm<z.infer<typeof vehicleSchema>>({
    resolver: zodResolver(vehicleSchema),
    defaultValues: { placa: '', marca: '', color: '', modelo: '', tipo: 'SEDAN' },
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [propRes, vehRes, marbRes] = await Promise.all([
        propertyService.getById(id),
        propertyService.listVehicles(id),
        propertyService.listMarbetes(id),
      ]);
      setProperty(propRes);
      setVehicles(vehRes);
      setMarbetes(marbRes);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const onSubmitVehicle = async (values: z.infer<typeof vehicleSchema>) => {
    try {
      await propertyService.registerVehicle(id, values);
      setIsVehicleOpen(false);
      vehicleForm.reset();
      loadData();
    } catch (error) {
      console.error(error);
      alert('Error registrando vehículo (tal vez la placa ya existe)');
    }
  };

  const handleCancelMarbete = async (marbeteId: string) => {
    if (!confirm('¿Seguro que deseas cancelar este marbete?')) return;
    try {
      await propertyService.cancelMarbete(marbeteId);
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleIssueMarbete = async (vehiculoId: string) => {
    try {
      await propertyService.issueMarbete(vehiculoId, 'MENSUAL');
      loadData();
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) return <div className="p-6">Cargando detalles...</div>;
  if (!property) return <div className="p-6">Propiedad no encontrada</div>;

  return (
    <div className="p-6 space-y-6">
      <Button variant="ghost" onClick={() => router.push('/propiedades')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Volver a Propiedades
      </Button>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{property.identificador}</h1>
          <div className="flex gap-2 mt-2">
            <Badge variant="outline">{property.tipo}</Badge>
            <Badge variant={property.estado === 'OCUPADA' ? 'default' : 'secondary'}>{property.estado}</Badge>
          </div>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">Datos Generales y Residentes</TabsTrigger>
          <TabsTrigger value="vehiculos">Vehículos y Marbetes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle>Propietario</CardTitle></CardHeader>
            <CardContent>
              {property.propietario ? (
                <div>
                  <p className="font-semibold">{property.propietario.nombre_completo}</p>
                  <p className="text-sm text-gray-500">{property.propietario.email}</p>
                  <p className="text-sm text-gray-500">{property.propietario.telefono}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Sin propietario asignado.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Inquilino</CardTitle></CardHeader>
            <CardContent>
              {property.inquilino ? (
                <div>
                  <p className="font-semibold">{property.inquilino.nombre_completo}</p>
                  <p className="text-sm text-gray-500">{property.inquilino.email}</p>
                  <p className="text-sm text-gray-500">{property.inquilino.telefono}</p>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Sin inquilino asignado.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vehiculos" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Vehículos Registrados</h2>
            <Dialog open={isVehicleOpen} onOpenChange={setIsVehicleOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" /> Registrar Vehículo</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Registrar Vehículo</DialogTitle>
                </DialogHeader>
                <Form {...vehicleForm}>
                  <form onSubmit={vehicleForm.handleSubmit(onSubmitVehicle)} className="space-y-4">
                    <FormField control={vehicleForm.control} name="placa" render={({ field }) => (
                      <FormItem><FormLabel>Placa</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={vehicleForm.control} name="marca" render={({ field }) => (
                        <FormItem><FormLabel>Marca</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={vehicleForm.control} name="color" render={({ field }) => (
                        <FormItem><FormLabel>Color</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField control={vehicleForm.control} name="modelo" render={({ field }) => (
                        <FormItem><FormLabel>Modelo (Año)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={vehicleForm.control} name="tipo" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo</FormLabel>
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
                    <Button type="submit" className="w-full">Guardar Vehículo</Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

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
                <TableRow><TableCell colSpan={6} className="text-center py-4">No hay vehículos registrados.</TableCell></TableRow>
              ) : (
                vehicles.map((v) => {
                  const activeMarbete = marbetes.find(m => m.vehiculo_id === v.id && m.estado === 'ACTIVO');
                  return (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.placa}</TableCell>
                      <TableCell>{v.marca} {v.modelo ? `(${v.modelo})` : ''}</TableCell>
                      <TableCell>{v.color}</TableCell>
                      <TableCell>{v.tipo}</TableCell>
                      <TableCell>
                        {activeMarbete ? (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="text-sm font-semibold">{activeMarbete.codigo}</span>
                            <div className="flex gap-1">
                              <Badge variant="default">Activo</Badge>
                              {activeMarbete.es_extra ? <Badge variant="destructive">Extra</Badge> : <Badge variant="secondary">Incluido</Badge>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Sin marbete activo</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {activeMarbete ? (
                          <Button variant="destructive" size="sm" onClick={() => handleCancelMarbete(activeMarbete.id)}>
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
