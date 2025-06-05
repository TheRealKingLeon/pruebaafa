
'use client';

import { useForm, useFieldArray, Controller, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tournamentRulesSchema, type TournamentRulesFormInput } from '../tournament-settings/schemas';
import type { TiebreakerRule, TiebreakerCriterionKey } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Save, AlertTriangle, Trash2, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveTournamentRulesAction } from '../tournament-settings/actions';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect } from 'react';


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
  priority: index + 1, // Default sequential priority
  enabled: index < 3, // Enable first 3 by default as an example
}));

interface SortableTiebreakerItemProps {
  item: TiebreakerRule;
  index: number;
  control: any; // Control from react-hook-form
  register: any; // Register from react-hook-form
  errors: any; // Errors from react-hook-form
  setValue: Function;
}

function SortableTiebreakerItem({ item, index, control, register, errors, setValue }: SortableTiebreakerItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

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
            onCheckedChange={(checked) => {
                field.onChange(checked);
                // Optional: auto-adjust priorities when enabling/disabling
            }}
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
        value={item.id}
      />
      <input
        type="hidden"
        {...register(`tiebreakers.${index}.name`)}
        value={item.name}
      />
       <Input
        id={`tiebreaker-${item.id}-priority`}
        type="number"
        min="0"
        {...register(`tiebreakers.${index}.priority`)}
        className={`w-20 text-center ${errors?.tiebreakers?.[index]?.priority ? 'border-destructive' : ''}`}
        disabled={!control.getValues(`tiebreakers.${index}.enabled`)} // Disable priority if not enabled
      />
      {/* errors?.tiebreakers?.[index]?.priority && <p className="text-xs text-destructive">{errors.tiebreakers[index].priority.message}</p> */}
    </div>
  );
}


export function TournamentRulesClient() {
  const { toast } = useToast();
  const form = useForm<TournamentRulesFormInput>({
    resolver: zodResolver(tournamentRulesSchema),
    defaultValues: {
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      tiebreakers: defaultTiebreakers,
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "tiebreakers",
    keyName: "fieldId" // Use a different key name than 'id' to avoid conflict
  });
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id);
      const newIndex = fields.findIndex((field) => field.id === over.id);
      move(oldIndex, newIndex);
      
      // After moving, re-assign priorities based on new order for *all* tiebreakers
      const currentTiebreakers = form.getValues('tiebreakers');
      const updatedTiebreakers = currentTiebreakers.map((tb, idx) => ({
        ...tb,
        priority: idx + 1,
      }));
      form.setValue('tiebreakers', updatedTiebreakers, { shouldValidate: true, shouldDirty: true });
    }
  };
  
   // Effect to re-validate and re-assign priorities when 'enabled' status changes or fields are reordered
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name && name.startsWith('tiebreakers') && (type === 'change')) {
        const tiebreakers = form.getValues('tiebreakers');
        // Filter enabled tiebreakers and sort them by their current visual order (which is their array index)
        const enabledTiebreakers = tiebreakers
            .map((tb, index) => ({ ...tb, originalIndex: index })) // keep original index to update specific field
            .filter(tb => tb.enabled);

        // Sort enabled tiebreakers by their current 'priority' field value, then by original index as fallback
        enabledTiebreakers.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return a.originalIndex - b.originalIndex;
        });
        
        // Create a copy of all tiebreakers to update
        const updatedTiebreakers = [...tiebreakers];
        let currentPriority = 1;

        // Update priorities for enabled tiebreakers based on their sorted order
        enabledTiebreakers.forEach(enabledTb => {
            const originalTbIndex = enabledTb.originalIndex;
            if (updatedTiebreakers[originalTbIndex]) {
                 updatedTiebreakers[originalTbIndex].priority = currentPriority++;
            }
        });
        
        // For disabled tiebreakers, set priority to 0 or some non-colliding value (or handle as needed)
        updatedTiebreakers.forEach(tb => {
            if (!tb.enabled) {
                tb.priority = 0; // Or a large number, or maintain last known priority
            }
        });

        form.setValue('tiebreakers', updatedTiebreakers, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, form.getValues, form.setValue, form]);


  const onSubmit: SubmitHandler<TournamentRulesFormInput> = async (data) => {
    // Filter out disabled tiebreakers and re-ensure their priorities are sequential starting from 1
    const activeTiebreakers = data.tiebreakers
        .filter(tb => tb.enabled)
        .sort((a, b) => a.priority - b.priority) // Sort by priority before sending
        .map((tb, index) => ({ ...tb, priority: index + 1 })); // Re-assign sequential priority

    const payload = {
        ...data,
        tiebreakers: activeTiebreakers
    };
    
    console.log("Form data submitted to action:", JSON.stringify(payload, null, 2));
    const result = await saveTournamentRulesAction(payload);

    if (result.success) {
      toast({
        title: "Configuración Guardada",
        description: result.message,
      });
    } else {
      toast({
        title: "Error al Guardar",
        description: result.message || "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="shadow-lg max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary">Configuración de Reglas del Torneo</CardTitle>
        <CardDescription>Define el sistema de puntuación y los criterios de desempate para la fase de grupos.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-8">
          {/* Puntos por Partido */}
          <section>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Sistema de Puntuación</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="pointsForWin">Puntos por Victoria</Label>
                <Input id="pointsForWin" type="number" {...form.register("pointsForWin")} className={`mt-1 ${form.formState.errors.pointsForWin ? 'border-destructive' : ''}`} />
                {form.formState.errors.pointsForWin && <p className="text-sm text-destructive mt-1">{form.formState.errors.pointsForWin.message}</p>}
              </div>
              <div>
                <Label htmlFor="pointsForDraw">Puntos por Empate</Label>
                <Input id="pointsForDraw" type="number" {...form.register("pointsForDraw")} className={`mt-1 ${form.formState.errors.pointsForDraw ? 'border-destructive' : ''}`} />
                {form.formState.errors.pointsForDraw && <p className="text-sm text-destructive mt-1">{form.formState.errors.pointsForDraw.message}</p>}
              </div>
              <div>
                <Label htmlFor="pointsForLoss">Puntos por Derrota</Label>
                <Input id="pointsForLoss" type="number" {...form.register("pointsForLoss")} className={`mt-1 ${form.formState.errors.pointsForLoss ? 'border-destructive' : ''}`} />
                {form.formState.errors.pointsForLoss && <p className="text-sm text-destructive mt-1">{form.formState.errors.pointsForLoss.message}</p>}
              </div>
            </div>
          </section>

          <Separator />

          {/* Criterios de Desempate */}
          <section>
            <h3 className="text-lg font-semibold mb-1 text-foreground">Criterios de Desempate (Fase de Grupos)</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Habilita los criterios y arrastra para ordenar su prioridad. La prioridad se reasignará automáticamente según el orden.
            </p>
            {form.formState.errors.tiebreakers && typeof form.formState.errors.tiebreakers === 'object' && !Array.isArray(form.formState.errors.tiebreakers) && (
                 <div className="p-3 mb-4 bg-destructive/10 border border-destructive text-destructive text-sm rounded-md flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0"/>
                    <span>{form.formState.errors.tiebreakers.message}</span>
                </div>
            )}

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={fields.map(field => field.id)} strategy={verticalListSortingStrategy}>
                {fields.map((field, index) => (
                  <SortableTiebreakerItem
                    key={field.fieldId} // Use fieldId from useFieldArray
                    item={field as any} // Cast to any to match SortableTiebreakerItemProps expectation
                    index={index}
                    control={form.control}
                    register={form.register}
                    errors={form.formState.errors}
                    setValue={form.setValue}
                  />
                ))}
              </SortableContext>
            </DndContext>
            {/* Display individual tiebreaker errors if any (e.g. if priority not number) */}
            {fields.map((_, index) => (
              form.formState.errors?.tiebreakers?.[index]?.priority && (
                <p key={`err-${index}`} className="text-sm text-destructive mt-1">
                  Error en prioridad para el criterio "{form.getValues(`tiebreakers.${index}.name`)}": {form.formState.errors.tiebreakers[index].priority.message}
                </p>
              )
            ))}
          </section>
        </CardContent>
        <CardFooter className="border-t pt-6">
          <Button type="submit" disabled={form.formState.isSubmitting} className="w-full sm:w-auto ml-auto">
            <Save className="mr-2 h-5 w-5" />
            {form.formState.isSubmitting ? "Guardando..." : "Guardar Configuración de Reglas"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
