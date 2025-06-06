
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
import { getPlayoffFixturesAction } from '../admin/playoffs/actions'; // Import the centralized action

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
  // teamIds and other fields are preserved
  return data as Group;
}


async function calculateStandings(
  groupId: string,
  teamsInGroup: Team[],
  rules: TournamentRules | null
): Promise<StandingEntry[]> {
  if (!rules) {
    // Fallback default rules if tournamentRules are not loaded or available
    console.warn(`[calculateStandings] Tournament rules not available for group ${groupId}, using fallback default rules.`);
    rules = {
      pointsForWin: 3,
      pointsForDraw: 1,
      pointsForLoss: 0,
      roundRobinType: 'one-way',
      tiebreakers: [
        { id: 'goalDifference', name: 'Goal Difference', priority: 1, enabled: true },
        { id: 'goalsFor', name: 'Goals For', priority: 2, enabled: true },
      ] // Basic default tiebreakers
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
            // Add other tiebreaker criteria here as needed, e.g., directResult
            // directResult would require fetching specific matches between tied teams
        }
    }
    // Fallback to alphabetical by team name if all tiebreakers are equal
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
      error: `Servicio no disponible: Fallo al conectar con la base de datos. Debug Info: ${JSON.stringify({ error: debugInfo.error, configUsed: debugInfo.configUsed, envKeys: debugInfo.envKeys }, null, 2)}` 
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

    // Fetch playoff fixtures using the centralized action
    const playoffResult = await getPlayoffFixturesAction();
    let resolvedPlayoffFixtures: PlayoffFixture[] = [];

    if (playoffResult.error) {
        console.warn("Error fetching playoff fixtures for getTournamentCompetitionData. Error:", playoffResult.error);
        // Optionally, you could pass this error up or decide how to handle it.
        // For now, competition page will show empty playoffs if this fails.
    } else {
        resolvedPlayoffFixtures = playoffResult.fixtures; // The action already enriches with team names/logos
    }

    return { groupsWithStandings, playoffFixtures: resolvedPlayoffFixtures };

  } catch (error) {
    console.error("Error fetching tournament competition data:", error);
    const message = error instanceof Error ? error.message : "Unknown error fetching competition data.";
    const currentDebugInfo = getFirebaseDebugInfo();
    return { 
        groupsWithStandings: [], 
        playoffFixtures: [], 
        error: `Error obteniendo datos de competición: ${message}. Debug Info: ${JSON.stringify({ error: currentDebugInfo.error, configUsed: currentDebugInfo.configUsed, envKeys: currentDebugInfo.envKeys }, null, 2)}`
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
      error: `Servicio no disponible: Fallo al conectar con la base de datos. Debug Info: ${JSON.stringify({ error: debugInfo.error, configUsed: debugInfo.configUsed, envKeys: debugInfo.envKeys }, null, 2)}` 
    };
  }

  try {
    const now = new Date(); 

    const liveQuery = query(
      collection(db, "matches"),
      where("status", "==", "live"),
      limit(5)
    );

    const upcomingQuery = query(
      collection(db, "matches"),
      where("status", "==", "upcoming"),
      // No date filter here, sort and filter client-side or after fetching if needed
      limit(20) 
    );
    
    const pendingDateQuery = query(
      collection(db, "matches"),
      where("status", "==", "pending_date"),
      limit(10)
    );

    const promiseResults = await Promise.all([
        getDocs(liveQuery),
        getDocs(upcomingQuery),
        getDocs(pendingDateQuery),
    ]);
    
    const liveSnapshot = promiseResults[0];
    let rawUpcomingMatchesDocs = promiseResults[1].docs;
    const pendingDateSnapshot = promiseResults[2].docs;
    
    const rawLiveMatches = liveSnapshot.docs.map(doc => convertMatchTimestamps({ id: doc.id, ...doc.data() }));
    // Sorting for live matches by date (if available)
    rawLiveMatches.sort((a, b) => { 
      if (a.date && b.date) return new Date(a.date as string).getTime() - new Date(b.date as string).getTime();
      if (a.date) return -1; // Matches with dates first
      if (b.date) return 1;
      return 0; // Keep original order if no dates
    });

    // Filter upcoming matches to ensure they are truly in the future, then sort by date
    let rawUpcomingMatches = rawUpcomingMatchesDocs
        .map(doc => convertMatchTimestamps({ id: doc.id, ...doc.data() }))
        .filter(match => match.date && new Date(match.date as string) >= now); // Filter for future dates

    rawUpcomingMatches.sort((a, b) => { // Sort valid upcoming matches by date
        if (a.date && b.date) return new Date(a.date as string).getTime() - new Date(b.date as string).getTime();
        // Should not happen due to filter, but good practice
        if (a.date) return -1; 
        if (b.date) return 1;
        return 0;
    });

    const rawPendingDateMatches = pendingDateSnapshot.map(doc => convertMatchTimestamps({ id: doc.id, ...doc.data() }));
    // Sorting for pending_date matches: by groupName, then matchday
    rawPendingDateMatches.sort((a, b) => { 
        const groupCompare = (a.groupName || '').localeCompare(b.groupName || '');
        if (groupCompare !== 0) return groupCompare;
        return (a.matchday || 0) - (b.matchday || 0);
    });

    // Combine matches: live first, then upcoming (future dated), then pending_date
    // Use a Map to avoid duplicates if a match somehow appeared in multiple queries (unlikely with current logic)
    const matchesMap = new Map<string, ReturnType<typeof convertMatchTimestamps>>();
    
    rawLiveMatches.forEach(m => matchesMap.set(m.id, m));
    rawUpcomingMatches.forEach(m => { // These are already future-dated and sorted
        if (!matchesMap.has(m.id)) matchesMap.set(m.id, m);
    });
    rawPendingDateMatches.forEach(m => { // These are sorted by group/matchday
      if (!matchesMap.has(m.id)) matchesMap.set(m.id, m);
    });

    // The order of insertion into the map and then spreading preserves a general priority
    // To achieve specific multi-level sort for carousel: live > upcoming > pending_date, then group, then matchday
    let combinedMatches = Array.from(matchesMap.values());

    const getStatusPriority = (status: Match['status']): number => {
      switch (status) {
        case 'live': return 1;
        case 'upcoming': return 2;
        case 'pending_date': return 3;
        case 'completed': return 4; // Should not be in this list
        default: return 5;
      }
    };

    combinedMatches.sort((a, b) => {
      const priorityA = getStatusPriority(a.status);
      const priorityB = getStatusPriority(b.status);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // For 'live' and 'upcoming', sort by actual date if available
      if ((a.status === 'live' || a.status === 'upcoming') && (b.status === 'live' || b.status === 'upcoming')) {
        if (a.date && b.date) {
            const dateComparison = new Date(a.date as string).getTime() - new Date(b.date as string).getTime();
            if (dateComparison !== 0) return dateComparison;
        } else if (a.date) {
            return -1; // a has date, b doesn't
        } else if (b.date) {
            return 1;  // b has date, a doesn't
        }
        // If dates are same or both null, fall through to group/matchday
      }
      
      // Fallback/secondary sort: groupName then matchday
      const groupCompare = (a.groupName || '').localeCompare(b.groupName || '');
      if (groupCompare !== 0) return groupCompare;
      
      return (a.matchday || 0) - (b.matchday || 0);
    });
    
    // Limit the total number of matches for the carousel
    const limitedMatches = combinedMatches.slice(0, 10);

    // Populate team details for the selected matches
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
    })).filter(m => m.team1 && m.team2) as Match[]; // Ensure both teams are populated


    // For the home page, we call getTournamentCompetitionData to get groups with standings
    const competitionDataResult = await getTournamentCompetitionData();
    if (competitionDataResult.error && !competitionDataResult.groupsWithStandings.length) { 
        console.warn("Error fetching groups for home page via getTournamentCompetitionData. Error:", competitionDataResult.error);
        // If competitionData also had an error getting groups, reflect that
        return { upcomingLiveMatches, groupsWithStandings: [], error: competitionDataResult.error};
    }
    
    return { upcomingLiveMatches, groupsWithStandings: competitionDataResult.groupsWithStandings };

  } catch (error) {
    console.error("Error fetching tournament home page data:", error);
    const message = error instanceof Error ? error.message : "Unknown error fetching home page data.";
    const currentDebugInfo = getFirebaseDebugInfo();
    return { 
        upcomingLiveMatches: [], 
        groupsWithStandings: [], 
        error: `Error obteniendo datos de página principal: ${message}. Debug Info: ${JSON.stringify({ error: currentDebugInfo.error, configUsed: currentDebugInfo.configUsed, envKeys: currentDebugInfo.envKeys }, null, 2)}`
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
      error: `Servicio no disponible: Fallo al conectar con la base de datos. Debug Info: ${JSON.stringify({ error: debugInfo.error, configUsed: debugInfo.configUsed, envKeys: debugInfo.envKeys }, null, 2)}` 
    };
  }

  try {
    const matchesQuery = query(collection(db, "matches"));
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

     allMatchesWithTeams.sort((a, b) => {
        const aHasDate = !!a.date;
        const bHasDate = !!b.date;

        if (aHasDate && !bHasDate) return -1;
        if (!aHasDate && bHasDate) return 1;  
        
        if (aHasDate && bHasDate) {
          const dateComparison = new Date(a.date!).getTime() - new Date(b.date!).getTime();
          if (dateComparison !== 0) return dateComparison; 
        }
        
        const groupCompare = (a.groupName || '').localeCompare(b.groupName || '');
        if (groupCompare !== 0) return groupCompare;
        
        return (a.matchday || 0) - (b.matchday || 0);
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
        error: `Error obteniendo datos de resultados: ${message}. Debug Info: ${JSON.stringify({ error: currentDebugInfo.error, configUsed: currentDebugInfo.configUsed, envKeys: currentDebugInfo.envKeys }, null, 2)}`
    };
  }
}
