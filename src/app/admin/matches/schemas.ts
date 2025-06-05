
'use client'; 

import { z } from 'zod';

// No longer using mockTeams for validation here, as teams will be fetched from Firestore for select dropdowns.
// const isValidTeamId = (id: string) => mockTeams.some(team => team.id === id);

const commonMatchFieldsSchema = z.object({
  team1Id: z.string().min(1, "Equipo 1 es requerido."),
  team2Id: z.string().min(1, "Equipo 2 es requerido."),
  score1: z.preprocess(
    (val) => {
      if (val === '' || val === undefined || val === null) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    },
    z.number().int().min(0, "El resultado debe ser 0 o más.").nullable().optional()
  ),
  score2: z.preprocess(
    (val) => {
      if (val === '' || val === undefined || val === null) return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    },
    z.number().int().min(0, "El resultado debe ser 0 o más.").nullable().optional()
  ),
  date: z.string().refine((val) => {
    if (!val) return false; // Date must be provided
    return !isNaN(Date.parse(val));
  }, { message: "Fecha y hora son requeridas y deben ser válidas."}),
  status: z.enum(['upcoming', 'live', 'completed', 'pending_date'], { 
    required_error: "Estado es requerido.", 
    invalid_type_error: "Estado inválido." 
  }),
  streamUrl: z.string().url({ message: "Debe ser una URL válida." }).optional().or(z.literal('')),
});

const teamsMustBeDifferentRefinement = (data: { team1Id: string; team2Id: string;[key: string]: any }) => {
  if (data.team1Id && data.team2Id) {
    return data.team1Id !== data.team2Id;
  }
  return true;
};

export const matchFormSchema = commonMatchFieldsSchema.extend({
  id: z.string().min(1, { message: "ID del partido es requerido." }),
}).refine(teamsMustBeDifferentRefinement, {
  message: "Los equipos deben ser diferentes.",
  path: ["team2Id"], 
});
export type EditMatchFormInput = z.infer<typeof matchFormSchema>;


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
