
'use client';

import { useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CardDescription } from '@/components/ui/card'; // Replaced unused Card components
import { Save } from 'lucide-react';
import type { Match, Team } from '@/types';
import { updateMatchAction } from '@/app/admin/matches/actions';
import { matchFormSchema, type EditMatchFormInput } from '@/app/admin/matches/schemas';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

interface EditMatchDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  match: Match | null;
  allTeams: Team[];
  onMatchUpdate: () => void;
}

export function EditMatchDialog({ isOpen, onOpenChange, match, allTeams, onMatchUpdate }: EditMatchDialogProps) {
  const { toast } = useToast();
  const form = useForm<EditMatchFormInput>({
    resolver: zodResolver(matchFormSchema),
  });
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch, control } = form;

  useEffect(() => {
    if (match) {
      const localDateTime = match.date ? format(new Date(match.date), "yyyy-MM-dd'T'HH:mm") : "";
      reset({
        id: match.id,
        team1Id: match.team1Id || '',
        team2Id: match.team2Id || '',
        score1: match.score1 ?? undefined,
        score2: match.score2 ?? undefined,
        date: localDateTime,
        status: match.status,
        streamUrl: match.streamUrl || '',
      });
    } else {
      // Reset to default or empty if no match is provided (e.g., when dialog closes)
      reset({
        id: '',
        team1Id: '',
        team2Id: '',
        score1: undefined,
        score2: undefined,
        date: '',
        status: 'pending_date',
        streamUrl: '',
      });
    }
  }, [match, reset]);

  const onSubmit: SubmitHandler<EditMatchFormInput> = async (data) => {
    if (!match) return; // Should not happen if dialog is open with a match

    const result = await updateMatchAction(data);
    if (result.success) {
      toast({
        title: "Partido Actualizado",
        description: result.message,
      });
      onMatchUpdate(); // Callback to refresh the list in the parent page
      onOpenChange(false); // Close the dialog
    } else {
      toast({
        title: "Error al Actualizar",
        description: result.message || "No se pudo actualizar el partido.",
        variant: "destructive",
      });
    }
  };

  if (!match) {
    return null; // Don't render anything if there's no match to edit
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Partido: {match.team1?.name || 'Equipo 1'} vs {match.team2?.name || 'Equipo 2'}</DialogTitle>
          <CardDescription>Modifica la información del partido. Los cambios se guardarán en Firestore.</CardDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
            <Input type="hidden" {...register("id")} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="team1Id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipo 1</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className={errors.team1Id ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Selecciona Equipo 1" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allTeams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="team2Id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipo 2</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className={errors.team2Id ? 'border-destructive' : ''}>
                          <SelectValue placeholder="Selecciona Equipo 2" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allTeams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {errors.team2Id && errors.team2Id.type === 'custom' && <p className="text-sm text-destructive">{errors.team2Id.message}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel htmlFor="score1">Resultado Equipo 1</FormLabel>
                <Input
                  id="score1"
                  type="number"
                  {...register("score1")}
                  className={errors.score1 ? 'border-destructive' : ''}
                  disabled={watch("status") !== 'completed'}
                />
                {errors.score1 && <p className="text-sm text-destructive">{errors.score1.message}</p>}
              </FormItem>

              <FormItem>
                <FormLabel htmlFor="score2">Resultado Equipo 2</FormLabel>
                <Input
                  id="score2"
                  type="number"
                  {...register("score2")}
                  className={errors.score2 ? 'border-destructive' : ''}
                  disabled={watch("status") !== 'completed'}
                />
                {errors.score2 && <p className="text-sm text-destructive">{errors.score2.message}</p>}
              </FormItem>
            </div>

            <FormItem>
              <FormLabel htmlFor="date">Fecha y Hora</FormLabel>
              <Input
                id="date"
                type="datetime-local"
                {...register("date")}
                className={errors.date ? 'border-destructive' : ''}
              />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </FormItem>

            <FormField
              control={control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      const newStatus = value as 'upcoming' | 'live' | 'completed' | 'pending_date';
                      if (newStatus !== 'completed') {
                        setValue("score1", null);
                        setValue("score2", null);
                      }
                    }}
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className={errors.status ? 'border-destructive' : ''}>
                        <SelectValue placeholder="Selecciona un estado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending_date">Fecha Pendiente</SelectItem>
                      <SelectItem value="upcoming">Próximo</SelectItem>
                      <SelectItem value="live">En Vivo</SelectItem>
                      <SelectItem value="completed">Finalizado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormItem>
              <FormLabel htmlFor="streamUrl">URL del Stream (Opcional)</FormLabel>
              <Input
                id="streamUrl"
                type="url"
                {...register("streamUrl")}
                placeholder="https://twitch.tv/canal_ejemplo"
                className={errors.streamUrl ? 'border-destructive' : ''}
              />
              {errors.streamUrl && <p className="text-sm text-destructive">{errors.streamUrl.message}</p>}
            </FormItem>

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="mr-2 h-5 w-5" />
                {isSubmitting ? "Guardando Cambios..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
