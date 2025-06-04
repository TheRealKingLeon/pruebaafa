
import { SectionTitle } from '@/components/shared/SectionTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import Image from 'next/image';

export default function ContactPage() {
  // Placeholder for form submission
  async function handleSubmit(formData: FormData) {
    "use server";
    // Logic to handle form submission, e.g., send an email or save to database
    // For now, we'll just log it.
    console.log("Form submitted!");
    console.log("Name:", formData.get("name"));
    console.log("Email:", formData.get("email"));
    console.log("Message:", formData.get("message"));
    // Redirect or show a success message
  }

  return (
    <div className="space-y-12">
      <SectionTitle>Contacto</SectionTitle>
      
      <div className="grid md:grid-cols-2 gap-10">
        {/* Contact Information */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start gap-4">
              <MapPin className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Dirección</h3>
                <p className="text-muted-foreground">Viamonte 1366, CABA, Argentina</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Mail className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Correo Electrónico</h3>
                <p className="text-muted-foreground">
                  <a href="mailto:esports@afa.com.ar" className="hover:text-primary transition-colors">
                    esports@afa.com.ar
                  </a>
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">Teléfono</h3>
                <p className="text-muted-foreground">+54 11 1234-5678</p>
              </div>
            </div>
            <div className="mt-6 rounded-lg overflow-hidden shadow-md">
               <Image 
                src="https://placehold.co/600x300.png" 
                alt="AFA Headquarters or eSports event" 
                width={600} 
                height={300} 
                className="w-full h-auto object-cover"
                data-ai-hint="office building esports"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">Envíanos un Mensaje</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="font-medium">Nombre Completo</Label>
                <Input type="text" id="name" name="name" required className="mt-1" placeholder="Tu Nombre"/>
              </div>
              <div>
                <Label htmlFor="email" className="font-medium">Correo Electrónico</Label>
                <Input type="email" id="email" name="email" required className="mt-1" placeholder="tuemail@ejemplo.com"/>
              </div>
              <div>
                <Label htmlFor="subject" className="font-medium">Asunto</Label>
                <Input type="text" id="subject" name="subject" required className="mt-1" placeholder="Asunto del mensaje"/>
              </div>
              <div>
                <Label htmlFor="message" className="font-medium">Mensaje</Label>
                <Textarea id="message" name="message" rows={5} required className="mt-1 resize-none" placeholder="Escribe tu mensaje aquí..."/>
              </div>
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                <Send className="mr-2 h-4 w-4" /> Enviar Mensaje
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
