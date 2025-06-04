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
    <header className="bg-card border-b sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="relative flex items-center justify-center h-12 md:h-14">
          <Link
            href="/"
            className="text-primary hover:text-primary/80 transition-colors text-3xl md:text-4xl font-bold font-headline"
          >
            AFA eSports
          </Link>
          <div className="md:hidden absolute right-0 top-1/2 -translate-y-1/2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <nav className="flex flex-col gap-4 mt-8">
                  {navItems.map((item) => (
                    <Button
                      key={item.label}
                      variant="ghost"
                      className="w-full justify-start"
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
        <nav className="hidden md:flex gap-4 justify-center mt-2">
          {navItems.map((item) => (
            <Button key={item.label} variant="ghost" asChild>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
