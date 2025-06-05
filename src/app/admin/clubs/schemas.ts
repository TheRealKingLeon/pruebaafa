'use client'; // Schemas might be used in client components for form validation

import { z } from 'zod';

// Base schema for club data, ID is optional because it's not present when adding a new club.
// This version is for client-side forms.
export const clubFormSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, { message: "El nombre del club debe tener al menos 3 caracteres." }),
  logoUrl: z.string().url({ message: "Debe ingresar una URL válida para el logo." }),
});

// Schema for adding a club (client-side form validation)
// Used by AddClubPage client component
export const addClubSchema = clubFormSchema.omit({ id: true });
export type AddClubFormInput = z.infer<typeof addClubSchema>;

// Schema for editing a club (client-side form validation)
// Used by EditClubPage client component
export const editClubSchema = clubFormSchema.extend({
  id: z.string().min(1, { message: "ID del club es requerido para editar." }),
});
export type EditClubFormInput = z.infer<typeof editClubSchema>;
