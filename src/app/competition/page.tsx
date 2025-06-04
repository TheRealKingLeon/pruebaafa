import { SectionTitle } from '@/components/shared/SectionTitle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockGroups, mockPlayoffRounds } from '@/data/mock';
import type { Group, PlayoffRound } from '@/types';
import { GroupCard } from '@/components/sections/competition/GroupCard';
import { PlayoffMatchCard } from '@/components/sections/competition/PlayoffMatchCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Trophy, ListChecks } from 'lucide-react';

export default function CompetitionPage() {
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
            Los equipos se dividen en grupos y compiten en un formato de todos contra todos. Los mejores avanzan a los Playoffs.
            (Nota: Mostrando 2 grupos de 4 equipos a modo de ejemplo. El torneo real tendrá 8 grupos de 8).
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
            {mockGroups.map((group: Group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="playoffs" className="mt-6">
          <SectionTitle as="h3">Playoffs</SectionTitle>
          <p className="mb-6 text-muted-foreground">
            Los equipos clasificados se enfrentan en eliminación directa hasta coronar al campeón.
          </p>
          {mockPlayoffRounds.map((round: PlayoffRound) => (
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
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
