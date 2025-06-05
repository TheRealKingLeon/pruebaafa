
'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/admin/LoginForm';
import { Loader2 } from 'lucide-react'; // For loading state
import { Button } from '@/components/ui/button';

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, logout } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="relative">
      <div className="absolute top-4 right-4 z-50">
        <Button variant="outline" size="sm" onClick={logout}>
          Cerrar Sesión
        </Button>
      </div>
      {children}
    </div>
  );
}
