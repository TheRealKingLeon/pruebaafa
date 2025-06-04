import Image from 'next/image';
import type { Player } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, Gamepad, Info } from 'lucide-react';

interface PlayerDetailCardProps {
  player: Player | null;
  clubName?: string;
  clubLogoUrl?: string;
}

export function PlayerDetailCard({ player, clubName, clubLogoUrl }: PlayerDetailCardProps) {
  if (!player) {
    return (
      <Card className="sticky top-20 shadow-xl h-fit">
        <CardHeader>
          <CardTitle className="font-headline text-primary">Selecciona un Jugador</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Haz clic en un club de la lista para ver los detalles del jugador.</p>
          <div className="flex justify-center items-center h-64">
            <UserCircle className="w-32 h-32 text-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="sticky top-20 shadow-xl h-fit animate-fade-in">
      <CardHeader className="text-center bg-muted/30">
        {clubLogoUrl && clubName && (
          <Image
            src={clubLogoUrl}
            alt={`${clubName} logo`}
            width={80}
            height={80}
            className="mx-auto mb-2 rounded-full object-contain"
            data-ai-hint={clubName.toLowerCase().includes("river") || clubName.toLowerCase().includes("boca") ? "football club" : "team logo"}
          />
        )}
        <CardTitle className="font-headline text-2xl text-primary">{player.name}</CardTitle>
        <p className="text-accent font-semibold">{player.gamerTag}</p>
        {clubName && <p className="text-sm text-muted-foreground">Representando a {clubName}</p>}
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="flex justify-center">
          <Image
            src={player.imageUrl}
            alt={player.name}
            width={200}
            height={200}
            className="rounded-lg shadow-md object-cover"
            data-ai-hint="esports player photo"
          />
        </div>
        
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-primary mb-1">
            <Info className="h-5 w-5" /> Biografía
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{player.bio}</p>
        </div>
        
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-primary mb-1">
            <Gamepad className="h-5 w-5" /> Especialidad
          </h3>
          <p className="text-sm text-muted-foreground">FC 25 Virtuoso</p>
        </div>

      </CardContent>
    </Card>
  );
}
