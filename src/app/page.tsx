
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { SectionTitle } from '@/components/shared/SectionTitle';
import Link from 'next/link';
import { CheckCircle, CalendarDays, Clock, Swords } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { mockMatches } from '@/data/mock';
import type { Match } from '@/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function HomePage() {
  const upcomingLiveMatches = mockMatches
    .filter(match => match.status === 'upcoming' || match.status === 'live')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // Sort by date
    .slice(0, 5); // Show up to 5 matches

  return (
    <div className="space-y-16 pt-8">

      {/* Próximos Encuentros Carousel */}
      {upcomingLiveMatches.length > 0 && (
        <section className="mb-12">
          <SectionTitle>PRÓXIMOS ENCUENTROS</SectionTitle>
          <Carousel
            opts={{
              align: "start",
              loop: upcomingLiveMatches.length > 2, // Loop only if more than 2 items for better UX with fewer items
            }}
            className="w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto"
          >
            <CarouselContent className="-ml-4">
              {upcomingLiveMatches.map((match) => (
                <CarouselItem key={match.id} className="pl-4 md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <div className="p-1">
                    <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 bg-card/90 backdrop-blur-sm overflow-hidden">
                      <CardContent className="flex flex-col items-center p-4 space-y-3">
                        <div className="flex flex-col items-center text-center">
                          <Image
                            src={match.team1.logoUrl}
                            alt={`${match.team1.name} logo`}
                            width={48}
                            height={48}
                            className="rounded-full object-contain mb-1 border-2 border-card"
                            data-ai-hint={match.team1.name.toLowerCase().includes("river") || match.team1.name.toLowerCase().includes("boca") ? "football club" : "team logo"}
                          />
                          <span className="font-semibold text-sm text-card-foreground truncate w-36">{match.team1.name}</span>
                        </div>

                        <Swords className="h-6 w-6 text-primary my-0.5" />

                        <div className="flex flex-col items-center text-center">
                          <Image
                            src={match.team2.logoUrl}
                            alt={`${match.team2.name} logo`}
                            width={48}
                            height={48}
                            className="rounded-full object-contain mb-1 border-2 border-card"
                            data-ai-hint={match.team2.name.toLowerCase().includes("river") || match.team2.name.toLowerCase().includes("boca") ? "football club" : "team logo"}
                          />
                          <span className="font-semibold text-sm text-card-foreground truncate w-36">{match.team2.name}</span>
                        </div>

                        <Separator className="my-2 w-3/4 bg-border/50" />

                        <div className="text-xs text-muted-foreground space-y-1 text-center">
                            <div className="flex items-center gap-1 justify-center">
                                <CalendarDays className="h-3.5 w-3.5" />
                                <span>{format(new Date(match.date), "EEE dd MMM", { locale: es })}</span>
                            </div>
                            <div className="flex items-center gap-1 justify-center">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{format(new Date(match.date), "HH:mm 'hs'", { locale: es })}</span>
                            </div>
                        </div>
                        
                        <Badge
                          variant={match.status === 'live' ? 'destructive' : 'secondary'}
                          className="mt-2 text-xs px-3 py-1 font-bold"
                        >
                          {match.status === 'live' ? 'EN VIVO' : (match.status === 'upcoming' ? 'PRÓXIMO' : 'FINALIZADO')}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex text-primary hover:text-primary-foreground hover:bg-primary disabled:opacity-30" />
            <CarouselNext className="hidden sm:flex text-primary hover:text-primary-foreground hover:bg-primary disabled:opacity-30" />
          </Carousel>
        </section>
      )}

      {/* El Camino Hacia la Gloria */}
      <section>
        <SectionTitle>El Camino Hacia la Gloria</SectionTitle>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6">
            <p className="text-xl font-semibold leading-relaxed text-foreground">
              ¡La gloria llama a los elegidos! El AFA eSports Showdown es donde la pasión del fútbol argentino trasciende a la arena digital. Los jugadores más brillantes, vistiendo los colores de los clubes más icónicos de AFA, se enfrentan en una contienda épica de pura habilidad, estrategia electrizante y momentos que definirán leyendas. ¡Prepárate para una experiencia inolvidable, donde cada jugada es un paso hacia la inmortalidad!
            </p>
            <ul className="space-y-4">
              {[
                { icon: <CheckCircle className="h-6 w-6 text-primary" />, title: "JUEGO ESTELAR:", description: "FC 25 - ¡La Batalla Definitiva por la Gloria Virtual!" },
                { icon: <CheckCircle className="h-6 w-6 text-primary" />, title: "PLATAFORMA DE CAMPEONES:", description: "Las Consolas vibran con Talento Puro." },
                { icon: <CheckCircle className="h-6 w-6 text-primary" />, title: "FORMATO DE ÉLITE:", description: "Fase de Grupos Explosiva y Playoffs de Infarto hasta la Gran Final." },
                { icon: <CheckCircle className="h-6 w-6 text-primary" />, title: "ASPIRANTES AL TRONO:", description: "64 Gladiadores Digitales representando la Pasión de los Clubes AFA." },
              ].map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  {item.icon}
                  <div>
                    <span className="font-bold text-foreground">{item.title}</span>
                    <p className="text-foreground/90">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg overflow-hidden shadow-md">
            <Image
              src="https://placehold.co/600x400.png"
              alt="FC 25 Gameplay Action"
              width={600}
              height={400}
              className="w-full h-auto object-cover"
              data-ai-hint="esports soccer gameplay"
            />
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center py-10">
        <SectionTitle>¡No te pierdas la acción!</SectionTitle>
        <p className="text-lg mb-6 max-w-xl mx-auto text-muted-foreground">
          Sigue todos los resultados, conoce a los participantes y disfruta de los momentos más destacados del torneo.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-md transform hover:scale-105 transition-transform duration-300">
              <Link href="/results">Ver Resultados</Link>
            </Button>
            <Button size="lg" asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-lg shadow-md transform hover:scale-105 transition-transform duration-300">
              <Link href="/participants">Conocer Jugadores</Link>
            </Button>
        </div>
      </section>
    </div>
  );
}
