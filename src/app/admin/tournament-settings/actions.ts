
'use server';

import type { TournamentRulesFormInput } from './schemas';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import type { TiebreakerRule } from '@/types';

const TOURNAMENT_CONFIG_COLLECTION = "tournament_config";
const GROUP_STAGE_RULES_DOC_ID = "rules_group_stage";

// Helper to convert Firestore Timestamps to ISO strings if they exist
// For simplicity, we're not deeply converting nested timestamps in this example.
// The form expects basic types or types Zod can handle.
// TiebreakerRule itself doesn't have timestamps.
function convertTimestamps(data: any) {
  if (data && data.updatedAt instanceof Timestamp) {
    // We don't have updatedAt in TournamentRulesFormInput, but good practice if we did
    // data.updatedAt = data.updatedAt.toDate().toISOString();
  }
  // Convert other timestamps if necessary
  return data;
}


export async function saveTournamentRulesAction(data: TournamentRulesFormInput) {
  console.log("[Server Action] saveTournamentRulesAction: Attempting to save to Firestore with data:", JSON.stringify(data, null, 2));

  if (!db) {
    console.error("[Server Action] Firestore db instance is not available.");
    return { success: false, message: "Error de configuración: la base de datos no está inicializada." };
  }

  try {
    const rulesRef = doc(db, TOURNAMENT_CONFIG_COLLECTION, GROUP_STAGE_RULES_DOC_ID);
    
    // Ensure tiebreakers are correctly structured if they are being modified
    // The data coming from the form should already be in the correct format.
    const dataToSave = {
      ...data,
      updatedAt: serverTimestamp(), // Add/update an 'updatedAt' timestamp
    };

    await setDoc(rulesRef, dataToSave, { merge: true }); // merge: true to update if exists, create if not
    
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
      const { updatedAt, ...clientSafeData } = rawData;
      
      // Ensure tiebreakers array is present and correctly typed, even if empty from DB
      const validatedData = {
        ...clientSafeData,
        tiebreakers: clientSafeData.tiebreakers || [],
      } as TournamentRulesFormInput;

      console.log("[Server Action] Tournament rules loaded successfully from Firestore:", JSON.stringify(validatedData, null, 2));
      return { success: true, data: validatedData };
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
