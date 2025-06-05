
import Image from 'next/image';
import type { Player } from '@/types';
import { Card, CardContent, CardTitle } from '@/components/ui/card'; // Removed CardHeader
import { UserCircle, Gamepad, Info, Shield, ShieldPlus, Puzzle } from 'lucide-react';

interface PlayerDetailCardProps {
  player: Player | null;
  clubName?: string;
  clubLogoUrl?: string;
}

export function PlayerDetailCard({ player, clubName, clubLogoUrl }: PlayerDetailCardProps) {
  if (!player) {
    return (
      <Card className="sticky top-20 shadow-xl h-fit">
        <CardContent className="p-8 text-center"> {/* Increased padding, text-center */}
          <CardTitle className="font-headline text-2xl text-primary mb-4">Selecciona un Jugador</CardTitle>
          <p className="text-muted-foreground mb-8">Haz clic en un club de la lista para ver los detalles del jugador.</p>
          <div className="flex justify-center items-center">
            <UserCircle className="w-40 h-40 text-muted opacity-50" /> {/* Larger icon */}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-20 shadow-xl h-fit animate-fade-in overflow-hidden">
      <CardContent className="p-6">
        <div className="grid md:grid-cols-12 gap-6 items-start">
          {/* Left Column: Player Info */}
          <div className="md:col-span-7 space-y-4">
            {clubLogoUrl && clubName && (
              <div className="flex items-center gap-3 mb-3">
                <Image
                  src={clubLogoUrl}
                  alt={`${clubName} logo`}
                  width={32}
                  height={32}
                  className="rounded-full object-contain"
                  data-ai-hint={clubName.toLowerCase().includes("river") || clubName.toLowerCase().includes("boca") ? "football club" : "team logo"}
                />
                <p className="text-xs text-muted-foreground">
                  Representando a <span className="font-semibold text-foreground">{clubName}</span>
                </p>
              </div>
            )}

            <h1 className="text-3xl lg:text-4xl font-bold font-headline text-primary leading-tight">{player.name}</h1>
            <p className="text-xl font-semibold text-foreground -mt-1">@{player.gamerTag}</p>
            
            <div className="pt-3 space-y-4">
              <div>
                <h3 className="flex items-center gap-2 text-md font-semibold text-muted-foreground mb-1">
                  <Info className="h-4 w-4" /> Biografía
                </h3>
                <p className="text-sm text-foreground/80 leading-relaxed">{player.bio}</p>
              </div>
              
              {player.favoriteFormation && (
                <div>
                  <h3 className="flex items-center gap-2 text-md font-semibold text-muted-foreground mb-1">
                    <Puzzle className="h-4 w-4" /> Formación Favorita
                  </h3>
                  <p className="text-sm text-foreground/80">{player.favoriteFormation}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Player Image */}
          <div className="md:col-span-5 flex items-center justify-center md:justify-end mt-4 md:mt-0">
            <Image
              src={player.imageUrl} 
              alt={player.name}
              width={300} 
              height={400} // Increased height
              className="rounded-lg shadow-xl object-cover" // Removed aspect-square and border classes
              data-ai-hint="esports player photo"
              priority // Prioritize loading the main player image
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

