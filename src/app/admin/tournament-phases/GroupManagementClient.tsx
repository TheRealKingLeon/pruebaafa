
'use client';

import { useState, useEffect, useCallback, type DragEvent } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, Users, Shuffle, Info, RotateCcw, Move, Settings, FileCog, PlaySquare, Lock } from 'lucide-react';
import type { Team, Group as GroupType, TournamentRules } from '@/types';
import { getGroupsAndTeamsAction, autoAssignTeamsToGroupsAction, resetAndClearGroupsAction, manualMoveTeamAction, seedGroupStageMatchesAction } from '../groups/actions';
import { loadTournamentRulesAction } from '../tournament-settings/actions'; // For loading seed status
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TournamentRulesClient } from './TournamentRulesClient';

interface PopulatedGroup extends Omit<GroupType, 'teamIds'> {
  teams: Team[];
}

const TEAMS_PER_ZONE_CLIENT = 8; // Max teams per zone
const MINIMUM_TEAMS_PER_ZONE_FOR_SEED_CLIENT = 4; // Min teams in a zone for it to be seedable
const MINIMUM_ZONES_FOR_GLOBAL_SEED_CLIENT = 2; // Min seedable zones to enable global seed button

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
  const [tournamentRules, setTournamentRules] = useState<TournamentRules | null>(null);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    let toastMessageOnError: { title: string, description: string, variant?: "destructive" } | null = null;
    try {
      // Fetch groups and teams
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

      // Fetch tournament rules to get groupsSeeded status
      const rulesResult = await loadTournamentRulesAction();
      if (rulesResult.success && rulesResult.data) {
        setTournamentRules(rulesResult.data);
        setGroupsSeeded(rulesResult.data.groupsSeeded || false);
      } else {
        // If rules don't exist or fail to load, assume groups are not seeded
        setGroupsSeeded(false);
        console.warn("Could not load tournament rules or no rules found, defaulting groupsSeeded to false.", rulesResult.message);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido al cargar datos iniciales.";
      setError(errorMessage);
      toastMessageOnError = { title: "Error Inesperado (Datos Iniciales)", description: errorMessage, variant: "destructive" };
    } finally {
      setIsLoading(false);
      if (toastMessageOnError) {
          toast(toastMessageOnError as any);
      }
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleAutoAssign = async () => {
    setIsAssigning(true);
    try {
      const result = await autoAssignTeamsToGroupsAction();
      if (result.success) {
        toast({ title: "Asignación Exitosa", description: result.message });
        await fetchInitialData(); 
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
      const result = await resetAndClearGroupsAction(); // This action now also resets groupsSeeded flag and clears matches
      if (result.success) {
        toast({ title: "Grupos Limpiados", description: result.message });
        setGroupsSeeded(false); // Update local state immediately
        await fetchInitialData(); // Re-fetch to confirm changes
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
        toast({ title: "Seed Iniciado", description: result.message + (result.matchesGenerated ? ` Partidos generados: ${result.matchesGenerated}.` : '') });
        setGroupsSeeded(true); // Update local state
        // Optionally, re-fetch rules to confirm server state if needed, or rely on local update.
        const rulesRefresh = await loadTournamentRulesAction();
        if (rulesRefresh.success && rulesRefresh.data) {
            setTournamentRules(rulesRefresh.data);
            setGroupsSeeded(rulesRefresh.data.groupsSeeded || false);
        }

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

      const targetIsFull = targetGroup.teams.length >= TEAMS_PER_ZONE_CLIENT; // Use TEAMS_PER_ZONE_CLIENT (8)

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
    await fetchInitialData(); 
  };

  const zonesWithEnoughTeamsForSeedCount = populatedGroups.filter(g => g.teams.length >= MINIMUM_TEAMS_PER_ZONE_FOR_SEED_CLIENT).length;
  const requiredTeamsForMinZonesToSeed = MINIMUM_ZONES_FOR_GLOBAL_SEED_CLIENT * MINIMUM_TEAMS_PER_ZONE_FOR_SEED_CLIENT;
  
  const canSeedGroups = !groupsSeeded &&
    populatedGroups.length >= MINIMUM_ZONES_FOR_GLOBAL_SEED_CLIENT &&
    zonesWithEnoughTeamsForSeedCount >= MINIMUM_ZONES_FOR_GLOBAL_SEED_CLIENT &&
    allTeams.length >= requiredTeamsForMinZonesToSeed;
  
  console.log("--- Debugging canSeedGroups (Client) ---");
  console.log("Current Time:", new Date().toLocaleTimeString());
  console.log("1. groupsSeeded (from state):", groupsSeeded, `(!groupsSeeded is ${!groupsSeeded})`);
  console.log("2. populatedGroups.length:", populatedGroups.length, `(>= MINIMUM_ZONES_FOR_GLOBAL_SEED_CLIENT (${MINIMUM_ZONES_FOR_GLOBAL_SEED_CLIENT})? ${populatedGroups.length >= MINIMUM_ZONES_FOR_GLOBAL_SEED_CLIENT})`);
  console.log("3. zonesWithEnoughTeamsForSeedCount (zones with >= MINIMUM_TEAMS_PER_ZONE_FOR_SEED_CLIENT teams):", zonesWithEnoughTeamsForSeedCount, `(>= MINIMUM_ZONES_FOR_GLOBAL_SEED_CLIENT (${MINIMUM_ZONES_FOR_GLOBAL_SEED_CLIENT})? ${zonesWithEnoughTeamsForSeedCount >= MINIMUM_ZONES_FOR_GLOBAL_SEED_CLIENT})`);
  console.log("4. allTeams.length:", allTeams.length);
  console.log("5. Required teams for min zones to seed (MINIMUM_ZONES_FOR_GLOBAL_SEED_CLIENT * MINIMUM_TEAMS_PER_ZONE_FOR_SEED_CLIENT):", requiredTeamsForMinZonesToSeed);
  console.log("6. allTeams.length >= requiredTeamsForMinZonesToSeed?", allTeams.length >= requiredTeamsForMinZonesToSeed);
  console.log("Final canSeedGroups result:", canSeedGroups);
  console.log("-----------------------------");


  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-400px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Cargando configuración de grupos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-400px)] text-center p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg text-destructive font-semibold">Error al Cargar Grupos</p>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchInitialData}>Reintentar</Button>
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
              <Button variant="outline" disabled={isResetting} className="w-full sm:w-auto" title="Limpiar todos los equipos de las zonas y resetear el estado de seed">
                <RotateCcw className="mr-2 h-5 w-5" />
                {isResetting ? "Limpiando..." : "Reiniciar Grupos"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de limpiar los grupos?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción desasignará todos los equipos de todas las zonas, eliminará los partidos de grupo generados,
                  y reseteará el estado de "grupos semeados". Esta acción no se puede deshacer.
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
              <TournamentRulesClient 
                onSaveSuccess={() => {
                  setIsRulesModalOpen(false);
                  fetchInitialData(); // Recargar reglas para reflejar cambios si afectan el estado de seed
                }} 
              />
            </DialogContent>
          </Dialog>
          <Button 
            onClick={handleSeedGroups} 
            disabled={!canSeedGroups || isSeeding || isAssigning || isResetting} 
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
            title={
                groupsSeeded ? "Los grupos ya han sido semeados y están bloqueados." :
                (!canSeedGroups && populatedGroups.length > 0) ? `Se requieren al menos ${MINIMUM_ZONES_FOR_GLOBAL_SEED_CLIENT} zonas con ${MINIMUM_TEAMS_PER_ZONE_FOR_SEED_CLIENT} equipos c/u y ${requiredTeamsForMinZonesToSeed} equipos en total para el seed.` :
                (populatedGroups.length === 0) ? "Aún no hay zonas de grupos cargadas." :
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
              <p className="text-muted-foreground">No hay equipos registrados para asignar a los grupos.</p>
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
            <span className="font-medium">¡Grupos Semeados y Bloqueados!</span> Ya no se pueden modificar las zonas ni las reglas. Los partidos de la fase de grupos han sido generados.
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
              <CardDescription>Equipos: {group.teams.length} / {TEAMS_PER_ZONE_CLIENT} (Mín. {MINIMUM_TEAMS_PER_ZONE_FOR_SEED_CLIENT} para seed)</CardDescription>
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
            ? "Los grupos están semeados y bloqueados. Para realizar cambios, primero se necesitaría 'Reiniciar Grupos', lo cual eliminará los partidos generados."
            : `Puedes arrastrar y soltar equipos entre las zonas. Si sueltas sobre un equipo en una zona llena (max ${TEAMS_PER_ZONE_CLIENT} equipos), se intentará un intercambio. Cada zona necesita al menos ${MINIMUM_TEAMS_PER_ZONE_FOR_SEED_CLIENT} equipos para ser elegible para el 'seed'.`
        }
      </p>
      
    </div>
  );
}

