
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Shield, Users, ListOrdered, Settings } from 'lucide-react';

export default function AdminDashboardPage() {
  const managementSections = [
    { title: 'Gestionar Clubes', href: '/admin/clubs', icon: Shield, description: 'Añadir, editar o eliminar clubes participantes.' },
    { title: 'Gestionar Jugadores', href: '/admin/players', icon: Users, description: 'Administrar los perfiles de los jugadores.' },
    { title: 'Gestionar Grupos', href: '/admin/groups', icon: ListOrdered, description: 'Configurar las zonas y los equipos asignados.' },
    { title: 'Gestionar Partidos', href: '/admin/matches', icon: Settings, description: 'Programar enfrentamientos y actualizar resultados.' },
  ];

  return (
    <div className="space-y-8">
      <SectionTitle>Panel de Administración</SectionTitle>
      <p className="text-muted-foreground">
        Bienvenido al panel de administración. Desde aquí puedes gestionar los diferentes aspectos del torneo.
      </p>
      <div className="grid md:grid-cols-2 gap-6">
        {managementSections.map((section) => (
          <Card key={section.title} className="shadow-lg hover:shadow-primary/20 transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl font-headline text-primary">
                <section.icon className="h-6 w-6" />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{section.description}</p>
              <Button asChild className="w-full">
                <Link href={section.href}>Ir a {section.title.split(' ')[1]}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground italic mt-6">
        Nota: Las funcionalidades de edición y guardado de datos son prototipos. En una aplicación real, se requeriría integración con una base de datos.
      </p>
    </div>
  );
}
