
import Image from 'next/image';
import type { Match } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react'; // Added Clock
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface MatchResultCardProps {
  match: Match;
}

export function MatchResultCard({ match }: MatchResultCardProps) {
  const matchDate = new Date(match.date);
  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Top section: Group, Matchday, Date, Time */}
        <div className="flex justify-between items-start">
          <div>
            <p className="text-xs font-semibold text-primary">{match.groupName || match.roundName || 'Partido'}</p>
            {match.matchday && <p className="text-xs text-muted-foreground">Fecha {match.matchday}</p>}
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground flex items-center justify-end">
              <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{format(matchDate, "dd MMM yyyy", { locale: es })}</span>
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-end">
              <Clock className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{format(matchDate, "HH:mm'hs'", { locale: es })}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Main content: Teams and Score/VS */}
        <div className="flex items-stretch"> {/* Main flex row for teams and VS */}
          {/* Left part: Teams stacked vertically */}
          <div className="flex-grow space-y-2 pr-2">
            {/* Team 1 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0">
                <Image 
                  src={match.team1.logoUrl} 
                  alt={`${match.team1.name} logo`} 
                  width={28} 
                  height={28} 
                  className="rounded-full object-contain flex-shrink-0"
                  data-ai-hint={match.team1.name.toLowerCase().includes("river") || match.team1.name.toLowerCase().includes("boca") ? "football club" : "team logo"}
                />
                <span className="font-medium text-sm truncate">{match.team1.name}</span>
              </div>
              {/* Placeholder for Player 1 Image - can be uncommented and styled later */}
              {/* <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0 ml-2 hidden sm:flex items-center justify-center text-xs">P1</div> */}
            </div>

            {/* Team 2 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0">
                <Image 
                  src={match.team2.logoUrl} 
                  alt={`${match.team2.name} logo`} 
                  width={28} 
                  height={28} 
                  className="rounded-full object-contain flex-shrink-0"
                  data-ai-hint={match.team2.name.toLowerCase().includes("river") || match.team2.name.toLowerCase().includes("boca") ? "football club" : "team logo"}
                />
                <span className="font-medium text-sm truncate">{match.team2.name}</span>
              </div>
              {/* Placeholder for Player 2 Image - can be uncommented and styled later */}
              {/* <div className="w-8 h-8 bg-muted rounded-full flex-shrink-0 ml-2 hidden sm:flex items-center justify-center text-xs">P2</div> */}
            </div>
          </div>

          {/* Right part: VS / Score, aligned to the right of the teams block */}
          <div className="w-1/5 flex flex-col items-center justify-center text-center border-l border-border pl-2">
            {match.status === 'completed' ? (
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-primary">{match.score1}</span>
                <span className="text-xs text-muted-foreground">-</span>
                <span className="text-lg font-bold text-primary">{match.score2}</span>
              </div>
            ) : (
              <span className="text-md font-semibold text-muted-foreground">VS</span>
            )}
          </div>
        </div>
        
        <Separator />
        
        {/* Bottom: Status Badge */}
        <div className="text-center pt-1">
            <Badge 
                variant={match.status === 'upcoming' ? 'secondary' : (match.status === 'live' ? 'destructive' : 'default')} 
                className="uppercase text-xs px-3 py-1"
            >
                {match.status === 'upcoming' ? 'Próximo' : (match.status === 'live' ? 'En Vivo' : 'Finalizado')}
            </Badge>
        </div>

      </CardContent>
    </Card>
  );
}
