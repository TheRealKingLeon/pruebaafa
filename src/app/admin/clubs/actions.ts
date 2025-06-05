
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDoc, deleteDoc } from 'firebase/firestore';
import type { Team } from '@/types';
import type { AddClubFormInput, EditClubFormInput } from './schemas';

// Add Club Action
export async function addClubAction(data: AddClubFormInput) {
  console.log("[Server Action] addClubAction called with data:", JSON.stringify(data));
  try {
    // Basic check for Firestore instance (heuristic)
    if (!db || typeof db.INTERNAL === 'undefined') { 
      console.error("[Server Action] Firestore db instance is not properly initialized.");
      return { success: false, message: "Error de configuración: la base de datos no está inicializada." };
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
    let errorMessage = "Ocurrió un error desconocido.";
    if (error instanceof Error) {
      errorMessage = error.message;
      if ('code' in error) { // Check if it's a FirebaseError or similar
        console.error("[Server Action] Firebase error code:", (error as any).code);
        // Potentially customize errorMessage based on (error as any).code
      }
    }
    return { success: false, message: `Error al añadir el club: ${errorMessage}` };
  }
}

// Update Club Action
export async function updateClubAction(data: EditClubFormInput) {
  console.log("[Server Action] updateClubAction called with data:", JSON.stringify(data));
  const clubId = data.id;
  if (!clubId) {
    return { success: false, message: "ID del club no proporcionado." };
  }

  try {
    const clubRef = doc(db, "equipos", clubId);
    // Prepare data for Firestore update, excluding the id field itself
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
    let errorMessage = "Ocurrió un error desconocido.";
    if (error instanceof Error) {
      errorMessage = error.message;
      if ('code' in error) {
        console.error("[Server Action] Firebase error code:", (error as any).code);
      }
    }
    return { success: false, message: `Error al actualizar el club: ${errorMessage}` };
  }
}

// Delete Club Action
export async function deleteClubAction(clubId: string) {
  console.log("[Server Action] deleteClubAction called for club ID:", clubId);
  if (!clubId) {
    return { success: false, message: "ID del club no proporcionado para eliminar." };
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
    let errorMessage = "Ocurrió un error desconocido.";
    if (error instanceof Error) {
      errorMessage = error.message;
      if ('code' in error) {
        console.error("[Server Action] Firebase error code:", (error as any).code);
      }
    }
    return { success: false, message: `Error al eliminar el club: ${errorMessage}` };
  }
}
