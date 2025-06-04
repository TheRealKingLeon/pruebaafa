import type { Team, Group, Match, PlayoffRound, Player } from '@/types';

const generatePlayer = (id: string, name: string, clubId: string): Player => ({
  id: `player-${id}`,
  name: name,
  gamerTag: `Gamer${id}`,
  imageUrl: `https://placehold.co/300x300.png`,
  bio: `Jugador estrella de ${name}, especialista en FC 25 con una trayectoria impresionante en torneos locales e internacionales. Conocido por su estilo de juego agresivo y su capacidad para marcar goles en momentos cruciales.`,
  clubId: clubId,
});

const clubs = [
  { id: 'river', name: 'River Plate', logo: 'football club' },
  { id: 'boca', name: 'Boca Juniors', logo: 'football club' },
  { id: 'independiente', name: 'Independiente', logo: 'football club' },
  { id: 'racing', name: 'Racing Club', logo: 'football club' },
  { id: 'sanlorenzo', name: 'San Lorenzo', logo: 'football club' },
  { id: 'velez', name: 'Vélez Sarsfield', logo: 'football team' },
  { id: 'estudiantes', name: 'Estudiantes LP', logo: 'football team' },
  { id: 'lanus', name: 'Lanús', logo: 'football team' },
];

export const mockTeams: Team[] = clubs.map((club, index) => {
  const player = generatePlayer((index + 1).toString(), club.name, club.id);
  return {
    id: club.id,
    name: club.name,
    logoUrl: `https://placehold.co/100x100.png`,
    player: player,
  };
});

export const mockGroups: Group[] = [
  {
    id: 'group-a',
    name: 'Grupo A',
    teams: mockTeams.slice(0, 4),
  },
  {
    id: 'group-b',
    name: 'Grupo B',
    teams: mockTeams.slice(4, 8),
  },
];

const generateMatch = (id: string, team1: Team, team2: Team, groupName: string, status: 'completed' | 'upcoming', dateOffset: number): Match => {
  const matchDate = new Date();
  matchDate.setDate(matchDate.getDate() + dateOffset);
  return {
    id: `match-${id}`,
    team1,
    team2,
    score1: status === 'completed' ? Math.floor(Math.random() * 5) : undefined,
    score2: status === 'completed' ? Math.floor(Math.random() * 5) : undefined,
    date: matchDate.toISOString(),
    status,
    groupName,
  };
};

export const mockMatches: Match[] = [
  generateMatch('1', mockTeams[0], mockTeams[1], 'Grupo A', 'completed', -2),
  generateMatch('2', mockTeams[2], mockTeams[3], 'Grupo A', 'completed', -1),
  generateMatch('3', mockTeams[0], mockTeams[2], 'Grupo A', 'upcoming', 1),
  generateMatch('4', mockTeams[1], mockTeams[3], 'Grupo A', 'upcoming', 2),
  generateMatch('5', mockTeams[4], mockTeams[5], 'Grupo B', 'completed', -2),
  generateMatch('6', mockTeams[6], mockTeams[7], 'Grupo B', 'completed', -1),
  generateMatch('7', mockTeams[4], mockTeams[6], 'Grupo B', 'upcoming', 1),
  generateMatch('8', mockTeams[5], mockTeams[7], 'Grupo B', 'upcoming', 2),
];


export const mockPlayoffRounds: PlayoffRound[] = [
  {
    id: 'quarterfinals',
    name: 'Cuartos de Final',
    matches: [
      generateMatch('p1', mockTeams[0], mockTeams[3], '', 'upcoming', 5),
      generateMatch('p2', mockTeams[1], mockTeams[2], '', 'upcoming', 5),
      generateMatch('p3', mockTeams[4], mockTeams[7], '', 'upcoming', 6),
      generateMatch('p4', mockTeams[5], mockTeams[6], '', 'upcoming', 6),
    ],
  },
  {
    id: 'semifinals',
    name: 'Semifinales',
    matches: [
       // Placeholder, will be populated based on quarterfinal winners
    ],
  },
  {
    id: 'final',
    name: 'Final',
    matches: [
      // Placeholder
    ],
  },
];
