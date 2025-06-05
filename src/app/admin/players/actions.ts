
'use server';

import { db } from '@/lib/firebase';
import { collection, addDoc, updateDoc, getDocs, query, where, doc, serverTimestamp } from 'firebase/firestore';
import type { UpdatePlayerFormInput } from './schemas'; // Assumes schemas.ts is in the same directory
import type { Player } from '@/types';


export async function updatePlayerAction(data: UpdatePlayerFormInput) {
  try {
    const playersRef = collection(db, "jugadores");
    const q = query(playersRef, where("clubId", "==", data.clubId));
    const querySnapshot = await getDocs(q);

    const playerData = {
      name: data.name,
      gamerTag: data.gamerTag,
      imageUrl: data.imageUrl,
      bio: data.bio,
      clubId: data.clubId,
      updatedAt: serverTimestamp(),
    };

    if (querySnapshot.empty) {
      // No player found for this club, create a new one
      const newPlayerData = {
        ...playerData,
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(playersRef, newPlayerData);
      console.log(`Nuevo jugador añadido para el club ${data.clubId} con ID: ${docRef.id}`);
      return { 
        success: true, 
        message: `Jugador "${data.name}" añadido para el club ${data.clubId} (ID: ${docRef.id}).` 
      };
    } else {
      // Player found, update existing one
      const playerDocId = querySnapshot.docs[0].id;
      const playerDocRef = doc(db, "jugadores", playerDocId);
      await updateDoc(playerDocRef, playerData);
      console.log(`Jugador con ID ${playerDocId} para el club ${data.clubId} actualizado.`);
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
