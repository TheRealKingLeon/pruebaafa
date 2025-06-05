
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Loader2, UserCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import type { Team, Player } from '@/types';
import { updatePlayerAction } from '../../actions';
import { playerFormSchema, type PlayerFormData, type UpdatePlayerFormInput } from '../../schemas';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';

// Simpler Team type for fetching club name, as 'equipos' doc won't have full Player object
interface ClubDisplayInfo {
  id: string;
  name: string;
  logoUrl: string;
}

export default function EditPlayerPage() {
  const router = useRouter();
  const params = useParams();
  const clubId = params.clubId as string; 
  const { toast } = useToast();
  
  const [clubDisplayInfo, setClubDisplayInfo] = useState<ClubDisplayInfo | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // player state is implicitly handled by form's defaultValues after fetch

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<PlayerFormData>({
    resolver: zodResolver(playerFormSchema),
    defaultValues: {
      name: '',
      gamerTag: '',
      imageUrl: '',
      bio: '',
    }
  });

  const fetchClubAndPlayerData = useCallback(async (currentClubId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch club display info
      const clubRef = doc(db, "equipos", currentClubId);
      const clubSnap = await getDoc(clubRef);

      if (clubSnap.exists()) {
        setClubDisplayInfo({ id: clubSnap.id, ...clubSnap.data() } as ClubDisplayInfo);
      } else {
        setError(`Club con ID ${currentClubId} no encontrado.`);
        setClubDisplayInfo(null);
        setIsLoading(false);
        return;
      }

      // Fetch player data for this club
      const playersRef = collection(db, "jugadores");
      const q = query(playersRef, where("clubId", "==", currentClubId));
      const playerSnapshot = await getDocs(q);

      if (!playerSnapshot.empty) {
        const playerData = { id: playerSnapshot.docs[0].id, ...playerSnapshot.docs[0].data() } as Player;
        reset({ 
          name: playerData.name,
          gamerTag: playerData.gamerTag,
          imageUrl: playerData.imageUrl,
          bio: playerData.bio,
        });
      } else {
        // No player document for this clubId, form will be blank for new entry
        reset({ name: '', gamerTag: '', imageUrl: 'https://placehold.co/300x400.png', bio: '' });
      }
    } catch (err) {
      console.error("Error fetching player/club data:", err);
      const errorMessage = err instanceof Error ? err.message : "No se pudieron cargar los datos.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    if (clubId) {
      fetchClubAndPlayerData(clubId);
    }
  }, [clubId, fetchClubAndPlayerData]);

  const onSubmit: SubmitHandler<PlayerFormData> = async (formData) => {
    if (!clubId) {
        toast({
          title: "Error",
          description: "ID del club no encontrado. No se puede actualizar el jugador.",
          variant: "destructive",
        });
        return;
    }
    const dataWithClubId: UpdatePlayerFormInput = { ...formData, clubId };
    const result = await updatePlayerAction(dataWithClubId);
    
    if (result.success) {
      toast({
        title: "Jugador Guardado",
        description: result.message,
      });
      router.push('/admin/players');
    } else {
      toast({
        title: "Error al Guardar Jugador",
        description: result.message || "No se pudo guardar el jugador.",
        variant: "destructive",
      });
    }
  };
  
  if (isLoading || clubDisplayInfo === undefined) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-288px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-xl text-muted-foreground">Cargando datos del jugador y club...</p>
      </div>
    );
  }

  if (error || !clubDisplayInfo) {
    return (
      <div className="space-y-8 text-center">
         <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin/players">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Volver</span>
              </Link>
            </Button>
            <SectionTitle as="h1" className="mb-0 pb-0 border-none">Error</SectionTitle>
        </div>
        <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
        <p className="text-xl text-destructive font-semibold">Error al Cargar Datos</p>
        <p className="text-muted-foreground">{error || `No se pudo encontrar un club con el ID: ${clubId}`}</p>
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
        <SectionTitle as="h1" className="mb-0 pb-0 border-none">Gestionar Jugador del Club: {clubDisplayInfo.name}</SectionTitle>
      </div>

      <Card className="max-w-2xl mx-auto shadow-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Detalles del Jugador</CardTitle>
            <CardDescription>
              Modifique la información del jugador para el club {clubDisplayInfo.name}. 
              Si no existe un jugador, se creará uno nuevo.
            </CardDescription>
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
              {isSubmitting ? "Guardando..." : "Guardar Jugador"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
