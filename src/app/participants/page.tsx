
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { PlayerDetailCard } from '@/components/sections/participants/PlayerDetailCard';
import type { Team, Player } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Search, Loader2, AlertTriangle, Users } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface TeamWithPlayer extends Team {
  player?: Player; // Player is optional as a club might not have one assigned yet
}

export default function ParticipantsPage() {
  const [allTeamsWithPlayers, setAllTeamsWithPlayers] = useState<TeamWithPlayer[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<TeamWithPlayer[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedClubName, setSelectedClubName] = useState<string | undefined>(undefined);
  const [selectedClubLogo, setSelectedClubLogo] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTeamsAndPlayers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const equiposQuery = query(collection(db, "equipos"), orderBy("name"));
      const jugadoresQuery = query(collection(db, "jugadores"));

      const [equiposSnapshot, jugadoresSnapshot] = await Promise.all([
        getDocs(equiposQuery),
        getDocs(jugadoresQuery)
      ]);

      const equiposData = equiposSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));
      const jugadoresData = jugadoresSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
      
      const jugadoresMap = new Map(jugadoresData.map(jugador => [jugador.clubId, jugador]));

      const teamsWithPlayerData = equiposData.map(equipo => {
        const player = jugadoresMap.get(equipo.id); // clubId in player doc is the equipo.id
        return {
          ...equipo,
          player: player || undefined, // Assign player or undefined if not found
        };
      });

      setAllTeamsWithPlayers(teamsWithPlayerData);
      setFilteredTeams(teamsWithPlayerData); // Initialize filtered list
      if (teamsWithPlayerData.length > 0 && teamsWithPlayerData[0].player) {
        // Pre-select the first team's player if available
        handleSelectTeam(teamsWithPlayerData[0]);
      } else if (teamsWithPlayerData.length > 0) {
        // Pre-select first team even if no player, PlayerDetailCard handles null player
         handleSelectTeam(teamsWithPlayerData[0]);
      }


    } catch (err) {
      console.error("Error fetching teams/players: ", err);
      const errorMessage = err instanceof Error ? err.message : "No se pudieron cargar los datos.";
      setError(errorMessage);
      toast({
        title: "Error al Cargar Datos",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchTeamsAndPlayers();
  }, [fetchTeamsAndPlayers]);

  useEffect(() => {
    const lowercasedSearchTerm = searchTerm.toLowerCase();
    const results = allTeamsWithPlayers.filter(team => 
      team.name.toLowerCase().includes(lowercasedSearchTerm) ||
      (team.player && team.player.name.toLowerCase().includes(lowercasedSearchTerm)) ||
      (team.player && team.player.gamerTag.toLowerCase().includes(lowercasedSearchTerm))
    );
    setFilteredTeams(results);
  }, [searchTerm, allTeamsWithPlayers]);

  const handleSelectTeam = (team: TeamWithPlayer) => {
    setSelectedPlayer(team.player || null); // Pass null if player is undefined
    setSelectedClubName(team.name);
    setSelectedClubLogo(team.logoUrl);
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Cargando participantes desde Firestore...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <p className="text-xl text-destructive font-semibold">Error al Cargar Participantes</p>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchTeamsAndPlayers}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionTitle>Participantes del Torneo</SectionTitle>
      <p className="mb-6 text-muted-foreground">
        Conoce a los talentosos jugadores que representan a sus clubes en el AFA eSports Showdown.
        Los datos se cargan desde Firestore.
      </p>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar club o jugador..."
          className="pl-10 w-full md:w-1/2 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-1">
          <Card className="shadow-lg sticky top-20">
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-20rem)] min-h-[400px] rounded-md"> {/* Adjusted height */}
                {filteredTeams.length > 0 ? (
                  <ul className="p-2 sm:p-4 space-y-1 sm:space-y-2">
                    {filteredTeams.map((team: TeamWithPlayer) => (
                      <li key={team.id}>
                        <button
                          onClick={() => handleSelectTeam(team)}
                          className={`group w-full flex items-center gap-3 p-2 sm:p-3 rounded-md text-left transition-colors duration-150 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1
                            ${selectedClubLogo === team.logoUrl && selectedPlayer === team.player ? 'bg-primary text-primary-foreground shadow-md' : 'bg-card hover:bg-muted text-card-foreground'}`}
                          aria-current={selectedClubLogo === team.logoUrl && selectedPlayer === team.player ? "page" : undefined}
                        >
                          <Image
                            src={team.logoUrl || "https://placehold.co/40x40.png?text=?"}
                            alt={`${team.name} logo`}
                            width={32}
                            height={32}
                            className="rounded-full object-contain bg-muted p-0.5 flex-shrink-0"
                            data-ai-hint={team.name.toLowerCase().includes("river") || team.name.toLowerCase().includes("boca") ? "football club" : "team logo"}
                            onError={(e) => e.currentTarget.src = "https://placehold.co/40x40.png?text=Err"}
                          />
                          <div className="flex-grow overflow-hidden">
                            <span className="font-medium text-sm truncate block">{team.name}</span>
                            {team.player ? (
                              <span className={`text-xs truncate block 
                                ${selectedClubLogo === team.logoUrl && selectedPlayer === team.player 
                                  ? 'text-primary-foreground' // Fully opaque white when selected
                                  : 'text-muted-foreground group-hover:text-primary-foreground/80' // Default and non-selected hover state
                                }`
                              }>
                                {team.player.name} (@{team.player.gamerTag})
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground/70 italic truncate block">Sin jugador asignado</span>
                            )}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-6 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    No se encontraron clubes o jugadores que coincidan con tu búsqueda.
                  </div>
                )}
                {allTeamsWithPlayers.length === 0 && !isLoading && (
                   <div className="p-6 text-center text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    Aún no hay clubes registrados. <br/>Puedes añadirlos en el panel de administración.
                  </div>
                )}
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
