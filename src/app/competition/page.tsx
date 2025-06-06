
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Group, StandingEntry, PlayoffFixture as PlayoffFixtureType } from '@/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Trophy, ListChecks, BarChart3, Loader2, AlertTriangle, Swords, Info, LayoutGrid } from 'lucide-react';
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
  const [allPlayoffFixtures, setAllPlayoffFixtures] = useState<PlayoffFixtureType[] | null>(null);
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
        setAllPlayoffFixtures([]);
      } else {
        setGroupsWithStandings(result.groupsWithStandings);
        // Sort fixtures by round for display within each zone
        const sortedFixtures = result.playoffFixtures.sort((a, b) => {
            const roundOrder = ["Semifinal 1", "Semifinal 1 - Vuelta", "Semifinal 2", "Semifinal 2 - Vuelta", "Final", "Final - Vuelta"];
            return roundOrder.indexOf(a.round) - roundOrder.indexOf(b.round);
        });
        setAllPlayoffFixtures(sortedFixtures);
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

  const displayableGroupsForStandings = groupsWithStandings?.filter(g => g.standings && g.standings.length > 0) || [];
  const defaultGroupStageZoneId = displayableGroupsForStandings.length > 0 ? displayableGroupsForStandings[0].id : 'no-group-zones';
  
  const displayableZonesForPlayoffs = groupsWithStandings?.filter(g => g.zoneId && allPlayoffFixtures?.some(f => f.zoneId === g.zoneId)).map(g => ({id: g.id, name: g.name, zoneId: g.zoneId})) || [];
  const defaultPlayoffZoneId = displayableZonesForPlayoffs.length > 0 ? displayableZonesForPlayoffs[0].zoneId : 'no-playoff-zones';

  const getRoundDisplayName = (roundKey: string): string => {
    const names: Record<string, string> = {
      "Semifinal 1": "Semifinal 1",
      "Semifinal 1 - Vuelta": "Semifinal 1 (Vuelta)",
      "Semifinal 2": "Semifinal 2",
      "Semifinal 2 - Vuelta": "Semifinal 2 (Vuelta)",
      "Final": "Final",
      "Final - Vuelta": "Final (Vuelta)",
    };
    return names[roundKey] || roundKey;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Cargando datos de posiciones...</p>
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
      <SectionTitle>Posiciones y Playoffs</SectionTitle>

      <Tabs defaultValue="group-stage" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 mx-auto">
          <TabsTrigger value="group-stage" className="font-headline">
            <ListChecks className="mr-2 h-5 w-5" /> Fase de Grupos
          </TabsTrigger>
          <TabsTrigger value="playoffs" className="font-headline">
            <Trophy className="mr-2 h-5 w-5" /> Playoffs por Zona
          </TabsTrigger>
        </TabsList>

        <TabsContent value="group-stage" className="mt-6">
          <SectionTitle as="h3">Fase de Grupos</SectionTitle>
          <p className="mb-6 text-muted-foreground">
            Tablas de posiciones actualizadas.
          </p>
          
          {displayableGroupsForStandings.length > 0 ? (
            <Tabs defaultValue={defaultGroupStageZoneId} className="w-full">
              <TabsList className="flex flex-wrap w-full gap-1 rounded-md border-border bg-muted/30 mb-6 p-1">
                {displayableGroupsForStandings.map((group: Group) => (
                  <TabsTrigger 
                    key={group.id} 
                    value={group.id}
                    className="text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                  >
                    {group.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              {displayableGroupsForStandings.map((group: Group) => (
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
          <SectionTitle as="h3">Playoffs por Zona</SectionTitle>
          <p className="mb-6 text-muted-foreground">
            Cuadros de playoffs para cada zona del torneo.
          </p>
          {allPlayoffFixtures && allPlayoffFixtures.length > 0 && displayableZonesForPlayoffs.length > 0 ? (
            <Tabs defaultValue={defaultPlayoffZoneId} className="w-full">
              <TabsList className="flex flex-wrap w-full gap-1 mb-6 rounded-md border bg-muted/30 p-1">
                  {displayableZonesForPlayoffs.map((group) => (
                    <TabsTrigger
                      key={group.zoneId}
                      value={group.zoneId}
                      className="text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
                    >
                      {group.name}
                    </TabsTrigger>
                  ))}
              </TabsList>
              {displayableZonesForPlayoffs.map((group) => {
                  const zoneFixtures = allPlayoffFixtures.filter(f => f.zoneId === group.zoneId);
                  const fixturesByRound = zoneFixtures.reduce((acc, fixture) => {
                      const roundKey = fixture.round;
                      if (!acc[roundKey]) acc[roundKey] = [];
                      acc[roundKey].push(fixture);
                      return acc;
                  }, {} as Record<string, PlayoffFixtureType[]>);
                  const roundOrder = ["Semifinal 1", "Semifinal 1 - Vuelta", "Semifinal 2", "Semifinal 2 - Vuelta", "Final", "Final - Vuelta"];

                  return (
                  <TabsContent key={`${group.zoneId}-playoffs`} value={group.zoneId} className="mt-0">
                      <Card className="shadow-lg">
                          <CardHeader className="bg-muted/30">
                              <CardTitle className="text-xl font-headline text-primary flex items-center gap-2">
                                  <Trophy className="h-6 w-6" />
                                  Playoffs - {group.name}
                              </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4 space-y-6">
                              {zoneFixtures.length > 0 ? (
                                  roundOrder.map(roundKey => {
                                      const currentRoundFixtures = fixturesByRound[roundKey];
                                      if (!currentRoundFixtures || currentRoundFixtures.length === 0) return null;
                                      
                                      return (
                                          <div key={roundKey}>
                                              <h3 className="text-lg font-semibold mb-2 text-foreground flex items-center gap-2">
                                                <ListChecks className="h-5 w-5 text-muted-foreground" /> 
                                                {getRoundDisplayName(roundKey)}
                                              </h3>
                                              <div className="grid md:grid-cols-2 gap-4">
                                                  {currentRoundFixtures.map(fixture => (
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
                                              </div>
                                              {roundKey !== roundOrder[roundOrder.length -1] && <Separator className="my-6"/>}
                                          </div>
                                      );
                                  })
                              ) : (
                                <div className="text-center py-10 text-muted-foreground">
                                  <Info className="h-10 w-10 mx-auto mb-3 opacity-50" />
                                  No hay fixtures de playoffs para {group.name}.
                                </div>
                              )}
                          </CardContent>
                      </Card>
                  </TabsContent>
                  );
              })}
            </Tabs>
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
