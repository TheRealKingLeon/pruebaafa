
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, Users, Shuffle, Info } from 'lucide-react';
import type { Team, Group as GroupType } from '@/types';
import { getGroupsAndTeamsAction, autoAssignTeamsToGroupsAction } from './actions';
import { useToast } from '@/hooks/use-toast';

interface PopulatedGroup extends Omit<GroupType, 'teamIds'> {
  teams: Team[];
}

export default function ManageGroupsPage() {
  const [populatedGroups, setPopulatedGroups] = useState<PopulatedGroup[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { groups: firestoreGroups, teams, error: fetchError } = await getGroupsAndTeamsAction();
      if (fetchError) {
        setError(fetchError);
        setPopulatedGroups([]);
        setAllTeams([]);
        toast({ title: "Error al Cargar Datos", description: fetchError, variant: "destructive" });
        return;
      }

      setAllTeams(teams);
      
      const populated = firestoreGroups.map(group => {
        const groupTeams = group.teamIds
          .map(teamId => teams.find(t => t.id === teamId))
          .filter(Boolean) as Team[]; // Filter out undefined if a teamId is stale
        return { ...group, teams: groupTeams };
      });
      setPopulatedGroups(populated);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido al cargar datos.";
      setError(errorMessage);
      toast({ title: "Error Inesperado", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAutoAssign = async () => {
    setIsAssigning(true);
    try {
      const result = await autoAssignTeamsToGroupsAction();
      if (result.success) {
        toast({ title: "Asignación Exitosa", description: result.message });
        await fetchData(); // Refresh data
      } else {
        toast({ title: "Error en Asignación", description: result.message, variant: "destructive" });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido al asignar equipos.";
      toast({ title: "Error Inesperado", description: errorMessage, variant: "destructive" });
    } finally {
      setIsAssigning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Cargando datos de grupos y equipos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)] text-center p-4">
        <AlertTriangle className="h-16 w-16 text-destructive mb-4" />
        <p className="text-xl text-destructive font-semibold">Error al Cargar Grupos</p>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchData}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <SectionTitle>Gestionar Grupos (Zonas)</SectionTitle>
        <Button onClick={handleAutoAssign} disabled={isAssigning || allTeams.length === 0} className="w-full sm:w-auto">
          <Shuffle className="mr-2 h-5 w-5" />
          {isAssigning ? "Asignando Equipos..." : (allTeams.length === 0 ? "Añade equipos primero" : "Asignar Equipos Automáticamente")}
        </Button>
      </div>
      
      {allTeams.length === 0 && !isLoading && (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>No Hay Equipos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay equipos registrados en Firestore para asignar a los grupos.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Por favor, <Link href="/admin/clubs/add" className="underline hover:text-primary">añade clubes</Link> primero.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {allTeams.length > 0 && populatedGroups.length === 0 && !isLoading && !error && (
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>No Hay Grupos Definidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron grupos. Intenta recargar o asignar equipos.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {populatedGroups.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {populatedGroups.map((group) => (
            <Card key={group.id} className="shadow-lg">
              <CardHeader className="bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-xl font-headline text-primary">
                  <Users className="h-6 w-6" />
                  {group.name}
                </CardTitle>
                <CardDescription>Equipos asignados: {group.teams.length} / 8</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                {group.teams.length > 0 ? (
                  <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {group.teams.map((team) => (
                      <li key={team.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-secondary/10 transition-colors">
                        <Image
                          src={team.logoUrl || "https://placehold.co/32x32.png?text=?"}
                          alt={`${team.name} logo`}
                          width={28}
                          height={28}
                          className="rounded-sm object-contain bg-muted p-0.5"
                          data-ai-hint={team.name.toLowerCase().includes("river") || team.name.toLowerCase().includes("boca") ? "football club" : "team logo"}
                        />
                        <span className="text-sm font-medium truncate">{team.name}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">No hay equipos asignados a esta zona.</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <p className="text-sm text-muted-foreground italic mt-6">
        Los grupos y sus equipos se guardan en Firestore. La asignación automática distribuirá los equipos disponibles entre las 8 zonas.
        La funcionalidad para reemplazar equipos manualmente se implementará próximamente.
      </p>
    </div>
  );
}
