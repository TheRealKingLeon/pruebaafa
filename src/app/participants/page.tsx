'use client';

import { useState } from 'react';
import Image from 'next/image';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { PlayerDetailCard } from '@/components/sections/participants/PlayerDetailCard';
import { mockTeams } from '@/data/mock';
import type { Team, Player } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export default function ParticipantsPage() {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedClubName, setSelectedClubName] = useState<string | undefined>(undefined);
  const [selectedClubLogo, setSelectedClubLogo] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelectTeam = (team: Team) => {
    setSelectedPlayer(team.player);
    setSelectedClubName(team.name);
    setSelectedClubLogo(team.logoUrl);
  };

  const filteredTeams = mockTeams.filter(team => 
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.player.gamerTag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <SectionTitle>Participantes</SectionTitle>
      <p className="mb-6 text-muted-foreground">
        Conoce a los 64 talentosos jugadores que representan a sus clubes en el AFA eSports Showdown.
        (Nota: Mostrando 8 equipos/jugadores a modo de ejemplo).
      </p>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar equipo o jugador..."
          className="pl-10 w-full md:w-1/2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <Card className="shadow-lg">
            <CardContent className="p-0">
              <ScrollArea className="h-[600px] rounded-md">
                <ul className="p-4 space-y-2">
                  {filteredTeams.length > 0 ? filteredTeams.map((team: Team) => (
                    <li key={team.id}>
                      <button
                        onClick={() => handleSelectTeam(team)}
                        className={`w-full flex items-center gap-3 p-3 rounded-md text-left transition-colors hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-accent
                          ${selectedPlayer?.clubId === team.id ? 'bg-accent text-accent-foreground' : 'bg-card hover:bg-secondary/70'}`}
                        aria-current={selectedPlayer?.clubId === team.id ? "page" : undefined}
                      >
                        <Image
                          src={team.logoUrl}
                          alt={`${team.name} logo`}
                          width={40}
                          height={40}
                          className="rounded-full object-contain"
                          data-ai-hint={team.name.toLowerCase().includes("river") || team.name.toLowerCase().includes("boca") ? "football club" : "team logo"}
                        />
                        <span className="font-medium">{team.name}</span>
                      </button>
                    </li>
                  )) : (
                    <li className="p-3 text-center text-muted-foreground">No se encontraron equipos.</li>
                  )}
                </ul>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <PlayerDetailCard player={selectedPlayer} clubName={selectedClubName} clubLogoUrl={selectedClubLogo} />
        </div>
      </div>
    </div>
  );
}
