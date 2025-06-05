
'use client';

import { z } from 'zod';
import type { TiebreakerCriterionKey } from '@/types';

const tiebreakerCriterionKeys: [TiebreakerCriterionKey, ...TiebreakerCriterionKey[]] = [
  'directResult', 
  'goalDifference', 
  'goalsFor', 
  'matchesWon', 
  'pointsCoefficient', 
  'drawLot'
];

export const tiebreakerRuleSchema = z.object({
  id: z.enum(tiebreakerCriterionKeys, { message: "Criterio de desempate inválido." }),
  name: z.string(), 
  priority: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        const num = parseInt(val, 10);
        return isNaN(num) ? undefined : num;
      }
      if (typeof val === 'number') return val;
      return undefined; 
    },
    z.number({invalid_type_error: "Prioridad debe ser un número."}).min(0, { message: "La prioridad debe ser un número positivo o cero." })
  ),
  enabled: z.boolean(),
});

export const tournamentRulesSchema = z.object({
  pointsForWin: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : typeof val === 'number' ? val : undefined),
    z.number({invalid_type_error: "Debe ser un número."}).min(0, { message: "Los puntos por victoria deben ser un número positivo o cero." })
  ),
  pointsForDraw: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : typeof val === 'number' ? val : undefined),
    z.number({invalid_type_error: "Debe ser un número."}).min(0, { message: "Los puntos por empate deben ser un número positivo o cero." })
  ),
  pointsForLoss: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : typeof val === 'number' ? val : undefined),
    z.number({invalid_type_error: "Debe ser un número."}).min(0, { message: "Los puntos por derrota deben ser un número positivo o cero." })
  ),
  roundRobinType: z.enum(['one-way', 'two-way'], {
    required_error: "Debes seleccionar la modalidad de la fase de grupos.",
    invalid_type_error: "Modalidad inválida."
  }),
  tiebreakers: z.array(tiebreakerRuleSchema)
    .refine(tiebreakers => { 
      const enabledPriorities = tiebreakers.filter(tb => tb.enabled && tb.priority > 0).map(tb => tb.priority);
      if (enabledPriorities.length === 0) return true;
      return new Set(enabledPriorities).size === enabledPriorities.length;
    }, { message: "Las prioridades (mayores a 0) de los criterios de desempate habilitados deben ser únicas."})
    .refine(tiebreakers => { 
        const enabledTiebreakers = tiebreakers.filter(tb => tb.enabled && tb.priority > 0).sort((a,b) => a.priority - b.priority);
        if (enabledTiebreakers.length === 0) return true; 
        for(let i=0; i < enabledTiebreakers.length; i++) {
            if (enabledTiebreakers[i].priority !== i + 1) return false;
        }
        return true;
    }, { message: "Las prioridades de los criterios habilitados (mayores a 0) deben ser secuenciales empezando desde 1 (Ej: 1, 2, 3...). Reasigna prioridades."}),
  groupsSeeded: z.boolean().optional(),
  groupsSeededAt: z.any().optional(),
});

export type TournamentRulesFormInput = z.infer<typeof tournamentRulesSchema>;

