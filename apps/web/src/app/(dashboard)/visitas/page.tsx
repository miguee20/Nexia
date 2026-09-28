'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, Clock, ShieldCheck, QrCode } from 'lucide-react';

const visitSchema = z.object({
  nombre_visitante: z.string().min(1, 'El nombre es requerido'),
  motivo: z.enum(['VISITA_PERSONAL', 'SERVICIO_TECNICO', 'EVENTO']),
  fecha_llegada: z.string().optional(),
  vehiculo_placa: z.string().optional()
});

const deliverySchema = z.object({
  descripcion: z.string().min(1, 'Empresa/Descripción requerida'),
  nombre_repartidor: z.string().optional()
});

export default function VisitasPage() {
  const [activeTab, setActiveTab] = useState<'VISITAS' | 'DELIVERIES'>('VISITAS');
  
  // Modals
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [generatedQR, setGeneratedQR] = useState<{ token: string; expiracion: string } | null>(null);

  // Data
  const [passes, setPasses] = useState<any[]>([]);
  const [deliveries, setDeliveries] = useState<any[]>([]);

  // Forms
  const visitForm = useForm<z.infer<typeof visitSchema>>({
    resolver: zodResolver(visitSchema),
    defaultValues: { nombre_visitante: '', motivo: 'VISITA_PERSONAL', fecha_llegada: '', vehiculo_placa: '' }
  });

  const deliveryForm = useForm<z.infer<typeof deliverySchema>>({
    resolver: zodResolver(deliverySchema),
    defaultValues: { descripcion: '', nombre_repartidor: '' }
  });

  const fetchPasses = async () => {
    try {
      const { data } = await api.get('/visits/my');
      setPasses(data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchDeliveries = async () => {
    try {
      const { data } = await api.get('/deliveries/my');
      setDeliveries(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPasses();
    fetchDeliveries();
  }, []);

  const onSubmitVisit = async (values: z.infer<typeof visitSchema>) => {
    try {
      const payload = {
        ...values,
        fecha_llegada: values.fecha_llegada ? new Date(values.fecha_llegada).toISOString() : undefined
      };
      const { data } = await api.post('/visits', payload);
      setGeneratedQR({ token: data.token, expiracion: data.fecha_expiracion });
      visitForm.reset();
      setIsVisitModalOpen(false);
      fetchPasses();
    } catch (error) {
      console.error(error);
    }
  };

  const onSubmitDelivery = async (values: z.infer<typeof deliverySchema>) => {
    try {
      await api.post('/deliveries', values);
      deliveryForm.reset();
      setIsDeliveryModalOpen(false);
      fetchDeliveries();
    } catch (error) {
      console.error(error);
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'ACTIVO': return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Activo</Badge>;
      case 'USADO': return <Badge className="bg-zinc-100 text-zinc-800 hover:bg-zinc-100">Usado</Badge>;
      case 'EXPIRADO': return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Expirado</Badge>;
      default: return <Badge>{estado}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Control de Accesos</h1>
          <p className="text-sm text-zinc-500 mt-1">Gestiona tus visitas y entregas esperadas.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white" onClick={() => setIsDeliveryModalOpen(true)}>
            <Package className="mr-2 h-4 w-4" /> Espero Delivery
          </Button>
          <Button onClick={() => setIsVisitModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Generar Pase QR
          </Button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-zinc-200">
        <button
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'VISITAS' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
          onClick={() => setActiveTab('VISITAS')}
        >
          Mis Pases de Visita
        </button>
        <button
          className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'DELIVERIES' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500 hover:text-zinc-700'}`}
          onClick={() => setActiveTab('DELIVERIES')}
        >
          Deliveries Esperados
        </button>
      </div>

      {activeTab === 'VISITAS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {passes.map(pass => (
            <Card key={pass.id} className="bg-white border-zinc-200/80 shadow-xs rounded-xl overflow-hidden">
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base">{pass.nombre_visitante}</CardTitle>
                  <CardDescription className="mt-1">{pass.motivo}</CardDescription>
                </div>
                {getStatusBadge(pass.estado)}
              </CardHeader>
              <CardContent>
                <div className="text-sm text-zinc-600 mb-4 space-y-1">
                  <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> Expira: {new Date(pass.fecha_expiracion).toLocaleString()}</div>
                  {pass.vehiculo_placa && <div className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5" /> Placa: {pass.vehiculo_placa}</div>}
                </div>
                {pass.estado === 'ACTIVO' && (
                  <Button variant="secondary" className="w-full" onClick={() => setGeneratedQR({ token: pass.token_qr, expiracion: pass.fecha_expiracion })}>
                    <QrCode className="w-4 h-4 mr-2" /> Mostrar QR
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          {passes.length === 0 && <div className="text-zinc-500 text-sm">No tienes pases de visita recientes.</div>}
        </div>
      )}

      {activeTab === 'DELIVERIES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {deliveries.map(delivery => (
            <Card key={delivery.id} className="bg-white border-zinc-200/80 shadow-xs rounded-xl">
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2"><Package className="w-4 h-4 text-emerald-600" /> {delivery.descripcion}</CardTitle>
                  <CardDescription className="mt-1">{delivery.nombre_repartidor || 'Repartidor no especificado'}</CardDescription>
                </div>
                {getStatusBadge(delivery.estado)}
              </CardHeader>
              <CardContent>
                <div className="text-sm text-zinc-600">
                  Válido hasta: {new Date(delivery.fecha_expiracion).toLocaleTimeString()}
                </div>
              </CardContent>
            </Card>
          ))}
          {deliveries.length === 0 && <div className="text-zinc-500 text-sm">No tienes deliveries esperados activos.</div>}
        </div>
      )}

      {/* Modal QR Pass */}
      <Dialog open={isVisitModalOpen} onOpenChange={setIsVisitModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Generar Pase QR</DialogTitle>
            <DialogDescription>Completa los datos para autorizar el ingreso de tu visita.</DialogDescription>
          </DialogHeader>
          <Form {...visitForm}>
            <form onSubmit={visitForm.handleSubmit(onSubmitVisit)} className="space-y-4">
              <FormField control={visitForm.control} name="nombre_visitante" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Visitante</FormLabel>
                  <FormControl><Input placeholder="Ej. Juan Pérez" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={visitForm.control} name="motivo" render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Selecciona un motivo" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="VISITA_PERSONAL">Visita Personal</SelectItem>
                      <SelectItem value="SERVICIO_TECNICO">Servicio Técnico</SelectItem>
                      <SelectItem value="EVENTO">Evento</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={visitForm.control} name="fecha_llegada" render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha/Hora de Llegada (Opcional)</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={visitForm.control} name="vehiculo_placa" render={({ field }) => (
                <FormItem>
                  <FormLabel>Placa del Vehículo (Opcional)</FormLabel>
                  <FormControl><Input placeholder="Ej. ABC-1234" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsVisitModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Generar QR</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal Delivery */}
      <Dialog open={isDeliveryModalOpen} onOpenChange={setIsDeliveryModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Espero un Delivery</DialogTitle>
            <DialogDescription>Avisa a garita que esperas un pedido (Uber Eats, PedidosYa, Amazon).</DialogDescription>
          </DialogHeader>
          <Form {...deliveryForm}>
            <form onSubmit={deliveryForm.handleSubmit(onSubmitDelivery)} className="space-y-4">
              <FormField control={deliveryForm.control} name="descripcion" render={({ field }) => (
                <FormItem>
                  <FormLabel>Empresa / Pedido</FormLabel>
                  <FormControl><Input placeholder="Ej. Uber Eats - Pizza" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={deliveryForm.control} name="nombre_repartidor" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Repartidor (Opcional)</FormLabel>
                  <FormControl><Input placeholder="Ej. Carlos" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDeliveryModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Avisar a Garita</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal Show QR */}
      <Dialog open={!!generatedQR} onOpenChange={(open) => !open && setGeneratedQR(null)}>
        <DialogContent className="sm:max-w-[360px] text-center">
          <DialogHeader>
            <DialogTitle className="text-center">Pase de Ingreso</DialogTitle>
            <DialogDescription className="text-center">Muestra este código al llegar a garita</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center p-6 bg-white rounded-xl">
            {generatedQR && <QRCodeSVG value={generatedQR.token} size={200} level="H" includeMargin />}
          </div>
          <div className="text-sm font-medium text-zinc-700">
            Válido hasta: {generatedQR && new Date(generatedQR.expiracion).toLocaleString()}
          </div>
          <DialogFooter className="sm:justify-center">
            <Button className="w-full" onClick={() => {
               // En una app real usaríamos html2canvas para descargar la imagen
               alert('En una app real, esto descargaría la imagen.');
            }}>
              Compartir / Descargar Imagen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
