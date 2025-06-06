
import Image from 'next/image';
import type { Player } from '@/types';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { UserCircle, Info, Puzzle } from 'lucide-react'; // Removed Gamepad, Shield, ShieldPlus

interface PlayerDetailCardProps {
  player: Player | null;
  clubName?: string;
  clubLogoUrl?: string;
}

export function PlayerDetailCard({ player, clubName, clubLogoUrl }: PlayerDetailCardProps) {
  if (!selectedClubName && !player) { // Show initial prompt if no club is even selected
    return (
      <Card className="sticky top-20 shadow-xl h-fit">
        <CardContent className="p-8 text-center">
          <CardTitle className="font-headline text-2xl text-primary mb-4">Selecciona un Club</CardTitle>
          <p className="text-muted-foreground mb-8">Haz clic en un club de la lista para ver los detalles de su jugador.</p>
          <div className="flex justify-center items-center">
            <UserCircle className="w-40 h-40 text-muted opacity-50" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!player && selectedClubName) { // Show if a club is selected but has no player
     return (
      <Card className="sticky top-20 shadow-xl h-fit animate-fade-in overflow-hidden">
        <CardContent className="p-6 text-center">
           {clubLogoUrl && (
            <Image
                src={clubLogoUrl}
                alt={`${selectedClubName} logo`}
                width={64}
                height={64}
                className="rounded-full object-contain mx-auto mb-4 border"
                data-ai-hint={selectedClubName?.toLowerCase().includes("river") || selectedClubName?.toLowerCase().includes("boca") ? "football club" : "team logo"}
              />
           )}
          <CardTitle className="font-headline text-xl text-primary mb-2">{selectedClubName}</CardTitle>
          <p className="text-muted-foreground">Este club aún no tiene un jugador asignado.</p>
          <p className="text-sm text-muted-foreground mt-1">Puedes asignarle uno desde el panel de administración.</p>
        </CardContent>
      </Card>
    );
  }
  
  // This will only render if player is not null.
  // The above conditions handle the null/undefined cases.
  if (!player) return null;


  return (
    <Card className="sticky top-20 shadow-xl h-fit animate-fade-in overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Player Image - Make it take less space on md+ and be on left/top */}
          <div className="w-full md:w-1/3 flex-shrink-0">
            <Image
              src={player.imageUrl} 
              alt={player.name}
              width={300} 
              height={400}
              className="rounded-lg shadow-lg object-cover w-full aspect-[3/4]" // Ensure aspect ratio
              data-ai-hint="esports player photo"
              priority
            />
          </div>

          {/* Player Info - Takes remaining space */}
          <div className="flex-grow space-y-4">
            {clubLogoUrl && clubName && (
              <div className="flex items-center gap-3 mb-2">
                <Image
                  src={clubLogoUrl}
                  alt={`${clubName} logo`}
                  width={32}
                  height={32}
                  className="rounded-full object-contain border"
                  data-ai-hint={clubName.toLowerCase().includes("river") || clubName.toLowerCase().includes("boca") ? "football club" : "team logo"}
                />
                <p className="text-sm text-muted-foreground">
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
        </div>
      </CardContent>
    </Card>
  );
}
