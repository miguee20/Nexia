'use client';

import { useEffect, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentsReconciliationTab } from '@/components/finance/PaymentsReconciliationTab';
import { FeesTab, PropertyOption } from '@/components/finance/FeesTab';
import { DelinquencyTab } from '@/components/finance/DelinquencyTab';
import { MonthlyReportTab } from '@/components/finance/MonthlyReportTab';
import { propertyService } from '@/services/property.service';

const TRIGGER_CLASS =
  'min-h-11 flex-1 whitespace-nowrap rounded-md px-3 py-2 text-sm text-zinc-600 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-xs sm:min-h-8 sm:flex-none sm:py-1';

export default function FinanzasPage() {
  const [tab, setTab] = useState('conciliacion');
  const [properties, setProperties] = useState<PropertyOption[]>([]);

  useEffect(() => {
    propertyService
      .list()
      .then((res) =>
        setProperties(
          (res.data ?? []).map((p: { id: string; identificador: string }) => ({
            id: p.id,
            identificador: p.identificador,
          }))
        )
      )
      .catch(() => setProperties([]));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-0.5">
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 md:text-2xl">Finanzas</h1>
        <p className="text-sm text-zinc-500">Conciliación de pagos, emisión de cuotas, morosidad y reportes.</p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap rounded-lg bg-zinc-100/80 p-1 sm:inline-flex sm:w-auto print:hidden">
          <TabsTrigger value="conciliacion" className={TRIGGER_CLASS}>
            Conciliación
          </TabsTrigger>
          <TabsTrigger value="emision" className={TRIGGER_CLASS}>
            Emisión de cuotas
          </TabsTrigger>
          <TabsTrigger value="morosidad" className={TRIGGER_CLASS}>
            Morosidad
          </TabsTrigger>
          <TabsTrigger value="reporte" className={TRIGGER_CLASS}>
            Reporte mensual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conciliacion" className="mt-0">
          <PaymentsReconciliationTab />
        </TabsContent>
        <TabsContent value="emision" className="mt-0">
          <FeesTab properties={properties} />
        </TabsContent>
        <TabsContent value="morosidad" className="mt-0">
          <DelinquencyTab />
        </TabsContent>
        <TabsContent value="reporte" className="mt-0">
          <MonthlyReportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
