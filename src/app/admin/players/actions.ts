
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, getDocs, query, where, doc, serverTimestamp, writeBatch, deleteDoc } from 'firebase/firestore';
import type { UpdatePlayerFormInput } from './schemas';
import type { Player, Team } from '@/types';
import { z } from 'zod';

// Schema for CSV player import (server-side validation)
const playerImportSchema = z.object({
  clubId: z.string().min(1, "Club ID es requerido."),
  name: z.string().min(3, "Nombre del jugador debe tener al menos 3 caracteres."),
  gamerTag: z.string().min(2, "GamerTag debe tener al menos 2 caracteres."),
  imageUrl: z.string().url("URL de imagen inválida."),
  bio: z.string().min(10, "Biografía debe tener al menos 10 caracteres.").max(500, "Biografía no puede exceder 500 caracteres."),
  favoriteFormation: z.string().optional(),
});
export type PlayerImportData = z.infer<typeof playerImportSchema>;

export interface ImportPlayerResultDetail {
  lineNumber: number;
  playerName?: string;
  clubId?: string;
  status: 'imported' | 'updated' | 'error' | 'skipped';
  reason?: string;
}

export interface ImportPlayersResult {
  success: boolean;
  message: string;
  importedCount: number;
  updatedCount: number;
  skippedCount: number;
  errorCount: number;
  details: ImportPlayerResultDetail[];
}


export async function updatePlayerAction(data: UpdatePlayerFormInput) {
  try {
    const playersRef = collection(db, "jugadores");
    const q = query(playersRef, where("clubId", "==", data.clubId));
    const querySnapshot = await getDocs(q);

    const playerData: Partial<Player> = {
      name: data.name,
      gamerTag: data.gamerTag,
      imageUrl: data.imageUrl,
      bio: data.bio,
      clubId: data.clubId,
      updatedAt: serverTimestamp(),
    };

    if (data.favoriteFormation && data.favoriteFormation.trim() !== '') {
      playerData.favoriteFormation = data.favoriteFormation.trim();
    } else {
      playerData.favoriteFormation = undefined; // Or use deleteField() if explicitly removing
    }

    if (querySnapshot.empty) {
      const newPlayerData = {
        ...playerData,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(playersRef, newPlayerData);
      return {
        success: true,
        message: `Jugador "${data.name}" añadido para el club ${data.clubId} (ID: ${docRef.id}).`
      };
    } else {
      const playerDocId = querySnapshot.docs[0].id;
      const playerDocRef = doc(db, "jugadores", playerDocId);
      await updateDoc(playerDocRef, playerData);
      return {
        success: true,
        message: `Jugador "${data.name}" para el club ${data.clubId} actualizado.`
      };
    }
  } catch (error) {
    console.error("Error actualizando/añadiendo jugador en Firestore: ", error);
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
    return { success: false, message: `Error al procesar el jugador: ${errorMessage}` };
  }
}

export async function deleteAllPlayersAction(): Promise<{ success: boolean; message: string; deletedCount?: number }> {
  if (!db) {
    return { success: false, message: "Error de configuración: la base de datos no está inicializada." };
  }
  try {
    const playersRef = collection(db, "jugadores");
    const querySnapshot = await getDocs(playersRef);

    if (querySnapshot.empty) {
      return { success: true, message: "No hay jugadores para eliminar.", deletedCount: 0 };
    }

    const batch = writeBatch(db);
    querySnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    const deletedCount = querySnapshot.size;
    return { success: true, message: `Todos los ${deletedCount} jugadores han sido eliminados.`, deletedCount };
  } catch (error) {
    console.error("Error eliminando todos los jugadores de Firestore: ", error);
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido al eliminar todos los jugadores.";
    return { success: false, message: `Error al eliminar todos los jugadores: ${errorMessage}.` };
  }
}

export async function importPlayersAction(playersToImport: PlayerImportData[]): Promise<ImportPlayersResult> {
  if (!db) {
    return {
      success: false,
      message: "Error de configuración: la base de datos no está inicializada.",
      importedCount: 0, updatedCount: 0, skippedCount: playersToImport.length, errorCount: 0,
      details: playersToImport.map((player, index) => ({
        lineNumber: index + 1, playerName: player.name, clubId: player.clubId, status: 'skipped', reason: 'Error de base de datos.',
      })),
    };
  }

  let importedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;
  const details: ImportPlayerResultDetail[] = [];

  for (let i = 0; i < playersToImport.length; i++) {
    const playerDataFromCsv = playersToImport[i];
    const lineNumber = i + 1;

    try {
      // Validate player data
      const validationResult = playerImportSchema.safeParse(playerDataFromCsv);
      if (!validationResult.success) {
        errorCount++;
        const errorMessages = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
        details.push({ lineNumber, playerName: playerDataFromCsv.name, clubId: playerDataFromCsv.clubId, status: 'error', reason: `Datos inválidos: ${errorMessages}` });
        continue;
      }
      const validatedPlayerData = validationResult.data;

      // Check if clubId exists
      const clubRef = doc(db, "equipos", validatedPlayerData.clubId);
      const clubSnap = await getDoc(clubRef);
      if (!clubSnap.exists()) {
        skippedCount++;
        details.push({ lineNumber, playerName: validatedPlayerData.name, clubId: validatedPlayerData.clubId, status: 'skipped', reason: `Club ID "${validatedPlayerData.clubId}" no encontrado.` });
        continue;
      }

      // Prepare player data for Firestore
      const firestorePlayerData: Partial<Player> & {clubId: string} = {
        clubId: validatedPlayerData.clubId,
        name: validatedPlayerData.name,
        gamerTag: validatedPlayerData.gamerTag,
        imageUrl: validatedPlayerData.imageUrl,
        bio: validatedPlayerData.bio,
        updatedAt: serverTimestamp(),
      };
      if (validatedPlayerData.favoriteFormation && validatedPlayerData.favoriteFormation.trim() !== '') {
        firestorePlayerData.favoriteFormation = validatedPlayerData.favoriteFormation.trim();
      } else {
        firestorePlayerData.favoriteFormation = undefined;
      }

      // Check if player already exists for this clubId
      const playersRef = collection(db, "jugadores");
      const q = query(playersRef, where("clubId", "==", validatedPlayerData.clubId));
      const playerSnapshot = await getDocs(q);

      if (playerSnapshot.empty) {
        // Add new player
        firestorePlayerData.createdAt = serverTimestamp();
        await addDoc(playersRef, firestorePlayerData);
        importedCount++;
        details.push({ lineNumber, playerName: validatedPlayerData.name, clubId: validatedPlayerData.clubId, status: 'imported' });
      } else {
        // Update existing player
        const playerDocId = playerSnapshot.docs[0].id;
        const playerDocRef = doc(db, "jugadores", playerDocId);
        await updateDoc(playerDocRef, firestorePlayerData);
        updatedCount++;
        details.push({ lineNumber, playerName: validatedPlayerData.name, clubId: validatedPlayerData.clubId, status: 'updated' });
      }

    } catch (error) {
      errorCount++;
      const specificErrorReason = error instanceof Error ? error.message : "Error desconocido durante el procesamiento.";
      details.push({ lineNumber, playerName: playerDataFromCsv.name, clubId: playerDataFromCsv.clubId, status: 'error', reason: specificErrorReason });
      console.error(`[Server Action] Error processing player "${playerDataFromCsv.name}" (Line ${lineNumber}):`, error);
    }
  }

  const overallSuccess = (importedCount > 0 || updatedCount > 0) && errorCount === 0;
  let message = `${importedCount} jugadores importados, ${updatedCount} actualizados.`;
  if (skippedCount > 0) message += ` ${skippedCount} omitidos.`;
  if (errorCount > 0) message += ` ${errorCount} con errores.`;

  return {
    success: overallSuccess,
    message,
    importedCount,
    updatedCount,
    skippedCount,
    errorCount,
    details,
  };
}
    