
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, writeBatch, serverTimestamp, query, orderBy, getDoc, Timestamp, runTransaction } from 'firebase/firestore';
import type { Group, Team } from '@/types';

const TOTAL_ZONES = 8;
const TEAMS_PER_ZONE = 4; 
const DEFAULT_ZONE_IDS = Array.from({ length: TOTAL_ZONES }, (_, i) => `zona-${String.fromCharCode(97 + i)}`); 

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
    const groupsRef = collection(db, "grupos");
    const groupsSnapshot = await getDocs(groupsRef);
    
    if (groupsSnapshot.empty) {
      return { success: true, message: "No hay grupos para limpiar (la colección 'grupos' está vacía o no existe)." };
    }

    const batch = writeBatch(db);
    groupsSnapshot.forEach(groupDoc => {
      batch.update(groupDoc.ref, {
        teamIds: [],
        updatedAt: serverTimestamp()
      });
    });

    await batch.commit();
    return { success: true, message: "Todos los grupos han sido limpiados y los equipos desasignados con éxito." };
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


export async function seedGroupStageMatchesAction(): Promise<{ success: boolean; message: string }> {
  console.log("[Server Action] seedGroupStageMatchesAction called. Placeholder implementation.");
  // TODO:
  // 1. Fetch tournament rules (roundRobinType) from tournament_config/rules_group_stage.
  // 2. Fetch all groups and their assigned teams from 'grupos' collection.
  // 3. For each group:
  //    - Check if group has TEAMS_PER_ZONE teams. If not, maybe skip or return error.
  //    - Generate round-robin matches based on roundRobinType.
  //    - Assign placeholder dates/times for these matches.
  //    - Create Match objects (status: 'upcoming', no scores).
  // 4. Save these Match objects to a new Firestore collection (e.g., 'group_stage_matches').
  // 5. Update a flag in Firestore (e.g., tournament_config/status or rules_group_stage)
  //    to indicate that group stage has been seeded (e.g., `groupsSeeded: true`).
  
  try {
    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 1500)); 
    
    // Example: Set a flag in Firestore to indicate groups are seeded
    // This part would be more complex in a real scenario.
    // For now, we assume the client will manage the 'groupsSeeded' state locally after this action returns success.
    // A more robust solution would be to read this flag from Firestore in GroupManagementClient.
    
    // const statusRef = doc(db, "tournament_config", "status_flags"); // Example path
    // await setDoc(statusRef, { groupsSeeded: true, groupsSeededAt: serverTimestamp() }, { merge: true });

    return { success: true, message: "Seed de grupos iniciado (simulación). Partidos deberían generarse y grupos bloqueados." };

  } catch (error) {
    console.error("Error in seedGroupStageMatchesAction (simulación):", error);
    const message = error instanceof Error ? error.message : "Error desconocido durante el seed de grupos.";
    return { success: false, message };
  }
}

