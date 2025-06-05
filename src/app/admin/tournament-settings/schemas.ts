
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
  name: z.string(), // Name is for display, not part of the form directly but good to have in schema
  priority: z.preprocess(
    (val) => parseInt(z.string().parse(val), 10),
    z.number().min(0, { message: "La prioridad debe ser un número positivo." })
  ),
  enabled: z.boolean(),
});

export const tournamentRulesSchema = z.object({
  pointsForWin: z.preprocess(
    (val) => parseInt(z.string().parse(val), 10),
    z.number().min(0, { message: "Los puntos por victoria deben ser un número positivo." })
  ),
  pointsForDraw: z.preprocess(
    (val) => parseInt(z.string().parse(val), 10),
    z.number().min(0, { message: "Los puntos por empate deben ser un número positivo." })
  ),
  pointsForLoss: z.preprocess(
    (val) => parseInt(z.string().parse(val), 10),
    z.number().min(0, { message: "Los puntos por derrota deben ser un número positivo o cero." })
  ),
  roundRobinType: z.enum(['one-way', 'two-way'], {
    required_error: "Debes seleccionar la modalidad de la fase de grupos.",
    invalid_type_error: "Modalidad inválida."
  }),
  tiebreakers: z.array(tiebreakerRuleSchema)
    .refine(tiebreakers => { // Ensure priorities are unique among enabled tiebreakers
      const enabledPriorities = tiebreakers.filter(tb => tb.enabled).map(tb => tb.priority);
      return new Set(enabledPriorities).size === enabledPriorities.length;
    }, { message: "Las prioridades de los criterios de desempate habilitados deben ser únicas."})
    .refine(tiebreakers => { // Ensure priorities are sequential among enabled tiebreakers starting from 1 if any are enabled
        const enabledTiebreakers = tiebreakers.filter(tb => tb.enabled).sort((a,b) => a.priority - b.priority);
        if (enabledTiebreakers.length === 0) return true; // No enabled tiebreakers, passes
        for(let i=0; i < enabledTiebreakers.length; i++) {
            if (enabledTiebreakers[i].priority !== i + 1) return false;
        }
        return true;
    }, { message: "Las prioridades de los criterios habilitados deben ser secuenciales empezando desde 1 (Ej: 1, 2, 3...). Reasigna prioridades."})
});

export type TournamentRulesFormInput = z.infer<typeof tournamentRulesSchema>;
