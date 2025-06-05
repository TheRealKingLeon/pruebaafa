
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDoc, deleteDoc } from 'firebase/firestore';
import type { Team } from '@/types';
import type { AddClubFormInput, EditClubFormInput } from './schemas';

// Add Club Action
export async function addClubAction(data: AddClubFormInput) {
  try {
    const clubData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "equipos"), clubData);
    console.log("Club añadido a Firestore con ID: ", docRef.id);
    
    const newClub = {
      id: docRef.id,
      ...data,
    } as Team;

    return { success: true, message: `Club "${data.name}" añadido con ID: ${docRef.id}.`, club: newClub };
  } catch (error) {
    console.error("Error añadiendo club a Firestore: ", error);
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
    return { success: false, message: `Error al añadir el club: ${errorMessage}` };
  }
}

// Update Club Action
export async function updateClubAction(data: EditClubFormInput) {
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
    await updateDoc(clubRef, updatePayload);
    console.log(`Club con ID ${clubId} actualizado en Firestore.`);
    return { success: true, message: `Club "${data.name}" (ID: ${clubId}) actualizado.` };
  } catch (error) {
    console.error("Error actualizando club en Firestore: ", error);
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
    return { success: false, message: `Error al actualizar el club: ${errorMessage}` };
  }
}

// Delete Club Action
export async function deleteClubAction(clubId: string) {
  if (!clubId) {
    return { success: false, message: "ID del club no proporcionado para eliminar." };
  }
  try {
    const clubRef = doc(db, "equipos", clubId);
    const clubSnap = await getDoc(clubRef);

    if (!clubSnap.exists()) {
      return { success: false, message: `Club con ID ${clubId} no encontrado.` };
    }
    
    // TODO: Consider deleting associated player from "jugadores" collection
    // For now, we only delete the club.
    // Example:
    // const playerQuery = query(collection(db, "jugadores"), where("clubId", "==", clubId));
    // const playerDocs = await getDocs(playerQuery);
    // playerDocs.forEach(async (playerDoc) => {
    //   await deleteDoc(doc(db, "jugadores", playerDoc.id));
    //   console.log(`Jugador asociado ${playerDoc.id} eliminado.`);
    // });

    await deleteDoc(clubRef);
    console.log(`Club con ID ${clubId} eliminado de Firestore.`);
    return { success: true, message: `Club con ID ${clubId} eliminado.` };
  } catch (error) {
    console.error("Error eliminando club de Firestore: ", error);
    const errorMessage = error instanceof Error ? error.message : "Ocurrió un error desconocido.";
    return { success: false, message: `Error al eliminar el club: ${errorMessage}` };
  }
}
