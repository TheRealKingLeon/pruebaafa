
'use server';

import { db } from '@/lib/firebase';
import { collection, writeBatch, serverTimestamp, query, orderBy, getDocs, doc, where, documentId, Timestamp, deleteDoc } from 'firebase/firestore';
import type { Group, Team, PlayoffFixture, TournamentRules, Match as MatchType, StandingEntry } from '@/types';
import { loadTournamentRulesAction } from '../tournament-settings/actions'; // Para obtener playoffMatchRoundType

const PLAYOFF_FIXTURES_COLLECTION = "playoff_fixtures"; // Usaremos esta colección para los fixtures de playoff
const MATCHES_COLLECTION = "matches"; // Para los partidos reales de los playoffs
const TOTAL_ZONES_FOR_PLAYOFFS = 8; // Ahora son 8 playoffs

// Helper to get team details
async function getTeamsDetailsMap(teamIds: string[]): Promise<Map<string, Pick<Team, 'name' | 'logoUrl'>>> {
  const teamsMap = new Map<string, Pick<Team, 'name' | 'logoUrl'>>();
  if (!teamIds || teamIds.length === 0) return teamsMap;

  const uniqueTeamIds = Array.from(new Set(teamIds.filter(id => id)));
  const MAX_IDS_PER_QUERY = 30;
  for (let i = 0; i < uniqueTeamIds.length; i += MAX_IDS_PER_QUERY) {
    const chunk = uniqueTeamIds.slice(i, i + MAX_IDS_PER_QUERY);
    if (chunk.length > 0) {
      const teamsQuery = query(collection(db, "equipos"), where(documentId(), "in", chunk));
      const snapshot = await getDocs(teamsQuery);
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data() as Team;
        teamsMap.set(docSnap.id, { name: data.name, logoUrl: data.logoUrl });
      });
    }
  }
  return teamsMap;
}

// Internal helper to calculate standings for a single group (similar to tournament-service)
async function calculateGroupStandings(
  groupId: string,
  teamsInGroup: Team[], // Array de objetos Team completos para este grupo
  groupRules: TournamentRules
): Promise<StandingEntry[]> {
  const completedMatchesQuery = query(
    collection(db, MATCHES_COLLECTION),
    where("groupId", "==", groupId),
    where("status", "==", "completed")
  );
  const matchesSnapshot = await getDocs(completedMatchesQuery);
  const groupMatches = matchesSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Omit<MatchType, 'team1' | 'team2'> & { team1Id: string, team2Id: string }));

  const standingsMap: Map<string, StandingEntry> = new Map();
  teamsInGroup.forEach(team => {
    standingsMap.set(team.id, {
      team: team, // Usa el objeto Team completo
      position: 0, points: 0, played: 0, won: 0, drawn: 0, lost: 0,
      goalsFor: 0, goalsAgainst: 0, goalDifference: 0,
    });
  });

  groupMatches.forEach(match => {
    const entry1 = standingsMap.get(match.team1Id);
    const entry2 = standingsMap.get(match.team2Id);
    const score1 = typeof match.score1 === 'number' ? match.score1 : 0;
    const score2 = typeof match.score2 === 'number' ? match.score2 : 0;

    if (entry1) {
      entry1.played++; entry1.goalsFor += score1; entry1.goalsAgainst += score2;
      if (score1 > score2) { entry1.won++; entry1.points += groupRules.pointsForWin; }
      else if (score1 < score2) { entry1.lost++; entry1.points += groupRules.pointsForLoss; }
      else { entry1.drawn++; entry1.points += groupRules.pointsForDraw; }
    }
    if (entry2) {
      entry2.played++; entry2.goalsFor += score2; entry2.goalsAgainst += score1;
      if (score2 > score1) { entry2.won++; entry2.points += groupRules.pointsForWin; }
      else if (score2 < score1) { entry2.lost++; entry2.points += groupRules.pointsForLoss; }
      else { entry2.drawn++; entry2.points += groupRules.pointsForDraw; }
    }
  });

  const standingsArray = Array.from(standingsMap.values());
  standingsArray.forEach(entry => { entry.goalDifference = entry.goalsFor - entry.goalsAgainst; });

  const enabledTiebreakers = groupRules.tiebreakers.filter(tb => tb.enabled && tb.priority > 0).sort((a, b) => a.priority - b.priority);
  standingsArray.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    for (const tiebreaker of enabledTiebreakers) {
      switch (tiebreaker.id) {
        case 'goalDifference': if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference; break;
        case 'goalsFor': if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor; break;
        case 'matchesWon': if (b.won !== a.won) return b.won - a.won; break;
        // TODO: Implement directResult if needed, requires fetching specific matches
      }
    }
    return a.team.name.localeCompare(b.team.name);
  });

  return standingsArray.map((entry, index) => ({ ...entry, position: index + 1 }));
}


export async function generatePlayoffFixturesAction(): Promise<{ success: boolean; message: string; fixturesGenerated?: number }> {
  try {
    const rulesResult = await loadTournamentRulesAction();
    if (!rulesResult.success || !rulesResult.data) {
      return { success: false, message: `Error al cargar las reglas del torneo: ${rulesResult.message || "No hay datos de reglas."}` };
    }
    const tournamentRules = rulesResult.data;
    const playoffMatchRoundType = tournamentRules.playoffMatchRoundType || 'one-way';

    // 1. Clear existing playoff fixtures
    const batch = writeBatch(db);
    const existingFixturesQuery = query(collection(db, PLAYOFF_FIXTURES_COLLECTION));
    const existingFixturesSnap = await getDocs(existingFixturesQuery);
    existingFixturesSnap.forEach(d => batch.delete(d.ref));
    
    // Also clear playoff-related matches from the "matches" collection (those with a roundName but no groupId)
    const oldPlayoffMatchesQuery = query(collection(db, MATCHES_COLLECTION), where("roundName", "!=", null), where("groupId", "==", null));
    const oldPlayoffMatchesSnap = await getDocs(oldPlayoffMatchesQuery);
    oldPlayoffMatchesSnap.forEach(matchDoc => batch.delete(matchDoc.ref));


    // 2. Fetch all groups and all teams
    const groupsQuery = query(collection(db, "grupos"), orderBy("name"));
    const groupsSnap = await getDocs(groupsQuery);
    const allGroups = groupsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Group));

    const allTeamIdsFromGroups = new Set<string>();
    allGroups.forEach(g => g.teamIds.forEach(tid => allTeamIdsFromGroups.add(tid)));
    const allTeamsMap = await getTeamsDetailsMap(Array.from(allTeamIdsFromGroups)); // Fetch once

    let totalFixturesGenerated = 0;

    for (const group of allGroups) {
      if (group.teamIds.length < 4) {
        console.log(`Zona ${group.name} (ID: ${group.id}) tiene menos de 4 equipos, omitiendo generación de playoffs para esta zona.`);
        continue;
      }

      // Get full team objects for this specific group
      const teamsInThisGroup = group.teamIds.map(tid => allTeamsMap.get(tid)).filter(Boolean) as Team[];
      if (teamsInThisGroup.length < 4) {
         console.log(`Zona ${group.name} (ID: ${group.id}) no pudo obtener detalles de al menos 4 equipos, omitiendo.`);
         continue;
      }

      const standings = await calculateGroupStandings(group.id, teamsInThisGroup, tournamentRules);
      if (standings.length < 4) {
        console.log(`Zona ${group.name} (ID: ${group.id}) no tiene suficientes equipos con posiciones calculadas (necesita 4, tiene ${standings.length}), omitiendo.`);
        continue;
      }

      const top4Teams = standings.slice(0, 4).map(s => s.team);
      const team1st = top4Teams[0];
      const team2nd = top4Teams[1];
      const team3rd = top4Teams[2];
      const team4th = top4Teams[3];

      const zoneFixtures: Omit<PlayoffFixture, 'id' | 'createdAt' | 'updatedAt'>[] = [];

      // Semifinal 1: 1st vs 4th
      zoneFixtures.push({
        zoneId: group.id,
        round: "Semifinal 1",
        matchLabel: `1º ${group.name} vs 4º ${group.name}`,
        team1Id: team1st.id,
        team2Id: team4th.id,
        status: 'upcoming',
      });
      if (playoffMatchRoundType === 'two-way') {
        zoneFixtures.push({
          zoneId: group.id,
          round: "Semifinal 1 - Vuelta",
          matchLabel: `4º ${group.name} vs 1º ${group.name} (Vuelta)`,
          team1Id: team4th.id, // Team 2 is home for return leg
          team2Id: team1st.id,
          status: 'upcoming',
          isSecondLeg: true,
        });
      }

      // Semifinal 2: 2nd vs 3rd
      zoneFixtures.push({
        zoneId: group.id,
        round: "Semifinal 2",
        matchLabel: `2º ${group.name} vs 3º ${group.name}`,
        team1Id: team2nd.id,
        team2Id: team3rd.id,
        status: 'upcoming',
      });
      if (playoffMatchRoundType === 'two-way') {
        zoneFixtures.push({
          zoneId: group.id,
          round: "Semifinal 2 - Vuelta",
          matchLabel: `3º ${group.name} vs 2º ${group.name} (Vuelta)`,
          team1Id: team3rd.id, // Team 2 is home for return leg
          team2Id: team2nd.id,
          status: 'upcoming',
          isSecondLeg: true,
        });
      }

      // Final: Placeholder
      zoneFixtures.push({
        zoneId: group.id,
        round: "Final",
        matchLabel: `Ganador SF1 ${group.name} vs Ganador SF2 ${group.name}`,
        team1Id: null, // To be filled after semifinals
        team2Id: null,
        status: 'pending_teams',
      });
      if (playoffMatchRoundType === 'two-way') {
         // Placeholder for final return leg if applicable
        zoneFixtures.push({
          zoneId: group.id,
          round: "Final - Vuelta",
          matchLabel: `Ganador SF2 ${group.name} vs Ganador SF1 ${group.name} (Vuelta)`,
          team1Id: null, 
          team2Id: null,
          status: 'pending_teams',
          isSecondLeg: true,
        });
      }
      
      zoneFixtures.forEach(fixtureData => {
        const fixtureRef = doc(collection(db, PLAYOFF_FIXTURES_COLLECTION));
        batch.set(fixtureRef, {
          ...fixtureData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        totalFixturesGenerated++;
      });
       console.log(`Generados ${zoneFixtures.length} fixtures de playoff para ${group.name}`);
    }

    if (totalFixturesGenerated === 0) {
        return { success: false, message: "No se generaron fixtures. Verifica que los grupos tengan al menos 4 equipos y que los partidos de grupo estén completados para calcular posiciones." };
    }

    await batch.commit();
    return { success: true, message: `Playoffs generados para ${allGroups.length} zonas. Total fixtures: ${totalFixturesGenerated}.`, fixturesGenerated: totalFixturesGenerated };

  } catch (error)
 {
    console.error("Error generando llaves de playoffs:", error);
    const message = error instanceof Error ? error.message : "Error desconocido.";
    return { success: false, message };
  }
}


export async function getPlayoffFixturesAction(): Promise<{ fixtures: PlayoffFixture[]; error?: string }> {
  try {
    // Order by zoneId, then by a logical round order if possible (e.g. using createdAt for simplicity for now)
    const fixturesQuery = query(collection(db, PLAYOFF_FIXTURES_COLLECTION), orderBy("zoneId"), orderBy("createdAt"));
    const snapshot = await getDocs(fixturesQuery);
    
    const fixtureDocs = snapshot.docs.map(d => ({ 
        id: d.id, 
        ...d.data(),
        createdAt: d.data().createdAt instanceof Timestamp ? d.data().createdAt.toDate().toISOString() : undefined,
        updatedAt: d.data().updatedAt instanceof Timestamp ? d.data().updatedAt.toDate().toISOString() : undefined,
     } as PlayoffFixture));
    
    const allTeamIds = new Set<string>();
    fixtureDocs.forEach(fixture => {
      if (fixture.team1Id) allTeamIds.add(fixture.team1Id);
      if (fixture.team2Id) allTeamIds.add(fixture.team2Id);
    });
    
    const teamsDetailsMap = await getTeamsDetailsMap(Array.from(allTeamIds));

    const fixtures = fixtureDocs.map(fixture => {
      const team1Details = fixture.team1Id ? teamsDetailsMap.get(fixture.team1Id) : undefined;
      const team2Details = fixture.team2Id ? teamsDetailsMap.get(fixture.team2Id) : undefined;
      return {
        ...fixture,
        team1Name: team1Details?.name,
        team1LogoUrl: team1Details?.logoUrl,
        team2Name: team2Details?.name,
        team2LogoUrl: team2Details?.logoUrl,
      };
    });

    return { fixtures };
  } catch (error) {
    console.error("Error obteniendo llaves de playoffs:", error);
    const message = error instanceof Error ? error.message : "Error desconocido.";
    return { fixtures: [], error: message };
  }
}

export async function clearPlayoffFixturesAction(): Promise<{ success: boolean; message: string }> {
  try {
    const batch = writeBatch(db);
    const fixturesQuery = query(collection(db, PLAYOFF_FIXTURES_COLLECTION));
    const snapshot = await getDocs(fixturesQuery);

    if (snapshot.empty) {
      // Check if there are playoff-related matches in "matches" collection as well
      const oldPlayoffMatchesQuery = query(collection(db, MATCHES_COLLECTION), where("roundName", "!=", null), where("groupId", "==", null));
      const oldPlayoffMatchesSnap = await getDocs(oldPlayoffMatchesQuery);
      if (oldPlayoffMatchesSnap.empty) {
        return { success: true, message: "No hay llaves de playoffs ni partidos de playoff para limpiar." };
      }
    }

    snapshot.forEach(d => {
      batch.delete(d.ref);
    });
    
    // Also clear playoff-related matches from the "matches" collection
    const oldPlayoffMatchesQuery = query(collection(db, MATCHES_COLLECTION), where("roundName", "!=", null), where("groupId", "==", null));
    const oldPlayoffMatchesSnap = await getDocs(oldPlayoffMatchesQuery);
    oldPlayoffMatchesSnap.forEach(matchDoc => batch.delete(matchDoc.ref));

    await batch.commit();
    return { success: true, message: `Todas las llaves de playoffs y partidos de playoff asociados han sido eliminados (${snapshot.size} fixtures, ${oldPlayoffMatchesSnap.size} partidos).` };
  } catch (error) {
    console.error("Error limpiando llaves de playoffs:", error);
    const message = error instanceof Error ? error.message : "Error desconocido.";
    return { success: false, message };
  }
}
