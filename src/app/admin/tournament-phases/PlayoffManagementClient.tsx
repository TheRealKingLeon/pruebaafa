
'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, AlertTriangle, Trophy, Trash2, Info, ListChecks, Swords, LayoutGrid } from 'lucide-react';
import type { PlayoffFixture, Group as GroupType } from '@/types'; // Added GroupType
import { generatePlayoffFixturesAction, getPlayoffFixturesAction, clearPlayoffFixturesAction } from '../playoffs/actions';
import { getGroupsAndTeamsAction } from '../groups/actions'; // To get group names for tabs
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PlayoffFixtureWithDetails extends PlayoffFixture {
  team1Name?: string;
  team1LogoUrl?: string;
  team2Name?: string;
  team2LogoUrl?: string;
}

export function PlayoffManagementClient() {
  const [allFixtures, setAllFixtures] = useState<PlayoffFixtureWithDetails[]>([]);
  const [allGroups, setAllGroups] = useState<Pick<GroupType, 'id' | 'name' | 'zoneId'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [fixturesResult, groupsResult] = await Promise.all([
        getPlayoffFixturesAction(),
        getGroupsAndTeamsAction() // Fetch groups to get their names for tabs
      ]);

      if (fixturesResult.error) {
        setError(fixturesResult.error);
        toast({ title: "Error al Cargar Llaves", description: fixturesResult.error, variant: "destructive" });
        setAllFixtures([]);
      } else {
        // Sort fixtures by round for display within each zone
        const sortedFixtures = fixturesResult.fixtures.sort((a, b) => {
            const roundOrder = ["Semifinal 1", "Semifinal 1 - Vuelta", "Semifinal 2", "Semifinal 2 - Vuelta", "Final", "Final - Vuelta"];
            return roundOrder.indexOf(a.round) - roundOrder.indexOf(b.round);
        });
        setAllFixtures(sortedFixtures as PlayoffFixtureWithDetails[]);
      }

      if (groupsResult.error) {
        setError(groupsResult.error || "Error al cargar grupos para pestañas");
        toast({ title: "Error al Cargar Zonas", description: groupsResult.error, variant: "destructive" });
        setAllGroups([]);
      } else {
        // Filter groups that might actually have playoff fixtures (e.g. those with enough teams)
        // or just show all groups and let the content be empty if no fixtures for them.
        // For simplicity, we'll use all groups and let content handle emptiness.
        setAllGroups(groupsResult.groups.map(g => ({ id: g.id, name: g.name, zoneId: g.zoneId })));
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido al cargar datos iniciales.";
      setError(errorMessage);
      toast({ title: "Error Inesperado (Playoffs)", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleGenerateFixtures = async () => {
    setIsGenerating(true);
    try {
      const result = await generatePlayoffFixturesAction();
      if (result.success) {
        toast({ title: "Generación Exitosa", description: result.message });
        await fetchInitialData(); 
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
        await fetchInitialData();
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
  
  const displayableGroupsForTabs = allGroups.filter(g => g.zoneId && allFixtures.some(f => f.zoneId === g.zoneId));
  const defaultZoneTab = displayableGroupsForTabs.length > 0 ? displayableGroupsForTabs[0].zoneId : 'no-zones';

  const getRoundDisplayName = (roundKey: string): string => {
    const names: Record<string, string> = {
      "Semifinal 1": "Semifinal 1",
      "Semifinal 1 - Vuelta": "Semifinal 1 (Vuelta)",
      "Semifinal 2": "Semifinal 2",
      "Semifinal 2 - Vuelta": "Semifinal 2 (Vuelta)",
      "Final": "Final",
      "Final - Vuelta": "Final (Vuelta)",
    };
    return names[roundKey] || roundKey;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-400px)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg text-muted-foreground">Cargando configuración de playoffs...</p>
      </div>
    );
  }

  if (error && !isGenerating && !isClearing) { 
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-400px)] text-center p-4">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <p className="text-lg text-destructive font-semibold">Error al Cargar Llaves de Playoffs</p>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={fetchInitialData}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-card border rounded-lg shadow">
         <CardTitle className="text-2xl">Configurar Llaves de Playoffs (Por Zona)</CardTitle>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button onClick={handleGenerateFixtures} disabled={isGenerating || isLoading} className="w-full sm:w-auto">
            <Trophy className="mr-2 h-5 w-5" />
            {isGenerating ? "Generando..." : "Generar Playoffs de Zonas"}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={isClearing || isLoading || allFixtures.length === 0} className="w-full sm:w-auto">
                <Trash2 className="mr-2 h-5 w-5" />
                {isClearing ? "Limpiando..." : "Limpiar Todos los Playoffs"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de limpiar todas las llaves de playoffs?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción eliminará todas las llaves de playoffs generadas para todas las zonas.
                  Deberás generarlas nuevamente si deseas continuar. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleClearFixtures} disabled={isClearing}>
                  Sí, limpiar todo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <p className="text-sm text-muted-foreground px-4">
        Utiliza "Generar Playoffs de Zonas" para crear un cuadro de playoffs (Semifinales y Final) para cada una de las 8 zonas,
        basado en el Top 4 de cada zona. Las reglas de partido único o ida y vuelta se toman de la configuración del torneo.
      </p>

      {allFixtures.length === 0 && !isLoading && (
         <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>No Hay Llaves de Playoffs Generadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10">
              <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Actualmente no hay ninguna llave de playoffs.</p>
              <p className="text-sm text-muted-foreground mt-2">
                 Usa el botón "Generar Playoffs de Zonas" para crearlas.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {allFixtures.length > 0 && displayableGroupsForTabs.length > 0 && (
        <Tabs defaultValue={defaultZoneTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1 mb-6 rounded-md border bg-muted/30 p-1">
            {displayableGroupsForTabs.map((group) => (
              <TabsTrigger
                key={group.zoneId}
                value={group.zoneId}
                className="text-xs sm:text-sm py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                {group.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {displayableGroupsForTabs.map((group) => {
            const zoneFixtures = allFixtures.filter(f => f.zoneId === group.zoneId);
            
            const fixturesByRound = zoneFixtures.reduce((acc, fixture) => {
                const roundKey = fixture.round;
                if (!acc[roundKey]) acc[roundKey] = [];
                acc[roundKey].push(fixture);
                return acc;
            }, {} as Record<string, PlayoffFixtureWithDetails[]>);
            const roundOrder = ["Semifinal 1", "Semifinal 1 - Vuelta", "Semifinal 2", "Semifinal 2 - Vuelta", "Final", "Final - Vuelta"];


            return (
              <TabsContent key={group.zoneId} value={group.zoneId} className="mt-0">
                <Card className="shadow-lg">
                  <CardHeader className="bg-muted/30">
                    <CardTitle className="text-xl font-headline text-primary flex items-center gap-2">
                      <Trophy className="h-6 w-6" />
                      Playoffs - {group.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-6">
                    {zoneFixtures.length > 0 ? (
                        roundOrder.map(roundKey => {
                            const currentRoundFixtures = fixturesByRound[roundKey];
                            if (!currentRoundFixtures || currentRoundFixtures.length === 0) return null;
                            
                            return (
                                <div key={roundKey}>
                                    <h3 className="text-lg font-semibold mb-2 text-foreground flex items-center gap-2">
                                      <ListChecks className="h-5 w-5 text-muted-foreground" /> 
                                      {getRoundDisplayName(roundKey)}
                                    </h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {currentRoundFixtures.map(fixture => (
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
                                                    ID: {fixture.id.substring(0,8)}... | Estado: <span className={`font-semibold ${fixture.status === 'upcoming' ? 'text-blue-500' : fixture.status === 'completed' ? 'text-green-500' : 'text-amber-500'}`}>
                                                        {fixture.status === 'upcoming' ? 'Próximo' : fixture.status === 'completed' ? 'Finalizado' : 'Pendiente'}
                                                    </span>
                                                </p>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                    {roundKey !== roundOrder[roundOrder.length -1] && <Separator className="my-6"/>}
                                </div>
                            );
                        })
                    ) : (
                      <div className="text-center py-10 text-muted-foreground">
                        <Info className="h-10 w-10 mx-auto mb-3 opacity-50" />
                        No hay fixtures de playoffs generados para {group.name}.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </div>
  );
}

