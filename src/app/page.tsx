
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionTitle } from '@/components/shared/SectionTitle';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

const staticHeroData = {
  title: "AFA eSports Showdown: ¡La Élite Compite!",
  description: "Vive la emoción del torneo oficial de FC 25 donde los mejores jugadores de Argentina luchan por la gloria.",
  imageUrl: "https://placehold.co/1600x800.png", // Larger, more impactful image
  imageHint: "esports championship stadium",
  buttonText: "Explorar Competición",
  buttonLink: "/competition",
};

export default function HomePage() {
  return (
    <div className="space-y-16"> {/* Increased spacing between sections */}
      {/* Static Hero Section */}
      <section className="relative -mx-4 md:mx-0 h-[70vh] md:h-[calc(100vh-120px)] max-h-[700px] rounded-lg overflow-hidden shadow-2xl flex items-center justify-center">
        <Image
          src={staticHeroData.imageUrl}
          alt={staticHeroData.title}
          layout="fill"
          objectFit="cover"
          priority
          data-ai-hint={staticHeroData.imageHint}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
        <div className="relative z-10 text-center p-8 md:p-16 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-headline mb-6 text-primary-foreground animate-fade-in-down shadow-text-lg">
            {staticHeroData.title}
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl mb-10 text-primary-foreground/90 animate-fade-in-up max-w-3xl mx-auto shadow-text-sm">
            {staticHeroData.description}
          </p>
          <Button 
            size="lg" 
            asChild 
            className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg md:text-xl py-3 px-8 md:py-4 md:px-10 animate-fade-in rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-300"
          >
            <Link href={staticHeroData.buttonLink}>{staticHeroData.buttonText}</Link>
          </Button>
        </div>
      </section>

      {/* El Camino Hacia la Gloria */}
      <section>
        <SectionTitle>El Camino Hacia la Gloria</SectionTitle>
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/80 backdrop-blur-sm">
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
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/80 backdrop-blur-sm">
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
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 bg-card/80 backdrop-blur-sm">
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
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-md transform hover:scale-105 transition-transform duration-300">
              <Link href="/results">Ver Resultados</Link>
            </Button>
            <Button size="lg" asChild variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground rounded-lg shadow-md transform hover:scale-105 transition-transform duration-300">
              <Link href="/participants">Conocer Jugadores</Link>
            </Button>
        </div>
      </section>
    </div>
  );
}
