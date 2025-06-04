import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionTitle } from '@/components/shared/SectionTitle';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary to-blue-700 text-primary-foreground py-20 rounded-lg overflow-hidden shadow-xl">
        <div className="absolute inset-0 opacity-20">
          <Image
            src="https://placehold.co/1200x400.png"
            alt="eSports Arena Background"
            layout="fill"
            objectFit="cover"
            data-ai-hint="esports stadium lights"
          />
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl font-bold font-headline mb-4 animate-fade-in-down">
            AFA eSports Showdown
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto animate-fade-in-up">
            El torneo oficial de FC 25 de la Asociación del Fútbol Argentino. 64 equipos, un solo campeón. ¡Viví la pasión del fútbol virtual!
          </p>
          <div className="space-x-4 animate-fade-in">
            <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/competition">Ver Competición</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Link href="/participants">Conocer Jugadores</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Tournament Overview */}
      <section>
        <SectionTitle>Sobre el Torneo</SectionTitle>
        <Card className="shadow-lg">
          <CardContent className="pt-6 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-lg mb-4">
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
                    <span>{item}</span>
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

      {/* How it Works */}
      <section>
        <SectionTitle>Formato de la Competición</SectionTitle>
        <div className="grid md:grid-cols-2 gap-8">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary">Fase de Grupos</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Los 64 equipos se dividen en 8 grupos de 8. En cada grupo, los equipos compiten en un formato de todos contra todos (Round Robin). Los mejores equipos de cada grupo avanzan a la siguiente fase.
              </p>
              <Image 
                src="https://placehold.co/400x250.png" 
                alt="Group stage diagram" 
                width={400} 
                height={250} 
                className="mt-4 rounded-md mx-auto"
                data-ai-hint="tournament groups chart"
              />
            </CardContent>
          </Card>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary">Playoffs</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                Los clasificados de la fase de grupos se enfrentan en un emocionante cuadro de eliminación directa. Cada partido es crucial en el camino hacia la gran final para coronar al campeón del AFA eSports Showdown.
              </p>
               <Image 
                src="https://placehold.co/400x250.png" 
                alt="Playoff bracket diagram" 
                width={400} 
                height={250} 
                className="mt-4 rounded-md mx-auto"
                data-ai-hint="tournament bracket chart"
              />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="text-center py-10">
        <SectionTitle>¡No te pierdas la acción!</SectionTitle>
        <p className="text-lg mb-6 max-w-xl mx-auto">
          Sigue todos los resultados, conoce a los participantes y disfruta de los momentos más destacados del torneo.
        </p>
        <Button size="lg" asChild className="bg-primary hover:bg-primary/90">
          <Link href="/results">Ver Resultados</Link>
        </Button>
      </section>
    </div>
  );
}
