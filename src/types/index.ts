
export interface Player {
  id: string; // Firestore document ID
  name: string;
  gamerTag: string;
  imageUrl: string; 
  bio: string;
  clubId: string; // ID of the club (equipo) this player belongs to
  createdAt?: any; // Firestore ServerTimestamp
  updatedAt?: any; // Firestore ServerTimestamp
}

export interface Team {
  id: string; // Firestore document ID for "equipos" collection
  name: string; 
  logoUrl: string; 
  // Player object is NOT stored directly in "equipos" document.
  // It's fetched separately from "jugadores" collection if needed.
  // The 'player' field here is more for conceptual client-side representation or from mock data.
  player?: Player; // Optional, as it might not always be populated from "equipos" doc
  createdAt?: any; // Firestore ServerTimestamp
  updatedAt?: any; // Firestore ServerTimestamp
}

export interface StandingEntry {
  team: Team; // This Team object might be a simplified version if standings are stored flat
  position: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  // Consider adding clubId directly here if team object is not fully populated
  clubId?: string; 
}

export interface Group {
  id: string; // Firestore document ID (if groups are stored) or conceptual ID
  name: string; 
  // Teams might be an array of clubIds or simplified Team objects
  teams: Team[]; // Or string[] (clubIds) if fetching teams separately
  standings: StandingEntry[];
  // Consider storing group related data in Firestore if needed, e.g. in a "grupos" collection
}

export interface Match {
  id: string; // Firestore document ID for "partidos" collection
  team1Id: string; // Firestore ID of team1 from "equipos"
  team2Id: string; // Firestore ID of team2 from "equipos"
  team1?: Team; // Populated on client-side after fetching by ID
  team2?: Team; // Populated on client-side after fetching by ID
  score1?: number;
  score2?: number;
  date: string; // ISO string, or Firestore Timestamp
  status: 'upcoming' | 'live' | 'completed';
  groupName?: string; 
  roundName?: string; 
  matchday?: number;
  createdAt?: any; 
  updatedAt?: any; 
}

export interface PlayoffRound {
  id: string; // Firestore document ID (if playoff rounds are stored) or conceptual ID
  name: string; 
  zoneId: string; 
  matches: Match[]; // Or string[] (matchIds) if fetching matches separately
}
