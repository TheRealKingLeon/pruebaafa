
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SectionTitle } from '@/components/shared/SectionTitle';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-16 pt-8"> {/* Added pt-8 to avoid overlap with sticky header */}
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
                    <CheckCircle className="h-5 w-5 text-primary" />
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
            <Button size="lg" asChild variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground rounded-lg shadow-md transform hover:scale-105 transition-transform duration-300">
              <Link href="/participants">Conocer Jugadores</Link>
            </Button>
        </div>
      </section>
    </div>
  );
}
