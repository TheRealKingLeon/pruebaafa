
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Loader2, Info, AlertTriangle, UserCog } from 'lucide-react';
import type { Team } from '@/types'; 
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { deleteClubAction } from './actions';
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

interface ClubDocument extends Omit<Team, 'player' | 'id'> { 
  id: string;
  createdAt?: any; 
  updatedAt?: any;
}

export default function ManageClubsPage() {
  const [clubs, setClubs] = useState<ClubDocument[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchClubs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const q = query(collection(db, "equipos"), orderBy("name"));
      const querySnapshot = await getDocs(q);
      const clubsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Team, 'id' | 'player'>) 
      } as ClubDocument));
      setClubs(clubsData);
    } catch (err) {
      console.error("Error fetching clubs: ", err);
      const errorMessage = err instanceof Error ? err.message : "No se pudieron cargar los clubes.";
      setError(errorMessage);
      toast({
        title: "Error al Cargar Clubes",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  const handleDeleteClub = async (clubId: string, clubName: string) => {
    const result = await deleteClubAction(clubId);
    if (result.success) {
      toast({
        title: "Club Eliminado",
        description: `El club "${clubName}" ha sido eliminado.`,
      });
      setClubs(prevClubs => prevClubs ? prevClubs.filter(club => club.id !== clubId) : null);
    } else {
      toast({
        title: "Error al Eliminar",
        description: result.message || `No se pudo eliminar el club "${clubName}".`,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Cargando clubes desde Firestore...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <p className="text-xl text-destructive font-semibold">Error al Cargar Clubes</p>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchClubs}>Reintentar</Button>
      </div>
    );
  }
  
  if (!clubs || clubs.length === 0) {
    return (
       <div className="space-y-8">
        <div className="flex justify-between items-center">
          <SectionTitle>Gestionar Clubes</SectionTitle>
          <Button asChild>
            <Link href="/admin/clubs/add">
              <PlusCircle className="mr-2 h-5 w-5" /> Añadir Nuevo Club
            </Link>
          </Button>
        </div>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Listado de Clubes (0)</CardTitle>
            <CardDescription>Aún no hay clubes registrados en Firestore.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay clubes para mostrar.</p>
              <p className="text-sm text-muted-foreground mt-2">Puedes empezar añadiendo uno nuevo.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <SectionTitle>Gestionar Clubes</SectionTitle>
        <Button asChild>
          <Link href="/admin/clubs/add">
            <PlusCircle className="mr-2 h-5 w-5" /> Añadir Nuevo Club
          </Link>
        </Button>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Listado de Clubes ({clubs.length})</CardTitle>
          <CardDescription>Clubes cargados desde la base de datos Firestore ("equipos").</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Logo</TableHead>
                <TableHead>ID del Club (Firestore)</TableHead>
                <TableHead>Nombre del Club</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clubs.map((club) => (
                <TableRow key={club.id}>
                  <TableCell>
                    <Image 
                      src={club.logoUrl || "https://placehold.co/64x64.png?text=?"} 
                      alt={`${club.name} logo`} 
                      width={40} 
                      height={40} 
                      className="rounded-md object-contain bg-muted p-1"
                      data-ai-hint={club.name.toLowerCase().includes("river") || club.name.toLowerCase().includes("boca") ? "football club" : "team logo"}
                      onError={(e) => e.currentTarget.src = "https://placehold.co/64x64.png?text=Error"}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{club.id}</TableCell>
                  <TableCell className="font-medium">{club.name}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" asChild title="Editar Club">
                      <Link href={`/admin/clubs/edit/${club.id}`}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar Club</span>
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild title="Gestionar Jugador">
                      <Link href={`/admin/players/edit/${club.id}`}>
                        <UserCog className="h-4 w-4" />
                        <span className="sr-only">Gestionar Jugador</span>
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" title="Eliminar Club">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar Club</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente el club "{club.name}" de la base de datos.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteClub(club.id, club.name)}>
                            Sí, eliminar club
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground italic mt-6">
        Los clubes se gestionan en Firestore. Para asignar o editar un jugador de un club, usa el botón <UserCog className="inline h-4 w-4" />.
      </p>
    </div>
  );
}

