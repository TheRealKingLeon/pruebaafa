import { z } from 'zod';

// Schema for the player details themselves
export const playerFormSchema = z.object({
  name: z.string().min(3, { message: "El nombre del jugador debe tener al menos 3 caracteres." }),
  gamerTag: z.string().min(2, { message: "El GamerTag debe tener al menos 2 caracteres." }),
  imageUrl: z.string().url({ message: "Debe ingresar una URL válida para la imagen." }),
  bio: z.string().min(10, { message: "La biografía debe tener al menos 10 caracteres." }).max(500, { message: "La biografía no puede exceder los 500 caracteres." }),
});
export type PlayerFormData = z.infer<typeof playerFormSchema>;

// Schema for updating a player, requires clubId to identify which player
export const updatePlayerSchema = playerFormSchema.extend({
  clubId: z.string().min(1, { message: "ID del club es requerido para actualizar el jugador." }),
});
export type UpdatePlayerFormInput = z.infer<typeof updatePlayerSchema>;