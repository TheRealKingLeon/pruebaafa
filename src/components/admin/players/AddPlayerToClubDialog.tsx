
'use client';

import { useEffect } from 'react';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Loader2 } from 'lucide-react';
import type { Team } from '@/types';
import { playerFormSchema, type PlayerFormData, type UpdatePlayerFormInput } from '@/app/admin/players/schemas';
import { updatePlayerAction } from '@/app/admin/players/actions';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

interface AddPlayerToClubDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  allTeams: Team[];
  onPlayerAddSuccess: () => void;
}

// Schema for the form within this dialog (player data + clubId)
const addPlayerToClubFormSchema = playerFormSchema.extend({
  clubId: z.string().min(1, { message: "Debes seleccionar un club." }),
});
type AddPlayerToClubFormValues = z.infer<typeof addPlayerToClubFormSchema>;


export function AddPlayerToClubDialog({ isOpen, onOpenChange, allTeams, onPlayerAddSuccess }: AddPlayerToClubDialogProps) {
  const { toast } = useToast();
  const form = useForm<AddPlayerToClubFormValues>({
    resolver: zodResolver(addPlayerToClubFormSchema),
    defaultValues: {
      name: '',
      gamerTag: '',
      imageUrl: 'https://placehold.co/300x400.png', // Default placeholder
      bio: '',
      favoriteFormation: '',
      clubId: '',
    },
  });

  const { handleSubmit, control, formState: { errors, isSubmitting }, reset } = form;

  useEffect(() => {
    if (!isOpen) {
      reset(); // Reset form when dialog is closed
    }
  }, [isOpen, reset]);

  const onSubmit: SubmitHandler<AddPlayerToClubFormValues> = async (data) => {
    // The data directly matches UpdatePlayerFormInput as clubId is included
    const result = await updatePlayerAction(data as UpdatePlayerFormInput);
    if (result.success) {
      toast({
        title: "Jugador Guardado",
        description: result.message,
      });
      onPlayerAddSuccess();
      onOpenChange(false); // Close dialog
    } else {
      toast({
        title: "Error al Guardar",
        description: result.message || "No se pudo guardar el jugador.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Jugador a un Club</DialogTitle>
          <DialogDescription>
            Completa los detalles del jugador y selecciona el club al que pertenecerá.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4 flex-grow overflow-y-auto pr-2">
            <FormField
              control={control}
              name="clubId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Club *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger className={errors.clubId ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Selecciona un club" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allTeams.length > 0 ? allTeams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name}
                        </SelectItem>
                      )) : <SelectItem value="no-teams" disabled>No hay clubes disponibles</SelectItem>}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Jugador *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Lionel Messi" {...field} className={errors.name ? 'border-destructive' : ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="gamerTag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>GamerTag (Nickname FC25) *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: LaPulga10" {...field} className={errors.gamerTag ? 'border-destructive' : ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL de Imagen del Jugador *</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://ejemplo.com/imagen.png" {...field} className={errors.imageUrl ? 'border-destructive' : ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={control}
              name="favoriteFormation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Formación Favorita (Ej: 4-3-3)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 4-3-3 (Defensiva)" {...field} className={errors.favoriteFormation ? 'border-destructive' : ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biografía *</FormLabel>
                  <FormControl>
                    <Textarea rows={4} placeholder="Breve descripción del jugador..." {...field} className={`resize-none ${errors.bio ? 'border-destructive' : ''}`} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4 border-t mt-auto">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                {isSubmitting ? "Guardando..." : "Guardar Jugador"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
