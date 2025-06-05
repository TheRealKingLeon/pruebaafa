
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { mockTeams as initialMockTeams } from '@/data/mock';
import type { Team } from '@/types';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';

export default function ManageClubsPage() {
  const [teams, setTeams] = useState<Team[] | null>(null);

  useEffect(() => {
    // Simulate fetching data
    setTeams(initialMockTeams);
  }, []);

  const handleDeleteClub = (clubId: string) => {
    // In a real app, this would call an API to delete the club.
    // For this prototype, we'll just log it and filter the client-side state.
    console.log(`Attempting to delete club with ID: ${clubId}`);
    setTeams(prevTeams => prevTeams ? prevTeams.filter(team => team.id !== clubId) : null);
    // Optionally, show a toast notification
  };

  if (!teams) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Cargando clubes...</p>
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
          <CardTitle>Listado de Clubes ({teams.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Logo</TableHead>
                <TableHead>ID del Club</TableHead>
                <TableHead>Nombre del Club</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell>
                    <Image 
                      src={team.logoUrl} 
                      alt={`${team.name} logo`} 
                      width={40} 
                      height={40} 
                      className="rounded-md object-contain bg-muted p-1"
                      data-ai-hint={team.name.toLowerCase().includes("river") || team.name.toLowerCase().includes("boca") ? "football club" : "team logo"}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">{team.id}</TableCell>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/clubs/edit/${team.id}`}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Link>
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteClub(team.id)}
                      title="Eliminar (Prototipo)"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Eliminar</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {teams.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No hay clubes para mostrar.</p>
          )}
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground italic mt-6">
        Nota: Las acciones de editar y eliminar son prototipos y no modificarán los datos permanentemente.
        La eliminación solo afecta la vista actual de la página.
      </p>
    </div>
  );
}
