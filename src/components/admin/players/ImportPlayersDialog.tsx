
'use client';

import { useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { importPlayersAction, type PlayerImportData, type ImportPlayersResultDetail } from '@/app/admin/players/actions'; // Adjusted path
import { FileText, UploadCloud, Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface ImportPlayersDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onImportSuccess: () => void;
}

export function ImportPlayersDialog({ isOpen, onOpenChange, onImportSuccess }: ImportPlayersDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedPlayers, setParsedPlayers] = useState<PlayerImportData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importResults, setImportResults] = useState<ImportPlayersResultDetail[] | null>(null);
  const [overallStats, setOverallStats] = useState<{ imported: number; updated: number; skipped: number; errors: number} | null>(null);
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
        setParsedPlayers([]);
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
      const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
      const players: PlayerImportData[] = [];
      lines.forEach((line, index) => {
        const parts = line.split(',');
        // Expecting 5 or 6 columns: clubId,name,gamerTag,imageUrl,bio,[favoriteFormation]
        if (parts.length >= 5 && parts.length <= 6) { 
          const [clubId, name, gamerTag, imageUrl, bio, favoriteFormation] = parts.map(p => p.trim());
          if (clubId && name && gamerTag && imageUrl && bio) {
            players.push({ clubId, name, gamerTag, imageUrl, bio, favoriteFormation: favoriteFormation || undefined });
          } else {
             console.warn(`Línea ${index + 1} del CSV de jugadores omitida por datos incompletos: "${line}"`);
          }
        } else {
          console.warn(`Línea ${index + 1} del CSV de jugadores omitida por formato incorrecto (esperadas 5 o 6 columnas, se encontraron ${parts.length}): "${line}"`);
        }
      });
      setParsedPlayers(players);
      if (players.length === 0 && lines.length > 0) {
         toast({
            title: "Archivo CSV de Jugadores Vacío o Mal Formateado",
            description: "No se detectaron jugadores válidos. Formato: clubId,nombre,gamerTag,imageUrl,bio[,formacionFavorita]",
            variant: "destructive",
         });
      }
    };
    reader.onerror = () => {
        toast({ title: "Error al Leer Archivo", description: "No se pudo leer el contenido del archivo.", variant: "destructive"});
        setParsedPlayers([]);
    }
    reader.readAsText(csvFile);
  };

  const handleImport = async () => {
    if (parsedPlayers.length === 0) {
      toast({
        title: "No Hay Jugadores para Importar",
        description: "Por favor, selecciona un archivo CSV válido con jugadores.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setImportResults(null);
    setOverallStats(null);

    try {
      const result = await importPlayersAction(parsedPlayers);
      setOverallStats({ 
        imported: result.importedCount, 
        updated: result.updatedCount, 
        skipped: result.skippedCount, 
        errors: result.errorCount 
      });
      setImportResults(result.details);

      if (result.success || result.importedCount > 0 || result.updatedCount > 0) {
        toast({
          title: "Importación de Jugadores Procesada",
          description: `${result.importedCount} jugadores importados, ${result.updatedCount} actualizados. ${result.skippedCount > 0 ? `${result.skippedCount} omitidos.` : ''} ${result.errorCount > 0 ? `${result.errorCount} con errores.` : ''}`,
        });
        if (result.importedCount > 0 || result.updatedCount > 0) {
            onImportSuccess();
        }
      } else {
        toast({
          title: "Importación de Jugadores Fallida",
          description: result.message || "Ningún jugador pudo ser procesado. Revisa los detalles.",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido.";
      toast({
        title: "Error en la Importación de Jugadores",
        description: errorMessage,
        variant: "destructive",
      });
       setOverallStats({ imported: 0, updated: 0, skipped: parsedPlayers.length, errors: parsedPlayers.length });
       setImportResults(parsedPlayers.map((player,idx) => ({
           lineNumber: idx + 1, 
           playerName: player.name, 
           clubId: player.clubId, 
           status: 'error', 
           reason: 'Error general del servidor.'
        })));
    } finally {
      setIsProcessing(false);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setParsedPlayers([]);
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
            Importar Jugadores desde CSV
          </DialogTitle>
          <DialogDescription>
            Sube un archivo CSV. Formato: <code>clubId,nombre_jugador,gamerTag,imageUrl,bio,formacionFavorita(opcional)</code>.
            Una entrada por línea, sin encabezados. El <code>clubId</code> debe existir previamente en la base de datos.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4 flex-grow overflow-y-auto">
          {!importResults ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="csv-player-file">Archivo CSV de Jugadores</Label>
                <Input id="csv-player-file" type="file" accept=".csv" onChange={handleFileChange} className="file:text-primary file:font-semibold" />
              </div>
              {file && (
                <div className="p-3 bg-muted rounded-md text-sm">
                  <p>Archivo seleccionado: <span className="font-semibold">{file.name}</span></p>
                  <p>Jugadores detectados: <span className="font-semibold">{parsedPlayers.length}</span></p>
                  {parsedPlayers.length > 0 && (
                    <ScrollArea className="max-h-32 mt-2 border rounded-md p-2">
                      <ul className="text-xs space-y-1">
                        {parsedPlayers.slice(0, 5).map((player, index) => (
                          <li key={index} className="truncate">
                            {index + 1}. Club: {player.clubId}, Jugador: {player.name}, Tag: @{player.gamerTag}
                          </li>
                        ))}
                        {parsedPlayers.length > 5 && <li>... y {parsedPlayers.length - 5} más.</li>}
                      </ul>
                    </ScrollArea>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
                <h3 className="font-semibold text-lg">Resultados de la Importación de Jugadores</h3>
                {overallStats && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm p-3 bg-muted rounded-md">
                        <p><CheckCircle className="inline h-4 w-4 mr-1 text-green-500"/>Importados: <span className="font-bold">{overallStats.imported}</span></p>
                        <p><CheckCircle className="inline h-4 w-4 mr-1 text-blue-500"/>Actualizados: <span className="font-bold">{overallStats.updated}</span></p>
                        <p><XCircle className="inline h-4 w-4 mr-1 text-yellow-500"/>Omitidos: <span className="font-bold">{overallStats.skipped}</span></p>
                        <p><AlertTriangle className="inline h-4 w-4 mr-1 text-red-500"/>Errores: <span className="font-bold">{overallStats.errors}</span></p>
                    </div>
                )}
                <ScrollArea className="max-h-60 border rounded-md">
                    <div className="p-3 space-y-2">
                    {importResults.map((result, index) => (
                        <div key={index} className="text-xs p-2 rounded-md border bg-card">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold">Línea {result.lineNumber}: {result.playerName || "Jugador Desconocido"} (Club: {result.clubId || "ID Club Desconocido"})</span>
                                {result.status === 'imported' && <Badge variant="default" className="bg-green-500 text-white">Importado</Badge>}
                                {result.status === 'updated' && <Badge variant="default" className="bg-blue-500 text-white">Actualizado</Badge>}
                                {result.status === 'error' && <Badge variant="destructive">Error</Badge>}
                                {/* Skipped status was not in ImportPlayersResultDetail, if needed, add it and uncomment:
                                {result.status === 'skipped' && <Badge variant="secondary" className="bg-yellow-500 text-black">Omitido</Badge>}
                                */}
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
          <Button onClick={handleImport} disabled={isProcessing || parsedPlayers.length === 0 || !!importResults}>
            {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileText className="mr-2 h-5 w-5" />}
            {isProcessing ? "Procesando..." : (importResults ? "Importación Finalizada" : "Iniciar Importación")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
