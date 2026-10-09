'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api';
import { QRCodeSVG, QRCodeCanvas } from 'qrcode.react';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Package, Clock, ShieldCheck, QrCode, CheckCircle2, Trash2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/stores/useAuth';

interface ActivePassDetails {
  token: string;
  expiracion: string;
  nombre_visitante?: string | undefined;
  propiedad?: string | undefined;
  residente?: string | undefined;
  motivo?: string | undefined;
  vehiculo_placa?: string | null | undefined;
}

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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'VISITAS' | 'DELIVERIES'>('VISITAS');
  
  // Modals
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [generatedQR, setGeneratedQR] = useState<ActivePassDetails | null>(null);
  const [passToCancel, setPassToCancel] = useState<any | null>(null);

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
      setGeneratedQR({
        token: data.qrToken,
        expiracion: data.visitPass.fecha_expiracion,
        nombre_visitante: data.visitPass.nombre_visitante,
        propiedad: data.visitPass.propiedad?.identificador,
        residente: user?.nombre_completo,
        motivo: data.visitPass.motivo,
        vehiculo_placa: data.visitPass.placa_vehiculo
      });
      visitForm.reset();
      setIsVisitModalOpen(false);
      fetchPasses();
      toast.success('Pase de visita generado exitosamente.');
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Error al generar el pase de visita.');
    }
  };

  const confirmCancelPass = async () => {
    if (!passToCancel) return;
    try {
      await api.delete(`/visits/${passToCancel.id}`);
      toast.success('Pase de visita cancelado exitosamente.');
      setPassToCancel(null);
      fetchPasses();
    } catch (error: any) {
      console.error(error);
      toast.error(error?.response?.data?.message || 'Error al cancelar el pase.');
    }
  };

  const downloadQRCard = () => {
    if (!generatedQR) return;

    const qrCanvas = document.getElementById('qr-canvas-download-source') as HTMLCanvasElement;
    if (!qrCanvas) {
      toast.error('No se pudo encontrar el código QR.');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 880;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Outer background
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, 640, 880);

    // Inner card background
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(24, 24, 592, 832, 24);
    ctx.fill();

    // Card Header Banner
    ctx.fillStyle = '#18181b';
    ctx.beginPath();
    ctx.roundRect(24, 24, 592, 110, [24, 24, 0, 0]);
    ctx.fill();

    // Header Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NEXIA • PASE DE ACCESO', 320, 68);

    ctx.fillStyle = '#a1a1aa';
    ctx.font = '14px sans-serif';
    ctx.fillText('Control de Acceso y Seguridad', 320, 98);

    // Draw QR code in the middle
    const qrSize = 300;
    const qrX = (640 - qrSize) / 2;
    const qrY = 160;

    // QR container box
    ctx.fillStyle = '#f4f4f5';
    ctx.beginPath();
    ctx.roundRect(qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 16);
    ctx.fill();

    // Disable image smoothing for ultra-sharp QR modules with crisp edges
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
    ctx.imageSmoothingEnabled = true;

    // Separator line
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(48, 530);
    ctx.lineTo(592, 530);
    ctx.stroke();
    ctx.setLineDash([]);

    // Information Section
    ctx.textAlign = 'left';

    // Visitor Name
    ctx.fillStyle = '#71717a';
    ctx.font = '12px sans-serif';
    ctx.fillText('VISITANTE AUTORIZADO', 56, 565);
    ctx.fillStyle = '#09090b';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(generatedQR.nombre_visitante || 'Visitante', 56, 592);

    // Property / Destination
    ctx.fillStyle = '#71717a';
    ctx.font = '12px sans-serif';
    ctx.fillText('PROPIEDAD / DESTINO', 360, 565);
    ctx.fillStyle = '#09090b';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(generatedQR.propiedad || 'Condominio', 360, 592);

    // Host Resident
    ctx.fillStyle = '#71717a';
    ctx.font = '12px sans-serif';
    ctx.fillText('AUTORIZADO POR', 56, 645);
    ctx.fillStyle = '#18181b';
    ctx.font = '600 16px sans-serif';
    ctx.fillText(generatedQR.residente || user?.nombre_completo || 'Residente', 56, 670);

    // Vehicle Placa
    if (generatedQR.vehiculo_placa) {
      ctx.fillStyle = '#71717a';
      ctx.font = '12px sans-serif';
      ctx.fillText('PLACA VEHÍCULO', 360, 645);
      ctx.fillStyle = '#18181b';
      ctx.font = '600 16px sans-serif';
      ctx.fillText(generatedQR.vehiculo_placa, 360, 670);
    }

    // Expiration Bar
    ctx.fillStyle = '#ecfdf5';
    ctx.strokeStyle = '#a7f3d0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(56, 715, 528, 56, 12);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#065f46';
    ctx.font = 'bold 14px sans-serif';
    const expDate = new Date(generatedQR.expiracion).toLocaleString();
    ctx.fillText(`Válido hasta: ${expDate}`, 320, 749);

    // Footer notice
    ctx.fillStyle = '#a1a1aa';
    ctx.font = '12px sans-serif';
    ctx.fillText('Presenta este código en la garita para registrar tu acceso.', 320, 810);

    // Trigger download
    const link = document.createElement('a');
    link.download = `pase-${(generatedQR.nombre_visitante || 'visita').toLowerCase().replace(/\s+/g, '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    toast.success('Pase de visita descargado como imagen con éxito.');
  };

  const onSubmitDelivery = async (values: z.infer<typeof deliverySchema>) => {
    try {
      await api.post('/deliveries', values);
      deliveryForm.reset();
      setIsDeliveryModalOpen(false);
      fetchDeliveries();
      setSuccessMessage('Alerta de delivery creada exitosamente. La garita ha sido notificada.');
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
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="flex-1"
                      onClick={() =>
                        setGeneratedQR({
                          token: pass.qr_token,
                          expiracion: pass.fecha_expiracion,
                          nombre_visitante: pass.nombre_visitante,
                          propiedad: pass.propiedad?.identificador,
                          residente: pass.residente?.nombre_completo || user?.nombre_completo,
                          motivo: pass.motivo,
                          vehiculo_placa: pass.placa_vehiculo
                        })
                      }
                    >
                      <QrCode className="w-4 h-4 mr-2" /> Mostrar QR
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      title="Cancelar pase"
                      onClick={() => setPassToCancel(pass)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
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
        <DialogContent className="sm:max-w-[420px] text-center">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">Pase de Ingreso</DialogTitle>
            <DialogDescription className="text-center">Muestra o comparte este pase para ingresar a garita</DialogDescription>
          </DialogHeader>

          {generatedQR && (
            <div className="space-y-4">
              <div className="bg-zinc-50 border border-zinc-200/80 rounded-2xl p-5 flex flex-col items-center shadow-xs">
                {/* Visual Badge Card Header */}
                <div className="w-full flex justify-between items-center text-xs font-semibold text-zinc-500 uppercase tracking-wider pb-3 border-b border-zinc-200">
                  <span>Nexia Pass</span>
                  <span className="text-emerald-600 font-bold">{generatedQR.propiedad || 'Condominio'}</span>
                </div>

                {/* QR Vector SVG (Crisp vector quality on screen) */}
                <div className="py-3 bg-white p-3 rounded-xl shadow-xs border border-zinc-100 my-3 flex items-center justify-center">
                  <QRCodeSVG
                    value={generatedQR.token}
                    size={220}
                    level="M"
                    includeMargin
                    className="max-w-full h-auto"
                  />
                  {/* Hidden high-res canvas (600px, level="M") used strictly for sharp PNG export */}
                  <div className="hidden">
                    <QRCodeCanvas
                      id="qr-canvas-download-source"
                      value={generatedQR.token}
                      size={600}
                      level="M"
                      includeMargin
                    />
                  </div>
                </div>

                {/* Card Details */}
                <div className="w-full text-left space-y-1.5 text-sm pt-1">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Visitante:</span>
                    <span className="font-semibold text-zinc-900">{generatedQR.nombre_visitante}</span>
                  </div>
                  {generatedQR.vehiculo_placa && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Placa:</span>
                      <span className="font-medium text-zinc-800">{generatedQR.vehiculo_placa}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Anfitrión:</span>
                    <span className="font-medium text-zinc-800">{generatedQR.residente || user?.nombre_completo}</span>
                  </div>
                  <div className="flex justify-between text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-100 mt-2">
                    <span>Vigencia:</span>
                    <span className="font-semibold">{new Date(generatedQR.expiracion).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <DialogFooter className="sm:justify-center">
                <Button className="w-full min-h-[48px] bg-zinc-900 hover:bg-zinc-800 text-white" onClick={downloadQRCard}>
                  <Download className="w-4 h-4 mr-2" /> Descargar Imagen del Pase
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Cancelar Pase */}
      <Dialog open={!!passToCancel} onOpenChange={(open) => !open && setPassToCancel(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-lg">¿Cancelar este pase de visita?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-zinc-600 py-2">
            Esta acción revocará el pase. Si <strong>{passToCancel?.nombre_visitante}</strong> intenta entrar a la garita con este código QR, su acceso será denegado.
          </p>
          <div className="flex justify-end gap-3 pt-3">
            <Button variant="outline" onClick={() => setPassToCancel(null)}>Volver</Button>
            <Button variant="destructive" onClick={confirmCancelPass}>Confirmar Cancelación</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!successMessage} onOpenChange={() => setSuccessMessage('')}>
        <DialogContent className="sm:max-w-[400px] text-center p-8 border-emerald-100">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <DialogTitle className="text-2xl font-bold text-zinc-900 mb-2">¡Operación Exitosa!</DialogTitle>
          <DialogDescription className="text-zinc-600 text-base mb-6">
            {successMessage}
          </DialogDescription>
          <Button className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700" onClick={() => setSuccessMessage('')}>
            Aceptar
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
