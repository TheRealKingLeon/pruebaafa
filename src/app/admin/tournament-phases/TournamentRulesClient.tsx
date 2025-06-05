
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
import { Save, AlertTriangle, Trash2, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { saveTournamentRulesAction } from '../tournament-settings/actions';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect } from 'react';
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
  priority: index + 1, // Default sequential priority
  enabled: index < 3, // Enable first 3 by default as an example
}));

interface SortableTiebreakerItemProps {
  item: TiebreakerRule & { fieldId: string }; // fieldId is from useFieldArray
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
  } = useSortable({ id: item.fieldId }); // Use fieldId for useSortable

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
        disabled={!item.enabled} // Disable priority if not enabled
      />
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
      roundRobinType: 'one-way', // Default to one-way
      tiebreakers: defaultTiebreakers,
    },
  });

  const { fields, append, remove, move } = useFieldArray({
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

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field.fieldId === active.id);
      const newIndex = fields.findIndex((field) => field.fieldId === over.id);
      move(oldIndex, newIndex);
      
      const currentTiebreakers = form.getValues('tiebreakers');
      const updatedTiebreakers = currentTiebreakers.map((tb, idx) => ({
        ...tb,
        priority: idx + 1,
      }));
      form.setValue('tiebreakers', updatedTiebreakers, { shouldValidate: true, shouldDirty: true });
    }
  };
  
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (name && name.startsWith('tiebreakers') && (type === 'change')) {
        const tiebreakers = form.getValues('tiebreakers');
        const enabledTiebreakers = tiebreakers
            .map((tb, index) => ({ ...tb, originalIndex: index })) 
            .filter(tb => tb.enabled);

        enabledTiebreakers.sort((a, b) => {
            if (a.priority !== b.priority) return a.priority - b.priority;
            return a.originalIndex - b.originalIndex;
        });
        
        const updatedTiebreakers = [...tiebreakers];
        let currentPriority = 1;

        enabledTiebreakers.forEach(enabledTb => {
            const originalTbIndex = enabledTb.originalIndex;
            if (updatedTiebreakers[originalTbIndex]) {
                 updatedTiebreakers[originalTbIndex].priority = currentPriority++;
            }
        });
        
        updatedTiebreakers.forEach(tb => {
            if (!tb.enabled) {
                tb.priority = 0; 
            }
        });

        form.setValue('tiebreakers', updatedTiebreakers, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch, form.getValues, form.setValue, form]);


  const onSubmit: SubmitHandler<TournamentRulesFormInput> = async (data) => {
    const activeTiebreakers = data.tiebreakers
        .filter(tb => tb.enabled)
        .sort((a, b) => a.priority - b.priority) 
        .map((tb, index) => ({ ...tb, priority: index + 1 })); 

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
      // Consider closing the dialog here if it's in a dialog context
      // document.getElementById('closeDialogButtonId')?.click(); // If DialogClose has an id
    } else {
      toast({
        title: "Error al Guardar",
        description: result.message || "No se pudo guardar la configuración.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl font-headline text-primary">Configuración de Reglas de Fase de Grupos</DialogTitle>
        <DialogDescription>Define el sistema de puntuación, modalidad y criterios de desempate.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            {/* Puntos por Partido */}
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
                        <Input type="number" {...field} className={`mt-1 ${form.formState.errors.pointsForWin ? 'border-destructive' : ''}`} />
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
                        <Input type="number" {...field} className={`mt-1 ${form.formState.errors.pointsForDraw ? 'border-destructive' : ''}`} />
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
                        <Input type="number" {...field} className={`mt-1 ${form.formState.errors.pointsForLoss ? 'border-destructive' : ''}`} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            <Separator />
            
            {/* Modalidad Round Robin */}
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

            {/* Criterios de Desempate */}
            <section>
              <h3 className="text-lg font-semibold mb-1 text-foreground">Criterios de Desempate</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Habilita los criterios y arrastra para ordenar su prioridad. La prioridad se reasignará automáticamente.
              </p>
              {form.formState.errors.tiebreakers && typeof form.formState.errors.tiebreakers === 'object' && !Array.isArray(form.formState.errors.tiebreakers) && (
                   <div className="p-3 mb-4 bg-destructive/10 border border-destructive text-destructive text-sm rounded-md flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 mt-0.5 flex-shrink-0"/>
                      <span>{form.formState.errors.tiebreakers.message}</span>
                  </div>
              )}

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={fields.map(field => field.fieldId)} strategy={verticalListSortingStrategy}>
                  {fields.map((field, index) => (
                    <SortableTiebreakerItem
                      key={field.fieldId} 
                      item={field as any} 
                      index={index}
                      control={form.control}
                      register={form.register}
                      errors={form.formState.errors}
                      setValue={form.setValue}
                    />
                  ))}
                </SortableContext>
              </DndContext>
              {fields.map((_, index) => (
                form.formState.errors?.tiebreakers?.[index]?.priority && (
                  <p key={`err-${index}`} className="text-sm text-destructive mt-1">
                    Error en prioridad para el criterio "{form.getValues(`tiebreakers.${index}.name`)}": {form.formState.errors.tiebreakers[index].priority.message}
                  </p>
                )
              ))}
            </section>
          <DialogFooter className="pt-4 border-t">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              <Save className="mr-2 h-5 w-5" />
              {form.formState.isSubmitting ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
