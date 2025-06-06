
'use client';

import { useState, useEffect, useCallback } from 'react';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { MatchResultCard } from '@/components/sections/results/MatchResultCard';
import type { Match, Group } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListEnd, ListTodo, LayoutGrid, CalendarDays, Loader2, AlertTriangle, Info } from 'lucide-react';
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
        toast({ title: "Error al Cargar Partidos", description: result.error, variant: "destructive" });
        setAllMatches([]);
        setGroupList([]);
      } else {
        const sortedMatches = result.allMatches.sort((a, b) => {
          const aHasDate = !!a.date;
          const bHasDate = !!b.date;

          if (aHasDate && !bHasDate) return -1; 
          if (!aHasDate && bHasDate) return 1;  
          
          if (aHasDate && bHasDate) {
            const dateComparison = new Date(a.date!).getTime() - new Date(b.date!).getTime();
            if (dateComparison !== 0) return dateComparison; 
          }
          
          const groupCompare = (a.groupName || '').localeCompare(b.groupName || '');
          if (groupCompare !== 0) return groupCompare;
          
          return (a.matchday || 0) - (b.matchday || 0);
        });
        setAllMatches(sortedMatches);
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

  const completedMatches = allMatches?.filter(match => match.status === 'completed') || [];
  const upcomingAndLiveMatches = allMatches?.filter(match => ['upcoming', 'live', 'pending_date'].includes(match.status)) || [];
  
  const groupsWithCompletedMatches = groupList?.filter(group => 
    completedMatches.some(match => match.groupId === group.id || match.groupName === group.name)
  ) || [];

  const groupsWithUpcomingMatches = groupList?.filter(group =>
    upcomingAndLiveMatches.some(match => match.groupId === group.id || match.groupName === group.name)
  ) || [];

  const defaultUpcomingZoneId = groupsWithUpcomingMatches.length > 0 ? groupsWithUpcomingMatches[0].id : 'no-upcoming-zones';
  const defaultCompletedZoneIdForGroupSelection = groupsWithCompletedMatches.length > 0 ? `${groupsWithCompletedMatches[0].id}-completed` : 'no-completed-zones';


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
        <p className="text-xl text-destructive font-semibold">Error al Cargar Partidos</p>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchData}>Reintentar</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <SectionTitle>Partidos: Resultados y Próximos Encuentros</SectionTitle>
      <p className="mb-6 text-muted-foreground">
        Sigue todos los resultados de los partidos jugados y mantente al tanto de los próximos enfrentamientos, filtrados por zona y fecha. Los datos se cargan desde la base de datos.
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
          {completedMatches.length > 0 && groupsWithCompletedMatches.length > 0 ? (
            <>
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center text-primary">
                  <LayoutGrid className="mr-2 h-5 w-5" />
                  Selecciona una Zona
                </h3>
                  <Tabs defaultValue={defaultCompletedZoneIdForGroupSelection} className="w-full">
                    <TabsList className="flex w-full gap-2 mb-4 overflow-x-auto whitespace-nowrap">
                      {groupsWithCompletedMatches.map((group) => (
                        <TabsTrigger key={`${group.id}-completed-group-trigger`} value={`${group.id}-completed`} className="text-xs sm:text-sm py-2">
                          {group.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {groupsWithCompletedMatches.map((group) => {
                      const zoneCompletedMatches = completedMatches.filter(
                        (match) => match.groupId === group.id || match.groupName === group.name 
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
                                <TabsList className="flex flex-wrap w-full gap-2 mb-6">
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
                                        <div className="text-center py-10 text-muted-foreground">
                                          <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                          No hay partidos finalizados para {group.name} - Fecha {matchday}.
                                        </div>
                                      )}
                                    </TabsContent>
                                  );
                                })}
                              </Tabs>
                            </>
                          ) : (
                             <div className="text-center py-10 text-muted-foreground">
                                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                No hay partidos finalizados para {group.name}.
                            </div>
                          )}
                        </TabsContent>
                      );
                    })}
                  </Tabs>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
                <Info className="h-10 w-10 mx-auto mb-3 opacity-50" />
                No hay partidos finalizados aún.
            </div>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
          {upcomingAndLiveMatches.length > 0 && groupsWithUpcomingMatches.length > 0 ? (
            <>
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center text-primary">
                  <LayoutGrid className="mr-2 h-5 w-5" />
                  Selecciona una Zona
                </h3>
                  <Tabs defaultValue={defaultUpcomingZoneId} className="w-full">
                    <TabsList className="flex w-full gap-2 mb-4 overflow-x-auto whitespace-nowrap">
                      {groupsWithUpcomingMatches.map((group) => (
                        <TabsTrigger key={`${group.id}-upcoming-trigger`} value={group.id} className="text-xs sm:text-sm py-2">
                          {group.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {groupsWithUpcomingMatches.map((group) => {
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
                            <div className="text-center py-10 text-muted-foreground">
                                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                No hay próximos partidos programados para {group.name}.
                            </div>
                          )}
                        </TabsContent>
                      );
                    })}
                  </Tabs>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
                <Info className="h-10 w-10 mx-auto mb-3 opacity-50" />
                No hay próximos partidos programados.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

