
'use client';

import { useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { importClubsAction, type ClubImportData, type ImportClubResultDetail } from '@/app/admin/clubs/actions';
import { FileText, UploadCloud, Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ImportClubsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

export function ImportClubsDialog({ isOpen, onOpenChange, onImportSuccess }: ImportClubsDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedClubs, setParsedClubs] = useState<ClubImportData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState<ImportClubResultDetail[] | null>(null);
  const [overallStats, setOverallStats] = useState<{ imported: number; skipped: number; errors: number} | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv') {
        toast({
          title: "Archivo Inválido",
          description: "Por favor, selecciona un archivo .csv.",
          variant: "destructive",
        });
        setFile(null);
        setParsedClubs([]);
        return;
      }
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (csvFile: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== ''); // Filter out empty lines
      const clubs: ClubImportData[] = [];
      lines.forEach((line, index) => {
        const parts = line.split(',');
        if (parts.length === 2) {
          const name = parts[0].trim();
          const logoUrl = parts[1].trim();
          if (name && logoUrl) {
            clubs.push({ name, logoUrl });
          } else {
             console.warn(`Línea ${index + 1} del CSV omitida por datos incompletos: "${line}"`);
          }
        } else {
          console.warn(`Línea ${index + 1} del CSV omitida por formato incorrecto (esperadas 2 columnas): "${line}"`);
        }
      });
      setParsedClubs(clubs);
      if (clubs.length === 0 && lines.length > 0) {
         toast({
            title: "Archivo CSV Vacío o Mal Formateado",
            description: "No se detectaron clubes válidos en el archivo. Asegúrate que el formato sea: nombre,url_logo",
            variant: "destructive",
         });
      }
    };
    reader.onerror = () => {
        toast({ title: "Error al Leer Archivo", description: "No se pudo leer el contenido del archivo.", variant: "destructive"});
        setParsedClubs([]);
    }
    reader.readAsText(csvFile);
  };

  const handleImport = async () => {
    if (parsedClubs.length === 0) {
      toast({
        title: "No Hay Clubes para Importar",
        description: "Por favor, selecciona un archivo CSV válido con clubes.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setImportResults(null);
    setOverallStats(null);

    try {
      const result = await importClubsAction(parsedClubs);
      setOverallStats({ imported: result.importedCount, skipped: result.skippedCount, errors: result.errorCount });
      setImportResults(result.details);

      if (result.success || result.importedCount > 0) {
        toast({
          title: "Importación Completada",
          description: `${result.importedCount} clubes importados. ${result.skippedCount > 0 ? `${result.skippedCount} omitidos (ver detalles).` : ''}`,
        });
        if (result.importedCount > 0) {
            onImportSuccess();
        }
      } else {
        toast({
          title: "Importación Fallida o Parcial",
          description: result.message || "Algunos clubes no pudieron ser importados. Revisa los detalles.",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido.";
      toast({
        title: "Error en la Importación",
        description: errorMessage,
        variant: "destructive",
      });
       setOverallStats({ imported: 0, skipped: parsedClubs.length, errors: parsedClubs.length });
       setImportResults(parsedClubs.map((club,idx) => ({lineNumber: idx + 1, clubName: club.name, status: 'error', reason: 'Error general del servidor.'})));
    } finally {
      setIsProcessing(false);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setParsedClubs([]);
    setIsProcessing(false);
    setImportResults(null);
    setOverallStats(null);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      resetDialog();
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UploadCloud className="h-6 w-6 text-primary" />
            Importar Clubes desde CSV
          </DialogTitle>
          <DialogDescription>
            Sube un archivo CSV con los datos de los clubes. El formato debe ser: <code>nombre_del_club,url_del_logo</code> (una entrada por línea, sin encabezados).
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4 flex-grow overflow-y-auto">
          {!importResults ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="csv-file">Archivo CSV</Label>
                <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} className="file:text-primary file:font-semibold" />
              </div>
              {file && (
                <div className="p-3 bg-muted rounded-md text-sm">
                  <p>Archivo seleccionado: <span className="font-semibold">{file.name}</span></p>
                  <p>Clubes detectados: <span className="font-semibold">{parsedClubs.length}</span></p>
                  {parsedClubs.length > 0 && (
                    <ScrollArea className="max-h-32 mt-2 border rounded-md p-2">
                      <ul className="text-xs space-y-1">
                        {parsedClubs.slice(0, 5).map((club, index) => (
                          <li key={index} className="truncate">
                            {index + 1}. {club.name} - {club.logoUrl.substring(0,30)}...
                          </li>
                        ))}
                        {parsedClubs.length > 5 && <li>... y {parsedClubs.length - 5} más.</li>}
                      </ul>
                    </ScrollArea>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
                <h3 className="font-semibold text-lg">Resultados de la Importación</h3>
                {overallStats && (
                    <div className="flex gap-4 text-sm p-3 bg-muted rounded-md">
                        <p><CheckCircle className="inline h-4 w-4 mr-1 text-green-500"/>Importados: <span className="font-bold">{overallStats.imported}</span></p>
                        <p><XCircle className="inline h-4 w-4 mr-1 text-yellow-500"/>Omitidos: <span className="font-bold">{overallStats.skipped}</span></p>
                        <p><AlertTriangle className="inline h-4 w-4 mr-1 text-red-500"/>Errores: <span className="font-bold">{overallStats.errors}</span></p>
                    </div>
                )}
                <ScrollArea className="max-h-60 border rounded-md">
                    <div className="p-3 space-y-2">
                    {importResults.map((result, index) => (
                        <div key={index} className="text-xs p-2 rounded-md border bg-card">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">Línea {result.lineNumber}: {result.clubName || "Nombre Desconocido"}</span>
                                {result.status === 'imported' && <Badge variant="default" className="bg-green-500">Importado</Badge>}
                                {result.status === 'skipped' && <Badge variant="secondary" className="bg-yellow-500 text-black">Omitido</Badge>}
                                {result.status === 'error' && <Badge variant="destructive">Error</Badge>}
                            </div>
                            {result.reason && <p className="text-muted-foreground mt-1">{result.reason}</p>}
                        </div>
                    ))}
                    </div>
                </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t mt-auto">
          <DialogClose asChild>
            <Button variant="outline" onClick={resetDialog}>Cerrar</Button>
          </DialogClose>
          <Button onClick={handleImport} disabled={isProcessing || parsedClubs.length === 0 || !!importResults}>
            {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileText className="mr-2 h-5 w-5" />}
            {isProcessing ? "Importando..." : (importResults ? "Importación Finalizada" : "Iniciar Importación")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
