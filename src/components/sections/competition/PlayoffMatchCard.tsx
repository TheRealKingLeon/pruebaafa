import Image from 'next/image';
import type { Match } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Shield, Versus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PlayoffMatchCardProps {
  match: Match;
}

export function PlayoffMatchCard({ match }: PlayoffMatchCardProps) {
  const matchDate = new Date(match.date);

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardContent className="pt-6">
        <div className="flex items-center justify-around text-center mb-4">
          <div className="flex flex-col items-center w-1/3">
            <Image 
              src={match.team1.logoUrl} 
              alt={`${match.team1.name} logo`} 
              width={60} 
              height={60} 
              className="mb-2 rounded-full object-contain"
              data-ai-hint={match.team1.name.toLowerCase().includes("river") || match.team1.name.toLowerCase().includes("boca") ? "football club" : "team logo"}
            />
            <span className="font-semibold truncate w-full">{match.team1.name}</span>
            {match.status === 'completed' && typeof match.score1 === 'number' && (
              <span className="text-2xl font-bold text-primary">{match.score1}</span>
            )}
          </div>
          
          <Versus className="h-8 w-8 text-accent mx-2" />

          <div className="flex flex-col items-center w-1/3">
            <Image 
              src={match.team2.logoUrl} 
              alt={`${match.team2.name} logo`} 
              width={60} 
              height={60} 
              className="mb-2 rounded-full object-contain"
              data-ai-hint={match.team2.name.toLowerCase().includes("river") || match.team2.name.toLowerCase().includes("boca") ? "football club" : "team logo"}
            />
            <span className="font-semibold truncate w-full">{match.team2.name}</span>
            {match.status === 'completed' && typeof match.score2 === 'number' && (
              <span className="text-2xl font-bold text-primary">{match.score2}</span>
            )}
          </div>
        </div>

        <div className="text-sm text-muted-foreground text-center space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{format(matchDate, "eeee dd 'de' MMMM, HH:mm", { locale: es })}</span>
          </div>
          {match.status === 'upcoming' && (
            <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">Próximamente</span>
          )}
          {match.status === 'live' && (
            <span className="inline-block bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium animate-pulse">En Vivo</span>
          )}
          {match.status === 'completed' && (
            <span className="inline-block bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">Finalizado</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
