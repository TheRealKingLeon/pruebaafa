
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, writeBatch, serverTimestamp, query, orderBy, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
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
  };
}


export async function getGroupsAndTeamsAction(): Promise<{ groups: Group[]; teams: Team[]; error?: string }> {
  try {
    const teamsSnapshot = await getDocs(query(collection(db, "equipos"), orderBy("name")));
    const teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));

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
    const teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));

    if (teams.length === 0) {
      return { success: false, message: "No hay equipos para asignar. Añade equipos primero." };
    }
    
    const shuffledTeams = shuffleArray(teams);
    const batch = writeBatch(db);

    const groupTeamAssignments: { [key: string]: string[] } = {};
    DEFAULT_ZONE_IDS.forEach(zoneId => {
      groupTeamAssignments[zoneId] = [];
    });

    shuffledTeams.forEach((team, index) => {
      const zoneIndex = index % TOTAL_ZONES;
      const zoneId = DEFAULT_ZONE_IDS[zoneIndex];
      if (groupTeamAssignments[zoneId].length < TEAMS_PER_ZONE) {
        groupTeamAssignments[zoneId].push(team.id);
      }
    });

    for (let i = 0; i < TOTAL_ZONES; i++) {
      const zoneId = DEFAULT_ZONE_IDS[i];
      const groupName = `Zona ${String.fromCharCode(65 + i)}`;
      const groupDocRef = doc(db, "grupos", zoneId);
      
      const groupDataUpdate = {
        name: groupName, 
        zoneId: zoneId, 
        teamIds: groupTeamAssignments[zoneId] || [], 
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
