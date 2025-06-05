
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Player, Team } from '@/types';
import { Edit, UserCircle, Loader2, Info, AlertTriangle } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface PlayerWithClubInfo extends Player {
  clubName?: string;
  clubLogoUrl?: string;
}

// Define a simpler Club type for mapping, as 'equipos' docs don't contain 'player' object
interface ClubInfo {
  id: string;
  name: string;
  logoUrl: string;
}

export default function ManagePlayersPage() {
  const [playersWithClubData, setPlayersWithClubData] = useState<PlayerWithClubInfo[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchPlayersAndClubs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const playersQuery = query(collection(db, "jugadores"), orderBy("name"));
      const clubsQuery = query(collection(db, "equipos"), orderBy("name"));

      const [playersSnapshot, clubsSnapshot] = await Promise.all([
        getDocs(playersQuery),
        getDocs(clubsQuery)
      ]);

      const playersData = playersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player));
      const clubsData = clubsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name, 
        logoUrl: doc.data().logoUrl 
      } as ClubInfo));
      
      const clubsMap = new Map(clubsData.map(club => [club.id, club]));

      const populatedPlayers = playersData.map(player => {
        const club = clubsMap.get(player.clubId);
        return {
          ...player,
          clubName: club?.name || 'Club Desconocido',
          clubLogoUrl: club?.logoUrl || 'https://placehold.co/32x32.png?text=?',
        };
      });
      setPlayersWithClubData(populatedPlayers);

    } catch (err) {
      console.error("Error fetching players/clubs: ", err);
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
    fetchPlayersAndClubs();
  }, [fetchPlayersAndClubs]);


  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Cargando jugadores...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <p className="text-xl text-destructive font-semibold">Error al Cargar Jugadores</p>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchPlayersAndClubs}>Reintentar</Button>
      </div>
    );
  }

  if (!playersWithClubData || playersWithClubData.length === 0) {
     return (
       <div className="space-y-8">
        <SectionTitle>Gestionar Jugadores</SectionTitle>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Listado de Jugadores (0)</CardTitle>
             <CardDescription>Aún no hay jugadores registrados o asignados a clubes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10">
              <UserCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay jugadores para mostrar.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Puedes añadir o editar jugadores desde la página de <Link href="/admin/clubs" className="underline hover:text-primary">gestión de clubes</Link>, seleccionando un club y luego editando su jugador.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="space-y-8">
      <SectionTitle>Gestionar Jugadores</SectionTitle>
      
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Listado de Jugadores ({playersWithClubData.length})</CardTitle>
          <CardDescription>Jugadores cargados desde la colección "jugadores".</CardDescription>
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
              {playersWithClubData.map((player) => (
                <TableRow key={player.id}>
                  <TableCell>
                    <Image 
                      src={player.imageUrl || "https://placehold.co/64x64.png?text=?"} 
                      alt={`${player.name} avatar`} 
                      width={40} 
                      height={40} 
                      className="rounded-full object-cover bg-muted p-0.5"
                      data-ai-hint="esports player photo"
                      onError={(e) => e.currentTarget.src = "https://placehold.co/64x64.png?text=Error"}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{player.name}</TableCell>
                  <TableCell className="font-mono text-xs">@{player.gamerTag}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Image
                        src={player.clubLogoUrl || 'https://placehold.co/32x32.png?text=?'}
                        alt={`${player.clubName} logo`}
                        width={24}
                        height={24}
                        className="rounded-sm object-contain bg-muted p-0.5"
                        data-ai-hint={player.clubName?.toLowerCase().includes("river") || player.clubName?.toLowerCase().includes("boca") ? "football club" : "team logo"}
                        onError={(e) => e.currentTarget.src = "https://placehold.co/32x32.png?text=Error"}
                      />
                      {player.clubName}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
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
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground italic mt-6">
        La información de los jugadores se guarda en la base de datos. Para añadir un nuevo jugador a un club, edita el club correspondiente.
      </p>
    </div>
  );
}
