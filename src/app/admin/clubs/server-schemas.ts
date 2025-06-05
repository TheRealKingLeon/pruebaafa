// NO 'use client'
import { z } from 'zod';

// Base schema for club data, used only for server-side validation in actions.
const baseClubSchemaServer = z.object({
  name: z.string().min(3, { message: "El nombre del club debe tener al menos 3 caracteres." }),
  logoUrl: z.string().url({ message: "Debe ingresar una URL válida para el logo." }),
});

// Schema specifically for adding a club in server actions
export const addClubSchemaForServer = baseClubSchemaServer;
export type AddClubFormInputForServer = z.infer<typeof addClubSchemaForServer>;
