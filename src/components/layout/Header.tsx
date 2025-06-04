import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Inicio' },
  { href: '/competition', label: 'Competición' },
  { href: '/participants', label: 'Participantes' },
  { href: '/results', label: 'Resultados' },
  { href: '/highlights', label: 'Destacados IA' },
  { href: '/contact', label: 'Contacto' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50">
      {/* Full-width Image Banner */}
      <div className="relative h-[300px] md:h-[400px] w-full group">
        <Image
          src="https://placehold.co/1920x400.png"
          alt="AFA eSports Tournament Banner"
          layout="fill"
          objectFit="cover"
          priority
          data-ai-hint="esports tournament banner"
        />
        {/* Gradient overlay removed as logo is removed */}
        {/* <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent flex flex-col items-center justify-center p-4"> */}
          {/* Logo removed from here */}
        {/* </div> */}
      </div>

      {/* Desktop Navigation Bar */}
      <nav className="bg-background shadow-lg hidden md:block py-3 border-b-2 border-accent">
        <div className="container mx-auto flex items-center justify-center gap-x-3 lg:gap-x-5">
          {navItems.map((item) => (
            <Button
              key={item.label}
              variant="link"
              asChild
              className="text-muted-foreground hover:text-foreground font-bold uppercase text-base lg:text-lg tracking-wider px-3 py-3 transition-colors duration-150"
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </div>
      </nav>

      {/* Mobile Navigation Bar - Contains Sheet Trigger */}
      <nav className="md:hidden bg-background shadow-lg py-3 border-b-2 border-accent">
        <div className="container mx-auto flex items-center justify-end px-4"> {/* Changed to justify-end */}
          {/* Simplified text logo removed */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="border-foreground/50">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background p-0 flex flex-col">
              <div className="p-4 border-b border-border">
                {/* Logo removed from sheet header */}
                <span className="text-xl font-bold font-headline text-primary">Menú</span> {/* Added a simple Menu title */}
              </div>
              <nav className="flex flex-col gap-1 p-4 flex-grow">
                {navItems.map((item) => (
                  <Button
                    key={item.label}
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-foreground font-bold uppercase text-xl py-3"
                    asChild
                  >
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
