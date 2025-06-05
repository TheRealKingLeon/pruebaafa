
'use client'; 

import { z } from 'zod';
import { mockTeams } from '@/data/mock'; 

// Helper function to validate if a team ID exists
const isValidTeamId = (id: string) => mockTeams.some(team => team.id === id);

// Base schema for common fields in both add and edit match forms
const commonMatchFieldsSchema = z.object({
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
  date: z.string().refine((val) => {
    if (!val) return false; // Ensure date is not empty
    return !isNaN(Date.parse(val));
  }, { message: "Fecha inválida o no proporcionada."}),
  status: z.enum(['upcoming', 'live', 'completed', 'pending_date'], { required_error: "Estado es requerido.", invalid_type_error: "Estado inválido." }),
  streamUrl: z.string().url({ message: "Debe ser una URL válida." }).optional().or(z.literal('')),
});

// Refinement logic to ensure team1Id and team2Id are different
const teamsMustBeDifferentRefinement = (data: { team1Id: string; team2Id: string;[key: string]: any }) => {
  if (data.team1Id && data.team2Id) {
    return data.team1Id !== data.team2Id;
  }
  return true; // Pass if one of the fields is not yet defined (should be caught by individual field validation)
};

// Schema for editing a match (includes ID and common fields with refinement)
export const matchFormSchema = commonMatchFieldsSchema.extend({
  id: z.string().min(1, { message: "ID del partido es requerido." }),
}).refine(teamsMustBeDifferentRefinement, {
  message: "Los equipos deben ser diferentes.",
  path: ["team2Id"], 
});
export type EditMatchFormInput = z.infer<typeof matchFormSchema>;


// Schema for adding a match (omits ID, adds group/round info, includes common fields with refinement)
export const addMatchSchema = commonMatchFieldsSchema.extend({
    groupName: z.string().optional(),
    matchday: z.preprocess(
      (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
      z.number().int({invalid_type_error: "Matchday debe ser un número entero."}).min(1, "Matchday debe ser al menos 1.").optional()
    ),
    roundName: z.string().optional(),
}).refine(teamsMustBeDifferentRefinement, {
    message: "Los equipos deben ser diferentes.",
    path: ["team2Id"],
});
export type AddMatchFormInput = z.infer<typeof addMatchSchema>;

