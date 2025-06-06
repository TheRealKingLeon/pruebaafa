
'use server';

import { db, getFirebaseDebugInfo } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, Timestamp, documentId, limit } from 'firebase/firestore';
import type {
  Team,
  Group,
  Match,
  Player,
  StandingEntry,
  PlayoffFixture,
  TournamentRules,
} from '@/types';
import { loadTournamentRulesAction } from '../admin/tournament-settings/actions';
import { getPlayoffFixturesAction } from '../admin/playoffs/actions';

// Helper to fetch team details in bulk
async function getTeamsDetailsMap(teamIds: string[]): Promise<Map<string, Team>> {
  const teamsMap = new Map<string, Team>();
  if (!teamIds || teamIds.length === 0) return teamsMap;

  const uniqueTeamIds = Array.from(new Set(teamIds.filter(id => id)));

  const MAX_IDS_PER_QUERY = 30;
  for (let i = 0; i < uniqueTeamIds.length; i += MAX_IDS_PER_QUERY) {
    const chunk = uniqueTeamIds.slice(i, i + MAX_IDS_PER_QUERY);
    if (chunk.length > 0) {
      const teamsQuery = query(collection(db, "equipos"), where(documentId(), "in", chunk));
      const snapshot = await getDocs(teamsQuery);
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const teamData: Team = {
          id: docSnap.id,
          name: data.name,
          logoUrl: data.logoUrl,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
        };
        teamsMap.set(docSnap.id, teamData);
      });
    }
  }
  return teamsMap;
}

// Helper to convert Firestore Timestamps in match objects
function convertMatchTimestamps(matchData: any): Omit<Match, 'team1' | 'team2' | 'createdAt' | 'updatedAt'> & { team1Id: string, team2Id: string, createdAt?: Timestamp | string, updatedAt?: Timestamp | string, date?: Timestamp | string | null } {
  return {
    ...matchData,
    id: matchData.id,
    date: matchData.date instanceof Timestamp ? matchData.date.toDate().toISOString() : matchData.date,
    createdAt: matchData.createdAt instanceof Timestamp ? matchData.createdAt.toDate().toISOString() : matchData.createdAt,
    updatedAt: matchData.updatedAt instanceof Timestamp ? matchData.updatedAt.toDate().toISOString() : matchData.updatedAt,
  };
}

// Helper to convert Firestore Timestamps in group objects
function convertGroupTimestamps(groupData: any): Group {
  const data = { ...groupData };
  if (data.createdAt instanceof Timestamp) {
    data.createdAt = data.createdAt.toDate().toISOString();
  }
  if (data.updatedAt instanceof Timestamp) {
    data.updatedAt = data.updatedAt.toDate().toISOString();
  }
  return data as Group;
}


async function calculateStandings(
  groupId: string,
  teamsInGroup: Team[],
  rules: TournamentRules | null
): Promise<StandingEntry[]> {
  if (!rules) {
    console.warn(`[calculateStandings] Tournament rules not available for group ${groupId}, using fallback default rules.`);
    rules = {
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      roundRobinType: 'one-way',
      tiebreakers: [
        { id: 'goalDifference', name: 'Goal Difference', priority: 1, enabled: true },
        { id: 'goalsFor', name: 'Goals For', priority: 2, enabled: true },
      ]
    };
  }

  const completedMatchesQuery = query(
    collection(db, "matches"),
    where("groupId", "==", groupId),
    where("status", "==", "completed")
  );
  const matchesSnapshot = await getDocs(completedMatchesQuery);
  const groupMatches = matchesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Omit<Match, 'team1' | 'team2'> & { team1Id: string, team2Id: string } ));

  const standingsMap: Map<string, StandingEntry> = new Map();

  teamsInGroup.forEach(team => {
    standingsMap.set(team.id, {
      team: team,
      position: 0,
      points: 0,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
    });
  });

  groupMatches.forEach(match => {
    const entry1 = standingsMap.get(match.team1Id);
    const entry2 = standingsMap.get(match.team2Id);
    const score1 = typeof match.score1 === 'number' ? match.score1 : 0;
    const score2 = typeof match.score2 === 'number' ? match.score2 : 0;

    if (entry1) {
      entry1.played++;
      entry1.goalsFor += score1;
      entry1.goalsAgainst += score2;
      if (score1 > score2) {
        entry1.won++;
        entry1.points += rules.pointsForWin;
      } else if (score1 < score2) {
        entry1.lost++;
        entry1.points += rules.pointsForLoss;
      } else {
        entry1.drawn++;
        entry1.points += rules.pointsForDraw;
      }
    }
    if (entry2) {
      entry2.played++;
      entry2.goalsFor += score2;
      entry2.goalsAgainst += score1;
      if (score2 > score1) {
        entry2.won++;
        entry2.points += rules.pointsForWin;
      } else if (score2 < score1) {
        entry2.lost++;
        entry2.points += rules.pointsForLoss;
      } else {
        entry2.drawn++;
        entry2.points += rules.pointsForDraw;
      }
    }
  });

  const standingsArray = Array.from(standingsMap.values());
  standingsArray.forEach(entry => {
    entry.goalDifference = entry.goalsFor - entry.goalsAgainst;
  });


  const enabledTiebreakers = rules.tiebreakers.filter(tb => tb.enabled && tb.priority > 0).sort((a, b) => a.priority - b.priority);

  standingsArray.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;

    for (const tiebreaker of enabledTiebreakers) {
        switch (tiebreaker.id) {
            case 'goalDifference':
                if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
                break;
            case 'goalsFor':
                if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
                break;
            case 'matchesWon':
                if (b.won !== a.won) return b.won - a.won;
                break;
        }
    }
    return a.team.name.localeCompare(b.team.name);
  });

  return standingsArray.map((entry, index) => ({ ...entry, position: index + 1 }));
}


export async function getTournamentCompetitionData(): Promise<{
  groupsWithStandings: Group[];
  playoffFixtures: PlayoffFixture[];
  error?: string;
}> {
  const debugInfo = getFirebaseDebugInfo();
  if (!db || !debugInfo.isDbInitialized) {
    console.error("[Service Error] getTournamentCompetitionData: Firestore db instance is not available.", debugInfo);
    return { 
      groupsWithStandings: [], 
      playoffFixtures: [], 
      error: `Servicio no disponible: Fallo al conectar con la base de datos. Debug Info: ${JSON.stringify({ error: debugInfo.initializationErrorDetected, configUsed: debugInfo.configUsedAtModuleLoad, runtimeEnvVarStatus: debugInfo.runtimeEnvVarStatus }, null, 2)}` 
    };
  }

  try {
    const groupsQuery = query(collection(db, "grupos"), orderBy("name"));
    const groupsSnapshot = await getDocs(groupsQuery);
    const rawGroups = groupsSnapshot.docs.map(doc => convertGroupTimestamps({ id: doc.id, ...doc.data() }));

    const allTeamIdsInGroups = new Set<string>();
    rawGroups.forEach(g => g.teamIds.forEach(tid => allTeamIdsInGroups.add(tid)));
    const teamsMap = await getTeamsDetailsMap(Array.from(allTeamIdsInGroups)); 

    const rulesResult = await loadTournamentRulesAction();
    const tournamentRules = rulesResult.success ? rulesResult.data : null;
    if (!rulesResult.success || !tournamentRules) {
        console.warn("Failed to load tournament rules for getTournamentCompetitionData. Standings might use default calculation rules. Message:", rulesResult.message);
    }


    const groupsWithStandings: Group[] = [];
    for (const rawGroup of rawGroups) {
      const groupTeams = rawGroup.teamIds.map(tid => teamsMap.get(tid)).filter(Boolean) as Team[];
      const standings = await calculateStandings(rawGroup.id, groupTeams, tournamentRules);
      groupsWithStandings.push({
        ...rawGroup, 
        teams: groupTeams, 
        standings: standings,
      });
    }

    const playoffResult = await getPlayoffFixturesAction();
    let resolvedPlayoffFixtures: PlayoffFixture[] = [];
    let playoffError: string | undefined = undefined;

    if (playoffResult.error) {
        console.warn("Error fetching playoff fixtures for getTournamentCompetitionData. Error:", playoffResult.error);
        playoffError = playoffResult.error; // Capture playoff specific error
    } else {
        resolvedPlayoffFixtures = playoffResult.fixtures;
    }

    // If there was a playoff error, include it in the main error message if no other error exists
    let mainError = playoffError;
    if (playoffError && groupsWithStandings.length === 0) { // Example: combine if standings also failed
        mainError = `Error en playoffs: ${playoffError}. Error en grupos no detectado o grupos vacíos.`
    }


    return { groupsWithStandings, playoffFixtures: resolvedPlayoffFixtures, error: mainError };

  } catch (error) {
    console.error("Error fetching tournament competition data:", error);
    const message = error instanceof Error ? error.message : "Unknown error fetching competition data.";
    const currentDebugInfo = getFirebaseDebugInfo();
    return { 
        groupsWithStandings: [], 
        playoffFixtures: [], 
        error: `Error obteniendo datos de competición: ${message}. Debug Info: ${JSON.stringify({ error: currentDebugInfo.initializationErrorDetected, configUsed: currentDebugInfo.configUsedAtModuleLoad, runtimeEnvVarStatus: currentDebugInfo.runtimeEnvVarStatus }, null, 2)}`
    };
  }
}


export async function getTournamentHomePageData(): Promise<{
  upcomingLiveMatches: Match[];
  groupsWithStandings: Group[];
  error?: string;
}> {
  const debugInfo = getFirebaseDebugInfo();
  if (!db || !debugInfo.isDbInitialized) {
    console.error("[Service Error] getTournamentHomePageData: Firestore db instance is not available.", debugInfo);
    return { 
      upcomingLiveMatches: [], 
      groupsWithStandings: [], 
      error: `Servicio no disponible: Fallo al conectar con la base de datos. Debug Info: ${JSON.stringify({ error: debugInfo.initializationErrorDetected, configUsed: debugInfo.configUsedAtModuleLoad, runtimeEnvVarStatus: debugInfo.runtimeEnvVarStatus }, null, 2)}` 
    };
  }

  try {
    const now = new Date(); 

    const liveQuery = query(collection(db, "matches"), where("status", "==", "live"), limit(5));
    const upcomingQuery = query(collection(db, "matches"), where("status", "==", "upcoming"), limit(20));
    const pendingDateQuery = query(collection(db, "matches"), where("status", "==", "pending_date"), limit(10));

    const [liveSnapshot, upcomingSnapshot, pendingDateSnapshot] = await Promise.all([
        getDocs(liveQuery),
        getDocs(upcomingQuery),
        getDocs(pendingDateQuery),
    ]);
    
    const rawLiveMatches = liveSnapshot.docs.map(doc => convertMatchTimestamps({ id: doc.id, ...doc.data() }));
    const rawUpcomingMatches = upcomingSnapshot.docs.map(doc => convertMatchTimestamps({ id: doc.id, ...doc.data() }));
    const rawPendingDateMatches = pendingDateSnapshot.docs.map(doc => convertMatchTimestamps({ id: doc.id, ...doc.data() }));
    
    const matchesMap = new Map<string, ReturnType<typeof convertMatchTimestamps>>();
    
    [...rawLiveMatches, ...rawUpcomingMatches, ...rawPendingDateMatches].forEach(m => {
        if (!matchesMap.has(m.id)) { // Ensure unique matches
            matchesMap.set(m.id, m);
        }
    });

    let combinedMatches = Array.from(matchesMap.values());

    const getStatusPriority = (status: Match['status']): number => {
      switch (status) {
        case 'live': return 1;
        case 'upcoming': return 2;
        case 'pending_date': return 3;
        case 'completed': return 4; 
        default: return 5;
      }
    };

    combinedMatches.sort((a, b) => {
      const priorityA = getStatusPriority(a.status);
      const priorityB = getStatusPriority(b.status);
      if (priorityA !== priorityB) return priorityA - priorityB;

      // For 'live' and 'upcoming' with actual dates, sort by date first
      if ((a.status === 'live' || a.status === 'upcoming') && (b.status === 'live' || b.status === 'upcoming')) {
        const aHasDate = !!a.date;
        const bHasDate = !!b.date;
        if (aHasDate && !bHasDate) return -1;
        if (!aHasDate && bHasDate) return 1;
        if (aHasDate && bHasDate) {
          const dateComparison = new Date(a.date as string).getTime() - new Date(b.date as string).getTime();
          if (dateComparison !== 0) return dateComparison;
        }
      }
      
      // Then sort by Matchday (Fecha)
      const matchdayA = a.matchday ?? Number.MAX_SAFE_INTEGER; // Treat null/undefined as last
      const matchdayB = b.matchday ?? Number.MAX_SAFE_INTEGER;
      if (matchdayA !== matchdayB) return matchdayA - matchdayB;

      // Then sort by Group Name (Zona)
      const groupCompare = (a.groupName || '').localeCompare(b.groupName || '');
      if (groupCompare !== 0) return groupCompare;
      
      // Final tie-breaker by team name (mostly for 'pending_date' or identical upcoming without distinct times)
      const team1NameA = a.team1?.name || a.team1Id || '';
      const team1NameB = b.team1?.name || b.team1Id || '';
      return team1NameA.localeCompare(team1NameB);
    });
    
    const limitedMatches = combinedMatches.slice(0, 10);

    const matchTeamIds = new Set<string>();
    limitedMatches.forEach(m => {
      if (m.team1Id) matchTeamIds.add(m.team1Id);
      if (m.team2Id) matchTeamIds.add(m.team2Id);
    });
    const teamsMapForMatches = await getTeamsDetailsMap(Array.from(matchTeamIds)); 

    const upcomingLiveMatches = limitedMatches.map(m => ({
      ...m, 
      team1: m.team1Id ? teamsMapForMatches.get(m.team1Id) : undefined,
      team2: m.team2Id ? teamsMapForMatches.get(m.team2Id) : undefined,
    })).filter(m => m.team1 && m.team2) as Match[];


    const competitionDataResult = await getTournamentCompetitionData();
    // Propagate error from competitionDataResult if it exists and groups are empty
    let homePageError = competitionDataResult.error; 
    if (competitionDataResult.error && competitionDataResult.groupsWithStandings.length === 0) {
        console.warn("Error fetching groups for home page via getTournamentCompetitionData. Error:", competitionDataResult.error);
    }
    
    return { 
        upcomingLiveMatches, 
        groupsWithStandings: competitionDataResult.groupsWithStandings,
        error: homePageError 
    };

  } catch (error) {
    console.error("Error fetching tournament home page data:", error);
    const message = error instanceof Error ? error.message : "Unknown error fetching home page data.";
    const currentDebugInfo = getFirebaseDebugInfo();
    return { 
        upcomingLiveMatches: [], 
        groupsWithStandings: [], 
        error: `Error obteniendo datos de página principal: ${message}. Debug Info: ${JSON.stringify({ error: currentDebugInfo.initializationErrorDetected, configUsed: currentDebugInfo.configUsedAtModuleLoad, runtimeEnvVarStatus: currentDebugInfo.runtimeEnvVarStatus }, null, 2)}`
    };
  }
}


export async function getTournamentResultsData(): Promise<{
  allMatches: Match[];
  groupList: Pick<Group, 'id' | 'name' | 'zoneId'>[];
  error?: string;
}> {
  const debugInfo = getFirebaseDebugInfo();
  if (!db || !debugInfo.isDbInitialized) {
    console.error("[Service Error] getTournamentResultsData: Firestore db instance is not available.", debugInfo);
    return { 
      allMatches: [], 
      groupList: [], 
      error: `Servicio no disponible: Fallo al conectar con la base de datos. Debug Info: ${JSON.stringify({ error: debugInfo.initializationErrorDetected, configUsed: debugInfo.configUsedAtModuleLoad, runtimeEnvVarStatus: debugInfo.runtimeEnvVarStatus }, null, 2)}` 
    };
  }

  try {
    const matchesQuery = query(collection(db, "matches")); // Consider adding orderBy here if needed for default sort
    const matchesSnapshot = await getDocs(matchesQuery);
    const rawMatches = matchesSnapshot.docs.map(doc => convertMatchTimestamps({ id: doc.id, ...doc.data() }));

    const teamIds = new Set<string>();
    rawMatches.forEach(m => {
      if (m.team1Id) teamIds.add(m.team1Id);
      if (m.team2Id) teamIds.add(m.team2Id);
    });
    const teamsMap = await getTeamsDetailsMap(Array.from(teamIds)); 

    const allMatchesWithTeams = rawMatches.map(m => ({
      ...m, 
      team1: m.team1Id ? teamsMap.get(m.team1Id) : undefined,
      team2: m.team2Id ? teamsMap.get(m.team2Id) : undefined,
    })).filter(m => m.team1 && m.team2) as Match[];

    // Default sort for results page, can be overridden client-side if necessary
    allMatchesWithTeams.sort((a, b) => {
        const aHasDate = !!a.date;
        const bHasDate = !!b.date;

        if (aHasDate && !bHasDate) return -1;
        if (!aHasDate && bHasDate) return 1;  
        
        if (aHasDate && bHasDate) {
          const dateComparison = new Date(b.date!).getTime() - new Date(a.date!).getTime(); // Descending for most recent completed
          if (dateComparison !== 0) return dateComparison; 
        }
        
        const groupCompare = (a.groupName || '').localeCompare(b.groupName || '');
        if (groupCompare !== 0) return groupCompare;
        
        return (b.matchday || 0) - (a.matchday || 0); // Descending matchday
    });


    const groupsQuery = query(collection(db, "grupos"), orderBy("name"));
    const groupsSnapshot = await getDocs(groupsQuery);
    const groupList = groupsSnapshot.docs.map(doc => {
        const groupData = doc.data();
        return {
            id: doc.id,
            name: groupData.name,
            zoneId: groupData.zoneId
        } as Pick<Group, 'id' | 'name' | 'zoneId'>;
    });

    return { allMatches: allMatchesWithTeams, groupList };

  } catch (error) {
    console.error("Error fetching tournament results data:", error);
    const message = error instanceof Error ? error.message : "Unknown error fetching results data.";
    const currentDebugInfo = getFirebaseDebugInfo();
    return { 
        allMatches: [], 
        groupList: [], 
        error: `Error obteniendo datos de resultados: ${message}. Debug Info: ${JSON.stringify({ error: currentDebugInfo.initializationErrorDetected, configUsed: currentDebugInfo.configUsedAtModuleLoad, runtimeEnvVarStatus: currentDebugInfo.runtimeEnvVarStatus }, null, 2)}`
    };
  }
}

    