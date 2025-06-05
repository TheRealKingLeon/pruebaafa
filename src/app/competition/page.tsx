
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Group, StandingEntry, PlayoffFixture as PlayoffFixtureType } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Trophy, ListChecks, BarChart3, Loader2, AlertTriangle, Swords, Info } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { getTournamentCompetitionData } from '@/app/services/tournament-service';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';


export default function CompetitionPage() {
  const [groupsWithStandings, setGroupsWithStandings] = useState<Group[] | null>(null);
  const [playoffFixtures, setPlayoffFixtures] = useState<PlayoffFixtureType[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getTournamentCompetitionData();
      if (result.error) {
        setError(result.error);
        toast({ title: "Error al Cargar Datos", description: result.error, variant: "destructive" });
        setGroupsWithStandings([]);
        setPlayoffFixtures([]);
      } else {
        setGroupsWithStandings(result.groupsWithStandings);
        setPlayoffFixtures(result.playoffFixtures);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido.";
      setError(msg);
      toast({ title: "Error Inesperado", description: msg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const displayableGroups = groupsWithStandings?.filter(g => g.standings && g.standings.length > 0) || [];
  const defaultGroupStageZoneId = displayableGroups.length > 0 ? displayableGroups[0].id : 'no-group-zones';
  
  const groupedPlayoffFixtures = playoffFixtures?.reduce((acc, fixture) => {
    const round = fixture.round || "Desconocido";
    if (!acc[round]) acc[round] = [];
    acc[round].push(fixture);
    return acc;
  }, {} as Record<string, PlayoffFixtureType[]>) || {};

  const playoffRoundOrder = ["Cuartos de Final", "Semifinal", "Final"]; 

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Cargando datos de la competición desde Firestore...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <p className="text-xl text-destructive font-semibold">Error al Cargar Datos de Posiciones</p>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchData}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionTitle>Posiciones: Fase de Grupos y Playoffs</SectionTitle>

      <Tabs defaultValue="group-stage" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 mx-auto">
          <TabsTrigger value="group-stage" className="font-headline">
            <ListChecks className="mr-2 h-5 w-5" /> Fase de Grupos
          </TabsTrigger>
          <TabsTrigger value="playoffs" className="font-headline">
            <Trophy className="mr-2 h-5 w-5" /> Playoffs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="group-stage" className="mt-6">
          <SectionTitle as="h3">Fase de Grupos</SectionTitle>
          <p className="mb-6 text-muted-foreground">
            Los equipos se dividen en zonas y compiten en un formato de todos contra todos. Las tablas de posiciones se calculan dinámicamente a partir de los partidos completados en Firestore.
          </p>
          
          {displayableGroups.length > 0 ? (
            <Tabs defaultValue={defaultGroupStageZoneId} className="w-full">
              <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 rounded-md border-border bg-muted/30 mb-6">
                {displayableGroups.map((group: Group) => (
                  <TabsTrigger 
                    key={group.id} 
                    value={group.id}
                    className="text-xs sm:text-sm rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none focus-visible:ring-offset-0 focus-visible:ring-primary text-center py-3"
                  >
                    {group.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {displayableGroups.map((group: Group) => (
                <TabsContent key={`${group.id}-content`} value={group.id} className="mt-0">
                  <Card className="shadow-lg bg-card text-card-foreground overflow-hidden">
                    <CardHeader className="bg-muted/50 p-4 border-b border-border">
                      <CardTitle className="text-xl font-headline text-primary flex items-center gap-2">
                        <BarChart3 className="h-6 w-6" />
                        Posiciones - {group.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <Table className="min-w-full">
                          <TableHeader className="bg-secondary/30">
                            <TableRow className="border-border">
                              <TableHead className="px-2 py-3.5 text-center w-8">Pos</TableHead>
                              <TableHead className="px-2 py-3.5 min-w-[150px]">Club</TableHead>
                              <TableHead className="px-2 py-3.5 text-center">PTS</TableHead>
                              <TableHead className="px-2 py-3.5 text-center">PJ</TableHead>
                              <TableHead className="px-2 py-3.5 text-center">G</TableHead>
                              <TableHead className="px-2 py-3.5 text-center">E</TableHead>
                              <TableHead className="px-2 py-3.5 text-center">P</TableHead>
                              <TableHead className="px-2 py-3.5 text-center">GF</TableHead>
                              <TableHead className="px-2 py-3.5 text-center">GC</TableHead>
                              <TableHead className="px-2 py-3.5 text-center">DG</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.standings?.map((entry: StandingEntry) => (
                              <TableRow key={entry.team.id} className="border-border hover:bg-muted/20">
                                <TableCell className="px-2 py-4 text-center font-medium">{entry.position}</TableCell>
                                <TableCell className="px-2 py-4">
                                  <div className="flex items-center gap-2">
                                    <Image 
                                      src={entry.team.logoUrl || "https://placehold.co/32x32.png?text=?"} 
                                      alt={`${entry.team.name} logo`} 
                                      width={20} 
                                      height={20} 
                                      className="object-contain"
                                      data-ai-hint={entry.team.name.toLowerCase().includes("river") || entry.team.name.toLowerCase().includes("boca") ? "football club" : "team logo"}
                                    />
                                    <span className="text-sm truncate max-w-[120px] sm:max-w-none">{entry.team.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="px-2 py-4 text-center font-bold text-primary">{entry.points}</TableCell>
                                <TableCell className="px-2 py-4 text-center">{entry.played}</TableCell>
                                <TableCell className="px-2 py-4 text-center">{entry.won}</TableCell>
                                <TableCell className="px-2 py-4 text-center">{entry.drawn}</TableCell>
                                <TableCell className="px-2 py-4 text-center">{entry.lost}</TableCell>
                                <TableCell className="px-2 py-4 text-center">{entry.goalsFor}</TableCell>
                                <TableCell className="px-2 py-4 text-center">{entry.goalsAgainst}</TableCell>
                                <TableCell className="px-2 py-4 text-center">{entry.goalDifference}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
             <div className="text-center py-10 text-muted-foreground">
                <Info className="h-10 w-10 mx-auto mb-3 opacity-50" />
                No hay grupos con tablas de posiciones disponibles en este momento.
            </div>
          )}
        </TabsContent>

        <TabsContent value="playoffs" className="mt-6">
          <SectionTitle as="h3">Playoffs</SectionTitle>
          <p className="mb-6 text-muted-foreground">
            Llaves de playoffs generadas desde el panel de administración.
          </p>
          {playoffFixtures && playoffFixtures.length > 0 ? (
            <div className="space-y-6">
            {playoffRoundOrder.map(roundName => {
              const roundFixtures = groupedPlayoffFixtures[roundName];
              if (!roundFixtures || roundFixtures.length === 0) return null;

              return (
                <Card key={roundName} className="shadow-lg">
                  <CardHeader className="bg-muted/30">
                    <CardTitle className="text-xl font-headline text-primary flex items-center gap-2">
                      <ListChecks className="h-6 w-6" />
                      {roundName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 grid md:grid-cols-2 gap-4">
                    {roundFixtures.map(fixture => (
                      <Card key={fixture.id} className="bg-card border">
                        <CardHeader className="p-3">
                          <CardDescription className="text-xs font-semibold text-primary">{fixture.matchLabel}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-3 text-sm">
                          {fixture.status === 'pending_teams' || (!fixture.team1Id || !fixture.team2Id) ? (
                            <p className="text-muted-foreground italic">Equipos por definir</p>
                          ) : (
                            <div className="flex items-center justify-between space-x-2">
                              <div className="flex flex-col items-center text-center w-2/5">
                                <Image
                                  src={fixture.team1LogoUrl || "https://placehold.co/48x48.png?text=?"}
                                  alt={fixture.team1Name || "Equipo 1"}
                                  width={32}
                                  height={32}
                                  className="rounded-full object-contain mb-1"
                                  data-ai-hint="team logo"
                                />
                                <span className="font-medium text-xs truncate w-24">{fixture.team1Name || "Equipo 1"}</span>
                              </div>
                              <Swords className="h-5 w-5 text-muted-foreground shrink-0" />
                              <div className="flex flex-col items-center text-center w-2/5">
                                <Image
                                  src={fixture.team2LogoUrl || "https://placehold.co/48x48.png?text=?"}
                                  alt={fixture.team2Name || "Equipo 2"}
                                  width={32}
                                  height={32}
                                  className="rounded-full object-contain mb-1"
                                  data-ai-hint="team logo"
                                />
                                <span className="font-medium text-xs truncate w-24">{fixture.team2Name || "Equipo 2"}</span>
                              </div>
                            </div>
                          )}
                           <Separator className="my-2"/>
                           <p className="text-xs text-muted-foreground text-center">
                              Estado: <span className={`font-semibold ${fixture.status === 'upcoming' ? 'text-blue-500' : fixture.status === 'completed' ? 'text-green-500' : 'text-amber-500'}`}>
                                  {fixture.status === 'upcoming' ? 'Próximo' : fixture.status === 'completed' ? 'Finalizado' : 'Pendiente'}
                              </span>
                           </p>
                        </CardContent>
                      </Card>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
          ) : (
             <div className="text-center py-10 text-muted-foreground">
                <Info className="h-10 w-10 mx-auto mb-3 opacity-50" />
                No hay llaves de playoffs definidas o generadas desde el panel de administración.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
