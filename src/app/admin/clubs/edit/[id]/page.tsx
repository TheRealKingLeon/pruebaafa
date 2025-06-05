
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { mockTeams } from '@/data/mock';
import type { Team } from '@/types';
import { updateClubAction, editClubSchema, type EditClubFormInput } from '../../actions';

export default function EditClubPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.id as string;
  
  const [club, setClub] = useState<Team | null | undefined>(undefined); // undefined for loading state

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<EditClubFormInput>({
    resolver: zodResolver(editClubSchema),
  });

  useEffect(() => {
    if (clubId) {
      const foundClub = mockTeams.find(t => t.id === clubId);
      setClub(foundClub || null);
      if (foundClub) {
        // Ensure 'id' is passed to reset as it's part of EditClubFormInput
        reset({ id: foundClub.id, name: foundClub.name, logoUrl: foundClub.logoUrl });
      }
    }
  }, [clubId, reset]);

  const onSubmit: SubmitHandler<EditClubFormInput> = async (data) => {
    const result = await updateClubAction(data);
    console.log(result.message);
    // Aquí podrías usar un toast para mostrar el mensaje de éxito
    if (result.success) {
      // En una app real, querrías invalidar el caché o refetchear
      router.push('/admin/clubs');
    }
  };

  if (club === undefined) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Cargando datos del club...</p>
      </div>
    );
  }

  if (club === null) {
    return (
      <div className="space-y-8 text-center">
        <SectionTitle>Club no Encontrado</SectionTitle>
        <p className="text-muted-foreground">No se pudo encontrar un club con el ID: {clubId}</p>
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
            <CardDescription>Modifique la información del club.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Hidden input for ID, crucial for the updateClubAction */}
            <Input type="hidden" {...register("id")} /> 
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Club</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Ej: Club Atlético Independiente"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="logoUrl">URL del Logo</Label>
              <Input
                id="logoUrl"
                {...register("logoUrl")}
                placeholder="https://ejemplo.com/logo.png"
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
      <p className="text-sm text-center text-muted-foreground italic mt-6">
        Nota: Al guardar, los datos se registrarán en la consola del servidor. No se producirán cambios permanentes.
      </p>
    </div>
  );
}
