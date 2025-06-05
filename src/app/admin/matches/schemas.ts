
'use client'; // Keep 'use client' if mockTeams is used here or if it's imported by client components

import { z } from 'zod';
import { mockTeams } from '@/data/mock'; // Assuming mockTeams is needed for isValidTeamId

// Helper function to validate if a team ID exists
// This function might need to be async if it were to check a database
const isValidTeamId = (id: string) => mockTeams.some(team => team.id === id);

export const matchFormSchema = z.object({
  id: z.string().min(1, { message: "ID del partido es requerido." }),
  team1Id: z.string().refine(isValidTeamId, { message: "Equipo 1 inválido." }),
  team2Id: z.string().refine(isValidTeamId, { message: "Equipo 2 inválido." }),
  score1: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().int().min(0, "El resultado debe ser 0 o más.").optional()
  ),
  score2: z.preprocess(
    (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
    z.number().int().min(0, "El resultado debe ser 0 o más.").optional()
  ),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha inválida."}), // Expects ISO-like string from datetime-local
  status: z.enum(['upcoming', 'live', 'completed', 'pending_date'], { message: "Estado inválido." }),
  streamUrl: z.string().url({ message: "Debe ser una URL válida." }).optional().or(z.literal('')),
}).refine((data) => {
    if (data.team1Id && data.team2Id) {
      return data.team1Id !== data.team2Id;
    }
    return true;
  }, {
    message: "Los equipos deben ser diferentes.",
    path: ["team2Id"],
});

export type EditMatchFormInput = z.infer<typeof matchFormSchema>;

// Schema for adding a match
export const addMatchSchema = matchFormSchema.omit({ id: true }).extend({
    groupName: z.string().optional(),
    matchday: z.number().optional(),
    roundName: z.string().optional(),
});
export type AddMatchFormInput = z.infer<typeof addMatchSchema>;
