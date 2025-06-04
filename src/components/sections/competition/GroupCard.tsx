import Image from 'next/image';
import type { Group, Team } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';

interface GroupCardProps {
  group: Group;
}

export function GroupCard({ group }: GroupCardProps) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="bg-muted/50">
        <CardTitle className="flex items-center gap-2 text-xl font-headline text-primary">
          <Users className="h-6 w-6" />
          {group.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <ul className="space-y-3">
          {group.teams.map((team: Team) => (
            <li key={team.id} className="flex items-center justify-between p-2 rounded-md hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <Image
                  src={team.logoUrl}
                  alt={`${team.name} logo`}
                  width={32}
                  height={32}
                  className="rounded-full object-contain"
                  data-ai-hint={team.name.toLowerCase().includes("river") || team.name.toLowerCase().includes("boca") ? "football club" : "team logo"}
                />
                <span className="font-medium">{team.name}</span>
              </div>
              <span className="text-sm text-muted-foreground">{team.player.gamerTag}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
