
'use server';

import type { TournamentRulesFormInput } from './schemas';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';
import type { TiebreakerRule, TournamentRules } from '@/types';

const TOURNAMENT_CONFIG_COLLECTION = "tournament_config";
const GROUP_STAGE_RULES_DOC_ID = "rules_group_stage";


export async function saveTournamentRulesAction(data: TournamentRulesFormInput) {
  console.log("[Server Action] saveTournamentRulesAction: Attempting to save to Firestore with data:", JSON.stringify(data, null, 2));

  if (!db) {
    console.error("[Server Action] Firestore db instance is not available.");
    return { success: false, message: "Error de configuración: la base de datos no está inicializada." };
  }

  try {
    const rulesRef = doc(db, TOURNAMENT_CONFIG_COLLECTION, GROUP_STAGE_RULES_DOC_ID);
    
    const dataToSave: Partial<TournamentRules> = { // Use Partial for flexibility with fields like groupsSeededAt
      ...data,
      updatedAt: serverTimestamp(),
    };
    // Ensure groupsSeeded is explicitly passed or handled
    if (typeof data.groupsSeeded === 'boolean') {
      dataToSave.groupsSeeded = data.groupsSeeded;
      if (data.groupsSeeded && !data.groupsSeededAt) { // Only set groupsSeededAt if seeding now and not already set
        dataToSave.groupsSeededAt = serverTimestamp();
      } else if (!data.groupsSeeded) { // If unseeding
        dataToSave.groupsSeededAt = null; // Or deleteField() if you prefer to remove it
      }
    }


    await setDoc(rulesRef, dataToSave, { merge: true }); 
    
    console.log("[Server Action] Tournament rules saved successfully to Firestore.");
    return { success: true, message: "Configuración de reglas guardada exitosamente en Firestore." };
  } catch (error) {
    console.error("[Server Action] Error saving tournament rules to Firestore: ", error);
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido al guardar las reglas.";
    return { success: false, message: `Error al guardar la configuración: ${errorMessage}` };
  }
}


export async function loadTournamentRulesAction(): Promise<{ success: boolean; data: TournamentRulesFormInput | null; message?: string }> {
  console.log("[Server Action] loadTournamentRulesAction: Attempting to load from Firestore.");

  if (!db) {
    console.error("[Server Action] Firestore db instance is not available for loading.");
    return { success: false, data: null, message: "Error de configuración: la base de datos no está inicializada." };
  }

  try {
    const rulesRef = doc(db, TOURNAMENT_CONFIG_COLLECTION, GROUP_STAGE_RULES_DOC_ID);
    const docSnap = await getDoc(rulesRef);

    if (docSnap.exists()) {
      const rawData = docSnap.data();
      // Remove server-only fields like 'updatedAt' before sending to client for Zod validation
      // and convert Timestamp for groupsSeededAt to string or number if needed by form, or handle in client
      const { updatedAt, groupsSeededAt, ...clientSafeDataBase } = rawData;
      
      const clientSafeData: TournamentRulesFormInput = {
        pointsForWin: clientSafeDataBase.pointsForWin ?? 0,
        pointsForDraw: clientSafeDataBase.pointsForDraw ?? 0,
        pointsForLoss: clientSafeDataBase.pointsForLoss ?? 0,
        roundRobinType: clientSafeDataBase.roundRobinType ?? 'one-way',
        tiebreakers: clientSafeDataBase.tiebreakers || [],
        groupsSeeded: typeof clientSafeDataBase.groupsSeeded === 'boolean' ? clientSafeDataBase.groupsSeeded : false,
        // groupsSeededAt is not part of TournamentRulesFormInput currently, so not passed to client form state
      };
      
      console.log("[Server Action] Tournament rules loaded successfully from Firestore:", JSON.stringify(clientSafeData, null, 2));
      return { success: true, data: clientSafeData };
    } else {
      console.log("[Server Action] No tournament rules document found in Firestore. Returning null.");
      return { success: true, data: null, message: "No se encontró configuración de reglas guardada." };
    }
  } catch (error) {
    console.error("[Server Action] Error loading tournament rules from Firestore: ", error);
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido al cargar las reglas.";
    return { success: false, data: null, message: `Error al cargar la configuración: ${errorMessage}` };
  }
}

export async function updateGroupSeedStatusAction(seeded: boolean): Promise<{success: boolean, message: string}> {
    if (!db) {
        return { success: false, message: "Error de DB."};
    }
    try {
        const rulesRef = doc(db, TOURNAMENT_CONFIG_COLLECTION, GROUP_STAGE_RULES_DOC_ID);
        const updateData: Partial<TournamentRules> = {
            groupsSeeded: seeded,
            updatedAt: serverTimestamp()
        };
        if (seeded) {
            updateData.groupsSeededAt = serverTimestamp();
        } else {
            // Consider if you want to nullify groupsSeededAt or use deleteField()
            // For simplicity, setDoc with merge:true below will handle it if not present in updateData,
            // or we can explicitly set it to null.
            updateData.groupsSeededAt = null; 
        }
        await setDoc(rulesRef, updateData, { merge: true });
        return { success: true, message: `Estado de seed de grupos actualizado a: ${seeded}.`};
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Error desconocido.";
        return { success: false, message: `Error actualizando estado de seed: ${msg}`};
    }
}
