
import { SectionTitle } from '@/components/shared/SectionTitle';
import { MatchResultCard } from '@/components/sections/results/MatchResultCard';
import { mockMatches, mockGroups } from '@/data/mock';
import type { Match, Group } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ListEnd, ListTodo, LayoutGrid, CalendarDays } from 'lucide-react';

export default function ResultsPage() {
  const completedMatches = mockMatches.filter(match => match.status === 'completed');
  const upcomingAndLiveMatches = mockMatches.filter(match => match.status === 'upcoming' || match.status === 'live');

  const defaultUpcomingZoneId = mockGroups.length > 0 ? mockGroups[0].id : 'no-upcoming-zones';
  // Adjust defaultCompletedZoneId to point to the group's tab, not a matchday tab initially
  const defaultCompletedZoneIdForGroupSelection = mockGroups.length > 0 ? `${mockGroups[0].id}-completed` : 'no-completed-zones';

  return (
    <div className="space-y-8">
      <SectionTitle>Resultados y Próximos Partidos</SectionTitle>
      <p className="mb-6 text-muted-foreground">
        Sigue todos los resultados de los partidos jugados y mantente al tanto de los próximos enfrentamientos, filtrados por zona y fecha.
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
                {mockGroups.length > 0 ? (
                  <Tabs defaultValue={defaultCompletedZoneIdForGroupSelection} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
                      {mockGroups.map((group: Group) => (
                        <TabsTrigger key={`${group.id}-completed-group-trigger`} value={`${group.id}-completed`} className="text-xs sm:text-sm py-2">
                          {group.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {mockGroups.map((group: Group) => {
                      const zoneCompletedMatches = completedMatches.filter(
                        (match) => match.groupName === group.name
                      );

                      const uniqueMatchdays = Array.from(new Set(zoneCompletedMatches.map(m => m.matchday).filter(Boolean) as number[])).sort((a, b) => a - b);
                      const defaultMatchdayTab = `all-matchdays-${group.id}-completed`;

                      return (
                        <TabsContent key={`${group.id}-completed-content`} value={`${group.id}-completed`} className="mt-0"> {/* Removed mt-6 here for better nesting */}
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
                {mockGroups.length > 0 ? (
                  <Tabs defaultValue={defaultUpcomingZoneId} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
                      {mockGroups.map((group: Group) => (
                        <TabsTrigger key={`${group.id}-upcoming-trigger`} value={group.id} className="text-xs sm:text-sm py-2">
                          {group.name}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {mockGroups.map((group: Group) => {
                      const zoneMatches = upcomingAndLiveMatches.filter(
                        (match) => match.groupName === group.name
                      );
                      return (
                        <TabsContent key={`${group.id}-upcoming-content`} value={group.id} className="mt-0"> {/* Removed mt-6 for better nesting */}
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
