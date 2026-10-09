'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../stores/useAuth';
import { api } from '../../../lib/api';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Ingresa un correo válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setAuth = useAuth((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validación Zod
      loginSchema.parse({ email, password });

      // Llamada al API
      const response = await api.post('/auth/login', { email, password });
      
      const { accessToken, user } = response.data;
      setAuth(user, accessToken);

      // Redirección según rol
      switch (user.rol) {
        case 'SUPERADMIN':
          router.push('/sa/condominios');
          break;
        case 'ADMIN_CONDOMINIO':
          router.push('/dashboard');
          break;
        case 'GUARDIA':
          router.push('/garita');
          break;
        case 'RESIDENTE':
          router.push('/mi-cuenta');
          break;
        default:
          router.push('/');
      }
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        setError(err.issues[0]?.message || 'Error de validación');
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Ocurrió un error inesperado al intentar iniciar sesión');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="rounded-2xl border border-zinc-200/80 bg-white p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]">
          <CardHeader className="space-y-1.5 p-0 pb-6">
            <CardTitle className="text-2xl font-semibold tracking-tight text-zinc-900">Nexia</CardTitle>
            <CardDescription className="text-xs font-normal text-zinc-500">
              Ingresa a tu cuenta para continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div role="alert" className="flex items-start gap-2 rounded-lg border border-rose-200/60 bg-rose-50 p-3 text-xs text-rose-700">
                  <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-zinc-700">Correo Electrónico</Label>
                <Input
                  id="email"
                  className="h-9 text-sm"
                  type="email"
                  placeholder="nombre@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-zinc-700">Contraseña</Label>
                <Input
                  id="password"
                  className="h-9 text-sm"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="mt-2 h-9 w-full bg-zinc-900 text-sm text-white shadow-2xs hover:bg-zinc-800" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar Sesión
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="text-center text-xs text-zinc-500">
          SaaS Multi-tenant para Condominios
        </p>
      </div>
    </div>
  );
}
