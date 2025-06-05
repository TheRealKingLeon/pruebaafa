
'use server';

import { db } from '@/lib/firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp, 
  Timestamp,
  query,
  orderBy,
  where,
  documentId
} from 'firebase/firestore';
import type { Match, Team } from '@/types';
import type { AddMatchFormInput, EditMatchFormInput } from './schemas';

const MATCHES_COLLECTION = "matches";
const TEAMS_COLLECTION = "equipos";

// Helper to get multiple team details efficiently
async function getTeamsDetailsForMatches(teamIds: string[]): Promise<Map<string, Pick<Team, 'name' | 'logoUrl'>>> {
  const teamsMap = new Map<string, Pick<Team, 'name' | 'logoUrl'>>();
  if (teamIds.length === 0) return teamsMap;

  const uniqueTeamIds = Array.from(new Set(teamIds));
  
  // Firestore 'in' query limit is 30 IDs per query.
  const MAX_IDS_PER_QUERY = 30; // Increased from 10 to 30 as per Firestore limits
  for (let i = 0; i < uniqueTeamIds.length; i += MAX_IDS_PER_QUERY) {
    const chunk = uniqueTeamIds.slice(i, i + MAX_IDS_PER_QUERY);
    if (chunk.length > 0) {
      const teamsQuery = query(collection(db, TEAMS_COLLECTION), where(documentId(), "in", chunk));
      const snapshot = await getDocs(teamsQuery);
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        teamsMap.set(docSnap.id, { name: data.name, logoUrl: data.logoUrl });
      });
    }
  }
  return teamsMap;
}

export async function getMatchesAction(): Promise<{ matches: Match[], error?: string }> {
  try {
    const matchesQuery = query(collection(db, MATCHES_COLLECTION), orderBy("date", "desc"));
    const snapshot = await getDocs(matchesQuery);
    
    const matchDocsData = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Omit<Match, 'team1' | 'team2'>));
    
    const teamIdsToFetch = new Set<string>();
    matchDocsData.forEach(m => {
      if (m.team1Id) teamIdsToFetch.add(m.team1Id);
      if (m.team2Id) teamIdsToFetch.add(m.team2Id);
    });

    const teamsDetailsMap = await getTeamsDetailsForMatches(Array.from(teamIdsToFetch));

    const populatedMatches: Match[] = matchDocsData.map(m => {
      const team1Data = m.team1Id ? teamsDetailsMap.get(m.team1Id) : undefined;
      const team2Data = m.team2Id ? teamsDetailsMap.get(m.team2Id) : undefined;
      return {
        ...m,
        team1: team1Data ? { id: m.team1Id!, ...team1Data } as Team : undefined,
        team2: team2Data ? { id: m.team2Id!, ...team2Data } as Team : undefined,
        date: m.date instanceof Timestamp ? m.date.toDate().toISOString() : m.date, // Ensure date is string for client
      };
    }).filter(m => m.team1 && m.team2); // Filter out matches with missing team data

    return { matches: populatedMatches };
  } catch (error) {
    console.error("Error fetching matches from Firestore:", error);
    const message = error instanceof Error ? error.message : "Error desconocido al obtener partidos.";
    return { matches: [], error: message };
  }
}

export async function getAllTeamsAction(): Promise<{ teams: Team[], error?: string }> {
  try {
    const teamsQuery = query(collection(db, TEAMS_COLLECTION), orderBy("name"));
    const snapshot = await getDocs(teamsQuery);
    const teams = snapshot.docs.map(docSnap => ({ 
        id: docSnap.id, 
        name: docSnap.data().name, 
        logoUrl: docSnap.data().logoUrl 
    } as Team));
    return { teams };
  } catch (error) {
    console.error("Error fetching teams from Firestore:", error);
    const message = error instanceof Error ? error.message : "Error desconocido al obtener equipos.";
    return { teams: [], error: message };
  }
}


export async function getMatchByIdAction(matchId: string): Promise<{ match: Match | null, error?: string }> {
  try {
    const matchRef = doc(db, MATCHES_COLLECTION, matchId);
    const matchSnap = await getDoc(matchRef);

    if (!matchSnap.exists()) {
      return { match: null, error: `Partido con ID ${matchId} no encontrado.` };
    }

    const matchData = { id: matchSnap.id, ...matchSnap.data() } as Omit<Match, 'team1' | 'team2'>;
    
    const teamIdsToFetch = new Set<string>();
    if (matchData.team1Id) teamIdsToFetch.add(matchData.team1Id);
    if (matchData.team2Id) teamIdsToFetch.add(matchData.team2Id);
    
    const teamsDetailsMap = await getTeamsDetailsForMatches(Array.from(teamIdsToFetch));

    const team1Data = matchData.team1Id ? teamsDetailsMap.get(matchData.team1Id) : undefined;
    const team2Data = matchData.team2Id ? teamsDetailsMap.get(matchData.team2Id) : undefined;
    
    const populatedMatch: Match = {
      ...matchData,
      team1: team1Data ? { id: matchData.team1Id!, ...team1Data } as Team : undefined,
      team2: team2Data ? { id: matchData.team2Id!, ...team2Data } as Team : undefined,
      date: matchData.date instanceof Timestamp ? matchData.date.toDate().toISOString() : matchData.date,
    };

    if (!populatedMatch.team1 || !populatedMatch.team2) {
        console.warn("Match found but team data is incomplete for match ID:", matchId);
        // Decide if this should be an error or return partial data. For now, returning with possibly undefined teams.
    }

    return { match: populatedMatch };
  } catch (error) {
    console.error(`Error fetching match ${matchId} from Firestore:`, error);
    const message = error instanceof Error ? error.message : "Error desconocido al obtener el partido.";
    return { match: null, error: message };
  }
}

export async function updateMatchAction(data: EditMatchFormInput) {
  console.log("Partido a actualizar en Firestore:", data);
  const matchId = data.id;

  if (!db) {
    return { success: false, message: "Error de configuración: la base de datos no está inicializada."};
  }
  if (!matchId) {
    return { success: false, message: "ID del partido no proporcionado." };
  }

  try {
    const matchRef = doc(db, MATCHES_COLLECTION, matchId);
    
    const updatePayload: Partial<Omit<Match, 'id' | 'team1' | 'team2' | 'createdAt'>> = {
      team1Id: data.team1Id,
      team2Id: data.team2Id,
      date: data.date ? Timestamp.fromDate(new Date(data.date)) : null,
      status: data.status,
      streamUrl: data.streamUrl || null, // Store null if empty string
      score1: data.status === 'completed' ? (data.score1 ?? null) : null,
      score2: data.status === 'completed' ? (data.score2 ?? null) : null,
      updatedAt: serverTimestamp(),
      // groupName, matchday, roundName are usually set at creation and not editable here
      // If they are part of EditMatchFormInput and need to be updatable, add them.
    };
    
    // Remove undefined fields from payload to avoid issues with Firestore
    Object.keys(updatePayload).forEach(key => {
      if ((updatePayload as any)[key] === undefined) {
        delete (updatePayload as any)[key];
      }
    });

    await updateDoc(matchRef, updatePayload);
    return { success: true, message: `Partido ID: ${matchId} actualizado en Firestore.` };
  } catch (error) {
    console.error("Error actualizando partido en Firestore:", error);
    const message = error instanceof Error ? error.message : "Error desconocido al actualizar el partido.";
    return { success: false, message };
  }
}

export async function addMatchAction(data: AddMatchFormInput) {
  console.log("Nuevo partido a añadir a Firestore:", data);

  if (!db) {
    return { success: false, message: "Error de configuración: la base de datos no está inicializada."};
  }
  
  try {
    const newMatchData: Omit<Match, 'id' | 'team1' | 'team2'> = {
      team1Id: data.team1Id,
      team2Id: data.team2Id,
      date: data.date ? Timestamp.fromDate(new Date(data.date)) : null,
      status: data.status,
      score1: data.status === 'completed' ? (data.score1 ?? null) : null,
      score2: data.status === 'completed' ? (data.score2 ?? null) : null,
      streamUrl: data.streamUrl || null,
      groupName: data.groupName || null,
      matchday: data.matchday || null,
      roundName: data.roundName || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, MATCHES_COLLECTION), newMatchData);
    const newMatchForClient = { ...newMatchData, id: docRef.id, date: data.date }; // Return string date
    return { success: true, message: `Partido ${docRef.id} añadido a Firestore.`, match: newMatchForClient as Match };
  } catch (error) {
    console.error("Error añadiendo partido a Firestore:", error);
    const message = error instanceof Error ? error.message : "Error desconocido al añadir el partido.";
    return { success: false, message };
  }
}
