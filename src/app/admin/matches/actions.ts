
'use server';

import { z } from 'zod';
import type { Match, Team } from '@/types';
import { mockMatches, mockTeams } from '@/data/mock'; // Import mock data for actions

// Helper function to validate if a team ID exists
const isValidTeamId = (id: string) => mockTeams.some(team => team.id === id);

export const matchFormSchema = z.object({
  id: z.string().min(1, { message: "ID del partido es requerido." }),
  team1Id: z.string().refine(isValidTeamId, { message: "Equipo 1 inválido." }),
  team2Id: z.string().refine(isValidTeamId, { message: "Equipo 2 inválido." })
    .refine((data) => data.team1Id !== data.team2Id, {
      message: "Los equipos deben ser diferentes.",
      path: ["team2Id"], // Optional: specify path for error message on team2Id
    }),
  score1: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().int().min(0).optional()
  ),
  score2: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().int().min(0).optional()
  ),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha inválida."}), // Expects ISO-like string from datetime-local
  status: z.enum(['upcoming', 'live', 'completed'], { message: "Estado inválido." }),
  // groupName, roundName, matchday could be added here if they were editable
  // For now, they are derived from existing match data or kept as is
});

export type EditMatchFormInput = z.infer<typeof matchFormSchema>;

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
    };
    console.log("Mock match updated in memory:", mockMatches[matchIndex]);
    return { success: true, message: `Partido ID: ${data.id} actualizado (simulación).` };
  }
  
  return { success: false, message: `Partido ID: ${data.id} no encontrado (simulación).` };
}

// Placeholder for future addMatchAction
export const addMatchSchema = matchFormSchema.omit({ id: true }); // ID will be generated
export type AddMatchFormInput = z.infer<typeof addMatchSchema>;

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
    team1,
    team2,
    score1: data.status === 'completed' ? data.score1 : undefined,
    score2: data.status === 'completed' ? data.score2 : undefined,
    date: new Date(data.date).toISOString(),
    status: data.status,
    // groupName, roundName, matchday would need to be part of AddMatchFormInput
  };
  mockMatches.push(newMatch); // Add to mock data (client-side only)
  console.log("New mock match added in memory:", newMatch);
  return { success: true