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
    <header className="bg-card border-b sticky top-0 z-50 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20 md:h-24"> {/* Increased height for more presence */}
          <Link
            href="/"
            className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="h-10 w-10 md:h-12 md:w-12 fill-current">
              <path d="M50 5C25.2 5 5 25.2 5 50s20.2 45 45 45 45-20.2 45-45S74.8 5 50 5zm0 82c-20.4 0-37-16.6-37-37s16.6-37 37-37 37 16.6 37 37-16.6 37-37 37z"/>
              <path d="M50 20.5c-5.8 0-10.8 3.2-13.4 7.9l6.2 3.5c1.3-2.3 3.8-3.9 6.7-3.9s5.4 1.5 6.7 3.9l6.2-3.5c-2.6-4.7-7.6-7.9-13.4-7.9zM32.5 50c0-3.9 1.5-7.5 3.9-10.2L28 35.1C22.8 40.7 20 48.5 20 57.5c0 2.8.3 5.6.9 8.2L31.6 58c-.4-2.5-.7-5.1-.7-7.7zm35 0c0-2.7-.3-5.2-.7-7.7l10.7-7.7c.6 2.6.9 5.3.9 8.2 0 9-2.8 16.8-8 22.4l-8.4-4.7c2.4-2.7 3.9-6.2 3.9-10zM50 79.5c5.8 0 10.8-3.2 13.4-7.9l-6.2-3.5c-1.3 2.3-3.8 3.9-6.7-3.9s-5.4-1.5-6.7-3.9l-6.2 3.5c2.6 4.7 7.6 7.9 13.4 7.9zM50 42.5c-4.1 0-7.5 3.4-7.5 7.5s3.4 7.5 7.5 7.5 7.5-3.4 7.5-7.5-3.4-7.5-7.5-7.5z"/>
            </svg>
            <span className="text-2xl md:text-3xl font-bold font-headline"> {/* Slightly larger title */}
              AFA eSports
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <Button key={item.label} variant="ghost" asChild className="text-sm font-medium text-foreground/80 hover:text-primary">
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
            <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground ml-2 rounded-md" size="sm">
              <Link href="/competition">Ver Torneos</Link>
            </Button>
          </nav>

          {/* Mobile Navigation Trigger */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="border-foreground/50">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] bg-card"> {/* Custom width and bg for mobile sheet */}
                 <div className="flex flex-col h-full">
                  <div className="p-4 border-b border-border">
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
                        className="w-full justify-start text-md py-3"
                        asChild
                      >
                        <Link href={item.href}>{item.label}</Link>
                      </Button>
                    ))}
                  </nav>
                  <div className="p-4 mt-auto border-t border-border">
                     <Button asChild className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-md py-3">
                        <Link href="/competition">Ver Torneos</Link>
                      </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
