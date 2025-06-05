
'use client';

import { useEffect, useState, useCallback } from 'react';
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
import type { Team } from '@/types'; // Team type might not include 'player'
import { updateClubAction, editClubSchema, type EditClubFormInput } from '../../actions';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface ClubData extends Omit<Team, 'player' | 'id'> { // 'player' is not in 'equipos' docs
  id: string;
}

export default function EditClubPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.id as string;
  const { toast } = useToast();
  
  const [club, setClub] = useState<ClubData | null | undefined>(undefined); // undefined for loading, null for not found
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<EditClubFormInput>({
    resolver: zodResolver(editClubSchema),
  });

  const fetchClub = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const clubRef = doc(db, "equipos", id);
      const clubSnap = await getDoc(clubRef);
      if (clubSnap.exists()) {
        const clubData = { id: clubSnap.id, ...clubSnap.data() } as ClubData;
        setClub(clubData);
        reset({ id: clubData.id, name: clubData.name, logoUrl: clubData.logoUrl });
      } else {
        setError("Club no encontrado en Firestore.");
        setClub(null);
      }
    } catch (err) {
      console.error("Error fetching club:", err);
      const errorMessage = err instanceof Error ? err.message : "No se pudo cargar el club.";
      setError(errorMessage);
      setClub(null);
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    if (clubId) {
      fetchClub(clubId);
    }
  }, [clubId, fetchClub]);

  const onSubmit: SubmitHandler<EditClubFormInput> = async (data) => {
    const result = await updateClubAction(data);
    if (result.success) {
      toast({
        title: "Club Actualizado",
        description: `El club "${data.name}" ha sido actualizado en Firestore.`,
      });
      router.push('/admin/clubs');
    } else {
      toast({
        title: "Error al Actualizar",
        description: result.message || "No se pudo actualizar el club.",
        variant: "destructive",
      });
    }
  };

  if (isLoading || club === undefined) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Cargando datos del club desde Firestore...</p>
      </div>
    );
  }

  if (error || club === null) {
    return (
      <div className="space-y-8 text-center">
        <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin/clubs">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Volver</span>
              </Link>
            </Button>
            <SectionTitle as="h1" className="mb-0 pb-0 border-none">Error</SectionTitle>
        </div>
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <p className="text-xl text-destructive font-semibold">Club no Encontrado</p>
        <p className="text-muted-foreground">{error || `No se pudo encontrar un club con el ID: ${clubId}`}</p>
        <Button asChild>
          <Link href="/admin/clubs">Volver a la Lista de Clubes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/clubs">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <SectionTitle as="h1" className="mb-0 pb-0 border-none">Editar Club: {club.name}</SectionTitle>
      </div>

      <Card className="max-w-2xl mx-auto shadow-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Detalles del Club</CardTitle>
            <CardDescription>Modifique la información del club. Los cambios se guardarán en Firestore.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Input type="hidden" {...register("id")} /> 
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Club</Label>
              <Input
                id="name"
                {...register("name")}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">URL del Logo</Label>
              <Input
                id="logoUrl"
                {...register("logoUrl")}
                className={errors.logoUrl ? 'border-destructive' : ''}
              />
              {errors.logoUrl && <p className="text-sm text-destructive">{errors.logoUrl.message}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-5 w-5" />
              {isSubmitting ? "Guardando Cambios..." : "Guardar Cambios"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
