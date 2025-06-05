
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
      if (currentTeamIdx >= teamsToAssign.length) {
        break; 
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
}): Promise<{ success: boolean; message: string }> {
  const { teamId, sourceGroupId, targetGroupId } = payload;

  if (sourceGroupId === targetGroupId) {
    return { success: false, message: "El equipo ya está en este grupo." };
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

      const sourceGroupData = sourceGroupSnap.data() as Group;
      const targetGroupData = targetGroupSnap.data() as Group;

      // Check if target group is full
      if (targetGroupData.teamIds.length >= TEAMS_PER_ZONE) {
        throw new Error(`El grupo de destino "${targetGroupData.name}" está lleno (máximo ${TEAMS_PER_ZONE} equipos).`);
      }
      
      // Check if team already in target group (should not happen if source and target are different and team is in source)
      if (targetGroupData.teamIds.includes(teamId)) {
         throw new Error(`El equipo ya se encuentra en el grupo de destino "${targetGroupData.name}".`);
      }


      // Remove team from source group
      const newSourceTeamIds = sourceGroupData.teamIds.filter(id => id !== teamId);
      transaction.update(sourceGroupRef, {
        teamIds: newSourceTeamIds,
        updatedAt: serverTimestamp(),
      });

      // Add team to target group
      const newTargetTeamIds = [...targetGroupData.teamIds, teamId];
      transaction.update(targetGroupRef, {
        teamIds: newTargetTeamIds,
        updatedAt: serverTimestamp(),
      });
    });

    return { success: true, message: "Equipo movido exitosamente." };
  } catch (error) {
    console.error("Error in manualMoveTeamAction:", error);
    const message = error instanceof Error ? error.message : "Error desconocido al mover el equipo.";
    return { success: false, message };
  }
}
