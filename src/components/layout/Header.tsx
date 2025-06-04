import Link from 'next/link';
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
      {/* Logo Area */}
      <div className="bg-card shadow-sm"> {/* Use shadow-sm for a more subtle shadow */}
        <div className="container mx-auto px-4 py-3 md:py-4 relative">
          <div className="flex justify-center">
            <Link
              href="/"
              className="flex flex-col items-center text-primary hover:text-primary/80 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-12 w-12 md:h-16 md:w-16 fill-current"> {/* Increased logo size */}
                <path d="M50 5C25.2 5 5 25.2 5 50s20.2 45 45 45 45-20.2 45-45S74.8 5 50 5zm0 82c-20.4 0-37-16.6-37-37s16.6-37 37-37 37 16.6 37 37-16.6 37-37 37z"/>
                <path d="M50 20.5c-5.8 0-10.8 3.2-13.4 7.9l6.2 3.5c1.3-2.3 3.8-3.9 6.7-3.9s5.4 1.5 6.7 3.9l6.2-3.5c-2.6-4.7-7.6-7.9-13.4-7.9zM32.5 50c0-3.9 1.5-7.5 3.9-10.2L28 35.1C22.8 40.7 20 48.5 20 57.5c0 2.8.3 5.6.9 8.2L31.6 58c-.4-2.5-.7-5.1-.7-7.7zm35 0c0-2.7-.3-5.2-.7-7.7l10.7-7.7c.6 2.6.9 5.3.9 8.2 0 9-2.8 16.8-8 22.4l-8.4-4.7c2.4-2.7 3.9-6.2 3.9-10zM50 79.5c5.8 0 10.8-3.2 13.4-7.9l-6.2-3.5c-1.3 2.3-3.8 3.9-6.7-3.9s-5.4-1.5-6.7-3.9l-6.2 3.5c2.6 4.7 7.6 7.9 13.4 7.9zM50 42.5c-4.1 0-7.5 3.4-7.5 7.5s3.4 7.5 7.5 7.5 7.5-3.4 7.5-7.5-3.4-7.5-7.5-7.5z"/>
              </svg>
              <span className="text-3xl md:text-4xl font-bold font-headline mt-1"> {/* Increased text size */}
                AFA eSports
              </span>
            </Link>
          </div>
          {/* Mobile Navigation Trigger */}
          <div className="md:hidden absolute top-1/2 -translate-y-1/2 right-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="border-foreground/50">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] bg-background p-0 flex flex-col"> {/* Changed bg-black to bg-background */}
                 <div className="p-4 border-b border-border"> {/* Changed border-gray-700 to border-border */}
                    <Link href="/" className="flex items-center gap-2 text-primary">
                       <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-8 w-8 fill-current">
                          <path d="M50 5C25.2 5 5 25.2 5 50s20.2 45 45 45 45-20.2 45-45S74.8 5 50 5zm0 82c-20.4 0-37-16.6-37-37s16.6-37 37-37 37 16.6 37 37-16.6 37-37 37z"/>
                          <path d="M50 20.5c-5.8 0-10.8 3.2-13.4 7.9l6.2 3.5c1.3-2.3 3.8-3.9 6.7-3.9s5.4 1.5 6.7 3.9l6.2-3.5c-2.6-4.7-7.6-7.9-13.4-7.9zM32.5 50c0-3.9 1.5-7.5 3.9-10.2L28 35.1C22.8 40.7 20 48.5 20 57.5c0 2.8.3 5.6.9 8.2L31.6 58c-.4-2.5-.7-5.1-.7-7.7zm35 0c0-2.7-.3-5.2-.7-7.7l10.7-7.7c.6 2.6.9 5.3.9 8.2 0 9-2.8 16.8-8 22.4l-8.4-4.7c2.4-2.7 3.9-6.2 3.9-10zM50 79.5c5.8 0 10.8-3.2 13.4-7.9l-6.2-3.5c-1.3 2.3-3.8 3.9-6.7-3.9s-5.4-1.5-6.7-3.9l-6.2 3.5c2.6 4.7 7.6 7.9 13.4 7.9zM50 42.5c-4.1 0-7.5 3.4-7.5 7.5s3.4 7.5 7.5 7.5 7.5-3.4 7.5-7.5-3.4-7.5-7.5-7.5z"/>
                        </svg>
                        <span className="text-xl font-bold font-headline">AFA eSports</span>
                    </Link>
                  </div>
                  <nav className="flex flex-col gap-1 p-4 flex-grow">
                    {navItems.map((item) => (
                      <Button
                        key={item.label}
                        variant="ghost"
                        className="w-full justify-start text-muted-foreground hover:text-foreground font-bold uppercase text-xl py-3" /* Increased from text-lg, changed text colors */
                        asChild
                      >
                        <Link href={item.href}>{item.label}</Link>
                      </Button>
                    ))}
                  </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Desktop Navigation Bar - Full Width */}
      <nav className="bg-background shadow-lg hidden md:block py-1 border-t-2 border-accent"> {/* Changed bg-black to bg-background, added border-t-2 border-accent */}
        <div className="container mx-auto flex items-center justify-center gap-x-3 lg:gap-x-5">
          {navItems.map((item) => (
            <Button
              key={item.label}
              variant="link" 
              asChild
              className="text-muted-foreground hover:text-foreground font-bold uppercase text-base lg:text-lg tracking-wider px-3 py-3 transition-colors duration-150" /* Increased from text-sm lg:text-base, changed colors */
            >
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </div>
      </nav>
    </header>
  );
}
