
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import type { Match, Team } from '@/types';
import { updateMatchAction, getMatchByIdAction, getAllTeamsAction } from '../../actions'; 
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

  const [matchData, setMatchData] = useState<Match | null>(null);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<EditMatchFormInput>({
    resolver: zodResolver(matchFormSchema),
  });
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch, control } = form;

  const fetchMatchAndTeams = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const [matchResult, teamsResult] = await Promise.all([
        getMatchByIdAction(id),
        getAllTeamsAction()
      ]);

      if (matchResult.error || !matchResult.match) {
        setError(matchResult.error || "Partido no encontrado.");
        setMatchData(null);
      } else {
        setMatchData(matchResult.match);
        const localDateTime = matchResult.match.date ? format(new Date(matchResult.match.date), "yyyy-MM-dd'T'HH:mm") : "";
        reset({
          id: matchResult.match.id,
          team1Id: matchResult.match.team1Id || '',
          team2Id: matchResult.match.team2Id || '',
          score1: matchResult.match.score1 ?? undefined, // Keep undefined if null for number input
          score2: matchResult.match.score2 ?? undefined,
          date: localDateTime,
          status: matchResult.match.status,
          streamUrl: matchResult.match.streamUrl || '',
        });
      }

      if (teamsResult.error || !teamsResult.teams) {
        setError(prevError => prevError ? `${prevError} Y ${teamsResult.error}` : (teamsResult.error || "No se pudieron cargar los equipos."));
        setAllTeams([]);
      } else {
        setAllTeams(teamsResult.teams);
      }

    } catch (err) {
      console.error("Error fetching match/teams:", err);
      const errorMessage = err instanceof Error ? err.message : "No se pudieron cargar los datos.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [matchId, reset]);


  useEffect(() => {
    if (matchId) {
      fetchMatchAndTeams(matchId);
    }
  }, [matchId, fetchMatchAndTeams]);

  const onSubmit: SubmitHandler<EditMatchFormInput> = async (data) => {
    const result = await updateMatchAction(data); 
    if (result.success) {
      toast({
        title: "Partido Actualizado",
        description: result.message,
      });
      router.push('/admin/matches');
      router.refresh(); // Ensures the list on /admin/matches is up-to-date
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
        <p className="text-xl text-muted-foreground">Cargando datos del partido y equipos...</p>
      </div>
    );
  }

  if (error || !matchData) {
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
        <p className="text-xl text-destructive font-semibold">Error al Cargar Partido</p>
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
        <SectionTitle as="h1" className="mb-0 pb-0 border-none">Editar Partido: {matchData.team1?.name || 'Equipo 1'} vs {matchData.team2?.name || 'Equipo 2'}</SectionTitle>
      </div>

      <Card className="max-w-2xl mx-auto shadow-lg">
        <Form {...form}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle>Detalles del Partido</CardTitle>
              <CardDescription>Modifica la información del partido. Los cambios se guardarán en Firestore.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                <div className="space-y-2">
                  <FormLabel htmlFor="score1">Resultado Equipo 1</FormLabel>
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
                  <FormLabel htmlFor="score2">Resultado Equipo 2</FormLabel>
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
                <FormLabel htmlFor="date">Fecha y Hora</FormLabel>
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
              
              <div className="space-y-2">
                <FormLabel htmlFor="streamUrl">URL del Stream (Opcional)</FormLabel>
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
