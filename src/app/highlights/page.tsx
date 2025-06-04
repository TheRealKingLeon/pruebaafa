"use client";

import { useState } from "react";
import { SectionTitle } from "@/components/shared/SectionTitle";
import { HighlightReelForm, type HighlightReelFormInput } from "@/components/sections/highlights/HighlightReelForm";
import { HighlightReelDisplay } from "@/components/sections/highlights/HighlightReelDisplay";
import { generateHighlightReel, type GenerateHighlightReelOutput } from "@/ai/flows/generate-highlight-reel";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function HighlightsPage() {
  const [highlightResult, setHighlightResult] = useState<GenerateHighlightReelOutput | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (data: HighlightReelFormInput) => {
    setIsGenerating(true);
    setError(null);
    setHighlightResult(null);

    try {
      const result = await generateHighlightReel(data);
      setHighlightResult(result);
      toast({
        title: "¡Imagen generada!",
        description: "La imagen destacada ha sido creada por la IA.",
        variant: "default",
      });
    } catch (e) {
      console.error("Error generating highlight reel:", e);
      const errorMessage = e instanceof Error ? e.message : "Ocurrió un error desconocido.";
      setError(`Error al generar la imagen: ${errorMessage}`);
      toast({
        title: "Error de IA",
        description: `No se pudo generar la imagen destacada. ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <SectionTitle>Destacados del Torneo (IA)</SectionTitle>
      <p className="mb-6 text-muted-foreground">
        Utiliza nuestra inteligencia artificial para generar una imagen única que capture la esencia y los mejores momentos del torneo AFA eSports Showdown.
      </p>
      
      <HighlightReelForm onSubmit={handleSubmit} isGenerating={isGenerating} />

      {isGenerating && (
        <div className="flex flex-col items-center justify-center text-center mt-8 p-6 bg-card rounded-lg shadow-md">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-semibold text-primary">Generando imagen destacada...</p>
          <p className="text-muted-foreground">Esto puede tardar unos momentos.</p>
        </div>
      )}

      <HighlightReelDisplay 
        imageDataUri={highlightResult?.highlightReelVideoDataUri || null} 
        description={highlightResult?.highlightReelDescription || null}
        error={error}
      />
    </div>
  );
}
