
'use client';

import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { addClubAction } from '../actions';
import { addClubSchema, type AddClubFormInput } from '../schemas';
import { useToast } from '@/hooks/use-toast';

export default function AddClubPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AddClubFormInput>({
    resolver: zodResolver(addClubSchema),
    defaultValues: {
      name: "",
      logoUrl: ""
    }
  });

  const onSubmit: SubmitHandler<AddClubFormInput> = async (data) => {
    const result = await addClubAction(data);
    if (result.success && result.club) {
      toast({
        title: "Club Añadido",
        description: `El club "${result.club.name}" ha sido añadido con ID: ${result.club.id}.`,
      });
      router.push('/admin/clubs'); 
      // router.refresh(); // Removed: The target page /admin/clubs is a client component that fetches on mount.
    } else {
      toast({
        title: "Error al Añadir Club",
        description: result.message || "No se pudo añadir el club a Firestore.",
        variant: "destructive",
      });
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
            <CardDescription>Complete la información para el nuevo club. Se guardará en Firestore.</CardDescription>
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
    </div>
  );
}
