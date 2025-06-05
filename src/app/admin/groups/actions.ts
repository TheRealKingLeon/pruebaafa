
'use server';

import { db } from '@/lib/firebase';
import { collection, getDocs, doc, setDoc, writeBatch, serverTimestamp, query, orderBy, getDoc } from 'firebase/firestore';
import type { Group, Team } from '@/types';

const TOTAL_ZONES = 8;
const TEAMS_PER_ZONE = 8;
const DEFAULT_ZONE_IDS = Array.from({ length: TOTAL_ZONES }, (_, i) => `zona-${String.fromCharCode(97 + i)}`); // zona-a, zona-b, ...

// Helper function to shuffle an array
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

export async function getGroupsAndTeamsAction(): Promise<{ groups: Group[]; teams: Team[]; error?: string }> {
  try {
    const teamsSnapshot = await getDocs(query(collection(db, "equipos"), orderBy("name")));
    const teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team));

    const groupsRef = collection(db, "grupos");
    let groups: Group[] = [];
    const existingGroupsSnapshot = await getDocs(query(groupsRef, orderBy("name")));
    
    if (existingGroupsSnapshot.docs.length < TOTAL_ZONES) {
      // Initialize groups if they don't exist or are incomplete
      const batch = writeBatch(db);
      const groupPromises: Promise<void>[] = [];

      for (let i = 0; i < TOTAL_ZONES; i++) {
        const zoneId = DEFAULT_ZONE_IDS[i];
        const groupName = `Zona ${String.fromCharCode(65 + i)}`;
        const groupDocRef = doc(db, "grupos", zoneId);
        
        // Check if this specific group doc exists before trying to create it
        const groupDocSnap = await getDoc(groupDocRef);
        if (!groupDocSnap.exists()) {
            const newGroupData: Omit<Group, 'id'> = { // Omit id as it's the doc name
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
      
      // Re-fetch groups after creation
      const newGroupsSnapshot = await getDocs(query(groupsRef, orderBy("name")));
      groups = newGroupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
    } else {
        groups = existingGroupsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
    }
    
    // Ensure groups are sorted by name (Zona A, Zona B, ...)
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
    // We allow fewer than 64 teams, they will be distributed as evenly as possible.
    // if (teams.length < TOTAL_ZONES * TEAMS_PER_ZONE) {
    //   return { success: false, message: `Se necesitan al menos ${TOTAL_ZONES * TEAMS_PER_ZONE} equipos para llenar todas las zonas. Actualmente hay ${teams.length}.` };
    // }

    const shuffledTeams = shuffleArray(teams);
    const batch = writeBatch(db);

    for (let i = 0; i < TOTAL_ZONES; i++) {
      const zoneId = DEFAULT_ZONE_IDS[i];
      const groupName = `Zona ${String.fromCharCode(65 + i)}`; // A, B, C...
      const groupDocRef = doc(db, "grupos", zoneId);

      // Distribute teams to this zone
      const startIndex = i * TEAMS_PER_ZONE;
      const endIndex = startIndex + TEAMS_PER_ZONE;
      const teamIdsForZone = shuffledTeams.slice(startIndex, endIndex).map(team => team.id);
      
      // Ensure all groups get an entry, even if there aren't enough teams to fill TEAMS_PER_ZONE
      // For example, if there are 10 teams and 8 zones, zona-a gets 2 teams, zona-b gets 2, ... zona-e gets 2, zona-f to zona-h get 0.
      // Corrected logic: distribute them more like cards dealt one by one to each zone.
      
      const groupDataUpdate = {
        name: groupName,
        zoneId: zoneId,
        teamIds: teamIdsForZone, // This will be empty if not enough teams reach this group
        updatedAt: serverTimestamp(),
      };

      // Use set with merge:true to create if not exists, or update if exists
      // Or check existence first, then decide to set or update.
      // For simplicity of auto-assign (which is a full overwrite of assignments), set is fine.
      // We ensure createdAt is only set once, if getGroupsAndTeamsAction initializes it.
      const groupDocSnap = await getDoc(groupDocRef);
      if (groupDocSnap.exists()) {
        batch.update(groupDocRef, groupDataUpdate);
      } else {
        batch.set(groupDocRef, {
          ...groupDataUpdate,
          createdAt: serverTimestamp() // Set createdAt only if new
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
