"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

const highlightSchema = z.object({
  tournamentName: z.string().min(3, "El nombre del torneo es requerido."),
  bestMomentsDescription: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
});

export type HighlightReelFormInput = z.infer<typeof highlightSchema>;

interface HighlightReelFormProps {
  onSubmit: SubmitHandler<HighlightReelFormInput>;
  isGenerating: boolean;
}

export function HighlightReelForm({ onSubmit, isGenerating }: HighlightReelFormProps) {
  const form = useForm<HighlightReelFormInput>({
    resolver: zodResolver(highlightSchema),
    defaultValues: {
      tournamentName: "AFA eSports Showdown",
      bestMomentsDescription: "Goles increíbles, atajadas espectaculares y jugadas maestras.",
    },
  });

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-accent" />
              Generador de Destacados IA
            </CardTitle>
            <CardDescription>
              Describe los mejores momentos del torneo para generar una imagen destacada con IA.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="tournamentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Torneo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: AFA eSports Showdown" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bestMomentsDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción de Mejores Momentos</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe jugadas clave, goles, etc."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isGenerating} className="w-full bg-accent hover:bg-accent/90">
              {isGenerating ? "Generando..." : "Generar Imagen Destacada"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
