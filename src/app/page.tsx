
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { SectionTitle } from '@/components/shared/SectionTitle';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-16 pt-8"> {/* Added pt-8 to avoid overlap with sticky header */}
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
