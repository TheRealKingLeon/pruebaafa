
export interface Player {
  id: string; // Firestore document ID
  name: string;
  gamerTag: string;
  imageUrl: string; 
  bio: string;
  clubId: string; // ID of the club (equipo) this player belongs to
  favoriteFormation?: string; // Nueva propiedad para la formación favorita
  createdAt?: any; // Firestore ServerTimestamp
  updatedAt?: any; // Firestore ServerTimestamp
}

export interface Team {
  id: string; // Firestore document ID for "equipos" collection
  name: string; 
  logoUrl: string; 
  player?: Player; 
  createdAt?: any; // Firestore ServerTimestamp
  updatedAt?: any; // Firestore ServerTimestamp
}

export interface StandingEntry {
  team: Team; 
  position: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  clubId?: string; 
}

// Updated Group interface for Firestore storage
export interface Group {
  id: string; // Firestore document ID (e.g., "zona-a")
  name: string; // e.g., "Zona A"
  zoneId: string; // e.g., "zona-a", matches the document ID
  teamIds: string[]; // Array of Firestore document IDs from the "equipos" collection
  createdAt?: any; // Firestore ServerTimestamp
  updatedAt?: any; // Firestore ServerTimestamp
}

export interface Match {
  id: string; 
  team1Id: string; 
  team2Id: string; 
  team1?: Team; 
  team2?: Team; 
  score1?: number;
  score2?: number;
  date: string; 
  status: 'upcoming' | 'live' | 'completed';
  groupName?: string; 
  roundName?: string; 
  matchday?: number;
  createdAt?: any; 
  updatedAt?: any; 
}

export interface PlayoffRound {
  id: string; 
  name: string; 
  zoneId: string; 
  matches: Match[]; 
}

// For admin management of playoff fixtures
export interface PlayoffFixture {
  id: string; // Firestore document ID
  round: string; // e.g., "Cuartos de Final", "Semifinal"
  matchLabel: string; // e.g., "Partido 1", "CF1"
  team1Id: string | null;
  team2Id: string | null;
  team1Name?: string;
  team1LogoUrl?: string;
  team2Name?: string;
  team2LogoUrl?: string;
  status: 'pending_teams' | 'upcoming' | 'completed'; // status for the fixture itself
  winnerId?: string | null;
  createdAt?: any;
  updatedAt?: any;
}
