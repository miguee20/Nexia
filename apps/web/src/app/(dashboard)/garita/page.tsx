'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Html5Qrcode } from 'html5-qrcode';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { QrCode, Phone, Package, CheckCircle2, XCircle, AlertTriangle, Home } from 'lucide-react';
import { toast } from 'sonner';

interface PropertySuggestion {
  id: string;
  identificador: string;
}

export default function GaritaConsolePage() {
  const [activeTab, setActiveTab] = useState<'ESCANER' | 'DELIVERIES'>('ESCANER');
  
  // QR Scan state
  const [qrToken, setQrToken] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  // Deliveries state
  const [deliveries, setDeliveries] = useState<any[]>([]);

  // Phone fallback state
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [propertyQuery, setPropertyQuery] = useState('');
  const [propertySuggestions, setPropertySuggestions] = useState<PropertySuggestion[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<PropertySuggestion | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [propertyContact, setPropertyContact] = useState<any>(null);
  const [visitorName, setVisitorName] = useState('');

  const fetchDeliveries = async () => {
    try {
      const { data } = await api.get('/gate/deliveries/active');
      setDeliveries(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchDeliveries();
    const interval = setInterval(fetchDeliveries, 30000);
    return () => clearInterval(interval);
  }, []);

  // Debounced property suggestions while the call fallback modal is open
  useEffect(() => {
    if (!isCallModalOpen || selectedProperty) return;

    const timeout = setTimeout(async () => {
      try {
        const { data } = await api.get<PropertySuggestion[]>('/gate/properties/search', {
          params: { q: propertyQuery.trim() }
        });
        setPropertySuggestions(data);
      } catch (error) {
        console.error(error);
        toast.error('No se pudo cargar la lista de propiedades.');
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [propertyQuery, isCallModalOpen, selectedProperty]);

  const validateQR = async (token: string) => {
    try {
      const { data } = await api.post('/gate/validate-qr', { qr_token: token });
      setScanResult(data);
    } catch (error) {
      console.error(error);
      setScanResult({ estado: 'INVALIDO', mensaje: 'Error al validar el código QR.' });
    }
  };

  const handleQRSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qrToken) {
      validateQR(qrToken);
      setQrToken('');
    }
  };

  const startCameraScan = () => {
    setIsScanning(true);
    setScanResult(null);
    
    // Esperar al siguiente ciclo de renderizado para que el div 'qr-reader' exista en el DOM
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;
        await scanner.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            scanner.stop().then(() => {
              setIsScanning(false);
              validateQR(decodedText);
            }).catch(console.error);
          },
          () => {}
        );
      } catch (err) {
        console.error("Camera error:", err);
        setIsScanning(false);
      }
    }, 100);
  };

  const stopCameraScan = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().catch(console.error);
      setIsScanning(false);
    }
  };

  const [successMessage, setSuccessMessage] = useState('');

  const registerEntry = async (paseId: string) => {
    try {
      await api.post('/gate/entries', { pase_id: paseId });
      setScanResult(null);
      setSuccessMessage('El ingreso del visitante se ha registrado exitosamente.');
    } catch (error) {
      toast.error('No se pudo registrar la entrada. Intenta de nuevo.');
    }
  };

  const registerDelivery = async (alertaId: string) => {
    try {
      await api.post(`/gate/deliveries/${alertaId}/entry`, { observaciones: 'Registrado desde consola' });
      fetchDeliveries();
      setSuccessMessage('El ingreso del repartidor se ha registrado exitosamente.');
    } catch (error) {
      toast.error('No se pudo registrar el ingreso del delivery. Intenta de nuevo.');
    }
  };

  const resetCallModal = () => {
    setPropertyQuery('');
    setSelectedProperty(null);
    setPropertySuggestions([]);
    setShowSuggestions(true);
    setPropertyContact(null);
    setVisitorName('');
  };

  const loadPropertyContact = async (property: PropertySuggestion) => {
    try {
      const { data } = await api.get(`/gate/properties/${property.id}/contact`);
      setPropertyContact(data);
    } catch (error) {
      toast.error('No se pudo obtener la información de contacto de la propiedad.');
      setPropertyContact(null);
    }
  };

  const selectProperty = (property: PropertySuggestion) => {
    setSelectedProperty(property);
    setPropertyQuery(property.identificador);
    setShowSuggestions(false);
    loadPropertyContact(property);
  };

  const handleSearchProperty = () => {
    const query = propertyQuery.trim().toLowerCase();
    if (!query) {
      toast.error('Escribe el identificador de la propiedad (ej. CASA E-21).');
      return;
    }

    const exactMatch = propertySuggestions.find(p => p.identificador.toLowerCase() === query);
    const match = selectedProperty ?? exactMatch ?? (propertySuggestions.length === 1 ? propertySuggestions[0] : undefined);

    if (match) {
      selectProperty(match);
      return;
    }

    if (propertySuggestions.length > 1) {
      toast.info('Hay varias coincidencias. Selecciona una propiedad de la lista.');
      setShowSuggestions(true);
      return;
    }

    toast.error(`No se encontró ninguna propiedad con "${propertyQuery.trim()}".`);
  };

  const registerCallAuth = async (autorizado: boolean) => {
    if (!selectedProperty || !propertyContact) return;

    if (!visitorName.trim()) {
      toast.error('Ingresa el nombre del visitante para la bitácora.');
      return;
    }

    try {
      await api.post('/gate/call-verifications', {
        propiedad_id: selectedProperty.id,
        nombre_visitante: visitorName.trim(),
        telefono_contactado: propertyContact.propietario?.telefono || propertyContact.inquilino?.telefono || 'Desconocido',
        autorizo_ingreso: autorizado
      });
      setIsCallModalOpen(false);
      resetCallModal();
      if (autorizado) {
        setSuccessMessage('Ingreso por verificación telefónica registrado exitosamente.');
      } else {
        toast.info('Se registró que el residente denegó el ingreso.');
      }
    } catch (error) {
      toast.error('No se pudo registrar la verificación. Intenta de nuevo.');
    }
  };

  const renderScanResult = () => {
    if (!scanResult) return null;

    if (scanResult.estado === 'VALIDO') {
      return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
          <h3 className="text-2xl font-bold text-emerald-700">ACCESO AUTORIZADO</h3>
          <div className="text-left bg-white p-4 rounded-lg shadow-sm">
            <p><strong>Visitante:</strong> {scanResult.pass?.nombre_visitante}</p>
            <p><strong>Propiedad:</strong> {scanResult.pass?.propiedad?.identificador}</p>
            {scanResult.pass?.vehiculo_placa && <p><strong>Placa:</strong> {scanResult.pass.vehiculo_placa}</p>}
          </div>
          <Button className="w-full min-h-[56px] text-lg bg-emerald-600 hover:bg-emerald-700" onClick={() => registerEntry(scanResult.pass.id)}>
            Registrar Entrada
          </Button>
        </div>
      );
    }

    if (scanResult.estado === 'ANFITRION_MOROSO') {
      return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto" />
          <h3 className="text-2xl font-bold text-amber-700">ADVERTENCIA: RESIDENTE EN MORA</h3>
          <p className="text-amber-800">{scanResult.mensaje}</p>
          <div className="text-left bg-white p-4 rounded-lg shadow-sm">
            <p><strong>Visitante:</strong> {scanResult.pass?.nombre_visitante}</p>
            <p><strong>Propiedad:</strong> {scanResult.pass?.propiedad?.identificador}</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 min-h-[56px]" onClick={() => setScanResult(null)}>Rechazar</Button>
            <Button className="flex-1 min-h-[56px] bg-amber-600 hover:bg-amber-700" onClick={() => registerEntry(scanResult.pass.id)}>
              Ingresar con Advertencia
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-4">
        <XCircle className="w-16 h-16 text-red-500 mx-auto" />
        <h3 className="text-2xl font-bold text-red-700">ACCESO DENEGADO</h3>
        <p className="text-red-800 text-lg">{scanResult.mensaje}</p>
        <Button variant="outline" className="w-full min-h-[48px]" onClick={() => setScanResult(null)}>Volver a escanear</Button>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Consola de Garita</h1>
          <p className="text-sm text-zinc-500 mt-1">Control de acceso vehicular y peatonal.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-white border-zinc-200 shadow-sm min-h-[48px]" onClick={() => setIsCallModalOpen(true)}>
            <Phone className="mr-2 w-5 h-5" /> Verificar con Residente
          </Button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-zinc-200">
        <button
          className={`pb-3 text-lg font-medium border-b-4 transition-colors px-4 ${activeTab === 'ESCANER' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500'}`}
          onClick={() => setActiveTab('ESCANER')}
        >
          <QrCode className="inline-block w-5 h-5 mr-2" /> Escáner QR
        </button>
        <button
          className={`pb-3 text-lg font-medium border-b-4 transition-colors px-4 ${activeTab === 'DELIVERIES' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-500'}`}
          onClick={() => setActiveTab('DELIVERIES')}
        >
          <Package className="inline-block w-5 h-5 mr-2" /> Deliveries ({deliveries.length})
        </button>
      </div>

      {activeTab === 'ESCANER' && (
        <Card className="bg-white shadow-xs rounded-2xl overflow-hidden border-zinc-200">
          <CardContent className="p-6 sm:p-10">
            {!scanResult && (
              <div className="max-w-md mx-auto space-y-8">
                <form onSubmit={handleQRSubmit} className="space-y-4">
                  <Label className="text-lg">Código del Pase (Lector USB / Manual)</Label>
                  <div className="flex gap-2">
                    <Input 
                      autoFocus
                      placeholder="Ingrese o escanee el código..." 
                      className="min-h-[56px] text-lg"
                      value={qrToken}
                      onChange={(e) => setQrToken(e.target.value)}
                    />
                    <Button type="submit" className="min-h-[56px] px-8">Validar</Button>
                  </div>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-zinc-200" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-zinc-500">O usar cámara</span></div>
                </div>

                {!isScanning ? (
                  <Button variant="secondary" className="w-full min-h-[64px] text-lg" onClick={startCameraScan}>
                    <QrCode className="w-6 h-6 mr-2" /> Activar Cámara de la Tablet
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div id="qr-reader" className="w-full overflow-hidden rounded-xl border-2 border-zinc-200" />
                    <Button variant="destructive" className="w-full min-h-[48px]" onClick={stopCameraScan}>Cancelar Escaneo</Button>
                  </div>
                )}
              </div>
            )}

            {renderScanResult()}
          </CardContent>
        </Card>
      )}

      {activeTab === 'DELIVERIES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {deliveries.map(delivery => (
            <Card key={delivery.id} className="bg-white border-emerald-100 shadow-sm rounded-xl overflow-hidden relative">
              <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
              <CardContent className="p-6 pl-8 flex flex-col justify-between h-full space-y-4">
                <div>
                  <h3 className="text-xl font-bold">{delivery.descripcion}</h3>
                  <p className="text-zinc-600 mt-1">Hacia: <strong>{delivery.propiedad?.identificador}</strong></p>
                  <p className="text-sm text-zinc-500 mt-2">Repartidor: {delivery.nombre_repartidor || 'No especificado'}</p>
                </div>
                <Button className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700" onClick={() => registerDelivery(delivery.id)}>
                  Registrar Ingreso de Delivery
                </Button>
              </CardContent>
            </Card>
          ))}
          {deliveries.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-lg">No hay deliveries esperados en este momento.</p>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={isCallModalOpen}
        onOpenChange={(open) => {
          setIsCallModalOpen(open);
          if (!open) resetCallModal();
        }}
      >
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">Verificación por Llamada</DialogTitle>
            <DialogDescription>Si el visitante no tiene QR, busca la propiedad para contactar al residente.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {!propertyContact ? (
              <div className="space-y-4">
                <Label>Propiedad (ej. CASA E-21)</Label>
                <div className="flex gap-2">
                  <Input
                    className="min-h-[48px]"
                    placeholder="Escribe para buscar..."
                    value={propertyQuery}
                    onFocus={() => setShowSuggestions(true)}
                    onChange={(e) => {
                      setPropertyQuery(e.target.value);
                      setSelectedProperty(null);
                      setShowSuggestions(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSearchProperty();
                    }}
                  />
                  <Button className="min-h-[48px]" onClick={handleSearchProperty}>Buscar</Button>
                </div>
                {showSuggestions && propertySuggestions.length > 0 && (
                  <ul className="max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-xs divide-y divide-zinc-100">
                    {propertySuggestions.map((property) => (
                      <li key={property.id}>
                        <button
                          type="button"
                          className="flex w-full items-center gap-3 px-4 min-h-[48px] text-left text-sm font-medium text-zinc-800 hover:bg-zinc-50"
                          onClick={() => selectProperty(property)}
                        >
                          <Home className="w-4 h-4 text-zinc-400" />
                          {property.identificador}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-zinc-900">Contactos de {propertyContact.identificador}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setPropertyContact(null);
                        setSelectedProperty(null);
                        setShowSuggestions(true);
                      }}
                    >
                      Cambiar
                    </Button>
                  </div>
                  {propertyContact.inquilino && (
                    <div className="flex justify-between items-center py-2 border-b border-zinc-200">
                      <div>
                        <p className="text-sm font-medium">Inquilino: {propertyContact.inquilino.nombre_completo}</p>
                        <p className="text-xs text-zinc-500">{propertyContact.inquilino.telefono}</p>
                      </div>
                      <Button size="sm" variant="outline"><Phone className="w-4 h-4" /></Button>
                    </div>
                  )}
                  {propertyContact.propietario && (
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <p className="text-sm font-medium">Propietario: {propertyContact.propietario.nombre_completo}</p>
                        <p className="text-xs text-zinc-500">{propertyContact.propietario.telefono}</p>
                      </div>
                      <Button size="sm" variant="outline"><Phone className="w-4 h-4" /></Button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <Label>Nombre del Visitante (para la bitácora)</Label>
                  <Input className="min-h-[48px]" value={visitorName} onChange={(e) => setVisitorName(e.target.value)} />
                  
                  <div className="flex gap-4 pt-4">
                    <Button variant="destructive" className="flex-1 min-h-[56px] text-lg" onClick={() => registerCallAuth(false)}>Denegar Ingreso</Button>
                    <Button className="flex-1 min-h-[56px] text-lg bg-emerald-600 hover:bg-emerald-700" onClick={() => registerCallAuth(true)}>Autorizar Ingreso</Button>
                  </div>
                </div>
              </div>
            )}
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
