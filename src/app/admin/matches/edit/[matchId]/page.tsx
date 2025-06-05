
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import type { Match, Team } from '@/types';
import { mockMatches, mockTeams } from '@/data/mock'; // Will be replaced with Firestore actions
import { updateMatchAction } from '../../actions'; 
import { matchFormSchema, type EditMatchFormInput } from '../../schemas'; 
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


export default function EditMatchPage() {
  const router = useRouter();
  const params = useParams();
  const matchId = params.matchId as string;
  const { toast } = useToast();

  const [match, setMatch] = useState<Match | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EditMatchFormInput>({
    resolver: zodResolver(matchFormSchema),
  });
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch, control } = form;

  useEffect(() => {
    if (matchId) {
      setIsLoading(true);
      // TODO: Replace with actual fetch from Firestore: getMatchByIdAction(matchId)
      const foundMatch = mockMatches.find(m => m.id === matchId);
      if (foundMatch) {
        setMatch(foundMatch);
        // Format date for datetime-local input: YYYY-MM-DDTHH:mm
        const localDateTime = foundMatch.date ? format(new Date(foundMatch.date), "yyyy-MM-dd'T'HH:mm") : "";
        reset({
          id: foundMatch.id,
          team1Id: foundMatch.team1.id,
          team2Id: foundMatch.team2.id,
          score1: foundMatch.score1,
          score2: foundMatch.score2,
          date: localDateTime,
          status: foundMatch.status,
          streamUrl: foundMatch.streamUrl || '',
        });
      } else {
        setError("Partido no encontrado (simulación).");
        setMatch(null);
      }
      setIsLoading(false);
    }
  }, [matchId, reset]);

  const onSubmit: SubmitHandler<EditMatchFormInput> = async (data) => {
    const result = await updateMatchAction(data); // Uses mock action for now
    if (result.success) {
      toast({
        title: "Partido Actualizado",
        description: result.message,
      });
      router.push('/admin/matches');
    } else {
      toast({
        title: "Error al Actualizar",
        description: result.message || "No se pudo actualizar el partido.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Cargando datos del partido...</p>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="space-y-8 text-center">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/matches">
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Volver</span>
            </Link>
          </Button>
          <SectionTitle as="h1" className="mb-0 pb-0 border-none">Error</SectionTitle>
        </div>
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <p className="text-xl text-destructive font-semibold">Partido no Encontrado</p>
        <p className="text-muted-foreground">{error || `No se pudo encontrar el partido.`}</p>
        <Button asChild>
          <Link href="/admin/matches">Volver a la Lista de Partidos</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/matches">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <SectionTitle as="h1" className="mb-0 pb-0 border-none">Editar Partido: {match.team1.name} vs {match.team2.name}</SectionTitle>
      </div>

      <Card className="max-w-2xl mx-auto shadow-lg">
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Detalles del Partido</CardTitle>
              <CardDescription>Modifica la información del partido. Los cambios se simularán.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Input type="hidden" {...register("id")} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="team1Id">Equipo 1</Label>
                  {/* TODO: Replace with Select component populated from actual teams from Firestore */}
                  <select
                    id="team1Id"
                    {...register("team1Id")}
                    className={`w-full rounded-md border p-2 ${errors.team1Id ? 'border-destructive' : 'border-input'}`}
                    disabled // For now, teams are not editable to simplify
                  >
                    {mockTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                  </select>
                  {errors.team1Id && <p className="text-sm text-destructive">{errors.team1Id.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="team2Id">Equipo 2</Label>
                  {/* TODO: Replace with Select component populated from actual teams from Firestore */}
                   <select
                    id="team2Id"
                    {...register("team2Id")}
                    className={`w-full rounded-md border p-2 ${errors.team2Id ? 'border-destructive' : 'border-input'}`}
                    disabled // For now, teams are not editable to simplify
                  >
                    {mockTeams.map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
                  </select>
                  {errors.team2Id && <p className="text-sm text-destructive">{errors.team2Id.message}</p>}
                </div>
              </div>
               {errors.team2Id && errors.team2Id.type === 'custom' && <p className="text-sm text-destructive">{errors.team2Id.message}</p>}


              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="score1">Resultado Equipo 1</Label>
                  <Input
                    id="score1"
                    type="number"
                    {...register("score1")}
                    className={errors.score1 ? 'border-destructive' : ''}
                    disabled={watch("status") !== 'completed'}
                  />
                  {errors.score1 && <p className="text-sm text-destructive">{errors.score1.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="score2">Resultado Equipo 2</Label>
                  <Input
                    id="score2"
                    type="number"
                    {...register("score2")}
                    className={errors.score2 ? 'border-destructive' : ''}
                    disabled={watch("status") !== 'completed'}
                  />
                  {errors.score2 && <p className="text-sm text-destructive">{errors.score2.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Fecha y Hora</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  {...register("date")}
                  className={errors.date ? 'border-destructive' : ''}
                />
                {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
              </div>

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
                          setValue("score1", undefined);
                          setValue("score2", undefined);
                        }
                      }}
                      defaultValue={field.value}
                      value={field.value} // Ensure value is controlled
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
              
              <div className="space-y-2">
                <Label htmlFor="streamUrl">URL del Stream (Opcional)</Label>
                <Input
                  id="streamUrl"
                  type="url"
                  {...register("streamUrl")}
                  placeholder="https://twitch.tv/canal_ejemplo"
                  className={errors.streamUrl ? 'border-destructive' : ''}
                />
                {errors.streamUrl && <p className="text-sm text-destructive">{errors.streamUrl.message}</p>}
              </div>

            </CardContent>
            <CardFooter className="flex justify-end">
              <Button type="submit" disabled={isSubmitting}>
                <Save className="mr-2 h-5 w-5" />
                {isSubmitting ? "Guardando Cambios..." : "Guardar Cambios"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

