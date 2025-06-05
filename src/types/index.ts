
export interface Player {
  id: string;
  name: string;
  gamerTag: string;
  imageUrl: string; 
  bio: string;
  clubId: string;
}

export interface Team {
  id: string;
  name: string; 
  logoUrl: string; 
  player: Player;
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
}

export interface Group {
  id: string;
  name: string; 
  teams: Team[];
  standings: StandingEntry[];
}

export interface Match {
  id: string;
  team1: Team;
  team2: Team;
  score1?: number;
  score2?: number;
  date: string; 
  status: 'upcoming' | 'live' | 'completed';
  groupName?: string; 
  roundName?: string; 
  matchday?: number;
}

export interface PlayoffRound {
  id: string;
  name: string; 
  matches: Match[];
}
