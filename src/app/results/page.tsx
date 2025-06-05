
'use client';

import { useState, useEffect, useCallback } from 'react';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { MatchResultCard } from '@/components/sections/results/MatchResultCard';
import type { Match, Group } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListEnd, ListTodo, LayoutGrid, CalendarDays, Loader2, AlertTriangle } from 'lucide-react';
import { getTournamentResultsData } from '@/app/services/tournament-service';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';


export default function ResultsPage() {
  const [allMatches, setAllMatches] = useState<Match[] | null>(null);
  const [groupList, setGroupList] = useState<Pick<Group, 'id' | 'name' | 'zoneId'>[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getTournamentResultsData();
      if (result.error) {
        setError(result.error);
        toast({ title: "Error al Cargar Resultados", description: result.error, variant: "destructive" });
        setAllMatches([]);
        setGroupList([]);
      } else {
        setAllMatches(result.allMatches);
        setGroupList(result.groupList);
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

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Cargando resultados desde Firestore...</p>
      </div>
    );
  }

  if (error) {
     return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <p className="text-xl text-destructive font-semibold">Error al Cargar Resultados</p>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchData}>Reintentar</Button>
      </div>
    );
  }
  
  const completedMatches = allMatches?.filter(match => match.status === 'completed') || [];
  const upcomingAndLiveMatches = allMatches?.filter(match => match.status === 'upcoming' || match.status === 'live' || match.status === 'pending_date') || [];
  
  const defaultUpcomingZoneId = groupList && groupList.length > 0 ? groupList[0].id : 'no-upcoming-zones';
  const defaultCompletedZoneIdForGroupSelection = groupList && groupList.length > 0 ? `${groupList[0].id}-completed` : 'no-completed-zones';

  return (
    <div className="space-y-8">
      <SectionTitle>Resultados y Próximos Partidos</SectionTitle>
      <p className="mb-6 text-muted-foreground">
        Sigue todos los resultados de los partidos jugados y mantente al tanto de los próximos enfrentamientos, filtrados por zona y fecha. Los datos se cargan desde Firestore.
      </p>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 mx-auto">
          <TabsTrigger value="completed">
            <ListEnd className="mr-2 h-5 w-5" /> Partidos Finalizados
          </TabsTrigger>
          <TabsTrigger value="upcoming">
            <ListTodo className="mr-2 h-5 w-5" /> Próximos Partidos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="completed" className="mt-6">
          {completedMatches.length > 0 ? (
            <>
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center text-primary">
                  <LayoutGrid className="mr-2 h-5 w-5" />
                  Selecciona una Zona
                </h3>
                {groupList && groupList.length > 0 ? (
                  <Tabs defaultValue={defaultCompletedZoneIdForGroupSelection} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
                      {groupList.map((group) => (
                        <TabsTrigger key={`${group.id}-completed-group-trigger`} value={`${group.id}-completed`} className="text-xs sm:text-sm py-2">
                          {group.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {groupList.map((group) => {
                      const zoneCompletedMatches = completedMatches.filter(
                        (match) => match.groupId === group.id || match.groupName === group.name // Match by ID or name for flexibility
                      );

                      const uniqueMatchdays = Array.from(new Set(zoneCompletedMatches.map(m => m.matchday).filter(Boolean) as number[])).sort((a, b) => a - b);
                      const defaultMatchdayTab = `all-matchdays-${group.id}-completed`;

                      return (
                        <TabsContent key={`${group.id}-completed-content`} value={`${group.id}-completed`} className="mt-0">
                          {zoneCompletedMatches.length > 0 ? (
                            <>
                              <h4 className="text-lg font-semibold mb-3 flex items-center text-muted-foreground">
                                <CalendarDays className="mr-2 h-4 w-4" />
                                Selecciona una Fecha
                              </h4>
                              <Tabs defaultValue={defaultMatchdayTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2 mb-6">
                                  <TabsTrigger value={`all-matchdays-${group.id}-completed`} className="text-xs py-1.5">Todas</TabsTrigger>
                                  {uniqueMatchdays.map(matchday => (
                                    <TabsTrigger key={`matchday-${matchday}-${group.id}-completed-trigger`} value={`matchday-${matchday}-${group.id}-completed`} className="text-xs py-1.5">
                                      Fecha {matchday}
                                    </TabsTrigger>
                                  ))}
                                </TabsList>
                                
                                <TabsContent value={`all-matchdays-${group.id}-completed`}>
                                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {zoneCompletedMatches.map((match: Match) => (
                                      <MatchResultCard key={`${match.id}-all-completed`} match={match} />
                                    ))}
                                  </div>
                                </TabsContent>

                                {uniqueMatchdays.map(matchday => {
                                  const matchesForMatchday = zoneCompletedMatches.filter(
                                    m => m.matchday === matchday
                                  );
                                  return (
                                    <TabsContent key={`matchday-${matchday}-${group.id}-completed-content`} value={`matchday-${matchday}-${group.id}-completed`}>
                                      {matchesForMatchday.length > 0 ? (
                                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                                          {matchesForMatchday.map((match: Match) => (
                                            <MatchResultCard key={`${match.id}-matchday-${matchday}`} match={match} />
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-center text-muted-foreground py-10">
                                          No hay partidos finalizados para {group.name} - Fecha {matchday}.
                                        </p>
                                      )}
                                    </TabsContent>
                                  );
                                })}
                              </Tabs>
                            </>
                          ) : (
                            <p className="text-center text-muted-foreground py-10">
                              No hay partidos finalizados para {group.name}.
                            </p>
                          )}
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                ) : (
                  <p className="text-center text-muted-foreground py-10">No hay zonas definidas para filtrar.</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-10">No hay partidos finalizados aún.</p>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingAndLiveMatches.length > 0 ? (
            <>
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center text-primary">
                  <LayoutGrid className="mr-2 h-5 w-5" />
                  Selecciona una Zona
                </h3>
                {groupList && groupList.length > 0 ? (
                  <Tabs defaultValue={defaultUpcomingZoneId} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
                      {groupList.map((group) => (
                        <TabsTrigger key={`${group.id}-upcoming-trigger`} value={group.id} className="text-xs sm:text-sm py-2">
                          {group.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {groupList.map((group) => {
                      const zoneMatches = upcomingAndLiveMatches.filter(
                        (match) => match.groupId === group.id || match.groupName === group.name
                      );
                      return (
                        <TabsContent key={`${group.id}-upcoming-content`} value={group.id} className="mt-0">
                          {zoneMatches.length > 0 ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {zoneMatches.map((match: Match) => (
                                <MatchResultCard key={match.id} match={match} />
                              ))}
                            </div>
                          ) : (
                            <p className="text-center text-muted-foreground py-10">
                              No hay próximos partidos programados para {group.name}.
                            </p>
                          )}
                        </TabsContent>
                      );
                    })}
                  </Tabs>
                ) : (
                  <p className="text-center text-muted-foreground py-10">No hay zonas definidas para filtrar.</p>
                )}
              </div>
            </>
          ) : (
            <p className="text-center text-muted-foreground py-10">No hay próximos partidos programados.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

    