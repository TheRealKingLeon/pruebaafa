
'use server';

import { db } from '@/lib/firebase';
import { collection, writeBatch, serverTimestamp, query, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';
import type { Group, Team, PlayoffFixture } from '@/types';

const PLAYOFF_FIXTURES_COLLECTION = "playoff_fixtures";
const GROUPS_FOR_PLAYOFFS = ['zona-a', 'zona-b', 'zona-c', 'zona-d']; // Use first 4 groups
const TEAMS_PER_GROUP_QUALIFY = 2;

// Helper to get team details
async function getTeamsDetails(teamIds: string[]): Promise<Map<string, Pick<Team, 'name' | 'logoUrl'>>> {
  const teamsMap = new Map<string, Pick<Team, 'name' | 'logoUrl'>>();
  if (teamIds.length === 0) return teamsMap;

  // Firestore 'in' query limit is 30 IDs per query.
  const MAX_IDS_PER_QUERY = 30;
  for (let i = 0; i < teamIds.length; i += MAX_IDS_PER_QUERY) {
    const chunk = teamIds.slice(i, i + MAX_IDS_PER_QUERY);
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


export async function generatePlayoffFixturesAction(): Promise<{ success: boolean; message: string; fixturesGenerated?: number }> {
  try {
    const batch = writeBatch(db);

    // 1. Clear existing playoff fixtures first (optional, but good for a clean "generation")
    const existingFixturesQuery = query(collection(db, PLAYOFF_FIXTURES_COLLECTION));
    const existingFixturesSnap = await getDocs(existingFixturesQuery);
    existingFixturesSnap.forEach(doc => batch.delete(doc.ref));
    // Commit this delete batch first if you want to ensure atomicity of delete before create
    // For simplicity here, we'll include it in the main batch.

    // 2. Fetch groups and their teams
    const groupsQuery = query(collection(db, "grupos"), orderBy("name")); // Assuming groups are named like "Zona A", "Zona B"
    const groupsSnap = await getDocs(groupsQuery);
    
    const qualifiedTeamsByGroup: Record<string, string[]> = {};
    const groupOrder: string[] = [];

    groupsSnap.docs.forEach(docSnap => {
      const group = docSnap.data() as Group;
      if (GROUPS_FOR_PLAYOFFS.includes(group.zoneId)) {
        qualifiedTeamsByGroup[group.zoneId] = group.teamIds.slice(0, TEAMS_PER_GROUP_QUALIFY);
        if (!groupOrder.includes(group.zoneId)) {
            groupOrder.push(group.zoneId);
        }
      }
    });
    
    // Ensure groups are in the order of GROUPS_FOR_PLAYOFFS for consistent seeding
    const orderedGroupIds = GROUPS_FOR_PLAYOFFS.filter(zoneId => groupOrder.includes(zoneId));


    let fixturesGeneratedCount = 0;
    const newFixtures: Omit<PlayoffFixture, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    if (orderedGroupIds.length >= 4 && 
        qualifiedTeamsByGroup[orderedGroupIds[0]]?.length === TEAMS_PER_GROUP_QUALIFY &&
        qualifiedTeamsByGroup[orderedGroupIds[1]]?.length === TEAMS_PER_GROUP_QUALIFY &&
        qualifiedTeamsByGroup[orderedGroupIds[2]]?.length === TEAMS_PER_GROUP_QUALIFY &&
        qualifiedTeamsByGroup[orderedGroupIds[3]]?.length === TEAMS_PER_GROUP_QUALIFY
    ) {
      const groupA_teams = qualifiedTeamsByGroup[orderedGroupIds[0]]; // e.g. zona-a
      const groupB_teams = qualifiedTeamsByGroup[orderedGroupIds[1]]; // e.g. zona-b
      const groupC_teams = qualifiedTeamsByGroup[orderedGroupIds[2]]; // e.g. zona-c
      const groupD_teams = qualifiedTeamsByGroup[orderedGroupIds[3]]; // e.g. zona-d

      // Define Quarter-Finals (example seeding: 1st vs 2nd from different groups)
      const qfMatches = [
        { label: "CF1", team1Id: groupA_teams[0], team2Id: groupB_teams[1] }, // A1 vs B2
        { label: "CF2", team1Id: groupC_teams[0], team2Id: groupD_teams[1] }, // C1 vs D2
        { label: "CF3", team1Id: groupB_teams[0], team2Id: groupA_teams[1] }, // B1 vs A2
        { label: "CF4", team1Id: groupD_teams[0], team2Id: groupC_teams[1] }, // D1 vs C2
      ];

      qfMatches.forEach(match => {
        newFixtures.push({
          round: "Cuartos de Final",
          matchLabel: match.label,
          team1Id: match.team1Id || null,
          team2Id: match.team2Id || null,
          status: (match.team1Id && match.team2Id) ? 'upcoming' : 'pending_teams',
        });
      });

      // Placeholder for Semifinals and Final (teams depend on QF winners)
      ["SF1 (Ganador CF1 vs Ganador CF2)", "SF2 (Ganador CF3 vs Ganador CF4)"].forEach(label => {
        newFixtures.push({
          round: "Semifinal",
          matchLabel: label,
          team1Id: null,
          team2Id: null,
          status: 'pending_teams',
        });
      });
      newFixtures.push({
        round: "Final",
        matchLabel: "Final (Ganador SF1 vs Ganador SF2)",
        team1Id: null,
        team2Id: null,
        status: 'pending_teams',
      });

    } else {
      return { success: false, message: `No hay suficientes grupos (${GROUPS_FOR_PLAYOFFS.join(', ')}) configurados o no tienen suficientes equipos (${TEAMS_PER_GROUP_QUALIFY} c/u) para generar las llaves de playoffs.` };
    }

    newFixtures.forEach(fixtureData => {
      const fixtureRef = doc(collection(db, PLAYOFF_FIXTURES_COLLECTION));
      batch.set(fixtureRef, {
        ...fixtureData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      fixturesGeneratedCount++;
    });

    await batch.commit();
    return { success: true, message: `Llaves de playoffs generadas/actualizadas (${fixturesGeneratedCount} fixtures).`, fixturesGenerated: fixturesGeneratedCount };

  } catch (error) {
    console.error("Error generando llaves de playoffs:", error);
    const message = error instanceof Error ? error.message : "Error desconocido.";
    return { success: false, message };
  }
}


export async function getPlayoffFixturesAction(): Promise<{ fixtures: PlayoffFixture[]; error?: string }> {
  try {
    const fixturesQuery = query(collection(db, PLAYOFF_FIXTURES_COLLECTION), orderBy("createdAt")); // Simple order for now
    const snapshot = await getDocs(fixturesQuery);
    
    const fixtureDocs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as PlayoffFixture));
    
    // Collect all unique team IDs to fetch their details in batches
    const allTeamIds = new Set<string>();
    fixtureDocs.forEach(fixture => {
      if (fixture.team1Id) allTeamIds.add(fixture.team1Id);
      if (fixture.team2Id) allTeamIds.add(fixture.team2Id);
    });
    
    const teamsDetailsMap = await getTeamsDetails(Array.from(allTeamIds));

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
      return { success: true, message: "No hay llaves de playoffs para limpiar." };
    }

    snapshot.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return { success: true, message: "Todas las llaves de playoffs han sido eliminadas." };
  } catch (error) {
    console.error("Error limpiando llaves de playoffs:", error);
    const message = error instanceof Error ? error.message : "Error desconocido.";
    return { success: false, message };
  }
}

// Helper to get documentId, as it's not directly available in server actions for 'where' clauses sometimes.
// Ensure you have appropriate imports if this were in a different context.
import { documentId, where } from 'firebase/firestore';
