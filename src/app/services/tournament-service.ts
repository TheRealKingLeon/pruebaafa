
'use server';

import { db } from '@/lib/firebase';
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

    const playoffQuery = query(collection(db, "playoff_fixtures"), orderBy("createdAt"));
    const playoffSnapshot = await getDocs(playoffQuery);
    const rawPlayoffFixtures = playoffSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      } as PlayoffFixture;
    });

    const playoffTeamIds = new Set<string>();
    rawPlayoffFixtures.forEach(pf => {
      if (pf.team1Id) playoffTeamIds.add(pf.team1Id);
      if (pf.team2Id) playoffTeamIds.add(pf.team2Id);
    });
    // Fetch details for teams involved in playoffs if they weren't already in groups.
    // This reuses teamsMap if teams are common, or fetches new ones.
    const playoffTeamsMap = await getTeamsDetailsMap(Array.from(playoffTeamIds));


    const playoffFixtures = rawPlayoffFixtures.map(pf => {
      const team1 = pf.team1Id ? playoffTeamsMap.get(pf.team1Id) : undefined;
      const team2 = pf.team2Id ? playoffTeamsMap.get(pf.team2Id) : undefined;
      return {
        ...pf, 
        team1Name: team1?.name,
        team1LogoUrl: team1?.logoUrl,
        team2Name: team2?.name,
        team2LogoUrl: team2?.logoUrl,
      };
    });

    return { groupsWithStandings, playoffFixtures };

  } catch (error) {
    console.error("Error fetching tournament competition data:", error);
    const message = error instanceof Error ? error.message : "Unknown error fetching competition data.";
    return { groupsWithStandings: [], playoffFixtures: [], error: message };
  }
}


export async function getTournamentHomePageData(): Promise<{
  upcomingLiveMatches: Match[];
  groupsWithStandings: Group[];
  error?: string;
}> {
  try {
    const now = Timestamp.now();

    // Query for 'live' matches
    const liveQuery = query(
      collection(db, "matches"),
      where("status", "==", "live"),
      // orderBy("date", "asc"), // Manual sort later
      limit(5) 
    );

    // Query for 'upcoming' matches (with a date set in the future)
    const upcomingQuery = query(
      collection(db, "matches"),
      where("status", "==", "upcoming"),
      where("date", ">=", now),
      orderBy("date", "asc"),
      limit(10) 
    );
    
    // Query for 'pending_date' matches
    const pendingDateQuery = query(
      collection(db, "matches"),
      where("status", "==", "pending_date"),
      orderBy("groupName", "asc"), // Order by group then matchday for some consistency
      orderBy("matchday", "asc"),
      limit(10)
    );

    const [liveSnapshot, upcomingSnapshot, pendingDateSnapshot] = await Promise.all([
      getDocs(liveQuery),
      getDocs(upcomingQuery),
      getDocs(pendingDateQuery),
    ]);
    
    const rawLiveMatches = liveSnapshot.docs.map(doc => convertMatchTimestamps({ id: doc.id, ...doc.data() }));
    const rawUpcomingMatches = upcomingSnapshot.docs.map(doc => convertMatchTimestamps({ id: doc.id, ...doc.data() }));
    const rawPendingDateMatches = pendingDateSnapshot.docs.map(doc => convertMatchTimestamps({ id: doc.id, ...doc.data() }));

    // Sort rawLiveMatches by date client-side as Firestore orderBy was removed to avoid index
    rawLiveMatches.sort((a, b) => {
      if (a.date && b.date) {
        return new Date(a.date as string).getTime() - new Date(b.date as string).getTime();
      }
      if (a.date) return -1;
      if (b.date) return 1;
      return 0;
    });

    // Combine and Deduplicate, prioritizing live, then upcoming with date, then pending_date
    const matchesMap = new Map<string, ReturnType<typeof convertMatchTimestamps>>();
    rawLiveMatches.forEach(m => matchesMap.set(m.id, m));
    rawUpcomingMatches.forEach(m => {
        if (!matchesMap.has(m.id)) matchesMap.set(m.id, m);
    });
    rawPendingDateMatches.forEach(m => {
      if (!matchesMap.has(m.id)) matchesMap.set(m.id, m);
    });

    let combinedMatches = Array.from(matchesMap.values());

    // Define a helper for sorting priority
    const getStatusPriority = (status: Match['status']): number => {
      switch (status) {
        case 'live': return 1;
        case 'upcoming': return 2;
        case 'pending_date': return 3;
        case 'completed': return 4; // Should ideally be filtered out earlier
        default: return 5;
      }
    };

    combinedMatches.sort((a, b) => {
      const priorityA = getStatusPriority(a.status);
      const priorityB = getStatusPriority(b.status);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Same priority, sort within:
      // For 'live' and 'upcoming', sort by date (earliest first)
      if (a.status === 'live' || a.status === 'upcoming') {
        if (a.date && b.date) return new Date(a.date as string).getTime() - new Date(b.date as string).getTime();
        if (a.date) return -1; // a has date, b doesn't (shouldn't happen for 'upcoming' from query)
        if (b.date) return 1;  // b has date, a doesn't
      }

      // For 'pending_date', they are already pre-sorted by groupName, matchday from the query.
      // If they were mixed with other null-date items, this would be where to sort them.
      // Since map preserved original order from individual sorted arrays (if keys are unique),
      // and we added pending_date last, their internal order should be fine if they are all 'pending_date'.
      // If comparing two 'pending_date' matches specifically (which shouldn't happen if priorities differ unless both are pending_date):
      if (a.status === 'pending_date' && b.status === 'pending_date') {
         const groupCompare = (a.groupName || '').localeCompare(b.groupName || '');
         if (groupCompare !== 0) return groupCompare;
         return (a.matchday || 0) - (b.matchday || 0);
      }
      
      return 0; 
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


    const { groupsWithStandings: fetchedGroups, error: groupsError } = await getTournamentCompetitionData();
    if (groupsError) {
        console.warn("Error fetching groups for home page, using empty array.", groupsError);
        return { upcomingLiveMatches, groupsWithStandings: [], error: groupsError};
    }

    return { upcomingLiveMatches, groupsWithStandings: fetchedGroups };

  } catch (error) {
    console.error("Error fetching tournament home page data:", error);
    const message = error instanceof Error ? error.message : "Unknown error fetching home page data.";
    return { upcomingLiveMatches: [], groupsWithStandings: [], error: message };
  }
}


export async function getTournamentResultsData(): Promise<{
  allMatches: Match[];
  groupList: Pick<Group, 'id' | 'name' | 'zoneId'>[];
  error?: string;
}> {
  try {
    // Fetch all statuses, then sort client-side for flexibility
    const matchesQuery = query(collection(db, "matches")/*, orderBy("date", "desc")*/); // Removing order by date for now
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

    // Now sort allMatchesWithTeams
     allMatchesWithTeams.sort((a, b) => {
        const aHasDate = !!a.date;
        const bHasDate = !!b.date;

        if (aHasDate && !bHasDate) return -1; // Matches with dates come first
        if (!aHasDate && bHasDate) return 1;  
        
        if (aHasDate && bHasDate) { // Both have dates, sort by date
          const dateComparison = new Date(a.date!).getTime() - new Date(b.date!).getTime();
          if (dateComparison !== 0) return dateComparison; // Ascending for results page overall view
        }
        
        // If dates are the same or both are null, sort by groupName, then matchday
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
    return { allMatches: [], groupList: [], error: message };
  }
}

