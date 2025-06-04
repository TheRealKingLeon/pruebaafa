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

export interface Group {
  id: string;
  name: string; 
  teams: Team[];
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
}

export interface PlayoffRound {
  id: string;
  name: string; 
  matches: Match[];
}
