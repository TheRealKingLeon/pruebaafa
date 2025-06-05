
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Player, Team } from '@/types';
import { Edit, UserCircle, Loader2, Info, AlertTriangle, Users, UploadCloud, Trash, UserPlus } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteAllPlayersAction } from './actions';
import { ImportPlayersDialog } from '@/components/admin/players/ImportPlayersDialog';


interface PlayerWithClubInfo extends Player {
  clubName?: string;
  clubLogoUrl?: string;
}

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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

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

  const handleDeleteAllPlayers = async () => {
    setIsDeletingAll(true);
    const result = await deleteAllPlayersAction();
    if (result.success) {
      toast({
        title: "Todos los Jugadores Eliminados",
        description: result.message,
      });
      setPlayersWithClubData([]); 
    } else {
      toast({
        title: "Error al Eliminar Jugadores",
        description: result.message,
        variant: "destructive",
      });
    }
    setIsDeletingAll(false);
  };
  
  const handleImportSuccess = () => {
    fetchPlayersAndClubs(); 
    setIsImportModalOpen(false); 
  };


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

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-2">
        <SectionTitle>Gestionar Jugadores</SectionTitle>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setIsImportModalOpen(true)} variant="outline">
            <UploadCloud className="mr-2 h-5 w-5" /> Importar Jugadores desde CSV
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={isDeletingAll || !playersWithClubData || playersWithClubData.length === 0}>
                <Trash className="mr-2 h-5 w-5" />
                {isDeletingAll ? "Limpiando..." : "Limpiar Todos los Jugadores"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Seguro que quieres eliminar TODOS los jugadores?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción es irreversible y eliminará todos los jugadores de la base de datos.
                  Esto podría afectar el funcionamiento de otras partes del sistema si los jugadores son referenciados.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAllPlayers} disabled={isDeletingAll}>
                  Sí, eliminar todos
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button asChild variant="secondary">
            <Link href="/admin/clubs">
              <UserPlus className="mr-2 h-5 w-5" /> Asignar/Crear Jugador
            </Link>
          </Button>
        </div>
      </div>
      
      {(!playersWithClubData || playersWithClubData.length === 0) ? (
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Listado de Jugadores (0)</CardTitle>
             <CardDescription>Aún no hay jugadores registrados o asignados a clubes.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay jugadores para mostrar.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Puedes empezar importando desde un archivo CSV o asignando un jugador a un club.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Listado de Jugadores ({playersWithClubData.length})</CardTitle>
            <CardDescription>Jugadores cargados desde la colección "jugadores". Para añadir un jugador a un club que aún no tiene, usa el botón "Asignar/Crear Jugador".</CardDescription>
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
      )}
      <p className="text-sm text-muted-foreground italic mt-6">
        La información de los jugadores se guarda en la base de datos. El botón "Asignar/Crear Jugador" te llevará a la gestión de clubes para que puedas seleccionar uno y luego gestionar su jugador.
      </p>
      <ImportPlayersDialog 
        isOpen={isImportModalOpen} 
        onOpenChange={setIsImportModalOpen} 
        onImportSuccess={handleImportSuccess} 
      />
    </div>
  );
}
