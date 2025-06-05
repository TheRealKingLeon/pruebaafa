'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, writeBatch, serverTimestamp, query, orderBy, getDoc, Timestamp, runTransaction, where, deleteDoc, documentId } from 'firebase/firestore';
import type { Group, Team, Match as MatchType, TournamentRules } from '@/types';
import { loadTournamentRulesAction, updateGroupSeedStatusAction } from '../tournament-settings/actions';

const TOTAL_ZONES = 8;
const TEAMS_PER_ZONE = 4; 
const DEFAULT_ZONE_IDS = Array.from({ length: TOTAL_ZONES }, (_, i) => `zona-${String.fromCharCode(97 + i)}`); 
const MATCHES_COLLECTION = "matches";

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

// Helper function to create a client-safe group object
function toClientSafeGroup(docSnap: import('firebase/firestore').QueryDocumentSnapshot | import('firebase/firestore').DocumentSnapshot): Group {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data?.name || '',
    zoneId: data?.zoneId || '',
    teamIds: data?.teamIds || [],
    // createdAt and updatedAt are intentionally omitted
  };
}

// Helper function to create a client-safe team object
function toClientSafeTeam(docSnap: import('firebase/firestore').QueryDocumentSnapshot | import('firebase/firestore').DocumentSnapshot): Team {
    const data = docSnap.data();
    return {
        id: docSnap.id,
        name: data?.name || '',
        logoUrl: data?.logoUrl || '',
        // player, createdAt, and updatedAt are intentionally omitted
    };
}


export async function getGroupsAndTeamsAction(): Promise<{ groups: Group[]; teams: Team[]; error?: string }> {
  try {
    const teamsSnapshot = await getDocs(query(collection(db, "equipos"), orderBy("name")));
    const teams = teamsSnapshot.docs.map(toClientSafeTeam); 

    const groupsRef = collection(db, "grupos");
    let groups: Group[] = [];
    const existingGroupsSnapshot = await getDocs(query(groupsRef, orderBy("name")));
    
    if (existingGroupsSnapshot.docs.length < TOTAL_ZONES) {
      const batch = writeBatch(db);
      
      for (let i = 0; i < TOTAL_ZONES; i++) {
        const zoneId = DEFAULT_ZONE_IDS[i];
        const groupName = `Zona ${String.fromCharCode(65 + i)}`;
        const groupDocRef = doc(db, "grupos", zoneId);
        
        const groupDocSnap = await getDoc(groupDocRef);
        if (!groupDocSnap.exists()) {
            const newGroupData = { 
                name: groupName,
                zoneId: zoneId,
                teamIds: [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            batch.set(groupDocRef, newGroupData);
        }
      }
      await batch.commit();
      
      const newGroupsSnapshot = await getDocs(query(groupsRef, orderBy("name")));
      groups = newGroupsSnapshot.docs.map(toClientSafeGroup);
    } else {
        groups = existingGroupsSnapshot.docs.map(toClientSafeGroup);
    }
    
    groups.sort((a, b) => a.name.localeCompare(b.name));

    return { groups, teams };
  } catch (error) {
    console.error("Error in getGroupsAndTeamsAction:", error);
    const message = error instanceof Error ? error.message : "Error desconocido al obtener grupos y equipos.";
    return { groups: [], teams: [], error: message };
  }
}

export async function autoAssignTeamsToGroupsAction(): Promise<{ success: boolean; message: string }> {
  try {
    // First, check if groups are already seeded
    const rulesResult = await loadTournamentRulesAction();
    if (rulesResult.data?.groupsSeeded) {
      return { success: false, message: "Los grupos ya han sido semeados y están bloqueados. No se pueden reasignar equipos." };
    }

    const teamsSnapshot = await getDocs(collection(db, "equipos"));
    const teamsFromDb = teamsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Team));

    if (teamsFromDb.length === 0) {
      return { success: false, message: "No hay equipos para asignar. Añade equipos primero." };
    }
    
    const shuffledTeams = shuffleArray(teamsFromDb);
    
    const groupTeamAssignments: { [key: string]: string[] } = {};
    DEFAULT_ZONE_IDS.forEach(zoneId => {
      groupTeamAssignments[zoneId] = [];
    });

    const teamsToAssign = [...shuffledTeams]; 
    let currentTeamIdx = 0;

    for (const zoneId of DEFAULT_ZONE_IDS) {
      const currentZoneAssignments = groupTeamAssignments[zoneId]; 
      while (currentZoneAssignments.length < TEAMS_PER_ZONE && currentTeamIdx < teamsToAssign.length) {
        currentZoneAssignments.push(teamsToAssign[currentTeamIdx].id);
        currentTeamIdx++;
      }
    }

    const batch = writeBatch(db);
    for (let i = 0; i < TOTAL_ZONES; i++) {
      const zoneId = DEFAULT_ZONE_IDS[i];
      const groupName = `Zona ${String.fromCharCode(65 + i)}`; 
      const groupDocRef = doc(db, "grupos", zoneId);
      
      const assignedTeamIds = groupTeamAssignments[zoneId] || []; 
      
      const groupDataUpdate = {
        name: groupName, 
        zoneId: zoneId, 
        teamIds: assignedTeamIds,
        updatedAt: serverTimestamp(),
      };

      const groupDocSnap = await getDoc(groupDocRef);
      if (groupDocSnap.exists()) {
        batch.update(groupDocRef, groupDataUpdate);
      } else {
        batch.set(groupDocRef, {
          ...groupDataUpdate,
          createdAt: serverTimestamp() 
        });
      }
    }

    await batch.commit();
    return { success: true, message: "Equipos asignados automáticamente a las zonas con éxito." };

  } catch (error) {
    console.error("Error in autoAssignTeamsToGroupsAction:", error);
    const message = error instanceof Error ? error.message : "Error desconocido al asignar equipos.";
    return { success: false, message };
  }
}

export async function resetAndClearGroupsAction(): Promise<{ success: boolean; message: string }> {
  try {
    // First, check if groups are already seeded
    const rulesResult = await loadTournamentRulesAction();
    if (rulesResult.data?.groupsSeeded) {
      // Allow reset, but warn user or handle differently if matches are critical
      // For now, we will proceed but also ensure the seeded flag is reset.
      console.warn("[Reset Action] Grupos están marcados como semeados. Procediendo a limpiar equipos y resetear el flag.");
    }
    
    const batch = writeBatch(db);
    const groupsRef = collection(db, "grupos");
    const groupsSnapshot = await getDocs(groupsRef);
    
    if (!groupsSnapshot.empty) {
      groupsSnapshot.forEach(groupDoc => {
        batch.update(groupDoc.ref, {
          teamIds: [],
          updatedAt: serverTimestamp()
        });
      });
    }

    // Clear existing group stage matches from 'matches' collection
    const matchesQuery = query(collection(db, MATCHES_COLLECTION), where("groupId", "!=", null)); // Get all matches with a groupId
    const matchesSnapshot = await getDocs(matchesQuery);
    let deletedGroupMatchesCount = 0;
    matchesSnapshot.forEach(matchDoc => {
      if (!matchDoc.data().roundName) { // Further filter: only delete if it's a group match (no roundName)
        batch.delete(matchDoc.ref);
        deletedGroupMatchesCount++;
      }
    });
    console.log(`[Reset Action] Deleted ${deletedGroupMatchesCount} group stage matches from 'matches' collection.`);
    
    await batch.commit();
    
    // Reset the groupsSeeded flag in tournament_config
    const seedStatusResult = await updateGroupSeedStatusAction(false);
    if (!seedStatusResult.success) {
        return { success: false, message: `Grupos y partidos limpiados, pero falló al resetear el estado de seed: ${seedStatusResult.message}` };
    }

    return { success: true, message: "Todos los grupos han sido limpiados, los equipos desasignados, los partidos de grupo eliminados y el estado de seed reseteado." };
  } catch (error) {
    console.error("Error in resetAndClearGroupsAction:", error);
    const message = error instanceof Error ? error.message : "Error desconocido al limpiar los grupos.";
    return { success: false, message };
  }
}

export async function manualMoveTeamAction(payload: {
  teamId: string;
  sourceGroupId: string;
  targetGroupId: string;
  specificTeamToSwapId?: string; 
}): Promise<{ success: boolean; message: string }> {
  const { teamId, sourceGroupId, targetGroupId, specificTeamToSwapId } = payload;

   // First, check if groups are already seeded
   const rulesResult = await loadTournamentRulesAction();
   if (rulesResult.data?.groupsSeeded) {
     return { success: false, message: "Los grupos ya han sido semeados y están bloqueados. No se pueden mover equipos." };
   }

  if (sourceGroupId === targetGroupId) {
    return { success: false, message: "No se puede mover un equipo al mismo grupo." };
  }

  try {
    await runTransaction(db, async (transaction) => {
      const sourceGroupRef = doc(db, "grupos", sourceGroupId);
      const targetGroupRef = doc(db, "grupos", targetGroupId);

      const [sourceGroupSnap, targetGroupSnap] = await Promise.all([
        transaction.get(sourceGroupRef),
        transaction.get(targetGroupRef),
      ]);

      if (!sourceGroupSnap.exists()) {
        throw new Error(`Grupo de origen (ID: ${sourceGroupId}) no encontrado.`);
      }
      if (!targetGroupSnap.exists()) {
        throw new Error(`Grupo de destino (ID: ${targetGroupId}) no encontrado.`);
      }

      const sourceGroupData = sourceGroupSnap.data() as { teamIds: string[] };
      let newSourceTeamIds = [...sourceGroupData.teamIds];

      const targetGroupData = targetGroupSnap.data() as { teamIds: string[], name: string };
      let newTargetTeamIds = [...targetGroupData.teamIds];

      if (!newSourceTeamIds.includes(teamId)) {
        throw new Error(`El equipo (ID: ${teamId}) no se encontró en el grupo de origen (ID: ${sourceGroupId}).`);
      }
      
      if (newTargetTeamIds.includes(teamId)) {
        throw new Error(`El equipo (ID: ${teamId}) ya existe en el grupo de destino "${targetGroupData.name}".`);
      }

      const isTargetFull = newTargetTeamIds.length >= TEAMS_PER_ZONE;

      if (isTargetFull) {
        let teamToMoveBackId: string | undefined = undefined;

        if (specificTeamToSwapId && newTargetTeamIds.includes(specificTeamToSwapId)) {
          teamToMoveBackId = specificTeamToSwapId;
        } else if (newTargetTeamIds.length > 0) { 
          teamToMoveBackId = newTargetTeamIds[0];
        }
        
        if (!teamToMoveBackId) {
            throw new Error(`El grupo de destino "${targetGroupData.name}" está lleno pero no se encontró un equipo para intercambiar.`);
        }
        
        newSourceTeamIds = newSourceTeamIds.filter(id => id !== teamId);
        if (!newSourceTeamIds.includes(teamToMoveBackId)) { 
            newSourceTeamIds.push(teamToMoveBackId);
        }
        
        newTargetTeamIds = newTargetTeamIds.filter(id => id !== teamToMoveBackId);
        newTargetTeamIds.push(teamId);

        transaction.update(sourceGroupRef, { teamIds: newSourceTeamIds, updatedAt: serverTimestamp() });
        transaction.update(targetGroupRef, { teamIds: newTargetTeamIds, updatedAt: serverTimestamp() });
      } else {
        newSourceTeamIds = newSourceTeamIds.filter(id => id !== teamId);
        newTargetTeamIds.push(teamId);
        
        transaction.update(sourceGroupRef, { teamIds: newSourceTeamIds, updatedAt: serverTimestamp() });
        transaction.update(targetGroupRef, { teamIds: newTargetTeamIds, updatedAt: serverTimestamp() });
      }
    });

    return { success: true, message: "Movimiento/intercambio de equipo procesado exitosamente." };
  } catch (error) {
    console.error("Error in manualMoveTeamAction:", error);
    const message = error instanceof Error ? error.message : "Error desconocido al mover/intercambiar el equipo.";
    return { success: false, message };
  }
}

// Round Robin Algorithm (Circle Method or Variation)
function generateRoundRobinFixtures(teams: string[], roundRobinType: 'one-way' | 'two-way'): Array<{ team1Id: string, team2Id: string, matchday: number }> {
  const fixtures: Array<{ team1Id: string, team2Id: string, matchday: number }> = [];
  const n = teams.length;
  if (n < 2) return fixtures;

  const schedule = [];
  const localTeams = [...teams]; // Use a mutable copy for rotation

  // If odd number of teams, add a "bye" team
  if (n % 2 !== 0) {
    localTeams.push("BYE");
  }
  const numTeamsForScheduling = localTeams.length;
  const numMatchdays = numTeamsForScheduling - 1;

  for (let day = 0; day < numMatchdays; day++) {
    for (let i = 0; i < numTeamsForScheduling / 2; i++) {
      const team1 = localTeams[i];
      const team2 = localTeams[numTeamsForScheduling - 1 - i];
      if (team1 !== "BYE" && team2 !== "BYE") {
        fixtures.push({ team1Id: team1, team2Id: team2, matchday: day + 1 });
      }
    }
    // Rotate teams, keeping the first one fixed
    const lastTeam = localTeams.pop()!;
    localTeams.splice(1, 0, lastTeam);
  }
  
  if (roundRobinType === 'two-way') {
    const oneWayFixturesCount = fixtures.length;
    for(let i = 0; i < oneWayFixturesCount; i++) {
        const fixture = fixtures[i];
        fixtures.push({
            team1Id: fixture.team2Id, // Swap teams for return leg
            team2Id: fixture.team1Id,
            matchday: fixture.matchday + numMatchdays // Second half of season
        });
    }
  }
  return fixtures;
}


export async function seedGroupStageMatchesAction(): Promise<{ success: boolean; message: string; matchesGenerated?: number }> {
  console.log("[Server Action] seedGroupStageMatchesAction called.");

  if (!db) {
    return { success: false, message: "Error de configuración: la base de datos no está inicializada."};
  }

  try {
    const rulesResult = await loadTournamentRulesAction();
    if (!rulesResult.success || !rulesResult.data) {
      return { success: false, message: `Error al cargar las reglas del torneo: ${rulesResult.message || "No hay datos de reglas."}` };
    }
    if (rulesResult.data.groupsSeeded) {
      return { success: false, message: "Los grupos ya han sido semeados. Limpia los grupos primero si deseas re-semear." };
    }
    const tournamentRules = rulesResult.data;

    const groupsQuery = query(collection(db, "grupos"));
    const groupsSnapshot = await getDocs(groupsQuery);
    const allGroups = groupsSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Group));

    const batch = writeBatch(db);
    let totalMatchesGenerated = 0;

    // 1. Clear existing group stage matches
    const matchesCollectionRef = collection(db, MATCHES_COLLECTION);
    const oldMatchesQuery = query(matchesCollectionRef, where("groupId", "!=", null)); // Get all matches with a groupId
    const oldMatchesSnapshot = await getDocs(oldMatchesQuery);
    
    let clearedMatchesCount = 0;
    oldMatchesSnapshot.forEach(matchDoc => {
        // Further filter: only delete if it's a group match (no roundName)
        if (!matchDoc.data().roundName) { 
            batch.delete(matchDoc.ref);
            clearedMatchesCount++;
        }
    });
    if (clearedMatchesCount > 0) {
        console.log(`[Seed Action] Cleared ${clearedMatchesCount} old group stage matches from 'matches' collection.`);
    }


    const MINIMUM_ZONES_TO_SEED = 2; 
    const completedGroups = allGroups.filter(g => g.teamIds.length === TEAMS_PER_ZONE);
    
    if (completedGroups.length < MINIMUM_ZONES_TO_SEED) {
        return { success: false, message: `Se requieren al menos ${MINIMUM_ZONES_TO_SEED} zonas completas (${TEAMS_PER_ZONE} equipos c/u) para iniciar el seed. Actualmente hay ${completedGroups.length}.`};
    }

    for (const group of completedGroups) { 
      if (group.teamIds.length !== TEAMS_PER_ZONE) {
        console.log(`[Seed Action] Skipping group ${group.name} (ID: ${group.id}) as it does not have ${TEAMS_PER_ZONE} teams.`);
        continue;
      }

      const fixtures = generateRoundRobinFixtures(group.teamIds, tournamentRules.roundRobinType);
      
      fixtures.forEach(fixture => {
        const matchDocRef = doc(collection(db, MATCHES_COLLECTION));
        const newMatch: Omit<MatchType, 'id' | 'team1' | 'team2'> = {
          team1Id: fixture.team1Id,
          team2Id: fixture.team2Id,
          date: null, 
          status: 'pending_date',
          groupId: group.id,
          groupName: group.name,
          matchday: fixture.matchday,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
        batch.set(matchDocRef, newMatch);
        totalMatchesGenerated++;
      });
      console.log(`[Seed Action] Generated ${fixtures.length} matches for group ${group.name}.`);
    }

    if (totalMatchesGenerated === 0 && completedGroups.length > 0) {
      return { success: false, message: "Se encontraron grupos completos, pero no se generaron partidos. Revisa la lógica de generación."};
    }
     if (totalMatchesGenerated === 0 && completedGroups.length === 0) {
      return { success: false, message: "No se encontraron grupos completos para generar partidos."};
    }


    // 2. Mark groups as seeded in tournament_config
    const configUpdateResult = await updateGroupSeedStatusAction(true);
    if (!configUpdateResult.success) {
        return { success: false, message: `Partidos generados (${totalMatchesGenerated}), pero falló al marcar los grupos como semeados: ${configUpdateResult.message}` };
    }
    
    await batch.commit();
    return { success: true, message: `Seed de grupos completado. ${totalMatchesGenerated} partidos generados. Los grupos están ahora bloqueados.`, matchesGenerated: totalMatchesGenerated };

  } catch (error) {
    console.error("Error in seedGroupStageMatchesAction:", error);
    const message = error instanceof Error ? error.message : "Error desconocido durante el seed de grupos.";
    return { success: false, message };
  }
}


export async function getTeamsDetailsByIdsAction(teamIds: string[]): Promise<{ teams: Team[], error?: string }> {
  const teams: Team[] = [];
  if (!teamIds || teamIds.length === 0) {
    return { teams };
  }

  try {
    const uniqueTeamIds = Array.from(new Set(teamIds));
    const MAX_IDS_PER_QUERY = 30; 

    for (let i = 0; i < uniqueTeamIds.length; i += MAX_IDS_PER_QUERY) {
      const chunk = uniqueTeamIds.slice(i, i + MAX_IDS_PER_QUERY);
      if (chunk.length > 0) {
        const teamsQuery = query(collection(db, "equipos"), where(documentId(), "in", chunk));
        const snapshot = await getDocs(teamsQuery);
        snapshot.docs.forEach(docSnap => {
          teams.push({ id: docSnap.id, ...docSnap.data() } as Team);
        });
      }
    }
    return { teams };
  } catch (error) {
    console.error("Error fetching teams by IDs:", error);
    const message = error instanceof Error ? error.message : "Error desconocido al obtener equipos por IDs.";
    return { teams: [], error: message };
  }
}
