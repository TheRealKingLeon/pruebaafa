
'use client';

import { SectionTitle } from '@/components/shared/SectionTitle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GroupManagementClient } from './GroupManagementClient';
import { PlayoffManagementClient } from './PlayoffManagementClient';
import { LayoutGrid, Trophy } from 'lucide-react';

export default function TournamentPhasesPage() {
  return (
    <div className="space-y-8">
      <SectionTitle>Gestión de Fases del Torneo</SectionTitle>
      <p className="text-muted-foreground">
        Selecciona la fase del torneo que deseas configurar o gestionar.
      </p>
      <Tabs defaultValue="group-stage" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-1/2 mx-auto">
          <TabsTrigger value="group-stage">
            <LayoutGrid className="mr-2 h-5 w-5" />
            Fase de Grupos
          </TabsTrigger>
          <TabsTrigger value="playoffs">
            <Trophy className="mr-2 h-5 w-5" />
            Playoffs
          </TabsTrigger>
        </TabsList>
        <TabsContent value="group-stage" className="mt-6">
          <GroupManagementClient />
        </TabsContent>
        <TabsContent value="playoffs" className="mt-6">
          <PlayoffManagementClient />
        </TabsContent>
      </Tabs>
    </div>
  );
}
