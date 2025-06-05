
'use server';

import { db, getFirebaseDebugInfo } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDoc, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import type { Team } from '@/types';
// Import client-facing types if other actions in this file need them
import { type EditClubFormInput } from './schemas'; 
// Import server-specific schema and type for addClubAction and importClubsAction
import { addClubSchemaForServer, type AddClubFormInputForServer } from './server-schemas';
import { z } from 'zod';

// Helper function to check for duplicate club name (case-insensitive)
async function isClubNameDuplicate(name: string, excludeClubId?: string): Promise<boolean> {
  // Re-import db here as a test for Turbopack resolution issues
  const { db: localDb } = await import('@/lib/firebase');
  if (!localDb) {
    console.error("[isClubNameDuplicate] Firestore db instance is not available.");
    // Optionally throw an error or return true to prevent operations
    throw new Error("Database not initialized in isClubNameDuplicate.");
  }
  const normalizedName = name.trim().toLowerCase();
  const equiposRef = collection(localDb, "equipos");
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

// Add Club Action - Uses AddClubFormInputForServer for its data type
export async function addClubAction(data: AddClubFormInputForServer) { // Changed type here
  console.log("[Server Action] addClubAction called with data:", JSON.stringify(data));
  
  const debugInfo = getFirebaseDebugInfo();

  if (!debugInfo.isDbInitialized || !db) {
    console.error("[Server Action] Firestore db instance is not properly initialized. Debug info:", JSON.stringify(debugInfo, null, 2));
    return { 
      success: false, 
      message: `Error de configuración: la base de datos no está inicializada. \nDebug Info: ${JSON.stringify({ error: debugInfo.initializationErrorDetected, configUsed: debugInfo.configUsedAtModuleLoad, runtimeEnvVarStatus: debugInfo.runtimeEnvVarStatus }, null, 2)}` 
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
    } as Team; // Type assertion, ensure Team is compatible

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
    return { success: false, message: `Error al añadir el club: ${errorMessage}. \nDebug Info: ${JSON.stringify({ error: debugInfo.initializationErrorDetected, configUsed: debugInfo.configUsedAtModuleLoad, runtimeEnvVarStatus: debugInfo.runtimeEnvVarStatus }, null, 2)}` };
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
      message: `Error de configuración (update): la base de datos no está inicializada. \nDebug Info: ${JSON.stringify({ error: debugInfo.initializationErrorDetected, configUsed: debugInfo.configUsedAtModuleLoad, runtimeEnvVarStatus: debugInfo.runtimeEnvVarStatus }, null, 2)}`
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
    return { success: false, message: `Error al actualizar el club: ${errorMessage}. \nDebug Info: ${JSON.stringify({ error: debugInfo.initializationErrorDetected, configUsed: debugInfo.configUsedAtModuleLoad, runtimeEnvVarStatus: debugInfo.runtimeEnvVarStatus }, null, 2)}` };
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
      message: `Error de configuración (delete): la base de datos no está inicializada. \nDebug Info: ${JSON.stringify({ error: debugInfo.initializationErrorDetected, configUsed: debugInfo.configUsedAtModuleLoad, runtimeEnvVarStatus: debugInfo.runtimeEnvVarStatus }, null, 2)}`
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
    return { success: false, message: `Error al eliminar el club: ${errorMessage}. \nDebug Info: ${JSON.stringify({ error: debugInfo.initializationErrorDetected, configUsed: debugInfo.configUsedAtModuleLoad, runtimeEnvVarStatus: debugInfo.runtimeEnvVarStatus }, null, 2)}` };
  }
}

// Type for CSV import data (aligns with AddClubFormInputForServer)
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
      message: `Error de configuración: la base de datos no está inicializada. \nDebug Info: ${JSON.stringify({ error: debugInfo.initializationErrorDetected, configUsed: debugInfo.configUsedAtModuleLoad, runtimeEnvVarStatus: debugInfo.runtimeEnvVarStatus }, null, 2)}`,
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

  for (let i = 0; i < clubsToImport.length; i++) {
    const clubData = clubsToImport[i]; 
    const lineNumber = i + 1;
    let validatedDataIfSuccessful: AddClubFormInputForServer | null = null; 

    try {
      // Use the server-specific schema for validation
      const validationResult = addClubSchemaForServer.safeParse(clubData);
      if (!validationResult.success) {
        errorCount++;
        const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.') || 'field'}: ${e.message}`).join('; ');
        details.push({
          lineNumber,
          clubName: clubData.name || 'Nombre no proporcionado',
          status: 'error',
          reason: `Datos inválidos: ${errorMessages}`,
        });
        console.warn(`[Server Action] CSV Import Validation Error line ${lineNumber} (${clubData.name || 'N/A'}): ${errorMessages}`);
        continue; 
      }
      
      validatedDataIfSuccessful = validationResult.data; 

      if (await isClubNameDuplicate(validatedDataIfSuccessful.name)) {
        skippedCount++;
        details.push({
          lineNumber,
          clubName: validatedDataIfSuccessful.name,
          status: 'skipped',
          reason: `El club "${validatedDataIfSuccessful.name}" ya existe.`,
        });
        continue;
      }

      const newClubDoc = {
        ...validatedDataIfSuccessful,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await addDoc(collection(db, "equipos"), newClubDoc);
      importedCount++;
      details.push({
        lineNumber,
        clubName: validatedDataIfSuccessful.name,
        status: 'imported',
      });
    } catch (error) {
      errorCount++;
      let specificErrorReason = "Error desconocido durante el procesamiento en servidor.";
      if (error instanceof TypeError && error.message.includes("is not a function")) {
          // Check if the error message contains the specific problematic import path from the original error
          if (error.message.includes("addClubSchema.safeParse") || error.message.includes("addClubSchemaForServer.safeParse")) {
             specificErrorReason = `Error de Configuración del Servidor: ${error.message}. Revisa el empaquetador (Turbopack) y dependencias.`;
          } else {
             specificErrorReason = `Error de Tipo en Servidor: ${error.message}.`;
          }
      } else if (error instanceof Error) {
          specificErrorReason = error.message;
      } else {
          specificErrorReason = String(error);
      }
      details.push({
        lineNumber,
        clubName: clubData.name || 'Nombre no disponible', 
        status: 'error',
        reason: specificErrorReason,
      });
      console.error(`[Server Action] Error processing club "${clubData.name || 'N/A'}" (Line ${lineNumber}) from CSV:`, error);
    }
  }

  const overallSuccess = importedCount > 0 && errorCount === 0; 
  let message = `${importedCount} clubes importados.`;
  if (skippedCount > 0) message += ` ${skippedCount} omitidos.`;
  if (errorCount > 0) message += ` ${errorCount} con errores.`;

  if (errorCount > 0) {
    if (importedCount > 0 || skippedCount > 0) {
        message = `${importedCount} clubes importados, ${skippedCount} omitidos. Hubo ${errorCount} errores durante el proceso. Revisa los detalles.`;
    } else {
        message = `Proceso finalizado con ${errorCount} errores. Ningún club importado. Revisa los detalles y la consola del servidor.`;
    }
  }


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

// Delete All Clubs Action
export async function deleteAllClubsAction(): Promise<{ success: boolean; message: string; deletedCount?: number }> {
  console.log("[Server Action] deleteAllClubsAction called.");

  const debugInfo = getFirebaseDebugInfo();
  if (!debugInfo.isDbInitialized || !db) {
    console.error("[Server Action] Firestore db instance is not properly initialized for deleteAllClubs. Debug info:", JSON.stringify(debugInfo, null, 2));
    return {
      success: false,
      message: `Error de configuración: la base de datos no está inicializada. \nDebug Info: ${JSON.stringify({ error: debugInfo.initializationErrorDetected, configUsed: debugInfo.configUsedAtModuleLoad, runtimeEnvVarStatus: debugInfo.runtimeEnvVarStatus }, null, 2)}`
    };
  }

  try {
    const equiposRef = collection(db, "equipos");
    const querySnapshot = await getDocs(equiposRef);
    
    if (querySnapshot.empty) {
      return { success: true, message: "No hay clubes para eliminar.", deletedCount: 0 };
    }

    const batch = writeBatch(db);
    querySnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    const deletedCount = querySnapshot.size;
    console.log(`[Server Action] Todos los ${deletedCount} clubes han sido eliminados de Firestore.`);
    return { success: true, message: `Todos los ${deletedCount} clubes han sido eliminados.`, deletedCount };
  } catch (error) {
    console.error("[Server Action] Error eliminando todos los clubes de Firestore: ", error);
    let errorMessage = "Ocurrió un error desconocido al eliminar todos los clubes.";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return { 
        success: false, 
        message: `Error al eliminar todos los clubes: ${errorMessage}. \nDebug Info: ${JSON.stringify({ error: debugInfo.initializationErrorDetected, configUsed: debugInfo.configUsedAtModuleLoad, runtimeEnvVarStatus: debugInfo.runtimeEnvVarStatus }, null, 2)}` 
    };
  }
}
