
'use client';

import type { ReactNode } from 'react';
import Link from 'next/link'; // Import Link
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/admin/LoginForm';
import { Loader2, Home } from 'lucide-react'; // Added Home icon
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
    <div className="min-h-screen flex flex-col bg-muted/40">
      <header className="bg-card text-card-foreground p-3 shadow-md flex justify-between items-center sticky top-0 z-50">
        <Button variant="link" asChild className="p-0 h-auto">
          <Link href="/admin" className="text-lg font-semibold text-primary hover:no-underline hover:opacity-80 transition-opacity">
            <Home className="h-5 w-5 mr-2 inline-block" /> {/* Added Home icon */}
            Panel de Administración
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={logout}>
          Cerrar Sesión
        </Button>
      </header>
      <main className="flex-grow p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
