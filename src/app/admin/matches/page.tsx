
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Match, Team } from '@/types';
import { Edit, PlusCircle, CalendarDays, Loader2, Info, AlertTriangle, ListFilter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { getMatchesAction, getAllTeamsAction } from './actions'; // Added getAllTeamsAction
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditMatchDialog } from '@/components/admin/matches/EditMatchDialog'; // Import the new dialog

type MatchStatus = Match['status'];
const ALL_STATUSES: MatchStatus[] = ['pending_date', 'upcoming', 'live', 'completed'];
const STATUS_DISPLAY_NAMES: Record<MatchStatus, string> = {
  pending_date: 'Fecha Pend.',
  upcoming: 'Próximo',
  live: 'En Vivo',
  completed: 'Finalizado',
};


export default function ManageMatchesPage() {
  const [allMatches, setAllMatches] = useState<Match[] | null>(null);
  const [filteredMatches, setFilteredMatches] = useState<Match[] | null>(null);
  const [allTeams, setAllTeams] = useState<Team[]>([]); // State for all teams
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [selectedStatus, setSelectedStatus] = useState<MatchStatus | 'all'>('all');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);

  // State for the edit dialog
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentEditingMatch, setCurrentEditingMatch] = useState<Match | null>(null);

  const fetchMatchesAndTeams = useCallback(async () => { // Renamed to reflect it fetches teams too
    setIsLoading(true);
    setError(null);
    try {
      const [matchesResult, teamsResult] = await Promise.all([
        getMatchesAction(),
        getAllTeamsAction() // Fetch all teams for the edit dialog
      ]);

      if (matchesResult.error || !matchesResult.matches) {
        setError(matchesResult.error || "No se pudieron cargar los partidos.");
        toast({
          title: "Error al Cargar Partidos",
          description: matchesResult.error || "No se pudieron cargar los partidos.",
          variant: "destructive",
        });
        setAllMatches([]);
      } else {
        const sortedMatches = matchesResult.matches.sort((a, b) => {
          const aHasDate = !!a.date;
          const bHasDate = !!b.date;
          if (aHasDate && !bHasDate) return -1;
          if (!aHasDate && bHasDate) return 1;
          if (aHasDate && bHasDate) {
            const dateA = new Date(a.date!).getTime();
            const dateB = new Date(b.date!).getTime();
            if (dateA !== dateB) return dateB - dateA;
          }
          const groupCompare = (a.groupName || '').localeCompare(b.groupName || '');
          if (groupCompare !== 0) return groupCompare;
          return (a.matchday || 0) - (b.matchday || 0);
        });
        setAllMatches(sortedMatches);
        const uniqueGroups = Array.from(new Set(sortedMatches.map(m => m.groupName).filter(Boolean) as string[])).sort();
        setAvailableGroups(uniqueGroups);
      }

      if (teamsResult.error || !teamsResult.teams) {
        // Handle error for teams if necessary, e.g., disable editing
        console.error("Error fetching teams for edit dialog:", teamsResult.error);
        setAllTeams([]);
         toast({
          title: "Error al Cargar Equipos",
          description: teamsResult.error || "No se pudieron cargar los equipos para edición.",
          variant: "destructive",
        });
      } else {
        setAllTeams(teamsResult.teams);
      }

    } catch (err) {
        const generalError = err instanceof Error ? err.message : "Error desconocido al cargar datos.";
        setError(generalError);
        toast({
            title: "Error General",
            description: generalError,
            variant: "destructive",
        });
    } finally {
        setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMatchesAndTeams();
  }, [fetchMatchesAndTeams]);

  useEffect(() => {
    if (!allMatches) {
      setFilteredMatches(null);
      return;
    }
    let matches = [...allMatches];
    if (selectedStatus !== 'all') {
      matches = matches.filter(m => m.status === selectedStatus);
    }
    if (selectedGroup !== 'all') {
      matches = matches.filter(m => m.groupName === selectedGroup);
    }
    setFilteredMatches(matches);
  }, [allMatches, selectedStatus, selectedGroup]);

  const handleEditClick = (match: Match) => {
    // Ensure the match object has string dates for the form, if they exist
    const matchForForm = {
        ...match,
        date: match.date ? new Date(match.date).toISOString() : null,
        // Firestore Timestamps for createdAt/updatedAt are already converted to strings by actions
    };
    setCurrentEditingMatch(matchForForm);
    setIsEditModalOpen(true);
  };
  
  const handleMatchUpdate = () => {
    fetchMatchesAndTeams(); // Re-fetch matches after an update
  };


  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Cargando partidos...</p>
      </div>
    );
  }
  
  if (error) {
     return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <p className="text-xl text-destructive font-semibold">Error al Cargar Datos</p>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchMatchesAndTeams}>Reintentar</Button>
      </div>
    );
  }
  
  if (!allMatches || allMatches.length === 0) {
    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <SectionTitle>Gestionar Partidos</SectionTitle>
          <Button asChild className="opacity-50 pointer-events-none" title="Próximamente: Añadir Partido Manual">
            <Link href="#"> {/* This link would be for a separate add page, not a modal currently */}
              <PlusCircle className="mr-2 h-5 w-5" /> Añadir Nuevo Partido
            </Link>
          </Button>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Listado de Partidos (0)</CardTitle>
            <CardDescription>No hay partidos registrados o no se generaron desde la fase de grupos.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay partidos para mostrar.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Puedes generar partidos desde la sección <Link href="/admin/tournament-phases" className="underline hover:text-primary">Gestión de Fases del Torneo</Link> iniciando el seed de grupos.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <SectionTitle>Gestionar Partidos</SectionTitle>
        <Button asChild className="opacity-50 pointer-events-none" title="Próximamente: Añadir Partido Manual">
          <Link href="#"> {/* Disabled add button functionality for now */}
            <PlusCircle className="mr-2 h-5 w-5" /> Añadir Nuevo Partido
          </Link>
        </Button>
      </div>

      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ListFilter className="h-5 w-5 text-primary"/>
            Filtros de Partidos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Filtrar por Estado:</label>
            <Tabs defaultValue="all" onValueChange={(value) => setSelectedStatus(value as MatchStatus | 'all')}>
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 gap-1">
                <TabsTrigger value="all">Todos</TabsTrigger>
                {ALL_STATUSES.map(status => (
                  <TabsTrigger key={status} value={status}>{STATUS_DISPLAY_NAMES[status]}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {availableGroups.length > 0 && (
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">Filtrar por Grupo/Zona:</label>
              <Tabs defaultValue="all" onValueChange={(value) => setSelectedGroup(value as string)}>
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-1">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  {availableGroups.map(groupName => (
                    <TabsTrigger key={groupName} value={groupName} className="truncate">{groupName}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>


      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Listado de Partidos ({filteredMatches ? filteredMatches.length : 0})</CardTitle>
          <CardDescription>Partidos cargados. Aquí puedes editar fechas, horas, resultados y URLs de stream.</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMatches && filteredMatches.length > 0 ? (
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
                {filteredMatches.map((match) => (
                  <TableRow key={match.id}>
                    <TableCell>
                      {match.date ? (
                        <div className="flex items-center gap-1 text-xs">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div>{format(new Date(match.date), "dd MMM yyyy", { locale: es })}</div>
                            <div className="text-muted-foreground">{format(new Date(match.date), "HH:mm'hs'", { locale: es })}</div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">Fecha TBD</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Image src={match.team1?.logoUrl || "https://placehold.co/32x32.png?text=T1"} alt={match.team1?.name || "Equipo 1"} width={24} height={24} className="rounded-sm bg-muted p-0.5" data-ai-hint="team logo"/>
                        <span className="font-medium">{match.team1?.name || "Equipo 1"}</span>
                      </div>
                      <div className="my-1 text-center text-xs text-muted-foreground">vs</div>
                      <div className="flex items-center gap-2">
                        <Image src={match.team2?.logoUrl || "https://placehold.co/32x32.png?text=T2"} alt={match.team2?.name || "Equipo 2"} width={24} height={24} className="rounded-sm bg-muted p-0.5" data-ai-hint="team logo"/>
                        <span className="font-medium">{match.team2?.name || "Equipo 2"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {match.status === 'completed' && (match.score1 !== null && match.score2 !== null) ? `${match.score1} : ${match.score2}` : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={
                        match.status === 'completed' ? 'default' :
                        match.status === 'live' ? 'destructive' : 
                        match.status === 'pending_date' ? 'outline' : 'secondary'
                      }>
                        {STATUS_DISPLAY_NAMES[match.status] || match.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {match.groupName || match.roundName || '-'}
                      {match.matchday && ` (F${match.matchday})`}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(match)}>
                        <Edit className="mr-1 h-4 w-4" /> Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
             <div className="text-center py-10">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron partidos que coincidan con los filtros seleccionados.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {currentEditingMatch && (
        <EditMatchDialog
          isOpen={isEditModalOpen}
          onOpenChange={setIsEditModalOpen}
          match={currentEditingMatch}
          allTeams={allTeams}
          onMatchUpdate={handleMatchUpdate}
        />
      )}

      <p className="text-sm text-muted-foreground italic mt-6">
        Los partidos son generados desde la fase de grupos. La funcionalidad de "Añadir Nuevo Partido" manual está pendiente.
      </p>
    </div>
  );
}
