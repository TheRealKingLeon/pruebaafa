
'use client';

import { useForm, useFieldArray, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tournamentRulesSchema, type TournamentRulesFormInput } from '../tournament-settings/schemas';
import type { TiebreakerRule, TiebreakerCriterionKey } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Save, AlertTriangle, GripVertical, FileCog, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveTournamentRulesAction, loadTournamentRulesAction } from '../tournament-settings/actions';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useState } from 'react';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';


const initialTiebreakerCriteria: Record<TiebreakerCriterionKey, string> = {
  directResult: "Resultado Directo (entre equipos empatados)",
  goalDifference: "Diferencia de Goles (General)",
  goalsFor: "Goles a Favor (General)",
  matchesWon: "Partidos Ganados (General)",
  pointsCoefficient: "Coeficiente de Puntos (Puntos / PJ)",
  drawLot: "Sorteo",
};

const defaultTiebreakers: TiebreakerRule[] = (Object.keys(initialTiebreakerCriteria) as TiebreakerCriterionKey[]).map((key, index) => ({
  id: key,
  name: initialTiebreakerCriteria[key],
  priority: index < 3 ? index + 1 : 0, 
  enabled: index < 3, 
}));

const defaultFormValues: TournamentRulesFormInput = {
  pointsForWin: 3,
  pointsForDraw: 1,
  pointsForLoss: 0,
  roundRobinType: 'one-way', 
  tiebreakers: defaultTiebreakers,
};


interface SortableTiebreakerItemProps {
  item: TiebreakerRule & { fieldId: string }; 
  index: number;
  control: any; 
  register: any; 
  errors: any; 
  currentEnabledStatus: boolean; // Pass current enabled status for the input
}

function SortableTiebreakerItem({ item, index, control, register, errors, currentEnabledStatus }: SortableTiebreakerItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.fieldId }); 

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-card border rounded-md mb-2 touch-manipulation">
      <button type="button" {...attributes} {...listeners} className="cursor-grab p-1">
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <Controller
        name={`tiebreakers.${index}.enabled`}
        control={control}
        render={({ field }) => (
          <Checkbox
            id={`tiebreaker-${item.id}-enabled`}
            checked={field.value}
            onCheckedChange={field.onChange}
            className="mr-2"
          />
        )}
      />
      <Label htmlFor={`tiebreaker-${item.id}-enabled`} className="flex-grow text-sm">
        {item.name}
      </Label>
      <input
        type="hidden"
        {...register(`tiebreakers.${index}.id`)}
      />
      <input
        type="hidden"
        {...register(`tiebreakers.${index}.name`)}
      />
       <Input
        id={`tiebreaker-${item.id}-priority`}
        type="number"
        min="0"
        {...register(`tiebreakers.${index}.priority`)}
        className={`w-20 text-center ${errors?.tiebreakers?.[index]?.priority ? 'border-destructive' : ''}`}
        disabled={!currentEnabledStatus} 
      />
    </div>
  );
}


export function TournamentRulesClient() {
  const { toast } = useToast();
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  const [initialLoadError, setInitialLoadError] = useState<string | null>(null);

  const form = useForm<TournamentRulesFormInput>({
    resolver: zodResolver(tournamentRulesSchema),
    defaultValues: defaultFormValues,
  });

  const { fields, move, replace } = useFieldArray({
    control: form.control,
    name: "tiebreakers",
    keyName: "fieldId" 
  });
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  useEffect(() => {
    async function fetchRules() {
      console.log("[TournamentRulesClient] Fetching rules from Firestore...");
      setIsLoadingRules(true);
      setInitialLoadError(null);
      try {
        const result = await loadTournamentRulesAction();
        if (result.success) {
          if (result.data) {
            console.log("[TournamentRulesClient] Rules loaded from Firestore, resetting form:", result.data);
            // Ensure all tiebreaker criteria are present, merging with defaults if necessary
            const allCriteriaKeys = Object.keys(initialTiebreakerCriteria) as TiebreakerCriterionKey[];
            const loadedTiebreakers = result.data.tiebreakers || [];
            const loadedTiebreakerIds = new Set(loadedTiebreakers.map(tb => tb.id));

            const mergedTiebreakers = allCriteriaKeys.map(key => {
                const loadedOne = loadedTiebreakers.find(tb => tb.id === key);
                if (loadedOne) return loadedOne;
                // If not found in loaded data, use default structure for this criterion
                const defaultOne = defaultTiebreakers.find(dtb => dtb.id === key);
                return defaultOne || { id: key, name: initialTiebreakerCriteria[key], priority: 0, enabled: false };
            });
            
            // Sort mergedTiebreakers by priority (enabled first, then by priority number)
            // then ensure the visual order matches this initial load order
            mergedTiebreakers.sort((a, b) => {
                if (a.enabled && !b.enabled) return -1;
                if (!a.enabled && b.enabled) return 1;
                if (a.priority === 0 && b.priority > 0) return 1; // Unprioritized enabled go after prioritized
                if (a.priority > 0 && b.priority === 0) return -1;
                return a.priority - b.priority;
            });
            
            form.reset({ ...defaultFormValues, ...result.data, tiebreakers: mergedTiebreakers });
            toast({ title: "Configuración Cargada", description: "Reglas cargadas desde Firestore." });
          } else {
            console.log("[TournamentRulesClient] No rules found in Firestore, using default values.");
            form.reset(defaultFormValues); // Ensure form is reset to defaults if nothing loaded
            toast({ title: "Sin Configuración Previa", description: "Usando configuración por defecto. Guarda para persistir.", variant: "default" });
          }
        } else {
          console.error("[TournamentRulesClient] Error loading rules:", result.message);
          setInitialLoadError(result.message || "No se pudieron cargar las reglas.");
          toast({ title: "Error al Cargar Reglas", description: result.message, variant: "destructive" });
          form.reset(defaultFormValues);
        }
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Error desconocido al cargar.";
        console.error("[TournamentRulesClient] Exception during fetchRules:", msg);
        setInitialLoadError(msg);
        toast({ title: "Error Crítico al Cargar", description: msg, variant: "destructive" });
        form.reset(defaultFormValues);
      } finally {
        setIsLoadingRules(false);
        console.log("[TournamentRulesClient] Finished fetching rules.");
      }
    }
    fetchRules();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Runs once on mount

  useEffect(() => {
    if (Object.keys(form.formState.errors).length > 0) {
      console.log("Form validation errors:", form.formState.errors);
    }
  }, [form.formState.errors]);

  const updatePriorities = (currentTiebreakers: TiebreakerRule[]): TiebreakerRule[] => {
    const updated = [...currentTiebreakers];
    let enabledPriorityCounter = 1;
    
    // Assign priorities to enabled tiebreakers based on their current order
    updated.forEach((tb) => {
      if (tb.enabled) {
        tb.priority = enabledPriorityCounter++;
      } else {
        tb.priority = 0; 
      }
    });
    return updated;
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id && over) {
      const oldIndex = fields.findIndex((field) => field.fieldId === active.id);
      const newIndex = fields.findIndex((field) => field.fieldId === over.id);
      move(oldIndex, newIndex); // This updates the visual order
      
      // Get the new order from the form state after `move`
      const newOrderedTiebreakers = form.getValues('tiebreakers');
      const finalPrioritizedTiebreakers = updatePriorities(newOrderedTiebreakers);
      // Update the form state with re-calculated priorities
      form.setValue('tiebreakers', finalPrioritizedTiebreakers, { shouldValidate: true, shouldDirty: true });
    }
  };
  
  useEffect(() => {
    const subscription = form.watch((values, { name, type }) => {
      if (name && name.startsWith('tiebreakers') && (name.endsWith('.enabled') || type === 'change')) {
        const currentTiebreakers = form.getValues('tiebreakers');
        const rePrioritized = updatePriorities(currentTiebreakers);
        
        if (JSON.stringify(rePrioritized) !== JSON.stringify(currentTiebreakers)) {
            form.setValue('tiebreakers', rePrioritized, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form, updatePriorities]);


  const onSubmit: SubmitHandler<TournamentRulesFormInput> = async (data) => {
    console.log("Form.handleSubmit está llamando a onSubmit con datos:", data);
    
    // Re-process priorities one last time before sending to ensure consistency
    const processedTiebreakers = updatePriorities(data.tiebreakers);
    
    const payload: TournamentRulesFormInput = {
        ...data,
        tiebreakers: processedTiebreakers, // Send all tiebreakers, server action does not filter
    };
    
    console.log("[TournamentRulesClient] Payload to be sent to server action:", JSON.stringify(payload, null, 2));
    const result = await saveTournamentRulesAction(payload);

    if (result.success) {
      toast({
        title: "Configuración Guardada",
        description: result.message,
      });
      form.reset(payload, { keepValues: true, keepDirty: false, keepDefaultValues: false }); // Reflect saved state
    } else {
      toast({
        title: "Error al Guardar",
        description: result.message || "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    }
  };
  console.log("TournamentRulesClient renderizando, errores:", form.formState.errors);

  if (isLoadingRules) {
    return (
      <>
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline text-primary flex items-center gap-2">
              <FileCog className="h-6 w-6" />
              Configuración de Reglas de Fase de Grupos
          </DialogTitle>
          <DialogDescription>Define el sistema de puntuación, modalidad y criterios de desempate.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-10 space-y-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando configuración de reglas...</p>
        </div>
        <DialogFooter className="pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled>Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled>
              <Save className="mr-2 h-5 w-5" />
              Cargando...
            </Button>
        </DialogFooter>
      </>
    );
  }

  if (initialLoadError) {
     return (
      <>
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline text-destructive flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              Error al Cargar Reglas
          </DialogTitle>
          <DialogDescription>No se pudo cargar la configuración de reglas.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center py-10 space-y-3 bg-destructive/10 p-4 rounded-md">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="text-destructive-foreground">{initialLoadError}</p>
          <Button onClick={() => window.location.reload()} variant="destructive">Reintentar Carga</Button>
        </div>
         <DialogFooter className="pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cerrar</Button>
            </DialogClose>
        </DialogFooter>
      </>
    );
  }


  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl font-headline text-primary flex items-center gap-2">
            <FileCog className="h-6 w-6" />
            Configuración de Reglas de Fase de Grupos
        </DialogTitle>
        <DialogDescription>Define el sistema de puntuación, modalidad y criterios de desempate. Los cambios se guardan en Firestore.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Sistema de Puntuación</h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="pointsForWin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Puntos por Victoria</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value,10))} className={`mt-1 ${form.formState.errors.pointsForWin ? 'border-destructive' : ''}`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pointsForDraw"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Puntos por Empate</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value,10))} className={`mt-1 ${form.formState.errors.pointsForDraw ? 'border-destructive' : ''}`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pointsForLoss"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Puntos por Derrota</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value,10))} className={`mt-1 ${form.formState.errors.pointsForLoss ? 'border-destructive' : ''}`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <Separator />
            
            <section>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Modalidad de Fase de Grupos</h3>
              <FormField
                control={form.control}
                name="roundRobinType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value} // Ensure value is controlled
                        defaultValue={field.value}
                        className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-4"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="one-way" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Solo Ida (equipos se enfrentan una vez)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="two-way" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Ida y Vuelta (equipos se enfrentan dos veces)
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <Separator />

            <section>
              <h3 className="text-lg font-semibold mb-1 text-foreground">Criterios de Desempate</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Habilita los criterios y arrastra para ordenar su prioridad. La prioridad se asignará automáticamente (1, 2, 3...).
              </p>
              {form.formState.errors.tiebreakers && typeof form.formState.errors.tiebreakers === 'object' && 'message' in form.formState.errors.tiebreakers && (
                   <div className="p-3 mb-4 bg-destructive/10 border border-destructive text-destructive text-sm rounded-md flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0"/>
                      <span>{(form.formState.errors.tiebreakers as any).message}</span>
                  </div>
              )}

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields.map(field => field.fieldId)} strategy={verticalListSortingStrategy}>
                  {fields.map((field, index) => {
                    const currentFieldValue = form.getValues(`tiebreakers.${index}`);
                    return (
                      <SortableTiebreakerItem
                        key={field.fieldId} 
                        item={{...field, ...currentFieldValue}} // Pass current field values for 'enabled' state
                        index={index}
                        control={form.control}
                        register={form.register}
                        errors={form.formState.errors}
                        currentEnabledStatus={currentFieldValue.enabled}
                      />
                    );
                  })}
                </SortableContext>
              </DndContext>
              {fields.map((field, index) => {
                 const tiebreakerError = form.formState.errors?.tiebreakers?.[index];
                 if (tiebreakerError && typeof tiebreakerError === 'object' && 'priority' in tiebreakerError && (tiebreakerError.priority as any)?.message) {
                    return (
                        <p key={`err-prio-${field.id}`} className="text-sm text-destructive mt-1">
                        Error en prioridad para "{field.name}": {(tiebreakerError.priority as any).message}
                        </p>
                    );
                 }
                 if (index === 0 && form.formState.errors.tiebreakers && (form.formState.errors.tiebreakers as any).root?.message) {
                    return <p key="err-tiebreakers-root" className="text-sm text-destructive mt-1">{(form.formState.errors.tiebreakers as any).root.message}</p>
                 }
                 if (index === 0 && form.formState.errors.tiebreakers?.message) {
                   return <p key="err-tiebreakers-general" className="text-sm text-destructive mt-1">{form.formState.errors.tiebreakers.message}</p>
                 }
                 return null;
              })}
            </section>
          <DialogFooter className="pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={form.formState.isSubmitting || isLoadingRules}>
              <Save className="mr-2 h-5 w-5" />
              {form.formState.isSubmitting ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}

