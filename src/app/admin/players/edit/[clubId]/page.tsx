
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { mockTeams } from '@/data/mock';
import type { Team, Player } from '@/types';
import { updatePlayerAction } from '../../actions';
import { playerFormSchema, type UpdatePlayerFormInput, type PlayerFormData } from '../../schemas';
import { useToast } from '@/hooks/use-toast';


export default function EditPlayerPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string; 
  const { toast } = useToast();
  
  const [team, setTeam] = useState<Team | null | undefined>(undefined); 
  const [player, setPlayer] = useState<Player | null | undefined>(undefined);

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<PlayerFormData>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: '',
      gamerTag: '',
      imageUrl: '',
      bio: '',
    }
  });

  useEffect(() => {
    if (clubId) {
      const foundTeam = mockTeams.find(t => t.id === clubId);
      setTeam(foundTeam || null);
      if (foundTeam) {
        setPlayer(foundTeam.player);
        reset({ 
          name: foundTeam.player.name,
          gamerTag: foundTeam.player.gamerTag,
          imageUrl: foundTeam.player.imageUrl,
          bio: foundTeam.player.bio,
        });
      } else {
        setPlayer(null);
      }
    }
  }, [clubId, reset]);

  const onSubmit: SubmitHandler<PlayerFormData> = async (formData) => {
    if (!clubId) {
        console.error("Club ID is missing");
        toast({
          title: "Error",
          description: "No se pudo identificar el club para actualizar el jugador.",
          variant: "destructive",
        });
        return;
    }
    const dataWithClubId: UpdatePlayerFormInput = { ...formData, clubId };
    const result = await updatePlayerAction(dataWithClubId);
    
    if (result.success) {
      toast({
        title: "Jugador Actualizado (Simulación)",
        description: result.message,
      });
      router.push('/admin/players');
    } else {
      toast({
        title: "Error al Actualizar (Simulación)",
        description: result.message || "No se pudo actualizar el jugador.",
        variant: "destructive",
      });
    }
  };
  
  if (team === undefined) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Cargando datos del jugador...</p>
      </div>
    );
  }

  if (!team || !player) {
    return (
      <div className="space-y-8 text-center">
        <SectionTitle>Jugador o Club no Encontrado</SectionTitle>
        <p className="text-muted-foreground">No se pudo encontrar un club o jugador con el ID de club: {clubId}</p>
         <div className="flex justify-center">
          <UserCircle className="h-24 w-24 text-muted-foreground opacity-50" />
        </div>
        <Button asChild>
          <Link href="/admin/players">Volver a la Lista de Jugadores</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/players">
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Volver</span>
          </Link>
        </Button>
        <SectionTitle as="h1" className="mb-0 pb-0 border-none">Editar Jugador: {player.name} (Club: {team.name})</SectionTitle>
      </div>

      <Card className="max-w-2xl mx-auto shadow-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Detalles del Jugador</CardTitle>
            <CardDescription>Modifique la información del jugador para el club {team.name}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Jugador</Label>
              <Input
                id="name"
                {...register("name")}
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="gamerTag">GamerTag (FC 25 Nickname)</Label>
              <Input
                id="gamerTag"
                {...register("gamerTag")}
                className={errors.gamerTag ? 'border-destructive' : ''}
              />
              {errors.gamerTag && <p className="text-sm text-destructive">{errors.gamerTag.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL de la Imagen del Jugador</Label>
              <Input
                id="imageUrl"
                type="url"
                {...register("imageUrl")}
                className={errors.imageUrl ? 'border-destructive' : ''}
              />
              {errors.imageUrl && <p className="text-sm text-destructive">{errors.imageUrl.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Biografía</Label>
              <Textarea
                id="bio"
                {...register("bio")}
                rows={5}
                className={errors.bio ? 'border-destructive' : ''}
              />
              {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
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
        Nota: Al guardar, los datos se registrarán en la consola del servidor y se mostrará una notificación. No se producirán cambios permanentes en los datos de ejemplo.
      </p>
    </div>
  );
}
