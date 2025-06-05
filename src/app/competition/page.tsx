
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockPlayoffRounds as importedMockPlayoffRounds, mockGroups as importedMockGroups } from '@/data/mock';
import type { Group, PlayoffRound, StandingEntry } from '@/types';
import { PlayoffMatchCard } from '@/components/sections/competition/PlayoffMatchCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy, ListChecks, BarChart3, Loader2 } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

export default function CompetitionPage() {
  const [pageGroups, setPageGroups] = useState<Group[] | null>(null);
  const [playoffRoundsData, setPlayoffRoundsData] = useState<PlayoffRound[] | null>(null);

  useEffect(() => {
    setPageGroups(importedMockGroups);
    setPlayoffRoundsData(importedMockPlayoffRounds);
  }, []);

  if (!pageGroups || !playoffRoundsData) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Cargando datos de la competición...</p>
      </div>
    );
  }

  const defaultGroupStageZoneId = pageGroups.length > 0 ? pageGroups[0].id : 'no-group-zones';
  const defaultPlayoffZoneId = pageGroups.length > 0 ? pageGroups[0].id : 'no-playoff-zones';


  return (
    <div className="space-y-8">
      <SectionTitle>Formato de Competición</SectionTitle>

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
            Los equipos se dividen en zonas y compiten en un formato de todos contra todos. Los mejores avanzan a los Playoffs de su respectiva zona.
            Selecciona una zona para ver las posiciones.
          </p>
          
          <Tabs defaultValue={defaultGroupStageZoneId} className="w-full">
            <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 rounded-md border-border bg-muted/30 mb-6">
              {pageGroups.map((group: Group) => (
                <TabsTrigger 
                  key={group.id} 
                  value={group.id}
                  className="text-xs sm:text-sm rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none focus-visible:ring-offset-0 focus-visible:ring-primary text-center py-3"
                >
                  {group.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {pageGroups.map((group: Group) => (
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
                          {group.standings.map((entry: StandingEntry) => (
                            <TableRow key={entry.team.id} className="border-border hover:bg-muted/20">
                              <TableCell className="px-2 py-4 text-center font-medium">{entry.position}</TableCell>
                              <TableCell className="px-2 py-4">
                                <div className="flex items-center gap-2">
                                  <Image 
                                    src={entry.team.logoUrl} 
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
        </TabsContent>

        <TabsContent value="playoffs" className="mt-6">
          <SectionTitle as="h3">Playoffs</SectionTitle>
          <p className="mb-6 text-muted-foreground">
            Los equipos clasificados de cada zona se enfrentan en eliminación directa (ida y vuelta) hasta coronar al campeón de la zona.
            Selecciona una zona para ver sus llaves de Playoffs.
          </p>
          <Tabs defaultValue={defaultPlayoffZoneId} className="w-full">
            <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 rounded-md border-border bg-muted/30 mb-6">
              {pageGroups.map((group: Group) => (
                <TabsTrigger 
                  key={`playoff-tab-${group.id}`} 
                  value={group.id}
                  className="text-xs sm:text-sm rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none focus-visible:ring-offset-0 focus-visible:ring-primary text-center py-3"
                >
                  {group.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {pageGroups.map((group: Group) => {
              const zonePlayoffRounds = playoffRoundsData?.filter(
                (r) => r.zoneId === group.id
              ) || [];

              const roundOrder = ["Semifinal - Ida", "Semifinal - Vuelta", "Final - Ida", "Final - Vuelta"];
    
              const orderedRounds = zonePlayoffRounds.sort((a, b) => {
                return roundOrder.indexOf(a.name) - roundOrder.indexOf(b.name);
              });

              return (
                <TabsContent key={`playoff-content-${group.id}`} value={group.id} className="mt-0">
                  {orderedRounds.length > 0 ? (
                    orderedRounds.map((round: PlayoffRound) => (
                      <div key={round.id} className="mb-8">
                        <Card className="shadow-lg">
                          <CardHeader className="bg-primary text-primary-foreground">
                            <CardTitle className="text-2xl font-headline">{round.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-6">
                            {round.matches.length > 0 ? (
                              <div className="grid md:grid-cols-2 gap-4">
                                {round.matches.map((match) => (
                                  <PlayoffMatchCard key={match.id} match={match} />
                                ))}
                              </div>
                            ) : (
                              <p className="text-muted-foreground">Los partidos de esta ronda se definirán próximamente.</p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground py-10">
                      Los Playoffs para {group.name} no han sido definidos aún.
                    </p>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}
