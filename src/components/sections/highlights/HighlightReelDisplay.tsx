import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Film, AlertTriangle } from 'lucide-react';

interface HighlightReelDisplayProps {
  imageDataUri: string | null;
  description: string | null;
  error?: string | null;
}

export function HighlightReelDisplay({ imageDataUri, description, error }: HighlightReelDisplayProps) {
  if (error) {
    return (
      <Card className="w-full max-w-lg mx-auto mt-8 border-destructive shadow-lg">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle /> Error al generar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }
  
  if (!imageDataUri) {
    return null; 
  }

  return (
    <Card className="w-full max-w-lg mx-auto mt-8 shadow-xl animate-fade-in">
      <CardHeader>
        <CardTitle className="font-headline text-xl text-primary flex items-center gap-2">
            <Film /> Imagen Destacada Generada
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="aspect-video relative rounded-md overflow-hidden border bg-muted">
          <Image 
            src={imageDataUri} 
            alt={description || "Highlight reel image"} 
            layout="fill" 
            objectFit="contain"
            data-ai-hint="esports highlight montage"
          />
        </div>
      </CardContent>
    </Card>
  );
}
