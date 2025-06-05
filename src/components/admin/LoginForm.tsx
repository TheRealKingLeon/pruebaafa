
'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function LoginForm() {
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (login(password)) {
      toast({
        title: 'Acceso Concedido',
        description: 'Has iniciado sesión en el panel de administración.',
      });
    } else {
      setError('Contraseña incorrecta. Inténtalo de nuevo.');
      toast({
        title: 'Acceso Denegado',
        description: 'La contraseña proporcionada es incorrecta.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
            <Lock className="h-7 w-7" />
            Acceso al Panel de Admin
          </CardTitle>
          <CardDescription>
            Por favor, introduce la contraseña para continuar.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Tu contraseña"
                className={error ? 'border-destructive' : ''}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
             {!process.env.NEXT_PUBLIC_ADMIN_PASSWORD && (
              <p className="text-xs text-destructive/80">
                Advertencia: La variable NEXT_PUBLIC_ADMIN_PASSWORD no está configurada en el servidor. El inicio de sesión no funcionará.
              </p>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              Ingresar
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
