import Image from 'next/image';
import type { Match } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface MatchResultCardProps {
  match: Match;
}

export function MatchResultCard({ match }: MatchResultCardProps) {
  const matchDate = new Date(match.date);
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <CardHeader className="bg-muted/30 p-4">
        <CardTitle className="text-lg font-headline text-primary flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-5 w-5" /> 
            {match.groupName || match.roundName || 'Partido Amistoso'}
          </span>
          {match.status === 'completed' && <ShieldCheck className="h-5 w-5 text-green-500" />}
          {match.status === 'upcoming' && <ShieldAlert className="h-5 w-5 text-yellow-500" />}
          {match.status === 'live' && <ShieldAlert className="h-5 w-5 text-red-500 animate-pulse" />}
        </CardTitle>
        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
          <Calendar className="h-3 w-3" />
          <span>{format(matchDate, "dd MMM yyyy, HH:mm", { locale: es })}</span>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Team 1 */}
          <div className="flex items-center gap-2 w-2/5">
            <Image 
              src={match.team1.logoUrl} 
              alt={`${match.team1.name} logo`} 
              width={32} 
              height={32} 
              className="rounded-full object-contain"
              data-ai-hint={match.team1.name.toLowerCase().includes("river") || match.team1.name.toLowerCase().includes("boca") ? "football club" : "team logo"}
            />
            <span className="font-medium truncate">{match.team1.name}</span>
          </div>

          {/* Score / Status */}
          <div className="text-center">
            {match.status === 'completed' ? (
              <span className="text-2xl font-bold text-primary">
                {match.score1} - {match.score2}
              </span>
            ) : (
              <Badge variant={match.status === 'upcoming' ? 'secondary' : 'destructive'} className="uppercase">
                {match.status === 'upcoming' ? 'Próximo' : 'En Vivo'}
              </Badge>
            )}
          </div>

          {/* Team 2 */}
          <div className="flex items-center gap-2 w-2/5 justify-end">
            <span className="font-medium truncate text-right">{match.team2.name}</span>
            <Image 
              src={match.team2.logoUrl} 
              alt={`${match.team2.name} logo`} 
              width={32} 
              height={32} 
              className="rounded-full object-contain"
              data-ai-hint={match.team2.name.toLowerCase().includes("river") || match.team2.name.toLowerCase().includes("boca") ? "football club" : "team logo"}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
