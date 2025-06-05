
import type { Team, Group, Match, PlayoffRound, Player, StandingEntry } from '@/types';

const generatePlayer = (id: string, name: string, clubId: string): Player => ({
  id: `player-${id}`,
  name: name,
  gamerTag: `Gamer${id.replace('club-','')}`,
  imageUrl: `https://static.lvp.global/players/photos/67a3837738fec333664517.x2.png`,
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
  status: 'completed' | 'upcoming' | 'live',
  dateOffset: number,
  matchday?: number, // Optional for playoffs
  groupName?: string, // Optional for playoffs
  roundName?: string  // Optional for group stage
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
    matchday: matchday || undefined,
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
            `carousel-${i + 1}`, 
            mockGroups[groupIndex].teams[team1Index],
            mockGroups[groupIndex].teams[team2Index],
            matchStatus,
            dateOffset,
            Math.floor(Math.random() * 7) + 1,
            mockGroups[groupIndex].name
        )
    );
}

// Add more completed matches for the results page
mockMatches.push(
  generateMatch('c1', mockTeams[0], mockTeams[1], 'completed', -2, 1, mockGroups[0].name),
  generateMatch('c2', mockTeams[2], mockTeams[3], 'completed', -1, 1, mockGroups[0].name),
  generateMatch('c3', mockTeams[8], mockTeams[9], 'completed', -2, 1, mockGroups[1].name),
  generateMatch('c4', mockTeams[10], mockTeams[11], 'completed', -1, 1, mockGroups[1].name),
  generateMatch('c5', mockTeams[4], mockTeams[5], 'completed', -3, 2, mockGroups[0].name), 
  generateMatch('c6', mockTeams[6], mockTeams[7], 'completed', -3, 2, mockGroups[0].name), 
  generateMatch('c7', mockTeams[12], mockTeams[13], 'completed', -4, 2, mockGroups[1].name), 
  generateMatch('c8', mockTeams[16], mockTeams[17], 'completed', -5, 1, mockGroups[2].name), 
  generateMatch('c9', mockTeams[18], mockTeams[19], 'completed', -5, 2, mockGroups[2].name), 
  generateMatch('c10', mockTeams[20], mockTeams[21], 'completed', -5, 3, mockGroups[2].name), 
  generateMatch('c11', mockTeams[0], mockTeams[4], 'completed', -4, 3, mockGroups[0].name), 
  generateMatch('c12', mockTeams[1], mockTeams[5], 'completed', -4, 3, mockGroups[0].name), 
  generateMatch('c13', mockTeams[2], mockTeams[6], 'completed', -5, 4, mockGroups[0].name), 
  generateMatch('c14', mockTeams[3], mockTeams[7], 'completed', -5, 4, mockGroups[0].name), 
  generateMatch('c15', mockTeams[8], mockTeams[12], 'completed', -6, 3, mockGroups[1].name), 
  generateMatch('c16', mockTeams[9], mockTeams[13], 'completed', -6, 3, mockGroups[1].name), 
  generateMatch('c17', mockTeams[24], mockTeams[25], 'completed', -2, 1, mockGroups[3].name), 
  generateMatch('c18', mockTeams[26], mockTeams[27], 'completed', -3, 2, mockGroups[3].name)  
);


export const mockPlayoffRounds: PlayoffRound[] = [];
const playoffStartDateOffset = 7; // Start playoffs 7 days from now

mockGroups.forEach((group, groupIdx) => {
  // Ensure there are at least 4 teams with standings for playoffs
  if (group.standings.length < 4) {
    console.warn(`Group ${group.name} has less than 4 teams, skipping playoff generation for this group.`);
    return;
  }

  const qualifiedTeams = group.standings.slice(0, 4).map(s => s.team);
  if (qualifiedTeams.length < 4) return; // Should not happen if standings check passed

  const teamA = qualifiedTeams[0]; // 1st place
  const teamB = qualifiedTeams[1]; // 2nd place
  const teamC = qualifiedTeams[2]; // 3rd place
  const teamD = qualifiedTeams[3]; // 4th place

  const sf1Ida = generateMatch(`sf1-ida-${group.id}`, teamA, teamD, 'upcoming', playoffStartDateOffset + (groupIdx * 2), undefined, undefined, 'Semifinal - Ida');
  const sf2Ida = generateMatch(`sf2-ida-${group.id}`, teamB, teamC, 'upcoming', playoffStartDateOffset + (groupIdx * 2), undefined, undefined, 'Semifinal - Ida');
  
  const sf1Vuelta = generateMatch(`sf1-vuelta-${group.id}`, teamD, teamA, 'upcoming', playoffStartDateOffset + (groupIdx * 2) + 2, undefined, undefined, 'Semifinal - Vuelta');
  const sf2Vuelta = generateMatch(`sf2-vuelta-${group.id}`, teamC, teamB, 'upcoming', playoffStartDateOffset + (groupIdx * 2) + 2, undefined, undefined, 'Semifinal - Vuelta');

  // For final, let's assume teamA and teamB advance for simplicity
  const finalIda = generateMatch(`final-ida-${group.id}`, teamA, teamB, 'upcoming', playoffStartDateOffset + (groupIdx * 2) + 5, undefined, undefined, 'Final - Ida');
  const finalVuelta = generateMatch(`final-vuelta-${group.id}`, teamB, teamA, 'upcoming', playoffStartDateOffset + (groupIdx * 2) + 7, undefined, undefined, 'Final - Vuelta');

  mockPlayoffRounds.push(
    { id: `semi-ida-${group.id}`, name: 'Semifinal - Ida', zoneId: group.id, matches: [sf1Ida, sf2Ida] },
    { id: `semi-vuelta-${group.id}`, name: 'Semifinal - Vuelta', zoneId: group.id, matches: [sf1Vuelta, sf2Vuelta] },
    { id: `final-ida-${group.id}`, name: 'Final - Ida', zoneId: group.id, matches: [finalIda] },
    { id: `final-vuelta-${group.id}`, name: 'Final - Vuelta', zoneId: group.id, matches: [finalVuelta] }
  );
});
