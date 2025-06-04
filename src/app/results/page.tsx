import { SectionTitle } from '@/components/shared/SectionTitle';
import { MatchResultCard } from '@/components/sections/results/MatchResultCard';
import { mockMatches } from '@/data/mock';
import type { Match } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ListEnd, ListTodo } from 'lucide-react';

export default function ResultsPage() {
  const completedMatches = mockMatches.filter(match => match.status === 'completed');
  const upcomingMatches = mockMatches.filter(match => match.status === 'upcoming' || match.status === 'live');

  return (
    <div className="space-y-8">
      <SectionTitle>Resultados y Próximos Partidos</SectionTitle>
      <p className="mb-6 text-muted-foreground">
        Sigue todos los resultados de los partidos jugados y mantente al tanto de los próximos enfrentamientos.
      </p>

      <Tabs defaultValue="completed" className="w-full">
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
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedMatches.map((match: Match) => (
                <MatchResultCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">No hay partidos finalizados aún.</p>
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="mt-6">
           {upcomingMatches.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingMatches.map((match: Match) => (
                <MatchResultCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">No hay próximos partidos programados.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
