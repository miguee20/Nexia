import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-background">
      <div className="flex flex-col items-center text-center space-y-6 max-w-2xl">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Building2 className="h-10 w-10" />
        </div>
        
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Nexia
        </h1>
        
        <p className="text-xl text-muted-foreground">
          SaaS multi-tenant para la gestión inteligente y segura de condominios residenciales.
        </p>

        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground">
          Fase 0 — Scaffolding Operativo
        </div>

        <div className="pt-8">
          <Button size="lg" className="font-semibold">
            Prueba de Componente shadcn/ui
          </Button>
        </div>
      </div>
    </main>
  );
}
