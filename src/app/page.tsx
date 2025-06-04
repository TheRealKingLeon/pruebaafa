
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionTitle } from '@/components/shared/SectionTitle';
import Link from 'next/link';
import { CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const heroSlides = [
  {
    title: "AFA eSports Showdown: ¡La Élite Compite!",
    description: "Vive la emoción del torneo oficial de FC 25 donde los mejores jugadores de Argentina luchan por la gloria.",
    imageUrl: "https://placehold.co/1200x500.png",
    imageHint: "esports championship game",
    buttonText: "Explorar Competición",
    buttonLink: "/competition",
  },
  {
    title: "Descubre los Talentos Argentinos de FC 25",
    description: "Conoce a las estrellas emergentes y a los veteranos consagrados que representan a sus clubes.",
    imageUrl: "https://placehold.co/1200x500.png",
    imageHint: "esports player profile",
    buttonText: "Ver Participantes",
    buttonLink: "/participants",
  },
  {
    title: "Sigue Cada Partido y Resultado",
    description: "No te pierdas ni un gol. Resultados actualizados, estadísticas y el camino a la final.",
    imageUrl: "https://placehold.co/1200x500.png",
    imageHint: "live match scoreboard",
    buttonText: "Consultar Resultados",
    buttonLink: "/results",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section with Carousel */}
      <section className="relative -mx-4 md:mx-0">
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
          data-testid="hero-carousel"
        >
          <CarouselContent className="h-[60vh] md:h-[500px]"> {/* Adjusted height */}
            {heroSlides.map((slide, index) => (
              <CarouselItem key={index}>
                <div className="relative h-full w-full rounded-lg overflow-hidden shadow-xl">
                  <Image
                    src={slide.imageUrl}
                    alt={slide.title}
                    layout="fill"
                    objectFit="cover"
                    priority={index === 0}
                    data-ai-hint={slide.imageHint}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent flex flex-col items-center justify-end text-center p-8 md:p-16">
                    <h1 className="text-3xl md:text-5xl font-bold font-headline mb-4 text-primary-foreground animate-fade-in-down">
                      {slide.title}
                    </h1>
                    <p className="text-md md:text-lg mb-8 max-w-2xl mx-auto text-primary-foreground/90 animate-fade-in-up">
                      {slide.description}
                    </p>
                    <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground animate-fade-in">
                      <Link href={slide.buttonLink}>{slide.buttonText}</Link>
                    </Button>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-10 h-10 w-10 md:h-12 md:w-12 bg-background/60 hover:bg-background/80 text-foreground" />
          <CarouselNext className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-10 h-10 w-10 md:h-12 md:w-12 bg-background/60 hover:bg-background/80 text-foreground" />
        </Carousel>
      </section>

      {/* El Camino Hacia la Gloria */}
      <section>
        <SectionTitle>El Camino Hacia la Gloria</SectionTitle>
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary">Fase de Grupos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Los 64 equipos se dividen en 8 grupos de 8. En cada grupo, los equipos compiten en un formato de todos contra todos (Round Robin). Los mejores equipos de cada grupo avanzan a la siguiente fase.
              </p>
              <Image 
                src="https://placehold.co/400x250.png" 
                alt="Diagrama de fase de grupos" 
                width={400} 
                height={250} 
                className="mt-4 rounded-md mx-auto shadow-md"
                data-ai-hint="tournament groups chart"
              />
            </CardContent>
          </Card>
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary">Playoffs</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Los clasificados de la fase de grupos se enfrentan en un emocionante cuadro de eliminación directa. Cada partido es crucial en el camino hacia la gran final para coronar al campeón del AFA eSports Showdown.
              </p>
               <Image 
                src="https://placehold.co/400x250.png" 
                alt="Diagrama de bracket de playoffs" 
                width={400} 
                height={250} 
                className="mt-4 rounded-md mx-auto shadow-md"
                data-ai-hint="tournament bracket chart"
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Sobre el Torneo */}
      <section>
        <SectionTitle>Sobre el Torneo</SectionTitle>
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardContent className="pt-6 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-lg mb-4 text-muted-foreground">
                El AFA eSports Showdown es la competencia cumbre de FC 25 en Argentina, donde los mejores jugadores representan a los clubes más emblemáticos del país. Prepárate para vivir la emoción, la habilidad y la estrategia en cada partido.
              </p>
              <ul className="space-y-3">
                {[
                  "Juego: FC 25 (Última Edición)",
                  "Plataforma: Multiplataforma (Consolas Principales)",
                  "Formato: Fase de Grupos (Round Robin) y Playoffs",
                  "Participantes: 64 jugadores representando a clubes de AFA",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-accent" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg overflow-hidden shadow-md">
              <Image
                src="https://placehold.co/600x400.png"
                alt="FC 25 Gameplay"
                width={600}
                height={400}
                className="w-full h-auto object-cover"
                data-ai-hint="soccer video game"
              />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Call to Action */}
      <section className="text-center py-10">
        <SectionTitle>¡No te pierdas la acción!</SectionTitle>
        <p className="text-lg mb-6 max-w-xl mx-auto text-muted-foreground">
          Sigue todos los resultados, conoce a los participantes y disfruta de los momentos más destacados del torneo.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/results">Ver Resultados</Link>
            </Button>
            <Button size="lg" asChild variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
              <Link href="/participants">Conocer Jugadores</Link>
            </Button>
        </div>
      </section>
    </div>
  );
}
