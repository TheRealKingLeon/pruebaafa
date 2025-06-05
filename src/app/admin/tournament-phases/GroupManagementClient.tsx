
'use client';

import { useState, useEffect, useCallback, type DragEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, Users, Shuffle, Info, RotateCcw, Move, Settings, FileCog, PlaySquare, Lock } from 'lucide-react'; // Added PlaySquare, Lock
import type { Team, Group as GroupType } from '@/types';
import { getGroupsAndTeamsAction, autoAssignTeamsToGroupsAction, resetAndClearGroupsAction, manualMoveTeamAction, seedGroupStageMatchesAction } from '../groups/actions';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { TournamentRulesClient } from './TournamentRulesClient';
import { Separator } from '@/components/ui/separator';

interface PopulatedGroup extends Omit<GroupType, 'teamIds'> {
  teams: Team[];
}

const TEAMS_PER_ZONE_CLIENT = 4; 
const MINIMUM_ZONES_TO_SEED = 2;

export function GroupManagementClient() {
  const [populatedGroups, setPopulatedGroups] = useState<PopulatedGroup[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const [draggedTeam, setDraggedTeam] = useState<Team | null>(null);
  const [sourceGroupIdForDrag, setSourceGroupIdForDrag] = useState<string | null>(null);
  const [hoveredTeamAsDropTarget, setHoveredTeamAsDropTarget] = useState<{ teamId: string, groupId: string } | null>(null);

  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [groupsSeeded, setGroupsSeeded] = useState(false); 
  const [isSeeding, setIsSeeding] = useState(false); 

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    let toastMessageOnError: { title: string, description: string, variant?: "destructive" } | null = null;
    try {
      const { groups: firestoreGroups, teams, error: fetchError } = await getGroupsAndTeamsAction();
      if (fetchError) {
        setError(fetchError);
        setPopulatedGroups([]);
        setAllTeams([]);
        toastMessageOnError = { title: "Error al Cargar Datos de Grupos", description: fetchError, variant: "destructive" };
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
      const errorMessage = err instanceof Error ? err.message : "Error desconocido al cargar datos de grupos.";
      setError(errorMessage);
      toastMessageOnError = { title: "Error Inesperado (Grupos)", description: errorMessage, variant: "destructive" };
    } finally {
      setIsLoading(false);
      if (toastMessageOnError) {
          toast(toastMessageOnError as any);
      }
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
      toast({ title: "Error Inesperado (Asignación)", description: errorMessage, variant: "destructive" });
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
        setGroupsSeeded(false); 
        await fetchData(); 
      } else {
        toast({ title: "Error al Limpiar Grupos", description: result.message, variant: "destructive" });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido al limpiar los grupos.";
      toast({ title: "Error Inesperado (Limpieza)", description: errorMessage, variant: "destructive" });
    } finally {
      setIsResetting(false);
    }
  };

  const handleSeedGroups = async () => {
    setIsSeeding(true);
    try {
      const result = await seedGroupStageMatchesAction();
      if (result.success) {
        toast({ title: "Seed Iniciado", description: result.message });
        setGroupsSeeded(true); 
      } else {
        toast({ title: "Error al Iniciar Seed", description: result.message, variant: "destructive" });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido al iniciar el seed.";
      toast({ title: "Error Inesperado (Seed)", description: errorMessage, variant: "destructive" });
    } finally {
      setIsSeeding(false);
    }
  };
  
  const onDragStart = (e: DragEvent<HTMLLIElement>, team: Team, currentGroupId: string) => {
    if (groupsSeeded) {
        toast({ title: "Grupos Bloqueados", description: "No se pueden mover equipos una vez iniciado el seed.", variant: "default" });
        e.preventDefault();
        return;
    }
    e.dataTransfer.setData('teamId', team.id);
    e.dataTransfer.setData('sourceGroupId', currentGroupId);
    setDraggedTeam(team);
    setSourceGroupIdForDrag(currentGroupId);
    e.currentTarget.style.opacity = '0.5';
  };

  const onDragEnd = (e: DragEvent<HTMLLIElement>) => {
    if (groupsSeeded) return;
    e.currentTarget.style.opacity = '1';
    document.querySelectorAll('.team-drop-target-active').forEach(el => el.classList.remove('team-drop-target-active'));
    setDraggedTeam(null);
    setSourceGroupIdForDrag(null);
    setHoveredTeamAsDropTarget(null); 
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (groupsSeeded) {
        e.dataTransfer.dropEffect = "none";
        return;
    }
    e.preventDefault(); 
  };

  const onTeamDragEnter = (e: DragEvent<HTMLLIElement>, teamId: string, groupId: string) => {
    if (groupsSeeded) return;
    if (draggedTeam && draggedTeam.id !== teamId && sourceGroupIdForDrag !== groupId) {
      setHoveredTeamAsDropTarget({ teamId, groupId });
      e.currentTarget.classList.add('team-drop-target-active');
    }
  };

  const onTeamDragLeave = (e: DragEvent<HTMLLIElement>) => {
    if (groupsSeeded) return;
    e.currentTarget.classList.remove('team-drop-target-active');
  };


  const onDrop = async (e: DragEvent<HTMLDivElement>, targetGroupId: string) => {
    if (groupsSeeded) {
        toast({ title: "Grupos Bloqueados", description: "No se pueden mover equipos una vez iniciado el seed.", variant: "default" });
        e.preventDefault();
        return;
    }
    e.preventDefault();
    document.querySelectorAll('.team-drop-target-active').forEach(el => el.classList.remove('team-drop-target-active'));

    const teamId = e.dataTransfer.getData('teamId');
    const currentSourceGroupId = e.dataTransfer.getData('sourceGroupId');
    
    let optimisticErrorCondition: { title: string, description: string, variant?: "destructive" } | null = null;

    if (!teamId || !currentSourceGroupId || !targetGroupId ) {
      setDraggedTeam(null); 
      setSourceGroupIdForDrag(null);
      setHoveredTeamAsDropTarget(null);
      return;
    }
    if (currentSourceGroupId === targetGroupId) {
        setDraggedTeam(null);
        setSourceGroupIdForDrag(null);
        setHoveredTeamAsDropTarget(null);
        return; 
    }

    const teamToMove = allTeams.find(t => t.id === teamId);
    if (!teamToMove) {
        setDraggedTeam(null);
        setSourceGroupIdForDrag(null);
        setHoveredTeamAsDropTarget(null);
        return;
    }
    
    const specificTeamToSwapId = (hoveredTeamAsDropTarget && hoveredTeamAsDropTarget.groupId === targetGroupId)
                                  ? hoveredTeamAsDropTarget.teamId
                                  : undefined;
    
    setPopulatedGroups(prevGroups => {
      const newGroups = prevGroups.map(g => ({
          ...g,
          teams: [...g.teams.map(t => ({...t}))] 
      }));

      const sourceGroupIndex = newGroups.findIndex(g => g.id === currentSourceGroupId);
      const targetGroupIndex = newGroups.findIndex(g => g.id === targetGroupId);
      
      if (sourceGroupIndex === -1 || targetGroupIndex === -1) {
          optimisticErrorCondition = { title: "Error Interno", description: "Grupo de origen o destino no encontrado en el estado local.", variant: "destructive" };
          return prevGroups;
      }

      const sourceGroup = newGroups[sourceGroupIndex];
      const targetGroup = newGroups[targetGroupIndex];

      if (targetGroup.teams.find(t => t.id === teamId)) {
         optimisticErrorCondition = { title: "Equipo Duplicado", description: `El equipo "${teamToMove.name}" ya está en el grupo "${targetGroup.name}".`, variant: "destructive" };
         return prevGroups;
      }

      const targetIsFull = targetGroup.teams.length >= TEAMS_PER_ZONE_CLIENT;

      if (targetIsFull) {
        let teamToSwapOutClient: Team | undefined;
        if (specificTeamToSwapId) {
            teamToSwapOutClient = targetGroup.teams.find(t => t.id === specificTeamToSwapId);
        }
        if (!teamToSwapOutClient && targetGroup.teams.length > 0) { 
            teamToSwapOutClient = targetGroup.teams[0]; 
        }

        if (!teamToSwapOutClient) {
          optimisticErrorCondition = { title: "Error de Intercambio", description: "El grupo de destino está lleno pero no se encontró un equipo para intercambiar.", variant: "destructive" };
          return prevGroups;
        }

        sourceGroup.teams = sourceGroup.teams.filter(t => t.id !== teamToMove.id);
        if (!sourceGroup.teams.find(t => t.id === teamToSwapOutClient!.id)) {
           sourceGroup.teams.push(teamToSwapOutClient!);
        }
        targetGroup.teams = targetGroup.teams.filter(t => t.id !== teamToSwapOutClient!.id);
        targetGroup.teams.push(teamToMove);
      } else {
        sourceGroup.teams = sourceGroup.teams.filter(t => t.id !== teamToMove.id);
        targetGroup.teams.push(teamToMove);
      }
      return newGroups;
    });
    
    setDraggedTeam(null); 
    setSourceGroupIdForDrag(null);
    setHoveredTeamAsDropTarget(null);
    
    if (optimisticErrorCondition) {
        toast(optimisticErrorCondition as any); 
        return; 
    }

    const result = await manualMoveTeamAction({ teamId, sourceGroupId: currentSourceGroupId, targetGroupId, specificTeamToSwapId });
    if (result.success) {
      toast({ title: "Acción Completada", description: result.message });
    } else {
      toast({ title: "Error al Mover/Intercambiar", description: result.message, variant: "destructive" });
    }
    await fetchData(); 
  };

  const completedZonesCount = populatedGroups.filter(g => g.teams.length === TEAMS_PER_ZONE_CLIENT).length;

  // Debugging logs for canSeedGroups
  console.log("--- Debugging canSeedGroups ---");
  console.log("Current Time:", new Date().toLocaleTimeString());
  console.log("1. groupsSeeded:", groupsSeeded, `(!groupsSeeded is ${!groupsSeeded})`);
  console.log("2. populatedGroups.length:", populatedGroups.length, `(>= MINIMUM_ZONES_TO_SEED (${MINIMUM_ZONES_TO_SEED})? ${populatedGroups.length >= MINIMUM_ZONES_TO_SEED})`);
  console.log("3. TEAMS_PER_ZONE_CLIENT:", TEAMS_PER_ZONE_CLIENT);
  console.log("4. completedZonesCount:", completedZonesCount, `(>= MINIMUM_ZONES_TO_SEED (${MINIMUM_ZONES_TO_SEED})? ${completedZonesCount >= MINIMUM_ZONES_TO_SEED})`);
  console.log("5. allTeams.length:", allTeams.length);
  const requiredTeamsForMinZones = MINIMUM_ZONES_TO_SEED * TEAMS_PER_ZONE_CLIENT;
  console.log("6. Required teams for min zones (MINIMUM_ZONES_TO_SEED * TEAMS_PER_ZONE_CLIENT):", requiredTeamsForMinZones);
  console.log("7. allTeams.length >= required teams?", allTeams.length >= requiredTeamsForMinZones);
  
  const canSeedGroups = !groupsSeeded &&
    populatedGroups.length >= MINIMUM_ZONES_TO_SEED &&
    completedZonesCount >= MINIMUM_ZONES_TO_SEED &&
    allTeams.length >= requiredTeamsForMinZones;
  
  console.log("Final canSeedGroups result:", canSeedGroups);
  console.log("-----------------------------");


  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-400px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Cargando datos de grupos y equipos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-400px)] text-center p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg text-destructive font-semibold">Error al Cargar Grupos</p>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchData}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <style jsx global>{`
        .team-drop-target-active {
          outline: 2px dashed hsl(var(--primary));
          outline-offset: 2px;
          background-color: hsla(var(--primary-hsl), 0.1);
        }
        .groups-locked .cursor-grab {
            cursor: not-allowed !important;
        }
      `}</style>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-card border rounded-lg shadow">
        <CardTitle className="text-2xl">Configurar Zonas de Grupos</CardTitle>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            onClick={handleAutoAssign} 
            disabled={isAssigning || allTeams.length === 0 || groupsSeeded} 
            className="w-full sm:w-auto"
            title={groupsSeeded ? "Los grupos ya han sido semeados y están bloqueados." : (allTeams.length === 0 ? "Añade equipos primero" : "Asignar equipos aleatoriamente")}
          >
            <Shuffle className="mr-2 h-5 w-5" />
            {isAssigning ? "Asignando..." : (allTeams.length === 0 ? "Añade equipos" : "Asignar Auto.")}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={isResetting || groupsSeeded} className="w-full sm:w-auto" title={groupsSeeded ? "Los grupos ya han sido semeados y están bloqueados." : "Limpiar todos los equipos de las zonas"}>
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
                  Los grupos dejarán de estar "semeados". Esta acción no se puede deshacer.
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
          <Dialog open={isRulesModalOpen} onOpenChange={setIsRulesModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto" disabled={groupsSeeded || isAssigning || isResetting || isSeeding} title={groupsSeeded ? "Las reglas no pueden cambiarse después de semear los grupos." : "Configurar reglas de la fase de grupos"}>
                <FileCog className="mr-2 h-5 w-5" />
                Configurar Reglas
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <TournamentRulesClient onSaveSuccess={() => setIsRulesModalOpen(false)} />
            </DialogContent>
          </Dialog>
          <Button 
            onClick={handleSeedGroups} 
            disabled={!canSeedGroups || isSeeding || isAssigning || isResetting} 
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
            title={
                groupsSeeded ? "Los grupos ya han sido semeados y están bloqueados." :
                (populatedGroups.length < MINIMUM_ZONES_TO_SEED) ? `Se requieren al menos ${MINIMUM_ZONES_TO_SEED} zonas de grupos. Actualmente hay ${populatedGroups.length}.` :
                (completedZonesCount < MINIMUM_ZONES_TO_SEED) ? `Se requiere que al menos ${MINIMUM_ZONES_TO_SEED} zonas tengan ${TEAMS_PER_ZONE_CLIENT} equipos. Actualmente ${completedZonesCount} cumplen.` :
                (allTeams.length < requiredTeamsForMinZones) ? `Se requieren al menos ${requiredTeamsForMinZones} equipos en total para ${MINIMUM_ZONES_TO_SEED} zonas.` :
                "Iniciar el sembrado de grupos y generar partidos"
            }
          >
            {groupsSeeded ? <Lock className="mr-2 h-5 w-5" /> : <PlaySquare className="mr-2 h-5 w-5" />}
            {isSeeding ? "Semeando..." : groupsSeeded ? "Grupos Semeados" : "Iniciar Seed"}
          </Button>
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

      {allTeams.length > 0 && populatedGroups.filter(g => g.teams.length > 0).length === 0 && !isLoading && !error && (
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

      {groupsSeeded && (
        <div className="p-4 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg dark:bg-blue-200 dark:text-blue-800 flex items-center gap-2" role="alert">
            <Lock className="h-5 w-5"/>
            <span className="font-medium">¡Grupos Semeados y Bloqueados!</span> Ya no se pueden modificar las zonas ni las reglas. Los partidos de la fase de grupos han sido generados (simulación).
        </div>
      )}

      <div className={`grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${groupsSeeded ? 'groups-locked' : ''}`}>
        {populatedGroups.map((group) => ( 
          <Card 
            key={group.id} 
            className={`shadow-lg transition-opacity ${group.teams.length === 0 ? 'opacity-70 border-dashed' : ''} ${groupsSeeded ? 'opacity-80' : ''}`}
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
                      className={`flex items-center gap-3 p-2 rounded-md hover:bg-secondary/10 transition-colors ${groupsSeeded ? 'cursor-not-allowed' : 'cursor-grab'} ${draggedTeam?.id === team.id && sourceGroupIdForDrag === group.id ? 'opacity-50 bg-primary/20' : ''}`}
                      draggable={!groupsSeeded}
                      onDragStart={(e) => onDragStart(e, team, group.id)}
                      onDragEnd={onDragEnd}
                      onDragEnter={(e) => onTeamDragEnter(e, team.id, group.id)}
                      onDragLeave={onTeamDragLeave}
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
                  {draggedTeam && !groupsSeeded ? `Arrastra aquí para mover a ${group.name}` : 'Zona vacía.'}
                  {groupsSeeded && 'Zona Bloqueada.'}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground italic mt-6">
        {groupsSeeded 
            ? "Los grupos están semeados y bloqueados. Para realizar cambios, primero se necesitaría una opción para 'Resetear Torneo Completo' (funcionalidad futura)."
            : `Puedes arrastrar y soltar equipos entre las zonas. Si sueltas sobre un equipo en una zona llena, se intentará un intercambio. Cada zona tiene un máximo de ${TEAMS_PER_ZONE_CLIENT} equipos.`
        }
      </p>
      
    </div>
  );
}

    