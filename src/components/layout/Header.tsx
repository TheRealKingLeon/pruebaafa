
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Cog } from 'lucide-react';

const navItems = [
  { href: '/', label: 'INICIO' },
  { href: '/results', label: 'RESULTADOS' },
  { href: '/participants', label: 'EQUIPOS' },
  { href: '/competition', label: 'PARTIDOS' },
  { href: '/contact', label: 'CONTACTO' },
  { href: '/admin', label: 'ADMIN', icon: Cog },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex flex-col">
      {/* Full-width Image Banner */}
      <div className="relative h-[200px] w-full group">
        <Image
          src="https://media.discordapp.net/attachments/495662170743242752/1379967831705124884/KGxN1S2rnpwAAAAASUVORK5CYII.png?ex=68422ab1&is=6840d931&hm=088d3adace3baa475d893201620c0ad2cfc82b06ab33ffef9a6b62694579ffcf&=&format=webp&quality=lossless"
          alt="AFA eSports Tournament Banner"
          layout="fill"
          objectFit="cover"
          priority
          data-ai-hint="esports league banner dark"
        />
      </div>

      {/* Desktop Navigation Bar */}
      <nav className="bg-background shadow-lg hidden md:block py-2 border-b-2 border-primary border-t-2">
        <div className="container mx-auto flex items-center justify-center gap-x-3 lg:gap-x-6">
          {navItems.map((item) => (
            <Button
              key={item.label}
              variant="link"
              asChild
              className="text-foreground hover:text-primary font-bold uppercase text-base lg:text-lg tracking-wider px-3 py-2 transition-colors duration-150"
            >
              <Link href={item.href}>
                {item.icon && <item.icon className="mr-2 h-5 w-5" />}
                {item.label}
              </Link>
            </Button>
          ))}
        </div>
      </nav>

      {/* Mobile Navigation Bar - Contains Sheet Trigger */}
      <nav className="md:hidden bg-background shadow-lg py-3 border-b-2 border-primary border-t-2">
        <div className="container mx-auto flex items-center justify-end px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="border-foreground/50">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background p-0 flex flex-col">
              <div className="p-4 border-b border-border">
                <span className="text-xl font-bold font-headline text-primary">Menú</span>
              </div>
              <nav className="flex flex-col gap-1 p-4 flex-grow">
                {navItems.map((item) => (
                  <Button
                    key={item.label}
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-foreground font-bold uppercase text-xl py-3"
                    asChild
                  >
                    <Link href={item.href}>
                      {item.icon && <item.icon className="mr-3 h-5 w-5" />}
                      {item.label}
                    </Link>
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
