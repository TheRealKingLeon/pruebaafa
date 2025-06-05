
import type { Team, Group, Match, PlayoffRound, Player, StandingEntry } from '@/types';

const generatePlayer = (id: string, name: string, clubId: string): Player => ({
  id: `player-${id}`,
  name: name,
  gamerTag: `Gamer${id.replace('club-','')}`,
  imageUrl: `https://placehold.co/300x300.png`,
  bio: `Jugador estrella de ${name}, especialista en FC 25 con una trayectoria impresionante en torneos locales e internacionales. Conocido por su estilo de juego agresivo y su capacidad para marcar goles en momentos cruciales.`,
  clubId: clubId,
});

const clubNames = [
  'River Plate', 'Boca Juniors', 'Independiente', 'Racing Club', 'San Lorenzo', 'Vélez Sarsfield', 'Estudiantes LP', 'Lanús',
  'Huracán', 'Gimnasia LP', 'Rosario Central', "Newell's Old Boys", 'Argentinos Jrs.', 'Banfield', 'Colón', 'Unión',
  'Talleres', 'Belgrano', 'Instituto', 'Godoy Cruz', 'Defensa y Justicia', 'Tigre', 'Platense', 'Sarmiento',
  'Atlético Tucumán', 'Central Córdoba', 'Barracas Central', 'Arsenal de Sarandí', 'Quilmes', 'Chacarita Juniors', 'Ferro Carril Oeste', 'Atlanta',
  'Aldosivi', 'Almirante Brown', 'Temperley', 'Brown de Adrogué', 'All Boys', 'Nueva Chicago', 'Deportivo Morón', 'San Martín (T)',
  'Gimnasia (Mendoza)', 'Estudiantes (RC)', 'Agropecuario', 'San Telmo', 'Flandria', 'Comunicaciones', 'Sacachispas', 'Dock Sud',
  'Excursionistas', 'Laferrere', 'Midland', 'Liniers', 'Ituzaingó', 'Argentino de Quilmes', 'Colegiales', 'UAI Urquiza',
  'Villa Dálmine', 'Defensores de Belgrano', 'Tristán Suárez', 'San Miguel', 'Los Andes', 'Acassuso', 'Argentino de Merlo', 'Fénix'
];


export const mockTeams: Team[] = clubNames.map((name, index) => {
  const clubId = `club-${index + 1}`;
  const player = generatePlayer(clubId, name, clubId);
  return {
    id: clubId,
    name: name,
    logoUrl: `https://placehold.co/64x64.png`,
    player: player,
  };
});

const generateMockStandings = (teamsInGroup: Team[], gamesPlayed: number): StandingEntry[] => {
  const standings: StandingEntry[] = teamsInGroup.map(team => {
    const won = Math.floor(Math.random() * (gamesPlayed + 1));
    const drawn = Math.floor(Math.random() * (gamesPlayed - won + 1));
    const lost = gamesPlayed - won - drawn;
    const points = (won * 3) + drawn;
    const goalsFor = Math.floor(Math.random() * 30) + lost;
    const goalsAgainst = Math.floor(Math.random() * 25) + won;
    const goalDifference = goalsFor - goalsAgainst;

    return {
      team,
      position: 0,
      points,
      played: gamesPlayed,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference,
    };
  });

  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    return b.goalsFor - a.goalsFor;
  });

  return standings.map((entry, index) => ({ ...entry, position: index + 1 }));
};

const groupLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
export const mockGroups: Group[] = groupLetters.map((letter, index) => {
  const teamsForGroup = mockTeams.slice(index * 8, (index + 1) * 8);
  const gamesPlayed = Math.floor(Math.random() * 5) + 3;
  return {
    id: `group-${letter.toLowerCase()}`,
    name: `Zona ${letter}`,
    teams: teamsForGroup,
    standings: generateMockStandings(teamsForGroup, gamesPlayed),
  };
});


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
  if (status === 'live') {
    matchDate.setHours(new Date().getHours(), new Date().getMinutes() - 15);
  } else if (status === 'upcoming') {
    matchDate.setHours(matchDate.getHours() + Math.floor(Math.random() * 24) + 1, Math.random() > 0.5 ? 30 : 0);
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

export const mockMatches: Match[] = [];
const numCarouselMatches = 10;
for (let i = 0; i < numCarouselMatches; i++) {
    const groupIndex = i % mockGroups.length;
    const team1Index = Math.floor(Math.random() * mockGroups[groupIndex].teams.length);
    let team2Index = Math.floor(Math.random() * mockGroups[groupIndex].teams.length);
    while (team2Index === team1Index) {
        team2Index = Math.floor(Math.random() * mockGroups[groupIndex].teams.length);
    }
    const matchStatus = Math.random() > 0.6 ? 'live' : 'upcoming';
    const dateOffset = matchStatus === 'live' ? 0 : Math.floor(Math.random() * 3);

    mockMatches.push(
        generateMatch(
            (i + 1).toString(),
            mockGroups[groupIndex].teams[team1Index],
            mockGroups[groupIndex].teams[team2Index],
            mockGroups[groupIndex].name,
            matchStatus,
            dateOffset,
            Math.floor(Math.random() * 7) + 1
        )
    );
}

mockMatches.push(
  generateMatch('c1', mockTeams[0], mockTeams[1], mockGroups[0].name, 'completed', -2, 1),
  generateMatch('c2', mockTeams[2], mockTeams[3], mockGroups[0].name, 'completed', -1, 1),
  generateMatch('c3', mockTeams[8], mockTeams[9], mockGroups[1].name, 'completed', -2, 1),
  generateMatch('c4', mockTeams[10], mockTeams[11], mockGroups[1].name, 'completed', -1, 1),
  generateMatch('c5', mockTeams[4], mockTeams[5], mockGroups[0].name, 'completed', -3, 2), // Zona A, Fecha 2
  generateMatch('c6', mockTeams[6], mockTeams[7], mockGroups[0].name, 'completed', -3, 2), // Zona A, Fecha 2
  generateMatch('c7', mockTeams[12], mockTeams[13], mockGroups[1].name, 'completed', -4, 2), // Zona B, Fecha 2
  generateMatch('c8', mockTeams[16], mockTeams[17], mockGroups[2].name, 'completed', -5, 1), // Zona C, Fecha 1
  generateMatch('c9', mockTeams[18], mockTeams[19], mockGroups[2].name, 'completed', -5, 2), // Zona C, Fecha 2
  generateMatch('c10', mockTeams[20], mockTeams[21], mockGroups[2].name, 'completed', -5, 3) // Zona C, Fecha 3
);


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
    ],
  },
  {
    id: 'final',
    name: 'Final',
    matches: [
    ],
  },
];
