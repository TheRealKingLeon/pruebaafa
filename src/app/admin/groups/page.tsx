
'use client';

import { useState, useEffect, useCallback, type DragEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, Users, Shuffle, Info, RotateCcw, Move } from 'lucide-react';
import type { Team, Group as GroupType } from '@/types';
import { getGroupsAndTeamsAction, autoAssignTeamsToGroupsAction, resetAndClearGroupsAction, manualMoveTeamAction } from './actions';
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

interface PopulatedGroup extends Omit<GroupType, 'teamIds'> {
  teams: Team[];
}

const TEAMS_PER_ZONE_CLIENT = 4; // Keep client consistent with server

export default function ManageGroupsPage() {
  const [populatedGroups, setPopulatedGroups] = useState<PopulatedGroup[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Drag and Drop state
  const [draggedTeam, setDraggedTeam] = useState<Team | null>(null);
  const [sourceGroupIdForDrag, setSourceGroupIdForDrag] = useState<string | null>(null);


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
          .filter(Boolean) as Team[]; 
        return { ...group, id: group.id, name: group.name, zoneId: group.zoneId, teams: groupTeams };
      }).sort((a,b) => a.name.localeCompare(b.name)); 
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
        await fetchData(); 
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

  const handleResetGroups = async () => {
    setIsResetting(true);
    try {
      const result = await resetAndClearGroupsAction();
      if (result.success) {
        toast({ title: "Grupos Limpiados", description: result.message });
        await fetchData(); 
      } else {
        toast({ title: "Error al Limpiar Grupos", description: result.message, variant: "destructive" });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido al limpiar los grupos.";
      toast({ title: "Error Inesperado", description: errorMessage, variant: "destructive" });
    } finally {
      setIsResetting(false);
    }
  };
  
  const onDragStart = (e: DragEvent<HTMLLIElement>, team: Team, currentGroupId: string) => {
    e.dataTransfer.setData('teamId', team.id);
    e.dataTransfer.setData('sourceGroupId', currentGroupId);
    setDraggedTeam(team);
    setSourceGroupIdForDrag(currentGroupId);
    e.currentTarget.style.opacity = '0.5';
  };

  const onDragEnd = (e: DragEvent<HTMLLIElement>) => {
    e.currentTarget.style.opacity = '1';
    setDraggedTeam(null);
    setSourceGroupIdForDrag(null);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
  };

  const onDrop = async (e: DragEvent<HTMLDivElement>, targetGroupId: string) => {
    e.preventDefault();
    const teamId = e.dataTransfer.getData('teamId');
    const currentSourceGroupId = e.dataTransfer.getData('sourceGroupId');

    if (!teamId || !currentSourceGroupId || !targetGroupId ) {
      console.log("Drop cancelled: missing data");
      setDraggedTeam(null); // Reset dragged team state
      setSourceGroupIdForDrag(null);
      return;
    }
    if (currentSourceGroupId === targetGroupId) {
        // console.log("Drop cancelled: same group"); // Optional: log if needed
        setDraggedTeam(null);
        setSourceGroupIdForDrag(null);
        return; // Do nothing if dropped on the same group
    }

    const teamToMove = allTeams.find(t => t.id === teamId);
    if (!teamToMove) {
        console.error("Dragged team not found in allTeams.");
        setDraggedTeam(null);
        setSourceGroupIdForDrag(null);
        return;
    }

    // Optimistic UI update
    setPopulatedGroups(prevGroups => {
      const newGroups = prevGroups.map(g => ({
          ...g,
          teams: [...g.teams] // Ensure teams array is a new instance
      }));

      const sourceGroupIndex = newGroups.findIndex(g => g.id === currentSourceGroupId);
      const targetGroupIndex = newGroups.findIndex(g => g.id === targetGroupId);
      
      if (sourceGroupIndex === -1 || targetGroupIndex === -1) {
          console.error("Optimistic update failed: source or target group not found.");
          return prevGroups;
      }

      const sourceGroup = newGroups[sourceGroupIndex];
      const targetGroup = newGroups[targetGroupIndex];

      // Check if team already exists in target group (client-side check)
      if (targetGroup.teams.find(t => t.id === teamId)) {
         toast({ title: "Equipo Duplicado", description: `El equipo "${teamToMove.name}" ya está en el grupo "${targetGroup.name}".`, variant: "destructive" });
         return prevGroups;
      }

      const targetIsFull = targetGroup.teams.length >= TEAMS_PER_ZONE_CLIENT;

      if (targetIsFull) {
        // Perform a swap
        const teamToSwapOut = targetGroup.teams[0]; 
        if (!teamToSwapOut) {
          console.error("Optimistic update swap failed: target group full but no team to swap out.");
          // This scenario should ideally not be reached if targetIsFull and TEAMS_PER_ZONE_CLIENT > 0
          toast({ title: "Error de Intercambio", description: "El grupo de destino está lleno pero no se encontró un equipo para intercambiar.", variant: "destructive" });
          return prevGroups;
        }

        // 1. Remove teamToMove from sourceGroup.teams
        sourceGroup.teams = sourceGroup.teams.filter(t => t.id !== teamToMove.id);
        // 2. Add teamToSwapOut to sourceGroup.teams (if not already there)
        if (!sourceGroup.teams.find(t => t.id === teamToSwapOut.id)) {
           sourceGroup.teams.push(teamToSwapOut);
        }

        // 3. Remove teamToSwapOut from targetGroup.teams
        targetGroup.teams = targetGroup.teams.filter(t => t.id !== teamToSwapOut.id);
        // 4. Add teamToMove to targetGroup.teams
        targetGroup.teams.push(teamToMove);
        
        toast({ title: "Intercambio Realizado", description: `"${teamToMove.name}" movido a ${targetGroup.name} e "${teamToSwapOut.name}" movido a ${sourceGroup.name}.`});
      } else {
        // Target has space, simple move
        sourceGroup.teams = sourceGroup.teams.filter(t => t.id !== teamToMove.id);
        targetGroup.teams.push(teamToMove);
        // For simple move, server response will provide primary toast.
      }
      return newGroups;
    });
    
    setDraggedTeam(null); // Reset dragged team state after optimistic update
    setSourceGroupIdForDrag(null);


    // Call server action
    const result = await manualMoveTeamAction({ teamId, sourceGroupId: currentSourceGroupId, targetGroupId });
    if (result.success) {
      // Toast for simple move or general success. Swap-specific toast is shown optimistically.
      if (!(populatedGroups.find(g=>g.id === targetGroupId)?.teams.length === TEAMS_PER_ZONE_CLIENT -1 && populatedGroups.find(g=>g.id === currentSourceGroupId)?.teams.length === 1)){
         toast({ title: "Movimiento Exitoso", description: result.message });
      }
      // Fetch data to ensure consistency, especially if optimistic update was complex or for any edge cases.
      await fetchData(); 
    } else {
      toast({ title: "Error al Mover/Intercambiar", description: result.message, variant: "destructive" });
      // Revert optimistic update if server action fails by re-fetching
      await fetchData(); 
    }
  };


  const activeGroups = populatedGroups.filter(group => group.teams.length > 0);


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
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={handleAutoAssign} disabled={isAssigning || allTeams.length === 0} className="w-full sm:w-auto">
            <Shuffle className="mr-2 h-5 w-5" />
            {isAssigning ? "Asignando..." : (allTeams.length === 0 ? "Añade equipos primero" : "Asignar Automáticamente")}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={isResetting} className="w-full sm:w-auto">
                <RotateCcw className="mr-2 h-5 w-5" />
                {isResetting ? "Limpiando..." : "Reiniciar Grupos"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de limpiar los grupos?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción desasignará todos los equipos de todas las zonas.
                  La asignación automática deberá realizarse nuevamente si deseas llenarlos.
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleResetGroups} disabled={isResetting}>
                  Sí, limpiar grupos
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
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

      {allTeams.length > 0 && populatedGroups.every(g => g.teams.length === 0) && !isLoading && !error && (
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>No Hay Equipos Asignados a Zonas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Ninguna zona tiene equipos asignados actualmente.</p>
              <p className="text-sm text-muted-foreground mt-2">
                 Usa el botón "Asignar Automáticamente" para distribuir los equipos disponibles.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {populatedGroups.map((group) => ( 
          <Card 
            key={group.id} 
            className={`shadow-lg ${group.teams.length === 0 ? 'opacity-70 border-dashed' : ''}`}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, group.id)}
            data-groupid={group.id}
          >
            <CardHeader className="bg-muted/30">
              <CardTitle className="flex items-center gap-2 text-xl font-headline text-primary">
                <Users className="h-6 w-6" />
                {group.name}
              </CardTitle>
              <CardDescription>Equipos asignados: {group.teams.length} / {TEAMS_PER_ZONE_CLIENT}</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 min-h-[150px]"> 
              {group.teams.length > 0 ? (
                <ul className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {group.teams.map((team) => (
                    <li 
                      key={team.id} 
                      className={`flex items-center gap-3 p-2 rounded-md hover:bg-secondary/10 transition-colors cursor-grab ${draggedTeam?.id === team.id && sourceGroupIdForDrag === group.id ? 'opacity-50 bg-primary/20' : ''}`}
                      draggable="true"
                      onDragStart={(e) => onDragStart(e, team, group.id)}
                      onDragEnd={onDragEnd}
                    >
                      <Move className="h-4 w-4 text-muted-foreground flex-shrink-0" />
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
                <p className="text-sm text-muted-foreground text-center py-4">
                  {draggedTeam ? `Arrastra aquí para mover a ${group.name}` : 'Zona vacía. Arrastra equipos aquí.'}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground italic mt-6">
        Puedes arrastrar y soltar equipos entre las zonas. Si una zona está llena, se intentará un intercambio con el primer equipo de esa zona.
        Cada zona tiene un máximo de {TEAMS_PER_ZONE_CLIENT} equipos. Las zonas se guardan en Firestore.
        Usa "Reiniciar Grupos" para limpiar todas las asignaciones.
      </p>
    </div>
  );
}

