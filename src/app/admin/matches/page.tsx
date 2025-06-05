'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockMatches as initialMockMatches } from '@/data/mock';
import type { Match } from '@/types';
import { Edit, PlusCircle, CalendarDays, Loader2, Info } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

export default function ManageMatchesPage() {
  const [matches, setMatches] = useState<Match[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching data
    // In a real app, you might re-fetch or use a state management solution that updates
    // after add/edit actions. For now, we use initialMockMatches.
    setMatches([...initialMockMatches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Cargando partidos...</p>
      </div>
    );
  }
  
  if (!matches) {
     return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)]">
        <Info className="h-16 w-16 text-destructive mb-4" />
        <p className="text-xl text-muted-foreground">No se pudieron cargar los partidos.</p>
        <Button onClick={() => {
          setIsLoading(true);
          setMatches([...initialMockMatches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
          setIsLoading(false);
        }} className="mt-4">Reintentar</Button>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <SectionTitle>Gestionar Partidos</SectionTitle>
        <Button asChild>
          {/* TODO: Link to /admin/matches/add when created */}
          <Link href="/admin/matches/add" className="opacity-50 pointer-events-none" title="Próximamente: Añadir Partido">
            <PlusCircle className="mr-2 h-5 w-5" /> Añadir Nuevo Partido
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Listado de Partidos ({matches.length})</CardTitle>
          <CardDescription>Aquí puedes ver y editar los detalles de los partidos del torneo.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Fecha y Hora</TableHead>
                <TableHead>Enfrentamiento</TableHead>
                <TableHead className="text-center">Resultado</TableHead>
                <TableHead className="text-center">Estado</TableHead>
                <TableHead>Grupo/Ronda</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matches.map((match) => (
                <TableRow key={match.id}>
                  <TableCell>
                    <div className="flex items-center gap-1 text-xs">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div>{format(new Date(match.date), "dd MMM yyyy", { locale: es })}</div>
                        <div className="text-muted-foreground">{format(new Date(match.date), "HH:mm'hs'", { locale: es })}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Image src={match.team1.logoUrl} alt={match.team1.name} width={24} height={24} className="rounded-sm bg-muted p-0.5" data-ai-hint="team logo" />
                      <span className="font-medium">{match.team1.name}</span>
                    </div>
                    <div className="my-1 text-center text-xs text-muted-foreground">vs</div>
                    <div className="flex items-center gap-2">
                      <Image src={match.team2.logoUrl} alt={match.team2.name} width={24} height={24} className="rounded-sm bg-muted p-0.5" data-ai-hint="team logo" />
                      <span className="font-medium">{match.team2.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-mono">
                    {match.status === 'completed' ? `${match.score1 ?? '-'} : ${match.score2 ?? '-'}` : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={
                      match.status === 'completed' ? 'default' :
                      match.status === 'live' ? 'destructive' : 'secondary'
                    }>
                      {match.status === 'completed' ? 'Finalizado' : match.status === 'live' ? 'En Vivo' : 'Próximo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {match.groupName || match.roundName || '-'}
                    {match.matchday && ` (F${match.matchday})`}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/matches/edit/${match.id}`}>
                        <Edit className="mr-1 h-4 w-4" /> Editar
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {matches.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No hay partidos para mostrar.</p>
          )}
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground italic mt-6">
        Nota: Las acciones de edición son prototipos y los cambios se reflejarán en la consola del servidor.
        La funcionalidad de "Añadir Nuevo Partido" está pendiente de implementación.
      </p>
    </div>
  );
}