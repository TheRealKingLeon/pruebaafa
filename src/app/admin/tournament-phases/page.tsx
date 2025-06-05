
'use client';

import { SectionTitle } from '@/components/shared/SectionTitle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GroupManagementClient } from './GroupManagementClient';
import { PlayoffManagementClient } from './PlayoffManagementClient';
import { TournamentRulesClient } from './TournamentRulesClient'; // Import the new client component
import { LayoutGrid, Trophy, SlidersHorizontal } from 'lucide-react'; // Added SlidersHorizontal

export default function TournamentPhasesPage() {
  return (
    <div className="space-y-8">
      <SectionTitle>Gestión de Fases del Torneo</SectionTitle>
      <p className="text-muted-foreground">
        Selecciona la fase del torneo que deseas configurar o gestionar.
      </p>
      <Tabs defaultValue="group-stage" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 mx-auto"> {/* Adjusted grid-cols for 3 tabs */}
          <TabsTrigger value="group-stage">
            <LayoutGrid className="mr-2 h-5 w-5" />
            Fase de Grupos
          </TabsTrigger>
          <TabsTrigger value="playoffs">
            <Trophy className="mr-2 h-5 w-5" />
            Playoffs
          </TabsTrigger>
          <TabsTrigger value="rules-config"> {/* New Trigger */}
            <SlidersHorizontal className="mr-2 h-5 w-5" /> {/* New Icon */}
            Configuración de Reglas
          </TabsTrigger>
        </TabsList>
        <TabsContent value="group-stage" className="mt-6">
          <GroupManagementClient />
        </TabsContent>
        <TabsContent value="playoffs" className="mt-6">
          <PlayoffManagementClient />
        </TabsContent>
        <TabsContent value="rules-config" className="mt-6"> {/* New Content */}
          <TournamentRulesClient />
        </TabsContent>
      </Tabs>
    </div>
  );
}
