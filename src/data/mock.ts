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
  { id: 'huracan', name: 'Huracán', logo: 'football team' },
  { id: 'gimnasia', name: 'Gimnasia LP', logo: 'football team' },
  { id: 'rosariocentral', name: 'Rosario Central', logo: 'football team' },
  { id: 'newells', name: "Newell's Old Boys", logo: 'football team' },
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
  {
    id: 'group-c',
    name: 'Grupo C',
    teams: mockTeams.slice(8, 12),
  },
];

const generateMatch = (
  id: string, 
  team1: Team, 
  team2: Team, 
  groupName: string, 
  status: 'completed' | 'upcoming' | 'live', 
  dateOffset: number,
  matchday: number,
  roundName?: string
): Match => {
  const matchDate = new Date();
  matchDate.setDate(matchDate.getDate() + dateOffset);
  // For live matches, set time to be very recent or current
  if (status === 'live') {
    matchDate.setHours(new Date().getHours(), new Date().getMinutes() - 15); // e.g., started 15 mins ago
  } else if (status === 'upcoming') {
    matchDate.setHours(matchDate.getHours() + Math.floor(Math.random() * 3) + 1, Math.random() > 0.5 ? 30 : 0); // Random time in the next few hours
  }


  return {
    id: `match-${id}`,
    team1,
    team2,
    score1: status === 'completed' ? Math.floor(Math.random() * 5) : undefined,
    score2: status === 'completed' ? Math.floor(Math.random() * 5) : undefined,
    date: matchDate.toISOString(),
    status,
    groupName: groupName || undefined,
    matchday,
    roundName: roundName || undefined,
  };
};

export const mockMatches: Match[] = [
  // Grupo A
  generateMatch('1', mockTeams[0], mockTeams[1], 'Grupo A', 'completed', -2, 1),
  generateMatch('2', mockTeams[2], mockTeams[3], 'Grupo A', 'completed', -1, 1),
  generateMatch('3', mockTeams[0], mockTeams[2], 'Grupo A', 'live', 0, 2), // Live match
  generateMatch('4', mockTeams[1], mockTeams[3], 'Grupo A', 'upcoming', 1, 2),
  generateMatch('13', mockTeams[0], mockTeams[3], 'Grupo A', 'upcoming', 2, 3),
  generateMatch('14', mockTeams[1], mockTeams[2], 'Grupo A', 'upcoming', 2, 3),

  // Grupo B
  generateMatch('5', mockTeams[4], mockTeams[5], 'Grupo B', 'completed', -2, 1),
  generateMatch('6', mockTeams[6], mockTeams[7], 'Grupo B', 'completed', -1, 1),
  generateMatch('7', mockTeams[4], mockTeams[6], 'Grupo B', 'upcoming', 0, 2), 
  generateMatch('8', mockTeams[5], mockTeams[7], 'Grupo B', 'upcoming', 1, 2),
  generateMatch('15', mockTeams[4], mockTeams[7], 'Grupo B', 'upcoming', 3, 3),
  generateMatch('16', mockTeams[5], mockTeams[6], 'Grupo B', 'upcoming', 3, 3),
  
  // Grupo C
  generateMatch('9', mockTeams[8], mockTeams[9], 'Grupo C', 'live', 0, 1), // Live match
  generateMatch('10', mockTeams[10], mockTeams[11], 'Grupo C', 'upcoming', 0, 1),
  generateMatch('11', mockTeams[8], mockTeams[10], 'Grupo C', 'upcoming', 1, 2),
  generateMatch('12', mockTeams[9], mockTeams[11], 'Grupo C', 'upcoming', 1, 2),
  generateMatch('17', mockTeams[8], mockTeams[11], 'Grupo C', 'upcoming', 4, 3),
  generateMatch('18', mockTeams[9], mockTeams[10], 'Grupo C', 'upcoming', 4, 3),
];


export const mockPlayoffRounds: PlayoffRound[] = [
  {
    id: 'quarterfinals',
    name: 'Cuartos de Final',
    matches: [
      generateMatch('p1', mockTeams[0], mockTeams[3], '', 'upcoming', 5, 1, 'Cuartos de Final'),
      generateMatch('p2', mockTeams[1], mockTeams[2], '', 'upcoming', 5, 1, 'Cuartos de Final'),
      generateMatch('p3', mockTeams[4], mockTeams[7], '', 'upcoming', 6, 1, 'Cuartos de Final'),
      generateMatch('p4', mockTeams[5], mockTeams[6], '', 'upcoming', 6, 1, 'Cuartos de Final'),
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
