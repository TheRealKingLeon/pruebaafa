
'use client';

import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

const clubSchema = z.object({
  name: z.string().min(3, { message: "El nombre del club debe tener al menos 3 caracteres." }),
  logoUrl: z.string().url({ message: "Debe ingresar una URL válida para el logo." }),
});

type ClubFormInput = z.infer<typeof clubSchema>;

// Server Action (simulated)
async function addClubAction(data: ClubFormInput) {
  "use server";
  console.log("Nuevo club a añadir (simulado):", data);
  // En una aplicación real, aquí se interactuaría con la base de datos para guardar el club.
  // Por ejemplo: await db.clubs.create({ data });
  // Para este prototipo, solo mostramos un mensaje.
  return { success: true, message: `Club "${data.name}" añadido (simulación).`, club: {...data, id: `club-${Math.random().toString(36).substr(2, 5)}`} };
}

export default function AddClubPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ClubFormInput>({
    resolver: zodResolver(clubSchema),
  });

  const onSubmit: SubmitHandler<ClubFormInput> = async (data) => {
    const result = await addClubAction(data);
    console.log(result.message);
    // Aquí podrías usar un toast para mostrar el mensaje de éxito
    // Para este prototipo, redirigimos a la lista de clubes
    if (result.success) {
      // En una app real, querrías invalidar el caché de la lista de clubes o refetchear
      router.push('/admin/clubs'); 
      // O podrías hacer router.refresh() si la lista de clubes usa Server Components que revalidan
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/clubs">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <SectionTitle as="h1" className="mb-0 pb-0 border-none">Añadir Nuevo Club</SectionTitle>
      </div>

      <Card className="max-w-2xl mx-auto shadow-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Detalles del Club</CardTitle>
            <CardDescription>Complete la información para el nuevo club.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
              {isSubmitting ? "Guardando..." : "Guardar Club"}
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
