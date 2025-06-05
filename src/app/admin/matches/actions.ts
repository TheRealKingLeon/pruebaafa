
'use server';

import type { Match, Team } from '@/types';
import { mockMatches, mockTeams } from '@/data/mock'; // Import mock data for actions
import { addMatchSchema, matchFormSchema, type AddMatchFormInput, type EditMatchFormInput } from './schemas';


export async function updateMatchAction(data: EditMatchFormInput) {
  console.log("Partido a actualizar (simulado):", data);
  
  // Simulate finding and updating the match in mockMatches
  const matchIndex = mockMatches.findIndex(m => m.id === data.id);
  if (matchIndex > -1) {
    const originalMatch = mockMatches[matchIndex];
    const team1 = mockTeams.find(t => t.id === data.team1Id);
    const team2 = mockTeams.find(t => t.id === data.team2Id);

    if (!team1 || !team2) {
      return { success: false, message: "Uno o ambos equipos no fueron encontrados." };
    }

    // Update the mockMatches array (client-side only, won't persist across reloads without further logic)
    mockMatches[matchIndex] = {
      ...originalMatch, // Preserve groupName, roundName, matchday, etc.
      team1: team1,
      team2: team2,
      score1: data.status === 'completed' ? data.score1 : undefined,
      score2: data.status === 'completed' ? data.score2 : undefined,
      date: new Date(data.date).toISOString(), // Convert back to ISO string for consistency
      status: data.status,
      streamUrl: data.streamUrl || undefined,
    };
    console.log("Mock match updated in memory:", mockMatches[matchIndex]);
    return { success: true, message: `Partido ID: ${data.id} actualizado (simulación).` };
  }
  
  return { success: false, message: `Partido ID: ${data.id} no encontrado (simulación).` };
}


export async function addMatchAction(data: AddMatchFormInput) {
  console.log("Nuevo partido a añadir (simulado):", data);
  const newMatchId = `match-${Math.random().toString(36).substring(2, 9)}`;
  const team1 = mockTeams.find(t => t.id === data.team1Id);
  const team2 = mockTeams.find(t => t.id === data.team2Id);

  if (!team1 || !team2) {
    return { success: false, message: "Uno o ambos equipos para el nuevo partido no fueron encontrados." };
  }

  const newMatch: Match = {
    id: newMatchId,
    team1Id: data.team1Id, 
    team2Id: data.team2Id, 
    team1, 
    team2, 
    score1: data.status === 'completed' ? data.score1 : undefined,
    score2: data.status === 'completed' ? data.score2 : undefined,
    date: new Date(data.date).toISOString(),
    status: data.status,
    streamUrl: data.streamUrl || undefined,
    groupName: data.groupName,
    matchday: data.matchday,
    roundName: data.roundName,
    createdAt: new Date().toISOString(), 
    updatedAt: new Date().toISOString(), 
  };
  mockMatches.push(newMatch); 
  console.log("New mock match added in memory:", newMatch);
  return { success: true, message: `Partido ${newMatchId} añadido (simulación).`, match: newMatch };
}
