
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockTeams as initialMockTeams } from '@/data/mock';
import type { Team, Player } from '@/types';
import { Edit, UserCircle, Loader2 } from 'lucide-react';

export default function ManagePlayersPage() {
  const [teams, setTeams] = useState<Team[] | null>(null);

  useEffect(() => {
    // Simulate fetching data
    // In a real app, you might fetch players or teams with player data
    setTeams(initialMockTeams);
  }, []);

  if (!teams) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Cargando jugadores...</p>
      </div>
    );
  }

  const playersWithClubInfo = teams.map(team => ({
    ...team.player,
    clubName: team.name,
    clubLogoUrl: team.logoUrl,
    // clubId is already on player, but explicitly adding for clarity if needed elsewhere
  }));

  return (
    <div className="space-y-8">
      <SectionTitle>Gestionar Jugadores</SectionTitle>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Listado de Jugadores ({playersWithClubInfo.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Avatar</TableHead>
                <TableHead>Nombre del Jugador</TableHead>
                <TableHead>GamerTag</TableHead>
                <TableHead>Club</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {playersWithClubInfo.map((player) => (
                <TableRow key={player.id}>
                  <TableCell>
                    <Image 
                      src={player.imageUrl} 
                      alt={`${player.name} avatar`} 
                      width={40} 
                      height={40} 
                      className="rounded-full object-cover bg-muted p-0.5"
                      data-ai-hint="esports player photo"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell className="font-mono text-xs">@{player.gamerTag}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Image
                        src={player.clubLogoUrl || 'https://placehold.co/32x32.png'}
                        alt={`${player.clubName} logo`}
                        width={24}
                        height={24}
                        className="rounded-sm object-contain bg-muted p-0.5"
                        data-ai-hint={player.clubName?.toLowerCase().includes("river") || player.clubName?.toLowerCase().includes("boca") ? "football club" : "team logo"}
                      />
                      {player.clubName}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      {/* Link to edit player details using clubId as player is tied to club */}
                      <Link href={`/admin/players/edit/${player.clubId}`}>
                        <Edit className="mr-1 h-4 w-4" />
                        Editar
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {playersWithClubInfo.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No hay jugadores para mostrar.</p>
          )}
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground italic mt-6">
        Nota: La gestión de jugadores implica editar la información del participante asignado a cada club.
        Las acciones de edición son prototipos y no modificarán los datos permanentemente.
      </p>
    </div>
  );
}
