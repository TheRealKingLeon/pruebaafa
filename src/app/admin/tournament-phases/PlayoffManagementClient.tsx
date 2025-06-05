
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, Trophy, Trash2, Info, ListChecks, Swords } from 'lucide-react';
import type { PlayoffFixture } from '@/types';
import { generatePlayoffFixturesAction, getPlayoffFixturesAction, clearPlayoffFixturesAction } from '../playoffs/actions'; // Adjusted import path
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';

export function PlayoffManagementClient() {
  const [fixtures, setFixtures] = useState<PlayoffFixture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchFixtures = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { fixtures: fetchedFixtures, error: fetchError } = await getPlayoffFixturesAction();
      if (fetchError) {
        setError(fetchError);
        toast({ title: "Error al Cargar Llaves", description: fetchError, variant: "destructive" });
      } else {
        setFixtures(fetchedFixtures);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido al cargar llaves.";
      setError(errorMessage);
      toast({ title: "Error Inesperado (Playoffs)", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFixtures();
  }, [fetchFixtures]);

  const handleGenerateFixtures = async () => {
    setIsGenerating(true);
    try {
      const result = await generatePlayoffFixturesAction();
      if (result.success) {
        toast({ title: "Generación Exitosa", description: result.message });
        await fetchFixtures(); 
      } else {
        toast({ title: "Error en Generación de Playoffs", description: result.message, variant: "destructive" });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido al generar llaves.";
      toast({ title: "Error Inesperado (Generación Playoffs)", description: errorMessage, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearFixtures = async () => {
    setIsClearing(true);
    try {
      const result = await clearPlayoffFixturesAction();
      if (result.success) {
        toast({ title: "Limpieza Exitosa", description: result.message });
        await fetchFixtures();
      } else {
        toast({ title: "Error al Limpiar Playoffs", description: result.message, variant: "destructive" });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido al limpiar llaves.";
      toast({ title: "Error Inesperado (Limpieza Playoffs)", description: errorMessage, variant: "destructive" });
    } finally {
      setIsClearing(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-400px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Cargando datos de playoffs...</p>
      </div>
    );
  }

  if (error && !isGenerating && !isClearing) { 
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-400px)] text-center p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg text-destructive font-semibold">Error al Cargar Llaves de Playoffs</p>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchFixtures}>Reintentar</Button>
      </div>
    );
  }

  const groupedFixtures = fixtures.reduce((acc, fixture) => {
    const round = fixture.round || "Desconocido";
    if (!acc[round]) {
      acc[round] = [];
    }
    acc[round].push(fixture);
    return acc;
  }, {} as Record<string, PlayoffFixture[]>);

  const roundOrder = ["Cuartos de Final", "Semifinal", "Final"];


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-card border rounded-lg shadow">
         <CardTitle className="text-2xl">Configurar Llaves de Playoffs</CardTitle>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={handleGenerateFixtures} disabled={isGenerating} className="w-full sm:w-auto">
            <Trophy className="mr-2 h-5 w-5" />
            {isGenerating ? "Generando..." : "Generar Llaves de Playoffs"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={isClearing || fixtures.length === 0} className="w-full sm:w-auto">
                <Trash2 className="mr-2 h-5 w-5" />
                {isClearing ? "Limpiando..." : "Limpiar Llaves"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de limpiar las llaves?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará todas las llaves de playoffs generadas.
                  Deberás generarlas nuevamente si deseas continuar. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearFixtures} disabled={isClearing}>
                  Sí, limpiar llaves
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <p className="text-sm text-muted-foreground px-4">
        Utiliza "Generar Llaves de Playoffs" para crear una estructura de torneo (Cuartos, Semifinal, Final) basada en los 
        dos primeros equipos configurados en las primeras cuatro zonas (A, B, C, D). 
        Esta es una simulación y no utiliza resultados reales de partidos.
      </p>

      {fixtures.length === 0 && !isLoading && (
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>No Hay Llaves de Playoffs Generadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Actualmente no hay ninguna llave de playoffs.</p>
              <p className="text-sm text-muted-foreground mt-2">
                 Usa el botón "Generar Llaves de Playoffs" para crearlas.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {fixtures.length > 0 && (
        <div className="space-y-6">
          {roundOrder.map(roundName => {
            const roundFixtures = groupedFixtures[roundName];
            if (!roundFixtures || roundFixtures.length === 0) return null;

            return (
              <Card key={roundName} className="shadow-lg">
                <CardHeader className="bg-muted/30">
                  <CardTitle className="text-xl font-headline text-primary flex items-center gap-2">
                    <ListChecks className="h-6 w-6" />
                    {roundName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 grid md:grid-cols-2 gap-4">
                  {roundFixtures.map(fixture => (
                    <Card key={fixture.id} className="bg-card border">
                      <CardHeader className="p-3">
                        <CardDescription className="text-xs font-semibold text-primary">{fixture.matchLabel}</CardDescription>
                      </CardHeader>
                      <CardContent className="p-3 text-sm">
                        {fixture.status === 'pending_teams' || (!fixture.team1Id || !fixture.team2Id) ? (
                          <p className="text-muted-foreground italic">Equipos por definir</p>
                        ) : (
                          <div className="flex items-center justify-between space-x-2">
                            <div className="flex flex-col items-center text-center w-2/5">
                              <Image
                                src={fixture.team1LogoUrl || "https://placehold.co/48x48.png?text=?"}
                                alt={fixture.team1Name || "Equipo 1"}
                                width={32}
                                height={32}
                                className="rounded-full object-contain mb-1"
                                data-ai-hint="team logo"
                              />
                              <span className="font-medium text-xs truncate w-24">{fixture.team1Name || "Equipo 1"}</span>
                            </div>
                            <Swords className="h-5 w-5 text-muted-foreground shrink-0" />
                            <div className="flex flex-col items-center text-center w-2/5">
                              <Image
                                src={fixture.team2LogoUrl || "https://placehold.co/48x48.png?text=?"}
                                alt={fixture.team2Name || "Equipo 2"}
                                width={32}
                                height={32}
                                className="rounded-full object-contain mb-1"
                                data-ai-hint="team logo"
                              />
                              <span className="font-medium text-xs truncate w-24">{fixture.team2Name || "Equipo 2"}</span>
                            </div>
                          </div>
                        )}
                         <Separator className="my-2"/>
                         <p className="text-xs text-muted-foreground text-center">
                            Estado: <span className={`font-semibold ${fixture.status === 'upcoming' ? 'text-blue-500' : fixture.status === 'completed' ? 'text-green-500' : 'text-amber-500'}`}>
                                {fixture.status === 'upcoming' ? 'Próximo' : fixture.status === 'completed' ? 'Finalizado' : 'Pendiente'}
                            </span>
                         </p>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
