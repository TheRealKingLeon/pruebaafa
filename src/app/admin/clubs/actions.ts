
'use server';

import { z } from 'zod';

// Base schema for club data, ID is optional because it's not present when adding a new club.
export const clubFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: "El nombre del club debe tener al menos 3 caracteres." }),
  logoUrl: z.string().url({ message: "Debe ingresar una URL válida para el logo." }),
});

// Schema for adding a club (ID is not part of the input form, it's generated)
export const addClubSchema = clubFormSchema.omit({ id: true });
export type AddClubFormInput = z.infer<typeof addClubSchema>;

// Schema for editing a club (ID is required to know which club to update)
export const editClubSchema = clubFormSchema.extend({
  id: z.string().min(1, { message: "ID del club es requerido para editar." }),
});
export type EditClubFormInput = z.infer<typeof editClubSchema>;


// Add Club Action
export async function addClubAction(data: AddClubFormInput) {
  console.log("Nuevo club a añadir (simulado):", data);
  // En una aplicación real, aquí se interactuaría con la base de datos para guardar el club.
  // Por ejemplo: await db.clubs.create({ data });
  // Para este prototipo, solo mostramos un mensaje.
  const newClubId = `club-${Math.random().toString(36).substr(2, 5)}`;
  return { success: true, message: `Club "${data.name}" añadido (simulación).`, club: {...data, id: newClubId} };
}

// Update Club Action
export async function updateClubAction(data: EditClubFormInput) {
  // ID is guaranteed by editClubSchema
  console.log("Club a actualizar (simulado):", data);
  // En una aplicación real, aquí se interactuaría con la base de datos para actualizar el club.
  // Por ejemplo: await db.clubs.update({ where: { id: data.id }, data: { name: data.name, logoUrl: data.logoUrl } });
  // Para este prototipo, solo mostramos un mensaje.
  return { success: true, message: `Club "${data.name}" (ID: ${data.id}) actualizado (simulación).` };
}
