
'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { SectionTitle } from '@/components/shared/SectionTitle';
import Link from 'next/link';
import { CalendarDays, Clock, Swords, Info, Gamepad2, Trophy, Users, BarChart3 } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { mockMatches, mockGroups } from '@/data/mock'; 
import type { Match, StandingEntry, Group as GroupType } from '@/types'; 
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [upcomingLiveMatches, setUpcomingLiveMatches] = useState<Match[]>([]);
  const [currentTimestamp, setCurrentTimestamp] = useState(new Date().toISOString());

  useEffect(() => {
    setUpcomingLiveMatches(
      mockMatches
        .filter(match => new Date(match.date) >= new Date(currentTimestamp) || match.status === 'live')
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    );
    
    const interval = setInterval(() => {
      setCurrentTimestamp(new Date().toISOString());
    }, 60000);
    return () => clearInterval(interval);
  }, [currentTimestamp]);


  return (
    <div className="space-y-16 pt-8">

      {upcomingLiveMatches.length > 0 && (
        <section className="mb-12">
          <SectionTitle>PRÓXIMOS ENCUENTROS</SectionTitle>
          <Carousel
            opts={{
              align: "start",
              loop: upcomingLiveMatches.length > 5, 
            }}
            className="w-full max-w-xs sm:max-w-md md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {upcomingLiveMatches.map((match) => (
                <CarouselItem key={match.id} className="pl-2 md:pl-4 basis-full xs:basis-1/2 sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                  <div className="p-1">
                    <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 bg-card/90 backdrop-blur-sm overflow-hidden">
                      <CardContent className="p-3 space-y-2">
                        {(match.groupName || match.roundName) && (
                          <p className="text-[10px] font-semibold text-primary mb-1 text-center uppercase tracking-wider">
                            {match.groupName || match.roundName} {match.matchday && `- Fecha ${match.matchday}`}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between space-x-2">
                          <div className="flex flex-col items-center text-center w-2/5">
                            <Image
                              src={match.team1.logoUrl}
                              alt={`${match.team1.name} logo`}
                              width={36}
                              height={36}
                              className="rounded-full object-contain mb-0.5 border border-card"
                              data-ai-hint={match.team1.name.toLowerCase().includes("river") || match.team1.name.toLowerCase().includes("boca") ? "football club" : "team logo"}
                            />
                            <span className="font-semibold text-[10px] text-card-foreground truncate w-20">{match.team1.name}</span>
                          </div>

                          <Swords className="h-4 w-4 text-primary shrink-0" />

                          <div className="flex flex-col items-center text-center w-2/5">
                            <Image
                              src={match.team2.logoUrl}
                              alt={`${match.team2.name} logo`}
                              width={36}
                              height={36}
                              className="rounded-full object-contain mb-0.5 border border-card"
                              data-ai-hint={match.team2.name.toLowerCase().includes("river") || match.team2.name.toLowerCase().includes("boca") ? "football club" : "team logo"}
                            />
                            <span className="font-semibold text-[10px] text-card-foreground truncate w-20">{match.team2.name}</span>
                          </div>
                        </div>

                        <Separator className="my-1 w-3/4 mx-auto bg-border/50" />

                        <div className="text-[10px] text-muted-foreground space-y-0.5 text-center">
                            <div className="flex items-center gap-1 justify-center">
                                <CalendarDays className="h-2.5 w-2.5" />
                                <span>{format(new Date(match.date), "dd MMM", { locale: es })}</span>
                            </div>
                            <div className="flex items-center gap-1 justify-center">
                                <Clock className="h-2.5 w-2.5" />
                                <span>{format(new Date(match.date), "HH:mm'hs'", { locale: es })}</span>
                            </div>
                        </div>
                        
                        <Badge
                          variant={match.status === 'live' ? 'destructive' : 'secondary'}
                          className="mt-1 text-[9px] px-1.5 py-0.5 font-bold w-full justify-center"
                        >
                          {match.status === 'live' ? 'EN VIVO' : (match.status === 'upcoming' ? 'PRÓXIMO' : 'FINALIZADO')}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden sm:flex text-primary hover:text-primary-foreground hover:bg-primary disabled:opacity-30 scale-75 -left-1 md:-left-3" />
            <CarouselNext className="hidden sm:flex text-primary hover:text-primary-foreground hover:bg-primary disabled:opacity-30 scale-75 -right-1 md:-right-3" />
          </Carousel>
        </section>
      )}

      {/* El Camino Hacia la Gloria & Standings */}
      <section>
        <div className="grid md:grid-cols-2 gap-x-10 gap-y-8 items-center">
          <div className="space-y-6 md:sticky md:top-24">
            <SectionTitle as="h2">EL CAMINO HACIA LA GLORIA</SectionTitle>
            <p className="text-xl font-semibold leading-relaxed text-foreground">
              ¡LA ARENA DIGITAL TE ESPERA! El <span className="text-primary font-bold">AFA eSports Showdown</span> es donde la pasión del fútbol argentino se fusiona con la adrenalina de los eSports. Los jugadores más brillantes, defendiendo los colores de los clubes más emblemáticos de AFA, se enfrentan en una batalla épica de habilidad pura, estrategia electrizante y momentos que forjarán leyendas. ¡Prepárate para una experiencia inolvidable donde cada jugada es un paso hacia la inmortalidad!
            </p>
            <ul className="space-y-4">
              {[
                { icon: <Gamepad2 className="h-6 w-6 text-primary" />, title: "JUEGO ESTELAR:", description: "FC 25 - ¡La Batalla Definitiva por la Gloria Virtual!" },
                { icon: <Trophy className="h-6 w-6 text-primary" />, title: "PLATAFORMA DE CAMPEONES:", description: "Las Consolas vibran con Talento Puro." },
                { icon: <Info className="h-6 w-6 text-primary" />, title: "FORMATO DE ÉLITE:", description: "Fase de Grupos Explosiva y Playoffs de Infarto hasta la Gran Final." },
                { icon: <Users className="h-6 w-6 text-primary" />, title: "ASPIRANTES AL TRONO:", description: "64 Gladiadores Digitales representando la Pasión de los Clubes AFA." },
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
          
          <div className="rounded-lg shadow-lg bg-card text-card-foreground overflow-hidden">
            <CardHeader className="bg-muted/50 p-4 border-b border-border">
              <CardTitle className="text-xl font-headline text-primary flex items-center gap-2">
                <BarChart3 className="h-6 w-6" />
                Posiciones
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Tabs defaultValue={mockGroups[0]?.id || 'group-a'} className="w-full">
                <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 rounded-none border-b border-border bg-muted/30">
                  {mockGroups.map((group: GroupType) => (
                    <TabsTrigger 
                      key={group.id} 
                      value={group.id}
                      className="text-xs sm:text-sm rounded-none data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-none focus-visible:ring-offset-0 focus-visible:ring-primary text-center py-2.5"
                    >
                      {group.name} 
                    </TabsTrigger>
                  ))}
                </TabsList>
                {mockGroups.map((group: GroupType) => (
                  <TabsContent key={group.id} value={group.id} className="m-0">
                    <div className="overflow-x-auto">
                      <Table className="min-w-full">
                        <TableHeader className="bg-secondary/30">
                          <TableRow className="border-border">
                            <TableHead className="px-2 py-3.5 text-center w-8">Pos</TableHead>
                            <TableHead className="px-2 py-3.5 min-w-[150px]">Club</TableHead>
                            <TableHead className="px-2 py-3.5 text-center">PTS</TableHead>
                            <TableHead className="px-2 py-3.5 text-center">PJ</TableHead>
                            <TableHead className="px-2 py-3.5 text-center">G</TableHead>
                            <TableHead className="px-2 py-3.5 text-center">E</TableHead>
                            <TableHead className="px-2 py-3.5 text-center">P</TableHead>
                            <TableHead className="px-2 py-3.5 text-center">GF</TableHead>
                            <TableHead className="px-2 py-3.5 text-center">GC</TableHead>
                            <TableHead className="px-2 py-3.5 text-center">DG</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.standings.map((entry: StandingEntry) => (
                            <TableRow key={entry.team.id} className="border-border hover:bg-muted/20">
                              <TableCell className="px-2 py-3.5 text-center font-medium">{entry.position}</TableCell>
                              <TableCell className="px-2 py-3.5">
                                <div className="flex items-center gap-2">
                                  <Image 
                                    src={entry.team.logoUrl} 
                                    alt={`${entry.team.name} logo`} 
                                    width={20} 
                                    height={20} 
                                    className="object-contain"
                                    data-ai-hint={entry.team.name.toLowerCase().includes("river") || entry.team.name.toLowerCase().includes("boca") ? "football club" : "team logo"}
                                  />
                                  <span className="text-sm truncate max-w-[120px] sm:max-w-none">{entry.team.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="px-2 py-3.5 text-center font-bold text-primary">{entry.points}</TableCell>
                              <TableCell className="px-2 py-3.5 text-center">{entry.played}</TableCell>
                              <TableCell className="px-2 py-3.5 text-center">{entry.won}</TableCell>
                              <TableCell className="px-2 py-3.5 text-center">{entry.drawn}</TableCell>
                              <TableCell className="px-2 py-3.5 text-center">{entry.lost}</TableCell>
                              <TableCell className="px-2 py-3.5 text-center">{entry.goalsFor}</TableCell>
                              <TableCell className="px-2 py-3.5 text-center">{entry.goalsAgainst}</TableCell>
                              <TableCell className="px-2 py-3.5 text-center">{entry.goalDifference}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
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
