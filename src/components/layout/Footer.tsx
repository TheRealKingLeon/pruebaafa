export function Footer() {
  return (
    <footer className="bg-muted text-muted-foreground border-t">
      <div className="container mx-auto px-4 py-8 text-center">
        <p>&copy; {new Date().getFullYear()} AFA eSports Showdown. Todos los derechos reservados.</p>
        <p className="text-sm mt-2">Organizado por la Asociación del Fútbol Argentino</p>
      </div>
    </footer>
  );
}
