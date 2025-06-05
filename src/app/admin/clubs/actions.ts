
'use server';

import { db, getFirebaseDebugInfo } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import type { Team } from '@/types';
import { addClubSchema, type AddClubFormInput, type EditClubFormInput } from './schemas';
import { z } from 'zod';

// Helper function to check for duplicate club name (case-insensitive)
async function isClubNameDuplicate(name: string, excludeClubId?: string): Promise<boolean> {
  const normalizedName = name.trim().toLowerCase();
  const equiposRef = collection(db, "equipos");
  const querySnapshot = await getDocs(equiposRef);
  
  for (const document of querySnapshot.docs) {
    const clubData = document.data();
    if (clubData.name && clubData.name.trim().toLowerCase() === normalizedName) {
      if (excludeClubId && document.id === excludeClubId) {
        continue; // Skip self when updating
      }
      return true; // Found a duplicate
    }
  }
  return false; // No duplicate found
}

// Add Club Action
export async function addClubAction(data: AddClubFormInput) {
  console.log("[Server Action] addClubAction called with data:", JSON.stringify(data));
  
  const debugInfo = getFirebaseDebugInfo();

  if (!debugInfo.isDbInitialized || !db) {
    console.error("[Server Action] Firestore db instance is not properly initialized. Debug info:", JSON.stringify(debugInfo, null, 2));
    return { 
      success: false, 
      message: `Error de configuración: la base de datos no está inicializada. \nDebug Info: ${JSON.stringify({ error: debugInfo.error, configUsed: debugInfo.configUsed, envKeys: debugInfo.envKeys }, null, 2)}` 
    };
  }

  try {
    // Check for duplicate name before adding
    if (await isClubNameDuplicate(data.name)) {
      console.warn(`[Server Action] Attempt to add club with duplicate name: "${data.name}"`);
      return { success: false, message: `Ya existe un club con el nombre "${data.name}". Por favor, elige un nombre diferente.` };
    }

    const clubData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    console.log("[Server Action] Attempting to add document to 'equipos' with data:", JSON.stringify(clubData));
    const docRef = await addDoc(collection(db, "equipos"), clubData);
    console.log("[Server Action] Club añadido a Firestore con ID: ", docRef.id);
    
    const newClub = {
      id: docRef.id,
      ...data, // name, logoUrl
    } as Team;

    return { success: true, message: `Club "${data.name}" añadido con ID: ${docRef.id}.`, club: newClub };
  } catch (error) {
    console.error("[Server Action] Error añadiendo club a Firestore: ", error);
    let errorMessage = "Ocurrió un error desconocido al añadir el club.";
    if (error instanceof Error) {
      errorMessage = error.message;
      if ('code' in error) { 
        console.error("[Server Action] Firebase error code:", (error as any).code);
      }
    }
    return { success: false, message: `Error al añadir el club: ${errorMessage}. \nDebug Info: ${JSON.stringify({ error: debugInfo.error, configUsed: debugInfo.configUsed, envKeys: debugInfo.envKeys }, null, 2)}` };
  }
}

// Update Club Action
export async function updateClubAction(data: EditClubFormInput) {
  console.log("[Server Action] updateClubAction called with data:", JSON.stringify(data));
  const clubId = data.id;
  if (!clubId) {
    return { success: false, message: "ID del club no proporcionado." };
  }

  const debugInfo = getFirebaseDebugInfo();
  if (!debugInfo.isDbInitialized || !db) {
    console.error("[Server Action] Firestore db instance is not properly initialized for update. Debug info:", JSON.stringify(debugInfo, null, 2));
    return { 
      success: false, 
      message: `Error de configuración (update): la base de datos no está inicializada. \nDebug Info: ${JSON.stringify({ error: debugInfo.error, configUsed: debugInfo.configUsed, envKeys: debugInfo.envKeys }, null, 2)}`
    };
  }

  try {
    // Check for duplicate name before updating, excluding the current club
    if (await isClubNameDuplicate(data.name, clubId)) {
      console.warn(`[Server Action] Attempt to update club ID ${clubId} with duplicate name: "${data.name}"`);
      return { success: false, message: `Ya existe otro club con el nombre "${data.name}". Por favor, elige un nombre diferente.` };
    }

    const clubRef = doc(db, "equipos", clubId);
    const { id, ...updateDataWithoutId } = data;
    const updatePayload = {
      ...updateDataWithoutId,
      updatedAt: serverTimestamp(),
    };
    console.log("[Server Action] Attempting to update document ID", clubId, "in 'equipos' with payload:", JSON.stringify(updatePayload));
    await updateDoc(clubRef, updatePayload);
    console.log(`[Server Action] Club con ID ${clubId} actualizado en Firestore.`);
    return { success: true, message: `Club "${data.name}" (ID: ${clubId}) actualizado.` };
  } catch (error) {
    console.error("[Server Action] Error actualizando club en Firestore: ", error);
    let errorMessage = "Ocurrió un error desconocido al actualizar el club.";
    if (error instanceof Error) {
      errorMessage = error.message;
      if ('code' in error) {
        console.error("[Server Action] Firebase error code:", (error as any).code);
      }
    }
    return { success: false, message: `Error al actualizar el club: ${errorMessage}. \nDebug Info: ${JSON.stringify({ error: debugInfo.error, configUsed: debugInfo.configUsed, envKeys: debugInfo.envKeys }, null, 2)}` };
  }
}

// Delete Club Action
export async function deleteClubAction(clubId: string) {
  console.log("[Server Action] deleteClubAction called for club ID:", clubId);
  if (!clubId) {
    return { success: false, message: "ID del club no proporcionado para eliminar." };
  }

  const debugInfo = getFirebaseDebugInfo();
  if (!debugInfo.isDbInitialized || !db) {
    console.error("[Server Action] Firestore db instance is not properly initialized for delete. Debug info:", JSON.stringify(debugInfo, null, 2));
    return { 
      success: false, 
      message: `Error de configuración (delete): la base de datos no está inicializada. \nDebug Info: ${JSON.stringify({ error: debugInfo.error, configUsed: debugInfo.configUsed, envKeys: debugInfo.envKeys }, null, 2)}`
    };
  }

  try {
    const clubRef = doc(db, "equipos", clubId);
    const clubSnap = await getDoc(clubRef);

    if (!clubSnap.exists()) {
      console.warn(`[Server Action] Club con ID ${clubId} no encontrado para eliminar.`);
      return { success: false, message: `Club con ID ${clubId} no encontrado.` };
    }
    
    console.log(`[Server Action] Attempting to delete document ID ${clubId} from 'equipos'.`);
    await deleteDoc(clubRef);
    console.log(`[Server Action] Club con ID ${clubId} eliminado de Firestore.`);
    return { success: true, message: `Club con ID ${clubId} eliminado.` };
  } catch (error) {
    console.error("[Server Action] Error eliminando club de Firestore: ", error);
    let errorMessage = "Ocurrió un error desconocido al eliminar el club.";
    if (error instanceof Error) {
      errorMessage = error.message;
      if ('code' in error) {
        console.error("[Server Action] Firebase error code:", (error as any).code);
      }
    }
    return { success: false, message: `Error al eliminar el club: ${errorMessage}. \nDebug Info: ${JSON.stringify({ error: debugInfo.error, configUsed: debugInfo.configUsed, envKeys: debugInfo.envKeys }, null, 2)}` };
  }
}

// Type for CSV import data
export interface ClubImportData {
  name: string;
  logoUrl: string;
}

export interface ImportClubResultDetail {
  lineNumber: number;
  clubName?: string;
  status: 'imported' | 'skipped' | 'error';
  reason?: string;
}

export interface ImportClubsResult {
  success: boolean;
  message: string;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  details: ImportClubResultDetail[];
}

// Action to import clubs from CSV data
export async function importClubsAction(clubsToImport: ClubImportData[]): Promise<ImportClubsResult> {
  console.log("[Server Action] importClubsAction called with", clubsToImport.length, "clubs.");
  const debugInfo = getFirebaseDebugInfo();
  if (!debugInfo.isDbInitialized || !db) {
    return {
      success: false,
      message: `Error de configuración: la base de datos no está inicializada. \nDebug Info: ${JSON.stringify({ error: debugInfo.error, configUsed: debugInfo.configUsed, envKeys: debugInfo.envKeys }, null, 2)}`,
      importedCount: 0,
      skippedCount: clubsToImport.length,
      errorCount: 0,
      details: clubsToImport.map((club, index) => ({
        lineNumber: index + 1,
        clubName: club.name,
        status: 'skipped',
        reason: 'Error de configuración de base de datos.',
      })),
    };
  }

  let importedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const details: ImportClubResultDetail[] = [];

  // Firestore allows a maximum of 500 writes in a single batch.
  // Process in chunks if necessary, though for typical CSVs, this might be fine.
  // For extreme simplicity here, not batching writes yet. Could be a future enhancement.

  for (let i = 0; i < clubsToImport.length; i++) {
    const clubData = clubsToImport[i];
    const lineNumber = i + 1;

    // Validate using Zod schema for individual club data
    const validationResult = addClubSchema.safeParse(clubData);
    if (!validationResult.success) {
      errorCount++;
      skippedCount++;
      details.push({
        lineNumber,
        clubName: clubData.name || 'Nombre no proporcionado',
        status: 'error',
        reason: `Datos inválidos: ${validationResult.error.errors.map(e => e.message).join(', ')}`,
      });
      continue;
    }

    const validatedData = validationResult.data;

    try {
      if (await isClubNameDuplicate(validatedData.name)) {
        skippedCount++;
        details.push({
          lineNumber,
          clubName: validatedData.name,
          status: 'skipped',
          reason: `El club "${validatedData.name}" ya existe.`,
        });
        continue;
      }

      const newClubDoc = {
        ...validatedData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await addDoc(collection(db, "equipos"), newClubDoc);
      importedCount++;
      details.push({
        lineNumber,
        clubName: validatedData.name,
        status: 'imported',
      });
    } catch (error) {
      errorCount++;
      skippedCount++;
      let errorMessage = "Error desconocido al añadir el club a Firestore.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      details.push({
        lineNumber,
        clubName: validatedData.name,
        status: 'error',
        reason: errorMessage,
      });
      console.error(`[Server Action] Error adding club "${validatedData.name}" from CSV:`, error);
    }
  }

  const overallSuccess = importedCount > 0;
  let message = `${importedCount} clubes importados.`;
  if (skippedCount > 0) message += ` ${skippedCount} omitidos.`;
  if (errorCount > 0 && skippedCount === 0) message += ` ${errorCount} con errores.`;
  else if (errorCount > 0 && skippedCount > 0) message = `${importedCount} clubes importados, ${skippedCount} omitidos (incluyendo ${errorCount} con errores de importación).`;


  console.log("[Server Action] importClubsAction finished. Result:", { importedCount, skippedCount, errorCount });
  return {
    success: overallSuccess,
    message,
    importedCount,
    skippedCount,
    errorCount,
    details,
  };
}
